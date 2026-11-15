/**
 * Пример клиента WorkSpot API для React-приложения (workspot.tsx).
 * Файл не входит в сборку сервера — скопируйте его во фронтенд.
 *
 * Использование:
 *   import { createWorkSpotApi } from './workspot-api';
 *   const api = createWorkSpotApi({ baseUrl: 'http://localhost:4000/api' });
 *   await api.login({ email, password });
 *   const { spaces } = await api.getSpaces({ date, startTime, endTime });
 */

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

export function createWorkSpotApi({ baseUrl = 'http://localhost:4000/api', storage } = {}) {
  const store = storage === undefined ? defaultStorage() : storage;
  let session = readSession();

  function readSession() {
    try {
      return JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      return null;
    }
  }

  function saveSession(next) {
    session = next;
    if (!store) return;
    if (next) store.setItem(STORAGE_KEY, JSON.stringify(next));
    else store.removeItem(STORAGE_KEY);
  }

  async function rawRequest(path, { method = 'GET', body, token, retry = true } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = payload.error ?? {};

      // Access-токен истёк — пробуем обновить сессию один раз
      if (response.status === 401 && retry && session?.refreshToken && error.code !== 'INVALID_CREDENTIALS') {
        const refreshed = await refresh();
        if (refreshed) return rawRequest(path, { method, body, token: session.accessToken, retry: false });
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

    async register(payload) {
      const data = await rawRequest('/auth/register', { method: 'POST', body: payload });
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      return data;
    },

    async login(payload) {
      const data = await rawRequest('/auth/login', { method: 'POST', body: payload });
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      return data;
    },

    async logout() {
      const refreshToken = session?.refreshToken;
      saveSession(null);
      if (refreshToken) {
        await rawRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
      }
    },

    async me() {
      const data = await authorized('/auth/me');
      saveSession({ ...session, user: data.user });
      return data.user;
    },

    /** Карта мест на интервал. Требует date + startTime + endTime (или только date — весь день). */
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
  };
}

/**
 * API отдаёт статусы available / booked / held / held_by_you.
 * В текущем макете у места есть только available / occupied,
 * поэтому для карты преобразуем «занято» и «резерв» в occupied.
 */
export function toFrontendSpace(space) {
  return {
    ...space,
    status: space.status === 'available' ? 'available' : 'occupied',
  };
}
