/**
 * Работа со временем бронирования.
 *
 * Все даты — строки 'YYYY-MM-DD', всё время — 'HH:mm' в часовом поясе коворкинга.
 * Сетка слотов — 30 минут. Такой формат позволяет:
 *  - сравнивать дату+время лексикографически (строки нуль-паддированы);
 *  - хранить занятые слоты в массиве и ловить пересечения уникальным индексом MongoDB.
 */

export const SLOT_MINUTES = 30;
export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value) => String(value).padStart(2, '0');

/** 'HH:mm' → минуты от начала суток */
export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** минуты от начала суток → 'HH:mm' (с ограничением внутри суток) */
export function fromMinutes(totalMinutes) {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

/** Проверка существования календарной даты (2026-02-31 → false) */
export function isValidDate(date) {
  const match = DATE_RE.exec(date ?? '');
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Время кратно 30 минутам — иначе округление цены и слотов будет неоднозначным */
export function isSlotAligned(time) {
  return toMinutes(time) % SLOT_MINUTES === 0;
}

/** Длительность в часах (0.5, 1, 1.5, ...) */
export function durationHours(startTime, endTime) {
  return Math.round(((toMinutes(endTime) - toMinutes(startTime)) / 60) * 100) / 100;
}

/** Округление вверх до ближайшего слота */
export function ceilToSlot(time) {
  const minutes = toMinutes(time);
  return fromMinutes(Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES);
}

/**
 * Ключи слотов, которые занимает интервал.
 * 09:00–11:00 → ['2026-11-16T09:00', '2026-11-16T09:30', '2026-11-16T10:00', '2026-11-16T10:30']
 */
export function slotKeys(date, startTime, endTime) {
  const keys = [];
  const end = toMinutes(endTime);
  for (let cursor = toMinutes(startTime); cursor < end; cursor += SLOT_MINUTES) {
    keys.push(`${date}T${fromMinutes(cursor)}`);
  }
  return keys;
}

/** '2026-11-16T09:30' → '09:30' */
export function slotTime(slotKey) {
  return slotKey.slice(11);
}

/** '2026-11-16T09:30' → '2026-11-16' */
export function slotDate(slotKey) {
  return slotKey.slice(0, 10);
}

/** Текущие дата и время в часовом поясе коворкинга */
export function currentBusinessTime(timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value ?? '00';

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

/** Дата + N дней (без влияния часового пояса сервера) */
export function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Окно доступности по умолчанию: ближайший слот и час после него.
 * Используется, если фронтенд не передал дату/время.
 */
export function defaultAvailabilityWindow(timeZone) {
  const now = currentBusinessTime(timeZone);

  let startTime = ceilToSlot(now.time);
  if (toMinutes(startTime) >= 23 * 60) startTime = '23:00';

  const endMinutes = Math.min(toMinutes(startTime) + 60, 23 * 60 + 30);

  return {
    date: now.date,
    startTime,
    endTime: fromMinutes(endMinutes),
  };
}
