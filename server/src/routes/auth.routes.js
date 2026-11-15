import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from '../validation/schemas.js';
import * as controller from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
authRouter.post('/refresh', validate({ body: refreshSchema }), controller.refresh);
authRouter.post('/logout', validate({ body: logoutSchema }), controller.logout);
authRouter.get('/me', requireAuth, controller.me);
