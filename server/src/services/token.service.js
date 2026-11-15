import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { getRedis } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

const refreshKey = (tokenHash) => `ws:refresh:${tokenHash}`;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id ?? user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtAccessTtl,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/**
 * Выдаёт пару токенов.
 * Access-токен — короткоживущий JWT (по умолчанию 2 часа).
 * Refresh-токен — случайная строка; в Redis хранится только её SHA-256, поэтому
 * утечка дампа Redis не даёт возможности войти в аккаунт.
 */
export async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = randomBytes(48).toString('hex');
  const ttlSeconds = env.refreshTtlDays * 24 * 60 * 60;

  await getRedis().set(refreshKey(hashToken(refreshToken)), String(user._id ?? user.id), 'EX', ttlSeconds);

  const decoded = jwt.decode(accessToken);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    accessTokenExpiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    refreshTokenExpiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };
}

/** Ротация refresh-токена: старый сразу инвалидируется. */
export async function rotateRefreshToken(refreshToken) {
  const redis = getRedis();
  const key = refreshKey(hashToken(refreshToken));
  const userId = await redis.get(key);

  if (!userId) {
    throw ApiError.unauthorized('Сессия истекла. Войдите в аккаунт заново.', 'REFRESH_INVALID');
  }

  await redis.del(key);

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('Пользователь не найден', 'REFRESH_INVALID');
  }

  return { user, tokens: await issueTokens(user) };
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await getRedis().del(refreshKey(hashToken(refreshToken)));
}
