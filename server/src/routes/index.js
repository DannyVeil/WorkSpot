import { Router } from 'express';
import { health } from '../controllers/health.controller.js';
import { authRouter } from './auth.routes.js';
import { spaceRouter } from './space.routes.js';
import { bookingRouter } from './booking.routes.js';
import { notificationRouter } from './notification.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/spaces', spaceRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/notifications', notificationRouter);

export { health };
