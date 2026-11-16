import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';
import RedisMock from 'ioredis-mock';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { env } from '../src/config/env.js';
import { connectMongo, disconnectMongo } from '../src/config/db.js';
import { closeRedis, getRedis, initRedis } from '../src/config/redis.js';
import { Booking, Notification, Space, User, ensureIndexes } from '../src/models/index.js';
import { SPACES } from '../src/seed/spaces.data.js';
import {
  cancelBookingByAdmin,
  extendBooking,
  getUserProfile,
  issuePassForUser,
  renameUser,
  resolveUser,
  setUserPhone,
  shortenId,
} from '../src/services/admin.service.js';
import { verifyPass } from '../src/services/pass.service.js';
import { addDays, currentBusinessTime, durationHours, slotKeys } from '../src/utils/time.js';

let mongod;
let space;
let user;
let date;

const nextCode = () => `BK-${randomInt(100_000, 1_000_000)}`;

async function makeBooking(overrides = {}) {
  const startTime = overrides.startTime ?? '09:00';
  const endTime = overrides.endTime ?? '11:00';
  const targetDate = overrides.date ?? date;

  return Booking.create({
    code: overrides.code ?? nextCode(),
    user: user._id,
    space: space._id,
    spaceSlug: space.slug,
    spaceName: space.name,
    zone: space.zone,
    date: targetDate,
    startTime,
    endTime,
    hours: durationHours(startTime, endTime),
    pricePerHour: space.pricePerHour,
    totalPrice: space.pricePerHour * durationHours(startTime, endTime),
    slots: slotKeys(targetDate, startTime, endTime),
    status: 'confirmed',
  });
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectMongo(mongod.getUri('workspot_admin_test'));
  initRedis({ client: new RedisMock() });
  await ensureIndexes();

  space = await Space.create({ ...SPACES[0], sortOrder: 0 });
  date = addDays(currentBusinessTime(env.businessTimezone).date, 2);
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

  user = await User.create({
    name: 'Даниил Бугаев',
    email: 'demo@workspot.kz',
    phone: '+7 (701) 555-01-99',
    passwordHash: 'not-a-real-hash',
    role: 'resident',
  });
});

describe('admin: поиск и профиль', () => {
  it('находит пользователя по email, полному id и суффиксу id', async () => {
    assert.equal((await resolveUser('demo@workspot.kz')).email, 'demo@workspot.kz');
    assert.equal((await resolveUser(String(user._id)))._id.toString(), user._id.toString());
    assert.equal((await resolveUser(shortenId(user._id).toLowerCase()))._id.toString(), user._id.toString());
  });

  it('возвращает понятную ошибку для неизвестного пользователя', async () => {
    await assert.rejects(() => resolveUser('nobody@workspot.kz'), /Пользователь не найден/);
  });

  it('показывает профиль с активными бронями', async () => {
    const booking = await makeBooking();
    const profile = await getUserProfile('demo@workspot.kz');

    assert.equal(profile.user.name, 'Даниил Бугаев');
    assert.equal(profile.totalBookings, 1);
    assert.equal(profile.active[0].id, booking.code);
  });
});

describe('admin: изменение профиля', () => {
  it('переименовывает пользователя и уведомляет его', async () => {
    const { user: updated, previousName } = await renameUser('demo@workspot.kz', '  Даниил Б.  ');

    assert.equal(previousName, 'Даниил Бугаев');
    assert.equal(updated.name, 'Даниил Б.');

    const note = await Notification.findOne({ user: user._id }).lean();
    assert.match(note.message, /«Даниил Бугаев» → «Даниил Б\.»/);
  });

  it('меняет и очищает телефон', async () => {
    await setUserPhone('demo@workspot.kz', '+7 (700) 111-22-33');
    assert.equal((await User.findById(user._id).lean()).phone, '+7 (700) 111-22-33');

    await setUserPhone('demo@workspot.kz', '-');
    assert.equal((await User.findById(user._id).lean()).phone, '');
  });

  it('выдаёт новый валидный QR-ключ', async () => {
    const { user: target, pass } = await issuePassForUser(shortenId(user._id));
    const check = verifyPass(pass.token);

    assert.equal(target.email, 'demo@workspot.kz');
    assert.equal(check.valid, true);
    assert.equal(check.userId, String(user._id));
  });
});

describe('admin: брони', () => {
  it('продлевает бронь: время, слоты, часы и сумма', async () => {
    const booking = await makeBooking();
    const result = await extendBooking({ code: booking.code, minutes: 90 });

    assert.equal(result.previousEnd, '11:00');
    assert.equal(result.newEnd, '12:30');
    assert.equal(result.extraPrice, Math.round(space.pricePerHour * 1.5));

    const updated = await Booking.findById(booking._id).lean();
    assert.equal(updated.endTime, '12:30');
    assert.equal(updated.hours, 3.5);
    assert.equal(updated.totalPrice, Math.round(space.pricePerHour * 3.5));
    assert.deepEqual(updated.slots, slotKeys(date, '09:00', '12:30'));

    const note = await Notification.findOne({ user: user._id }).lean();
    assert.match(note.message, /продлена до 12:30/);
  });

  it('не продлевает на занятое время', async () => {
    const booking = await makeBooking();
    await makeBooking({ startTime: '12:00', endTime: '13:00' });

    await assert.rejects(
      () => extendBooking({ code: booking.code, minutes: 90 }),
      /Место занято/,
    );
  });

  it('не продлевает после завершения и не кратно 30 минутам', async () => {
    const finished = await makeBooking({
      date: addDays(currentBusinessTime(env.businessTimezone).date, -1),
    });

    await assert.rejects(
      () => extendBooking({ code: finished.code, minutes: 30 }),
      /уже завершилась/,
    );

    const booking = await makeBooking();
    await assert.rejects(
      () => extendBooking({ code: booking.code, minutes: 45 }),
      /кратно 30 минутам/,
    );
  });

  it('не продлевает за полночь и сверх лимита часов', async () => {
    const late = await makeBooking({ startTime: '22:00', endTime: '23:00' });
    await assert.rejects(
      () => extendBooking({ code: late.code, minutes: 60 }),
      /максимум до 23:30/,
    );

    const long = await makeBooking({ startTime: '09:00', endTime: '20:00' });
    await assert.rejects(
      () => extendBooking({ code: long.code, minutes: 120 }),
      /превысит лимит/,
    );
  });

  it('отменяет бронь без участия пользователя и уведомляет его', async () => {
    const booking = await makeBooking();
    const result = await cancelBookingByAdmin(booking.code, 'клиент попросил по телефону');

    assert.equal(result.booking.status, 'cancelled');
    assert.equal((await Booking.findById(booking._id).lean()).status, 'cancelled');

    const note = await Notification.findOne({ user: user._id }).lean();
    assert.match(note.message, /Причина: клиент попросил по телефону/);
  });
});
