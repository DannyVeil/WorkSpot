/** Форматирование значений для интерфейса WorkSpot. */

/** 15400 → «15 400» */
export function formatPrice(value) {
  return Math.round(Number(value) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** «2026-11-18» → «18.11.2026» */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = String(isoDate).split('-');
  if (!year || !month || !day) return String(isoDate);
  return `${day}.${month}.${year}`;
}

/** «2026-11-18» → «18 ноября, вторник» */
export function formatDateLong(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(isoDate);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

/** Date → «2026-11-16» в локальном часовом поясе (для input[type=date]). */
export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Завтрашняя дата в формате input[type=date]. */
export function tomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

/** Date → «14:05» */
export function formatClock(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Разница между «09:00» и «16:00» в часах: 7 */
export function calculateHours(start, end) {
  const [startHours, startMinutes] = String(start || '')
    .split(':')
    .map(Number);
  const [endHours, endMinutes] = String(end || '')
    .split(':')
    .map(Number);

  if ([startHours, startMinutes, endHours, endMinutes].some(Number.isNaN)) return 0;

  const diff = endHours + endMinutes / 60 - (startHours + startMinutes / 60);
  return diff > 0 ? Math.round(diff * 10) / 10 : 0;
}

/** «Даниил Бугаев» → «ДБ» для аватарки в шапке. */
export function getUserInitials(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

/** «2 ч.» с правильным окончанием (для подсказок, не обязательное). */
export function formatHours(hours) {
  const value = Number(hours) || 0;
  const word = value === 1 ? 'час' : value >= 2 && value <= 4 ? 'часа' : 'часов';
  return `${value} ${word}`;
}

/** Небольшая человекочитаемая метка для уведомлений, созданных на клиенте. */
export function formatRelativeTime(value) {
  if (!value) return 'Только что';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Только что';

  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return 'Только что';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} мин назад`;
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)} ч назад`;
  return date.toLocaleDateString('ru-RU');
}
