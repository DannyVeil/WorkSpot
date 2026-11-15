import { getRedis } from '../config/redis.js';
import { mongoStatus } from '../config/db.js';

/** GET /healthz — используется docker-compose healthcheck и мониторингом */
export async function health(_req, res) {
  const mongo = mongoStatus() === 1 ? 'up' : 'down';

  let redis = 'down';
  try {
    const pong = await getRedis().ping();
    redis = pong === 'PONG' ? 'up' : 'down';
  } catch {
    redis = 'down';
  }

  const healthy = mongo === 'up' && redis === 'up';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    mongo,
    redis,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
