import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const jsonRateLimitHandler = (message) => (req, _res, next) => {
  next(ApiError.tooManyRequests(message));
};

const skipInTests = () => env.nodeEnv === 'test';

/** Защита от перебора паролей */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  handler: jsonRateLimitHandler('Слишком много попыток входа. Повторите через 15 минут.'),
});

/** Защита от спама резервами (каждый резерв — это запись в Redis) */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  handler: jsonRateLimitHandler('Слишком много запросов на бронирование. Подождите минуту.'),
});

/** Общий лимит для всего API */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  handler: jsonRateLimitHandler('Слишком много запросов. Попробуйте позже.'),
});
