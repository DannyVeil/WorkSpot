import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notificationParamsSchema } from '../validation/schemas.js';
import * as controller from '../controllers/notification.controller.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', controller.list);
notificationRouter.post('/read-all', controller.readAll);
notificationRouter.post(
  '/:id/read',
  validate({ params: notificationParamsSchema }),
  controller.readOne,
);
