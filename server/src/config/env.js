import 'dotenv/config';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'dev-only-workspot-secret-change-me';

if (isProd && !process.env.JWT_SECRET) {
  // Не роняем приложение, но громко предупреждаем: с дефолтным секретом токены можно подделать.
  console.warn('[env] JWT_SECRET не задан — используется небезопасный dev-секрет!');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: toInt(process.env.PORT, 4000),

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workspot',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

  jwtSecret,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '2h',
  refreshTtlDays: toInt(process.env.REFRESH_TTL_DAYS, 30),

  corsOrigins: toList(process.env.CORS_ORIGINS),
  trustProxy: toInt(process.env.TRUST_PROXY, 1),

  // Временная блокировка стола на время оформления брони
  holdTtlSeconds: toInt(process.env.HOLD_TTL_SECONDS, 600),
  // Блокировка на уровне Redis для критической секции «проверил → записал»
  mutexTtlMs: 5_000,
  mutexWaitMs: 2_500,

  maxBookingHours: toInt(process.env.MAX_BOOKING_HOURS, 12),
  bookingHorizonDays: toInt(process.env.BOOKING_HORIZON_DAYS, 60),
  businessTimezone: process.env.BUSINESS_TIMEZONE || 'Asia/Almaty',
};
