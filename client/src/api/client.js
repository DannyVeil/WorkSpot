/**
 * Клиент WorkSpot API.
 * Адаптирован из server/examples/workspot-api.js:
 *  - singleton для приложения;
 *  - подписка на изменение сессии;
 *  - преобразование статусов мест под интерактивную карту;
 *  - refresh-токен не пытаемся обновлять на /auth/* запросах.
 */
import { API_BASE_URL } from '../constants/config.js';

const STORAGE_KEY = 'workspot.auth';

export class WorkSpotApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'WorkSpotApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function defaultStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

export function createWorkSpotApi({ baseUrl = API_BASE_URL, storage } = {}) {
  const store = storage === undefined ? defaultStorage() : storage;
  let session = readSession();
  const listeners = new Set();

  function readSession() {
    try {
      return JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      return null;
    }
  }

  function saveSession(next) {
    session = next;
    if (store) {
      if (next) store.setItem(STORAGE_KEY, JSON.stringify(next));
      else store.removeItem(STORAGE_KEY);
    }
    listeners.forEach((listener) => {
      try {
        listener(session);
      } catch (error) {
        console.error('[auth] ошибка подписчика сессии:', error);
      }
    });
  }

  async function rawRequest(path, { method = 'GET', body, token, retry = true } = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      const error = new TypeError('Не удалось выполнить запрос к API');
      error.cause = cause;
      throw error;
    }

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = payload.error ?? {};

      // Access-токен истёк — пробуем обновить сессию один раз.
      // На самих auth-эндпоинтах refresh не вызываем, иначе ошибка входа зациклится.
      const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].some(
        (prefix) => path.startsWith(prefix),
      );

      if (
        response.status === 401 &&
        retry &&
        !isAuthEndpoint &&
        session?.refreshToken &&
        error.code !== 'INVALID_CREDENTIALS'
      ) {
        const refreshed = await refresh();
        if (refreshed) {
          return rawRequest(path, { method, body, token: session.accessToken, retry: false });
        }
      }

      throw new WorkSpotApiError(
        response.status,
        error.code ?? 'REQUEST_FAILED',
        error.message ?? `Ошибка запроса (${response.status})`,
        error.details,
      );
    }

    return payload;
  }

  async function refresh() {
    if (!session?.refreshToken) return false;
    try {
      const data = await rawRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
        retry: false,
      });
      saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return true;
    } catch {
      saveSession(null);
      return false;
    }
  }

  const authorized = (path, options = {}) => {
    if (!session?.accessToken) {
      return Promise.reject(
        new WorkSpotApiError(401, 'TOKEN_MISSING', 'Войдите в аккаунт, чтобы продолжить'),
      );
    }
    return rawRequest(path, { ...options, token: session.accessToken });
  };

  const query = (params) => {
    const search = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== ''),
    ).toString();
    return search ? `?${search}` : '';
  };

  return {
    get session() {
      return session;
    },
    get user() {
      return session?.user ?? null;
    },

    /** Подписка на вход/выход/обновление токена. Возвращает функцию отписки. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async register(payload) {
      const data = await rawRequest('/auth/register', { method: 'POST', body: payload });
      saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return data;
    },

    async login(payload) {
      const data = await rawRequest('/auth/login', { method: 'POST', body: payload });
      saveSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return data;
    },

    async logout() {
      const refreshToken = session?.refreshToken;
      saveSession(null);
      if (refreshToken) {
        await rawRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        }).catch(() => {});
      }
    },

    async me() {
      const data = await authorized('/auth/me');
      saveSession({ ...session, user: data.user });
      return data.user;
    },

    /** Карта мест на интервал. Токен не обязателен, но даёт статус «held_by_you». */
    async getSpaces(params) {
      return rawRequest(`/spaces${query(params)}`, {
        token: session?.accessToken,
      });
    },

    async getSpaceAvailability(slug, params) {
      return rawRequest(`/spaces/${encodeURIComponent(slug)}/availability${query(params)}`, {
        token: session?.accessToken,
      });
    },

    /** Шаг 1: временно закрепить стол за пользователем (Redis hold). */
    hold({ spaceId, date, startTime, endTime }) {
      return authorized('/bookings/hold', {
        method: 'POST',
        body: { spaceId, date, startTime, endTime },
      });
    },

    getHold(holdId) {
      return authorized(`/bookings/hold/${encodeURIComponent(holdId)}`);
    },

    releaseHold(holdId) {
      return authorized(`/bookings/hold/${encodeURIComponent(holdId)}`, { method: 'DELETE' });
    },

    /** Шаг 2: подтвердить резерв и получить бронь. */
    confirm(holdId) {
      return authorized('/bookings', { method: 'POST', body: { holdId } });
    },

    getBookings(scope = 'all') {
      return authorized(`/bookings${query({ scope })}`);
    },

    cancelBooking(code) {
      return authorized(`/bookings/${encodeURIComponent(code)}`, { method: 'DELETE' });
    },

    getNotifications() {
      return authorized('/notifications');
    },

    markAllNotificationsRead() {
      return authorized('/notifications/read-all', { method: 'POST' });
    },

    markNotificationRead(id) {
      return authorized(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
    },

    /** Чат поддержки: переписка текущего пользователя (ответы приходят из Telegram). */
    getSupportMessages() {
      return authorized('/support/messages');
    },

    sendSupportMessage(text) {
      return authorized('/support/messages', { method: 'POST', body: { text } });
    },

    /** Персональный QR-пропуск: подписанный ключ с ограниченным сроком действия. */
    getPass() {
      return authorized('/pass');
    },
  };
}

/**
 * API отдаёт статусы available / booked / held / held_by_you.
 * Карта макета знает только available / occupied.
 * Собственный резерв (held_by_you) считаем доступным для выбора.
 */
export function toFrontendSpace(space) {
  const apiStatus = space.status ?? 'available';
  const isSelectable = apiStatus === 'available' || apiStatus === 'held_by_you';

  return {
    ...space,
    apiStatus,
    heldByMe: apiStatus === 'held_by_you' || Boolean(space.heldByMe),
    status: isSelectable ? 'available' : 'occupied',
  };
}

export const api = createWorkSpotApi();
