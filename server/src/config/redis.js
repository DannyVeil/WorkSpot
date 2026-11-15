import Redis from 'ioredis';
import { env } from './env.js';

let client = null;

/**
 * Инициализация Redis.
 * В тестах можно передать свой клиент: initRedis({ client: new RedisMock() }).
 */
export function initRedis({ client: providedClient, url = env.redisUrl } = {}) {
  if (client) return client;

  client =
    providedClient ??
    new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
    });

  client.on('error', (err) => console.error('[redis] ошибка:', err.message));
  client.on('ready', () => console.log('[redis] подключено'));

  return client;
}

export function getRedis() {
  if (!client) {
    throw new Error('Redis не инициализирован. Вызовите initRedis() при старте приложения.');
  }
  return client;
}

export async function closeRedis() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect?.();
  }
  client = null;
}
