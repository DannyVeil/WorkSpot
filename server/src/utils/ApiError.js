/**
 * Ошибка приложения с HTTP-статусом и машинным кодом.
 * Все ожидаемые ошибки бросаются только этим классом — остальное попадает в 500.
 */
export class ApiError extends Error {
  constructor(status, message, code = 'ERROR', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true;
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Требуется авторизация', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Недостаточно прав', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Не найдено', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT', details) {
    return new ApiError(409, message, code, details);
  }

  static tooManyRequests(message = 'Слишком много запросов', code = 'RATE_LIMITED') {
    return new ApiError(429, message, code);
  }

  static unavailable(message = 'Сервис временно недоступен', code = 'UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}
