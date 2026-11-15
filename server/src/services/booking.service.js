import { randomInt } from 'node:crypto';
import { Booking } from '../models/Booking.js';
import { Space } from '../models/Space.js';
import { Notification } from '../models/Notification.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { toBookingDTO, toSpaceDTO } from '../utils/dto.js';
import {
  addDays,
  currentBusinessTime,
  durationHours,
  isSlotAligned,
  isValidDate,
  slotKeys,
  slotTime,
  TIME_RE,
  toMinutes,
} from '../utils/time.js';
import {
  createHold,
  getHeldSlots,
  getHold,
  getOwnHoldIds,
  mutexKey,
  releaseHold,
  withMutex,
} from './hold.service.js';

/**
 * Проверка интервала бронирования.
 * Возвращает нормализованное окно + готовый набор слотов для уникального индекса.
 */
export function validateBookingWindow({ date, startTime, endTime }) {
  if (!isValidDate(date)) {
    throw ApiError.badRequest('Некорректная дата. Ожидается формат YYYY-MM-DD.', 'INVALID_DATE');
  }
  if (!TIME_RE.test(startTime ?? '') || !TIME_RE.test(endTime ?? '')) {
    throw ApiError.badRequest('Некорректное время. Ожидается формат HH:mm.', 'INVALID_TIME');
  }
  if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
    throw ApiError.badRequest(
      'Время должно быть кратно 30 минутам (09:00, 09:30, 10:00…).',
      'TIME_NOT_ALIGNED',
    );
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw ApiError.badRequest('Время окончания должно быть позже времени начала.', 'INVALID_INTERVAL');
  }

  const hours = durationHours(startTime, endTime);
  if (hours > env.maxBookingHours) {
    throw ApiError.badRequest(
      `Максимальная длительность одной брони — ${env.maxBookingHours} ч.`,
      'BOOKING_TOO_LONG',
    );
  }

  const now = currentBusinessTime(env.businessTimezone);
  const startKey = `${date}T${startTime}`;
  const nowKey = `${now.date}T${now.time}`;

  if (startKey <= nowKey) {
    throw ApiError.badRequest('Нельзя забронировать место на прошедшее время.', 'BOOKING_IN_PAST');
  }
  if (date > addDays(now.date, env.bookingHorizonDays)) {
    throw ApiError.badRequest(
      `Бронировать можно не более чем на ${env.bookingHorizonDays} дней вперёд.`,
      'BOOKING_TOO_FAR',
    );
  }

  return {
    date,
    startTime,
    endTime,
    hours,
    slots: slotKeys(date, startTime, endTime),
  };
}

/** Пересечение с подтверждёнными бронями этого места и других мест этого же пользователя. */
async function assertWindowIsFree({ space, date, slots, userId }) {
  const spaceConflict = await Booking.findOne({
    space: space._id,
    date,
    status: 'confirmed',
    slots: { $in: slots },
  })
    .select('startTime endTime')
    .lean();

  if (spaceConflict) {
    throw ApiError.conflict(
      'Это время уже забронировано. Обновите карту и выберите другой интервал.',
      'SLOT_TAKEN',
      { busyFrom: spaceConflict.startTime, busyTo: spaceConflict.endTime },
    );
  }

  if (!userId) return;

  const userConflict = await Booking.findOne({
    user: userId,
    date,
    status: 'confirmed',
    slots: { $in: slots },
  })
    .select('code spaceName startTime endTime')
    .lean();

  if (userConflict) {
    throw ApiError.conflict(
      `У вас уже есть бронь «${userConflict.spaceName}» на это время (${userConflict.startTime}–${userConflict.endTime}).`,
      'USER_TIME_CONFLICT',
      { bookingId: userConflict.code },
    );
  }
}

async function notify(userId, { title, message, type = 'info' }) {
  // Уведомление не должно ломать основную операцию
  try {
    await Notification.create({ user: userId, title, message, type });
  } catch (err) {
    console.error('[notification] не удалось сохранить:', err.message);
  }
}

async function insertBookingWithUniqueCode(data) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Booking.create({ ...data, code: `BK-${randomInt(100_000, 1_000_000)}` });
    } catch (err) {
      // Коллизия именно по коду брони — просто пробуем другой
      if (err?.code === 11000 && err?.keyPattern?.code) continue;

      if (err?.code === 11000) {
        throw ApiError.conflict(
          'Это время только что заняли. Пожалуйста, выберите другой интервал.',
          'SLOT_TAKEN',
        );
      }
      throw err;
    }
  }

  throw ApiError.unavailable(
    'Не удалось сформировать номер брони. Попробуйте ещё раз.',
    'CODE_GENERATION_FAILED',
  );
}

/**
 * Шаг 1. Резерв стола на время оформления брони.
 * Redis держит слоты HOLD_TTL_SECONDS секунд — другие пользователи видят их занятыми,
 * но в MongoDB бронь ещё не создана. Бронь можно спокойно оплатить/подтвердить.
 */
export async function holdSpace({ userId, spaceId, date, startTime, endTime }) {
  const space = await Space.findOne({ slug: spaceId, isActive: true }).lean();
  if (!space) throw ApiError.notFound('Такое рабочее место не найдено', 'SPACE_NOT_FOUND');

  const window = validateBookingWindow({ date, startTime, endTime });

  // Мьютекс не даёт двум параллельным запросам одновременно занять частично
  // пересекающиеся наборы слотов одного стола.
  return withMutex(mutexKey(space.slug, window.date), async () => {
    await assertWindowIsFree({ space, ...window, userId });

    // Отдельно проверяем резервы других пользователей. Это позволяет не потерять
    // собственный старый резерв, если новый интервал уже кем-то удерживается.
    const [heldBySpace, ownHoldIds] = await Promise.all([
      getHeldSlots([space.slug], window.slots),
      getOwnHoldIds(userId, [space.slug], window.date),
    ]);

    const ownHoldId = ownHoldIds.get(space.slug);
    const heldSlots = heldBySpace.get(space.slug) ?? new Map();
    const foreignHold = [...heldSlots.entries()].find(([, holdId]) => holdId !== ownHoldId);

    if (foreignHold) {
      throw ApiError.conflict(
        `Слот ${slotTime(foreignHold[0])} уже бронируют. Обновите карту и выберите другое время.`,
        'SLOT_HELD',
        { slot: slotTime(foreignHold[0]) },
      );
    }

    const hold = await createHold({ userId, space, ...window });

    return {
      holdId: hold.holdId,
      expiresAt: hold.expiresAt,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      hours: hold.hours,
      totalPrice: hold.totalPrice,
      slots: hold.slots.map(slotTime),
      space: toSpaceDTO(space),
    };
  });
}

/**
 * Шаг 2. Подтверждение резерва и создание брони.
 * Внутри мьютекс + повторная проверка пересечений + уникальный индекс MongoDB.
 */
export async function confirmHold({ userId, holdId }) {
  const hold = await getHold(holdId);
  if (!hold) {
    throw new ApiError(
      410,
      'Время на оформление истекло. Выберите место и время заново.',
      'HOLD_EXPIRED',
    );
  }

  if (String(hold.userId) !== String(userId)) {
    throw ApiError.forbidden('Этот резерв принадлежит другому пользователю', 'HOLD_FOREIGN');
  }

  const space = await Space.findOne({ slug: hold.spaceSlug, isActive: true }).lean();
  if (!space) {
    await releaseHold(holdId);
    throw ApiError.notFound('Рабочее место больше недоступно', 'SPACE_NOT_FOUND');
  }

  const booking = await withMutex(mutexKey(space.slug, hold.date), async () => {
    await assertWindowIsFree({
      space,
      date: hold.date,
      slots: hold.slots,
      userId,
    });

    return insertBookingWithUniqueCode({
      user: userId,
      space: space._id,
      spaceSlug: space.slug,
      spaceName: space.name,
      zone: space.zone,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      hours: hold.hours,
      pricePerHour: space.pricePerHour,
      totalPrice: Math.round(space.pricePerHour * hold.hours),
      slots: hold.slots,
      status: 'confirmed',
    });
  });

  // Резерв больше не нужен: слоты теперь защищены документом брони
  await releaseHold(holdId);

  await notify(userId, {
    title: 'Бронь подтверждена',
    message: `${space.name} забронирован на ${hold.date} с ${hold.startTime} до ${hold.endTime}. Стоимость: ${Math.round(space.pricePerHour * hold.hours)} ₸.`,
    type: 'success',
  });

  return toBookingDTO(booking, currentBusinessTime(env.businessTimezone));
}

/** Отмена брони. Слоты автоматически освобождаются (частичный уникальный индекс). */
export async function cancelBooking({ userId, code }) {
  const booking = await Booking.findOne({ code, user: userId });
  if (!booking) throw ApiError.notFound('Бронирование не найдено', 'BOOKING_NOT_FOUND');

  if (booking.status !== 'confirmed') {
    throw ApiError.conflict('Эта бронь уже отменена или завершена', 'BOOKING_NOT_ACTIVE');
  }

  const dto = toBookingDTO(booking, currentBusinessTime(env.businessTimezone));
  if (!dto.canCancel) {
    throw ApiError.conflict('Нельзя отменить уже завершённую бронь', 'BOOKING_FINISHED');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  await notify(userId, {
    title: 'Бронирование отменено',
    message: `Бронь ${booking.code} (${booking.spaceName}) на ${booking.date} отменена.`,
    type: 'info',
  });

  return toBookingDTO(booking, currentBusinessTime(env.businessTimezone));
}

/** Информация об активном резерве (нужна фронтенду для таймера обратного отсчёта). */
export async function getHoldForUser({ userId, holdId }) {
  const hold = await getHold(holdId);
  if (!hold) {
    throw new ApiError(410, 'Резерв истёк или не найден', 'HOLD_EXPIRED');
  }
  if (String(hold.userId) !== String(userId)) {
    throw ApiError.forbidden('Этот резерв принадлежит другому пользователю', 'HOLD_FOREIGN');
  }

  return {
    holdId: hold.holdId,
    expiresAt: hold.expiresAt,
    date: hold.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    hours: hold.hours,
    totalPrice: hold.totalPrice,
    slots: hold.slots.map(slotTime),
  };
}

/** Досрочное освобождение резерва (кнопка «Отмена» в модальном окне). */
export async function releaseUserHold({ userId, holdId }) {
  const hold = await getHold(holdId);
  if (!hold) return { released: false };
  if (String(hold.userId) !== String(userId)) {
    throw ApiError.forbidden('Этот резерв принадлежит другому пользователю', 'HOLD_FOREIGN');
  }

  await releaseHold(holdId);
  return { released: true };
}

/** Список броней пользователя: active | history | all. */
export async function listUserBookings({ userId, scope = 'all' }) {
  const bookings = await Booking.find({ user: userId })
    .sort({ date: -1, startTime: -1 })
    .limit(200)
    .lean();

  const now = currentBusinessTime(env.businessTimezone);
  const dtos = bookings.map((booking) => toBookingDTO(booking, now));

  if (scope === 'active') return dtos.filter((booking) => booking.status === 'confirmed');
  if (scope === 'history') return dtos.filter((booking) => booking.status !== 'confirmed');
  return dtos;
}
