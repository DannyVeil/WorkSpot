import { randomUUID } from 'node:crypto';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { slotTime } from '../utils/time.js';

/**
 * Redis-схема (префикс ws = workspot):
 *
 *   ws:mutex:space:{slug}:{date}              — короткая блокировка критической секции
 *   ws:hold:{holdId}                          — JSON-метаданные резерва (TTL = HOLD_TTL_SECONDS)
 *   ws:hold:slot:{slug}:{YYYY-MM-DDTHH:mm}    — владелец слота (holdId), TTL = HOLD_TTL_SECONDS
 *   ws:hold:owner:{userId}:{slug}:{date}      — текущий резерв пользователя на это место/день
 *
 * Резерв (hold) — это «мягкая» блокировка на время оформления брони. Она живёт
 * несколько минут и не является бронью: подтверждение создаёт документ в MongoDB.
 */

const KEY = 'ws';

export const mutexKey = (spaceSlug, date) => `${KEY}:mutex:space:${spaceSlug}:${date}`;
export const holdKey = (holdId) => `${KEY}:hold:${holdId}`;
export const slotHoldKey = (spaceSlug, slotKey) => `${KEY}:hold:slot:${spaceSlug}:${slotKey}`;
export const ownerHoldKey = (userId, spaceSlug, date) =>
  `${KEY}:hold:owner:${userId}:${spaceSlug}:${date}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Распределённый мьютекс на SET NX PX.
 * Нужен, чтобы «проверить пересечение → создать бронь» выполнялось последовательно
 * для одного места и одной даты. Разные места друг друга не блокируют.
 */
export async function withMutex(key, fn, options = {}) {
  const redis = getRedis();
  const ttlMs = options.ttlMs ?? env.mutexTtlMs;
  const waitMs = options.waitMs ?? env.mutexWaitMs;
  const token = randomUUID();
  const deadline = Date.now() + waitMs;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const acquired = await redis.set(key, token, 'PX', ttlMs, 'NX');
    if (acquired === 'OK') break;

    if (Date.now() >= deadline) {
      throw ApiError.conflict(
        'Это место прямо сейчас оформляет другой пользователь. Попробуйте ещё раз через секунду.',
        'SPACE_BUSY',
      );
    }
    await sleep(30 + Math.random() * 70);
  }

  try {
    return await fn();
  } finally {
    // Снимаем блокировку только если она всё ещё наша (вдруг истёк TTL и её взял другой)
    try {
      const current = await redis.get(key);
      if (current === token) await redis.del(key);
    } catch (err) {
      console.error('[lock] не удалось снять мьютекс:', err.message);
    }
  }
}

/**
 * Берёт резерв на набор слотов.
 * Вызывать внутри withMutex(mutexKey(...)) — так несколько слотов занимаются без гонок.
 * Возвращает объект резерва (hold).
 */
export async function createHold({ userId, space, date, startTime, endTime, hours, slots }) {
  const redis = getRedis();
  const ttlMs = env.holdTtlSeconds * 1000;
  const holdId = randomUUID();
  const ownerKey = ownerHoldKey(userId, space.slug, date);

  // У пользователя может быть старый резерв на это же место/день (например, он поменял время).
  // Освобождаем его, чтобы не держать лишние слоты.
  const previousHoldId = await redis.get(ownerKey);
  if (previousHoldId) {
    await releaseHold(previousHoldId).catch((err) =>
      console.error('[hold] не удалось освободить предыдущий резерв:', err.message),
    );
  }

  const keys = slots.map((slot) => slotHoldKey(space.slug, slot));

  // Занимаем все слоты разом. NX гарантирует, что чужой резерв не перезапишется.
  const acquirePipeline = redis.pipeline();
  keys.forEach((key) => acquirePipeline.set(key, holdId, 'PX', ttlMs, 'NX'));
  const results = await acquirePipeline.exec();

  const failedIndex = (results ?? []).findIndex(([err, value]) => err || value !== 'OK');

  if (failedIndex !== -1) {
    const acquiredKeys = keys.filter((_, index) => results[index]?.[1] === 'OK');
    if (acquiredKeys.length) await redis.del(...acquiredKeys);

    const failedSlot = slots[failedIndex] ?? slots[0];
    throw ApiError.conflict(
      `Слот ${slotTime(failedSlot)} уже бронируют. Обновите карту и выберите другое время.`,
      'SLOT_HELD',
      { slot: slotTime(failedSlot) },
    );
  }

  const now = Date.now();
  const hold = {
    holdId,
    userId: String(userId),
    spaceSlug: space.slug,
    spaceName: space.name,
    zone: space.zone,
    date,
    startTime,
    endTime,
    hours,
    pricePerHour: space.pricePerHour,
    totalPrice: Math.round(space.pricePerHour * hours),
    slots,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
  };

  const savePipeline = redis.multi();
  savePipeline.set(holdKey(holdId), JSON.stringify(hold), 'PX', ttlMs);
  savePipeline.set(ownerKey, holdId, 'PX', ttlMs);
  await savePipeline.exec();

  return hold;
}

/** Метаданные резерва или null, если он истёк/не существует. */
export async function getHold(holdId) {
  const raw = await getRedis().get(holdKey(holdId));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Освобождает слоты резерва. Возвращает false, если резерв уже истёк. */
export async function releaseHold(holdId) {
  if (!holdId) return false;

  const redis = getRedis();
  const raw = await redis.get(holdKey(holdId));
  if (!raw) return false;

  let hold;
  try {
    hold = JSON.parse(raw);
  } catch {
    await redis.del(holdKey(holdId));
    return false;
  }

  const keys = (hold.slots ?? []).map((slot) => slotHoldKey(hold.spaceSlug, slot));

  if (keys.length) {
    // Удаляем только те слоты, которые всё ещё принадлежат этому резерву
    const readPipeline = redis.pipeline();
    keys.forEach((key) => readPipeline.get(key));
    const values = await readPipeline.exec();

    const keysToDelete = keys.filter((_, index) => values[index]?.[1] === holdId);
    if (keysToDelete.length) await redis.del(...keysToDelete);
  }

  await redis.del(holdKey(holdId));
  await redis.del(ownerHoldKey(hold.userId, hold.spaceSlug, hold.date));

  return true;
}

/**
 * Занятые резервами слоты по списку мест.
 * Возвращает Map<spaceSlug, Map<slotKey, holdId>>.
 */
export async function getHeldSlots(spaceSlugs, slots) {
  const result = new Map();
  if (!spaceSlugs.length || !slots.length) return result;

  const pairs = [];
  for (const slug of spaceSlugs) {
    for (const slot of slots) pairs.push([slug, slot]);
  }

  const values = await getRedis().mget(...pairs.map(([slug, slot]) => slotHoldKey(slug, slot)));

  values.forEach((holdId, index) => {
    if (!holdId) return;
    const [slug, slot] = pairs[index];
    if (!result.has(slug)) result.set(slug, new Map());
    result.get(slug).set(slot, holdId);
  });

  return result;
}

/** Текущий holdId пользователя на место+дату (или null). */
export async function getOwnHoldIds(userId, spaceSlugs, date) {
  const result = new Map();
  if (!userId || !spaceSlugs.length) return result;

  const values = await getRedis().mget(
    ...spaceSlugs.map((slug) => ownerHoldKey(userId, slug, date)),
  );

  values.forEach((holdId, index) => {
    if (holdId) result.set(spaceSlugs[index], holdId);
  });

  return result;
}
