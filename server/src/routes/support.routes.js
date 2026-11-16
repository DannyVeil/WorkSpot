import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { supportLimiter } from '../middleware/rateLimit.js';
import { supportMessageSchema } from '../validation/schemas.js';
import * as controller from '../controllers/support.controller.js';

export const supportRouter = Router();

supportRouter.use(requireAuth);

supportRouter.get('/messages', controller.list);
supportRouter.post(
  '/messages',
  supportLimiter,
  validate({ body: supportMessageSchema }),
  controller.send,
);
