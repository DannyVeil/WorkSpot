import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/** Подключение к MongoDB. Вызывается один раз при старте приложения и в тестах. */
export async function connectMongo(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.connection.on('connected', () => console.log('[mongo] подключено'));
  mongoose.connection.on('error', (err) => console.error('[mongo] ошибка:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] соединение потеряно'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8_000,
  });

  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

export function mongoStatus() {
  // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  return mongoose.connection.readyState;
}
