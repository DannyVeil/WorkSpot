/** Общие настройки фронтенда WorkSpot. */

export const APP_NAME = 'WorkSpot';

/**
 * В режиме разработки запросы идут на /api и проксируются Vite на Express.
 * В production задайте VITE_API_URL, например https://api.workspot.kz/api
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** Как часто обновляем карту доступности, чтобы видеть чужие резервы. */
export const SPACES_POLL_INTERVAL = 30_000;

/** Задержка перед запросом при изменении фильтров — чтобы не спамить API. */
export const SPACES_DEBOUNCE = 300;

export const BOOKING_TYPES = ['Все типы', 'Рабочий стол', 'Переговорная', 'Кабинет'];

export const DEFAULT_AUTH_BANNER =
  'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями';
