import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './config/db.js';
import { closeRedis, initRedis } from './config/redis.js';
import { ensureIndexes } from './models/index.js';
import { log } from './utils/logger.js';
import { startTelegramPoller, stopTelegramPoller } from './services/telegram.poller.js';

async function main() {
  initRedis();
  await connectMongo(env.mongoUri);
  await ensureIndexes();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    log.info(`WorkSpot API запущен: http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Бот техподдержки: long polling, публичный URL не нужен.
  await startTelegramPoller();

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info(`Получен ${signal}: останавливаем сервер…`);

    stopTelegramPoller();

    const forceExit = setTimeout(() => {
      log.error('Не удалось корректно завершить работу за 10 секунд');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await Promise.allSettled([disconnectMongo(), closeRedis()]);
      clearTimeout(forceExit);
      log.info('Сервер остановлен');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

main().catch((error) => {
  log.error('Не удалось запустить сервер:', error);
  process.exit(1);
});
