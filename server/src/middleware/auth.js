import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';

function extractBearerToken(req) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

/** Обязательная авторизация: 401, если токена нет/он просрочен. */
export function requireAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Требуется авторизация', 'TOKEN_MISSING'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Сессия истекла. Войдите в аккаунт заново.', 'TOKEN_INVALID'));
  }
}

/**
 * Необязательная авторизация: нужна карте доступности, чтобы показать
 * пользователю его собственный резерв. Невалидный токен просто игнорируется.
 */
export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    // гость
  }
  return next();
}

/** Доступ только для администратора коворкинга. */
export function requireAdmin(req, _res, next) {
  if (req.auth?.role !== 'admin') {
    return next(ApiError.forbidden('Недостаточно прав', 'ADMIN_ONLY'));
  }
  return next();
}
