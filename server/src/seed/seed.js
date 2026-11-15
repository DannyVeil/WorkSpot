import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectMongo, disconnectMongo } from '../config/db.js';
import { ensureIndexes, Booking, Notification, Space, User } from '../models/index.js';
import { addDays, currentBusinessTime, durationHours, slotKeys } from '../utils/time.js';
import { SPACES } from './spaces.data.js';

const DEMO_EMAIL = 'demo@workspot.kz';
const DEMO_PASSWORD = 'WorkSpot2026';

function demoBookings(spaceBySlug, today) {
  return [
    {
      code: 'BK-2048',
      spaceSlug: 'meeting-1',
      date: addDays(today, 3),
      startTime: '14:00',
      endTime: '16:00',
      status: 'confirmed',
    },
    {
      code: 'BK-1994',
      spaceSlug: 'desk-12',
      date: addDays(today, -5),
      startTime: '10:00',
      endTime: '15:00',
      status: 'completed',
    },
  ].map((booking) => {
    const space = spaceBySlug.get(booking.spaceSlug);
    const hours = durationHours(booking.startTime, booking.endTime);

    return {
      ...booking,
      space: space._id,
      spaceName: space.name,
      zone: space.zone,
      hours,
      pricePerHour: space.pricePerHour,
      totalPrice: space.pricePerHour * hours,
      slots: slotKeys(booking.date, booking.startTime, booking.endTime),
    };
  });
}

/**
 * Наполняет подключённую базу каталогом мест и демо-данными.
 * Идемпотентно: повторный запуск обновляет места и демо-брони, не создавая дублей.
 */
export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    console.log('[seed] --reset: удаляю брони, уведомления и каталог мест…');
    await Promise.all([Booking.deleteMany({}), Notification.deleteMany({}), Space.deleteMany({})]);
  }

  const spaceBySlug = new Map();

  for (const [index, space] of SPACES.entries()) {
    const document = await Space.findOneAndUpdate(
      { slug: space.slug },
      { $set: { ...space, isActive: true, sortOrder: index } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    spaceBySlug.set(space.slug, document);
  }

  console.log(`[seed] мест в каталоге: ${spaceBySlug.size}`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const demoUser = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      $setOnInsert: {
        name: 'Даниил Бугаев',
        email: DEMO_EMAIL,
        phone: '+7 (701) 555-01-99',
        passwordHash,
        role: 'resident',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const today = currentBusinessTime(env.businessTimezone).date;

  for (const booking of demoBookings(spaceBySlug, today)) {
    try {
      await Booking.updateOne(
        { code: booking.code },
        { $set: { ...booking, user: demoUser._id, cancelledAt: null } },
        { upsert: true },
      );
    } catch (error) {
      // Например, это время уже занято реальной бронью — не ломаем сид из-за демо-данных
      console.warn(`[seed] не удалось создать демо-бронь ${booking.code}:`, error.message);
    }
  }

  console.log('[seed] демо-аккаунт:', DEMO_EMAIL, '/', DEMO_PASSWORD);
  console.log('[seed] демо-брони: BK-2048 (предстоящая), BK-1994 (завершённая)');
  console.log('[seed] готово');

  return { spaces: spaceBySlug.size, demoEmail: DEMO_EMAIL, demoPassword: DEMO_PASSWORD };
}

async function main() {
  await connectMongo(env.mongoUri);
  await ensureIndexes();

  try {
    await seedDatabase({ reset: process.argv.includes('--reset') });
  } finally {
    await disconnectMongo();
  }
}

const isExecutedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  main().catch((error) => {
    console.error('[seed] ошибка:', error);
    process.exitCode = 1;
  });
}
