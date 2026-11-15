import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Валидация body / query / params через zod.
 * Результат кладётся в req.body, req.validatedQuery и req.validatedParams,
 * потому что в Express 5 req.query — read-only getter.
 */
export function validate(schemas) {
  return function validateMiddleware(req, _res, next) {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.query) req.validatedQuery = schemas.query.parse(req.query ?? {});
      if (schemas.params) req.validatedParams = schemas.params.parse(req.params ?? {});
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(
            422,
            'Проверьте правильность заполнения полей',
            'VALIDATION_ERROR',
            error.issues.map((issue) => ({
              field: issue.path.join('.') || 'body',
              message: issue.message,
            })),
          ),
        );
      }
      return next(error);
    }
  };
}
