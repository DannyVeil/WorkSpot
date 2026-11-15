import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { availabilityQuerySchema, spaceSlugParamsSchema } from '../validation/schemas.js';
import * as controller from '../controllers/space.controller.js';

export const spaceRouter = Router();

spaceRouter.get(
  '/',
  optionalAuth,
  validate({ query: availabilityQuerySchema }),
  controller.listSpaces,
);

spaceRouter.get(
  '/:slug/availability',
  optionalAuth,
  validate({ query: availabilityQuerySchema, params: spaceSlugParamsSchema }),
  controller.getSpaceAvailability,
);

spaceRouter.get(
  '/:slug',
  validate({ params: spaceSlugParamsSchema }),
  controller.getSpace,
);
