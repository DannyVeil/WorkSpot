import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { log } from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Маршрут ${req.method} ${req.originalUrl} не найден`, 'ROUTE_NOT_FOUND'));
}

/**
 * Единый обработчик ошибок.
 * Наружу отдаётся понятное сообщение и машинный код, детали 500 — только в лог.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Некорректный JSON в теле запроса' },
    });
  }

  // Ошибки валидации Mongoose
  if (err?.name === 'ValidationError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные',
        details: Object.values(err.errors).map((item) => ({
          field: item.path,
          message: item.message,
        })),
      },
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'INVALID_ID', message: `Некорректный идентификатор: ${err.path}` },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'Такая запись уже существует. Обновите данные и попробуйте ещё раз.',
      },
    });
  }

  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const message = isApiError ? err.message : 'Внутренняя ошибка сервера';
  const code = isApiError ? err.code : 'INTERNAL_ERROR';

  if (status >= 500) {
    log.error(`${req.method} ${req.originalUrl} →`, err?.stack ?? err);
  } else if (!env.isProd) {
    log.warn(`${req.method} ${req.originalUrl} → ${status} ${code}: ${message}`);
  }

  return res.status(status).json({
    error: {
      code,
      message,
      ...(isApiError && err.details ? { details: err.details } : {}),
    },
  });
}
