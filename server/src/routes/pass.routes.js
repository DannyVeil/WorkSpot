import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as controller from '../controllers/pass.controller.js';

export const passRouter = Router();

passRouter.use(requireAuth);

passRouter.get('/', controller.get);
