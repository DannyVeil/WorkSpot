import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { health, apiRouter } from './routes/index.js';

/** Собирает Express-приложение. Вынесено отдельно, чтобы тесты поднимали его без listen(). */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  if (env.trustProxy) app.set('trust proxy', env.trustProxy);

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Запросы без Origin (curl, server-to-server, мобильные приложения) разрешаем
        if (!origin) return callback(null, true);
        if (!env.corsOrigins.length || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(ApiError.forbidden(`Origin ${origin} не разрешён`, 'CORS_FORBIDDEN'));
      },
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  // Healthcheck без rate limit, чтобы им могли пользоваться docker/monitoring
  app.get('/healthz', health);

  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
