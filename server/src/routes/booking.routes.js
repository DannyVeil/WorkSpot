import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  bookingCodeParamsSchema,
  bookingListQuerySchema,
  confirmSchema,
  holdParamsSchema,
  holdSchema,
} from '../validation/schemas.js';
import * as controller from '../controllers/booking.controller.js';

export const bookingRouter = Router();

// Все операции с бронями — только для авторизованных пользователей
bookingRouter.use(requireAuth);

// Временный резерв стола (Redis) — шаг 1
bookingRouter.post('/hold', bookingLimiter, validate({ body: holdSchema }), controller.hold);
bookingRouter.get('/hold/:holdId', validate({ params: holdParamsSchema }), controller.getHold);
bookingRouter.delete('/hold/:holdId', validate({ params: holdParamsSchema }), controller.releaseHold);

// Подтверждение резерва и создание брони (MongoDB) — шаг 2
bookingRouter.post('/', bookingLimiter, validate({ body: confirmSchema }), controller.confirm);

bookingRouter.get('/', validate({ query: bookingListQuerySchema }), controller.list);
bookingRouter.delete('/:code', validate({ params: bookingCodeParamsSchema }), controller.cancel);
