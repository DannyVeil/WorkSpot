import { Booking } from '../models/Booking.js';
import { Space, SPACE_TYPES } from '../models/Space.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { toSpaceDTO } from '../utils/dto.js';
import {
  defaultAvailabilityWindow,
  isSlotAligned,
  isValidDate,
  slotKeys,
  slotTime,
  TIME_RE,
  toMinutes,
} from '../utils/time.js';
import { getHeldSlots, getHold, getOwnHoldIds } from './hold.service.js';

const ALL_TYPES = 'Все типы';

/**
 * Окно доступности:
 *  - ничего не передано  → ближайший час от текущего времени;
 *  - только дата         → весь день (00:00–23:30);
 *  - дата + время        → указанный интервал.
 */
export function resolveAvailabilityWindow({ date, startTime, endTime }) {
  if (!date) {
    if (startTime || endTime) {
      throw ApiError.badRequest('Укажите дату вместе со временем.', 'INCOMPLETE_WINDOW');
    }
    return defaultAvailabilityWindow(env.businessTimezone);
  }

  if (!isValidDate(date)) {
    throw ApiError.badRequest('Некорректная дата. Ожидается формат YYYY-MM-DD.', 'INVALID_DATE');
  }

  if (!startTime && !endTime) {
    return { date, startTime: '00:00', endTime: '23:30' };
  }

  if (!startTime || !endTime) {
    throw ApiError.badRequest('Укажите и время начала, и время окончания.', 'INCOMPLETE_WINDOW');
  }

  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    throw ApiError.badRequest('Некорректное время. Ожидается формат HH:mm.', 'INVALID_TIME');
  }

  if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
    throw ApiError.badRequest('Время должно быть кратно 30 минутам.', 'TIME_NOT_ALIGNED');
  }

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw ApiError.badRequest('Время окончания должно быть позже времени начала.', 'INVALID_INTERVAL');
  }

  return { date, startTime, endTime };
}

/**
 * Карта свободных/занятых мест на интервал.
 * Учитывает:
 *  - подтверждённые брони из MongoDB;
 *  - активные резервы (hold) из Redis — включая резерв самого пользователя.
 */
export async function getAvailability({ date, startTime, endTime, type, userId }) {
  const window = resolveAvailabilityWindow({ date, startTime, endTime });

  if (type && type !== ALL_TYPES && !SPACE_TYPES.includes(type)) {
    throw ApiError.badRequest(`Неизвестный тип места: ${type}`, 'INVALID_SPACE_TYPE');
  }

  const slots = slotKeys(window.date, window.startTime, window.endTime);
  const query = { isActive: true };
  if (type && type !== ALL_TYPES) query.type = type;

  const spaces = await Space.find(query).sort({ sortOrder: 1 }).lean();
  if (!spaces.length) {
    return { window: { ...window, slots: slots.map(slotTime) }, spaces: [] };
  }

  const spaceIds = spaces.map((space) => space._id);

  const booked = await Booking.find({
    date: window.date,
    status: 'confirmed',
    slots: { $in: slots },
    space: { $in: spaceIds },
  })
    .select('space slots')
    .lean();

  const busyBySpace = new Map();
  for (const booking of booked) {
    const key = String(booking.space);
    if (!busyBySpace.has(key)) busyBySpace.set(key, new Set());
    const set = busyBySpace.get(key);
    for (const slot of booking.slots) {
      if (slots.includes(slot)) set.add(slot);
    }
  }

  const slugs = spaces.map((space) => space.slug);
  const [heldBySpace, ownHoldIds] = await Promise.all([
    getHeldSlots(slugs, slots),
    getOwnHoldIds(userId, slugs, window.date),
  ]);

  // Метаданные резервов нужны только для отображения таймера «осталось N минут»
  const ownHoldMetas = new Map();
  await Promise.all(
    [...ownHoldIds.entries()].map(async ([slug, holdId]) => {
      const hold = await getHold(holdId);
      if (hold) ownHoldMetas.set(slug, hold);
    }),
  );

  const result = spaces.map((space) => {
    const ownHoldId = ownHoldIds.get(space.slug);
    const heldMap = heldBySpace.get(space.slug) ?? new Map();

    const busySlots = busyBySpace.get(String(space._id)) ?? new Set();
    const ownHeldSlots = new Set();
    const otherHeldSlots = new Set();

    for (const [slot, holdId] of heldMap) {
      if (ownHoldId && holdId === ownHoldId) ownHeldSlots.add(slot);
      else otherHeldSlots.add(slot);
    }

    const blockedByBooking = busySlots.size > 0;
    const blockedByOthers = otherHeldSlots.size > 0;

    let status = 'available';
    if (blockedByBooking) status = 'booked';
    else if (blockedByOthers) status = 'held';
    else if (ownHeldSlots.size > 0) status = 'held_by_you';

    return {
      ...toSpaceDTO(space),
      status,
      available: !blockedByBooking && !blockedByOthers,
      heldByMe: ownHeldSlots.size > 0,
      holdExpiresAt: ownHoldMetas.get(space.slug)?.expiresAt ?? null,
      busySlots: [...busySlots].sort().map(slotTime),
      heldSlots: [...otherHeldSlots].sort().map(slotTime),
      myHeldSlots: [...ownHeldSlots].sort().map(slotTime),
    };
  });

  return {
    window: { ...window, slots: slots.map(slotTime) },
    spaces: result,
  };
}

export async function getSpaceBySlug(slug) {
  const space = await Space.findOne({ slug, isActive: true }).lean();
  if (!space) throw ApiError.notFound('Рабочее место не найдено', 'SPACE_NOT_FOUND');
  return toSpaceDTO(space);
}
