/**
 * Демо-режим без установки MongoDB и Redis.
 *
 *   npm run dev:memory
 *
 * Поднимает MongoDB в памяти и Redis-mock, наполняет каталог демо-данными.
 * Подходит только для локального знакомства с API: данные исчезают после остановки,
 * а Redis-mock не проверяет настоящую конкурентность между несколькими процессами.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import RedisMock from 'ioredis-mock';

import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectMongo } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';
import { ensureIndexes } from '../src/models/index.js';
import { seedDatabase } from '../src/seed/seed.js';

const mongo = await MongoMemoryServer.create();
console.log('[dev:memory] MongoDB запущена в памяти:', mongo.getUri());

await connectMongo(mongo.getUri('workspot_dev'));
initRedis({ client: new RedisMock() });
await ensureIndexes();
await seedDatabase();

const server = createApp().listen(env.port, () => {
  console.log(`[dev:memory] API доступен: http://localhost:${env.port}`);
  console.log('[dev:memory] демо-вход: demo@workspot.kz / WorkSpot2026');
});

async function shutdown() {
  console.log('\n[dev:memory] остановка…');
  server.close(async () => {
    await mongo.stop();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
