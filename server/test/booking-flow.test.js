import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import RedisMock from 'ioredis-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectMongo, disconnectMongo } from '../src/config/db.js';
import { closeRedis, getRedis, initRedis } from '../src/config/redis.js';
import { Booking, Notification, Space, User, ensureIndexes } from '../src/models/index.js';
import { SPACES } from '../src/seed/spaces.data.js';
import { addDays, currentBusinessTime, slotKeys } from '../src/utils/time.js';

const PASSWORD = 'secret123';

let mongod;
let app;
let today;

// Всегда бронируем на послезавтра, чтобы тест не зависел от текущего времени
const bookingDate = () => addDays(today, 2);

async function register(email, name = 'Тестовый Пользователь') {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, phone: '+7 (701) 000-00-00', password: PASSWORD })
    .expect(201);

  return {
    ...response.body,
    auth: { Authorization: `Bearer ${response.body.accessToken}` },
  };
}

const hold = (token, body) =>
  request(app)
    .post('/api/bookings/hold')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

const confirm = (token, holdId) =>
  request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ holdId });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri('workspot_test'));
  initRedis({ client: new RedisMock() });
  await ensureIndexes();

  await Space.insertMany(SPACES.slice(0, 2).map((space, index) => ({ ...space, sortOrder: index })));

  app = createApp();
  today = currentBusinessTime(env.businessTimezone).date;
});

after(async () => {
  await closeRedis();
  await disconnectMongo();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([
    Booking.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({}),
  ]);
  await getRedis().flushall();
});

describe('auth', () => {
  it('регистрирует, логинит и отдаёт профиль по access-токену', async () => {
    const registered = await register('user@workspot.kz');
    assert.equal(registered.user.email, 'user@workspot.kz');
    assert.ok(registered.accessToken);
    assert.ok(registered.refreshToken);

    const me = await request(app)
      .get('/api/auth/me')
      .set(registered.auth)
      .expect(200);
    assert.equal(me.body.user.email, 'user@workspot.kz');
    assert.equal(me.body.user.passwordHash, undefined);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'USER@workspot.kz', password: PASSWORD })
      .expect(200);
    assert.equal(login.body.user.id, registered.user.id);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@workspot.kz', password: 'wrong-password' })
      .expect(401);
  });

  it('не даёт зарегистрировать повторный email', async () => {
    await register('duplicate@workspot.kz');

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Другой пользователь',
        email: 'duplicate@workspot.kz',
        password: PASSWORD,
      })
      .expect(409);

    assert.equal(response.body.error.code, 'EMAIL_TAKEN');
  });

  it('обновляет сессию по refresh-токену и отзывает старый токен', async () => {
    const { refreshToken } = await register('refresh@workspot.kz');

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    assert.ok(refreshed.body.accessToken);

    // Ротация: старый refresh-токен больше не работает
    await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });
});

describe('бронирование', () => {
  it('показывает все места свободными на выбранный интервал', async () => {
    const response = await request(app)
      .get('/api/spaces')
      .query({ date: bookingDate(), startTime: '10:00', endTime: '12:00' })
      .expect(200);

    assert.equal(response.body.spaces.length, 2);
    response.body.spaces.forEach((space) => {
      assert.equal(space.status, 'available');
      assert.equal(space.available, true);
      assert.equal(space.price, space.pricePerHour);
    });
  });

  it('резервирует стол в Redis и создаёт бронь в MongoDB', async () => {
    const user = await register('booker@workspot.kz');
    const payload = {
      spaceId: 'desk-12',
      date: bookingDate(),
      startTime: '10:00',
      endTime: '12:00',
    };

    const held = await hold(user.accessToken, payload).expect(201);
    assert.ok(held.body.holdId);
    assert.equal(held.body.totalPrice, 3600);
    assert.deepEqual(held.body.slots, ['10:00', '10:30', '11:00', '11:30']);

    const holdInfo = await request(app)
      .get(`/api/bookings/hold/${held.body.holdId}`)
      .set(user.auth)
      .expect(200);
    assert.equal(holdInfo.body.hold.expiresAt, held.body.expiresAt);

    // Владелец видит собственный резерв
    const ownView = await request(app)
      .get('/api/spaces')
      .query({ date: payload.date, startTime: '10:00', endTime: '12:00' })
      .set(user.auth)
      .expect(200);
    assert.equal(ownView.body.spaces[0].status, 'held_by_you');
    assert.equal(ownView.body.spaces[0].heldByMe, true);

    // Для гостя это место занято резервом
    const guestView = await request(app)
      .get('/api/spaces')
      .query({ date: payload.date, startTime: '10:00', endTime: '12:00' })
      .expect(200);
    assert.equal(guestView.body.spaces[0].status, 'held');
    assert.equal(guestView.body.spaces[0].available, false);

    const confirmed = await confirm(user.accessToken, held.body.holdId).expect(201);
    assert.equal(confirmed.body.booking.status, 'confirmed');
    assert.equal(confirmed.body.booking.spotId, 'desk-12');
    assert.equal(confirmed.body.booking.totalPrice, 3600);

    // После подтверждения резерв удалён, слоты заняты бронью
    const stored = await Booking.findOne({ code: confirmed.body.booking.id }).lean();
    assert.deepEqual(stored.slots, slotKeys(payload.date, '10:00', '12:00'));

    const afterBooking = await request(app)
      .get('/api/spaces')
      .query({ date: payload.date, startTime: '10:00', endTime: '12:00' })
      .expect(200);
    assert.equal(afterBooking.body.spaces[0].status, 'booked');

    const myBookings = await request(app)
      .get('/api/bookings')
      .set(user.auth)
      .expect(200);
    assert.equal(myBookings.body.bookings.length, 1);
    assert.equal(myBookings.body.bookings[0].id, confirmed.body.booking.id);

    const notifications = await request(app)
      .get('/api/notifications')
      .set(user.auth)
      .expect(200);
    assert.equal(notifications.body.notifications.length, 1);
    assert.equal(notifications.body.notifications[0].title, 'Бронь подтверждена');
    assert.equal(notifications.body.notifications[0].unread, true);
    assert.ok(notifications.body.notifications[0].time);

    const readAll = await request(app)
      .post('/api/notifications/read-all')
      .set(user.auth)
      .expect(200);
    assert.equal(readAll.body.updated, 1);

    const afterRead = await request(app)
      .get('/api/notifications')
      .set(user.auth)
      .expect(200);
    assert.equal(afterRead.body.notifications[0].unread, false);
  });

  it('не даёт двум пользователям забронировать один слот одновременно', async () => {
    const [alice, bob] = await Promise.all([
      register('alice@workspot.kz'),
      register('bob@workspot.kz'),
    ]);

    const payload = {
      spaceId: 'desk-13',
      date: bookingDate(),
      startTime: '14:00',
      endTime: '15:00',
    };

    const results = await Promise.all([
      hold(alice.accessToken, payload),
      hold(bob.accessToken, payload),
    ]);

    const statuses = results.map((response) => response.status).sort();
    assert.deepEqual(statuses, [201, 409]);

    const rejected = results.find((response) => response.status === 409);
    assert.ok(['SLOT_HELD', 'SPACE_BUSY'].includes(rejected.body.error.code));
  });

  it('не даёт одному пользователю две брони на одно время', async () => {
    const user = await register('conflict@workspot.kz');
    const date = bookingDate();

    const first = await hold(user.accessToken, {
      spaceId: 'desk-12',
      date,
      startTime: '10:00',
      endTime: '12:00',
    }).expect(201);
    await confirm(user.accessToken, first.body.holdId).expect(201);

    const second = await hold(user.accessToken, {
      spaceId: 'desk-13',
      date,
      startTime: '11:00',
      endTime: '13:00',
    }).expect(409);

    assert.equal(second.body.error.code, 'USER_TIME_CONFLICT');
  });

  it('освобождает слоты после отмены брони', async () => {
    const alice = await register('alice2@workspot.kz');
    const bob = await register('bob2@workspot.kz');
    const payload = {
      spaceId: 'desk-12',
      date: bookingDate(),
      startTime: '09:00',
      endTime: '10:00',
    };

    const held = await hold(alice.accessToken, payload).expect(201);
    const booking = await confirm(alice.accessToken, held.body.holdId).expect(201);

    await hold(bob.accessToken, payload).expect(409);

    const cancelled = await request(app)
      .delete(`/api/bookings/${booking.body.booking.id}`)
      .set(alice.auth)
      .expect(200);
    assert.equal(cancelled.body.booking.status, 'cancelled');

    const bobHold = await hold(bob.accessToken, payload).expect(201);
    await confirm(bob.accessToken, bobHold.body.holdId).expect(201);
  });

  it('не даёт подтвердить истёкший или освобождённый резерв', async () => {
    const user = await register('expired@workspot.kz');
    const held = await hold(user.accessToken, {
      spaceId: 'desk-12',
      date: bookingDate(),
      startTime: '16:00',
      endTime: '17:00',
    }).expect(201);

    await request(app)
      .delete(`/api/bookings/hold/${held.body.holdId}`)
      .set(user.auth)
      .expect(200);

    const response = await confirm(user.accessToken, held.body.holdId).expect(410);
    assert.equal(response.body.error.code, 'HOLD_EXPIRED');
  });

  it('не даёт чужому пользователю подтвердить резерв', async () => {
    const alice = await register('alice3@workspot.kz');
    const bob = await register('bob3@workspot.kz');

    const held = await hold(alice.accessToken, {
      spaceId: 'desk-12',
      date: bookingDate(),
      startTime: '18:00',
      endTime: '19:00',
    }).expect(201);

    const response = await confirm(bob.accessToken, held.body.holdId).expect(403);
    assert.equal(response.body.error.code, 'HOLD_FOREIGN');
  });

  it('уникальный индекс MongoDB не пропускает дубль даже в обход Redis', async () => {
    const user = await register('index@workspot.kz');
    const space = await Space.findOne({ slug: 'desk-12' }).lean();
    const date = bookingDate();
    const slots = slotKeys(date, '20:00', '21:00');

    const base = {
      user: user.user.id,
      space: space._id,
      spaceSlug: space.slug,
      spaceName: space.name,
      zone: space.zone,
      date,
      startTime: '20:00',
      endTime: '21:00',
      hours: 1,
      pricePerHour: space.pricePerHour,
      totalPrice: space.pricePerHour,
      slots,
      status: 'confirmed',
    };

    await Booking.create({ ...base, code: 'BK-111111' });

    await assert.rejects(
      () => Booking.create({ ...base, code: 'BK-222222' }),
      (error) => error.code === 11000,
    );
  });

  it('валидирует интервал и горизонт бронирования', async () => {
    const user = await register('validation@workspot.kz');
    const date = bookingDate();

    const notAligned = await hold(user.accessToken, {
      spaceId: 'desk-12',
      date,
      startTime: '10:15',
      endTime: '11:00',
    }).expect(400);
    assert.equal(notAligned.body.error.code, 'TIME_NOT_ALIGNED');

    const inverted = await hold(user.accessToken, {
      spaceId: 'desk-12',
      date,
      startTime: '12:00',
      endTime: '11:00',
    }).expect(400);
    assert.equal(inverted.body.error.code, 'INVALID_INTERVAL');

    const tooFar = await hold(user.accessToken, {
      spaceId: 'desk-12',
      date: addDays(today, env.bookingHorizonDays + 1),
      startTime: '10:00',
      endTime: '11:00',
    }).expect(400);
    assert.equal(tooFar.body.error.code, 'BOOKING_TOO_FAR');
  });
});
