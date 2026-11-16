/**
 * Персональный QR-пропуск.
 *
 * Ключ в QR — не случайная картинка, а подпись: HMAC-SHA256 от id пользователя
 * и времени истечения. Секрет живёт только на сервере, поэтому пропуск нельзя
 * подделать или переиспользовать после истечения.
 *
 * Формат токена: WSP1.<userId>.<expiresAtUnixSeconds>.<signature>
 *   - WSP1      — версия формата;
 *   - userId    — кому выдан пропуск;
 *   - expiresAt — когда ключ перестанет действовать;
 *   - signature — первые 24 base64url-символа HMAC (144 бита).
 *
 * Короткий ключ (например, A1B2-C3D4) показывается рядом с QR — его можно
 * набрать вручную на турникете, если камера не читает код.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const TOKEN_PREFIX = 'WSP1';
const SIGNATURE_LENGTH = 24;
const SHORT_KEY_LENGTH = 8;

function signature(payload) {
  return createHmac('sha256', env.passQrSecret)
    .update(payload)
    .digest('base64url')
    .slice(0, SIGNATURE_LENGTH);
}

/** Короткий человекочитаемый ключ: A1B2-C3D4. */
export function formatShortKey(sig) {
  const value = String(sig)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, SHORT_KEY_LENGTH);
  return value.length > 4 ? `${value.slice(0, 4)}-${value.slice(4)}` : value;
}

/**
 * Выдаёт новый пропуск. По умолчанию действует 5 минут — за это время
 * клиент успевает обновить код, а потерянный скриншот быстро становится бесполезным.
 */
export function createPass(userId, { ttlSeconds = env.passQrTtlSeconds, now = Date.now() } = {}) {
  const expiresAt = now + ttlSeconds * 1000;
  const expiresAtSeconds = Math.floor(expiresAt / 1000);
  const payload = `${TOKEN_PREFIX}.${userId}.${expiresAtSeconds}`;
  const sig = signature(payload);

  return {
    token: `${payload}.${sig}`,
    key: formatShortKey(sig),
    expiresAt,
    ttlSeconds,
  };
}

/**
 * Проверка ключа на турникете/считывателе.
 * Возвращает { valid, userId, expiresAt, reason }.
 */
export function verifyPass(token, { now = Date.now() } = {}) {
  const parts = String(token ?? '').trim().split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) {
    return { valid: false, reason: 'FORMAT' };
  }

  const [, userId, expiresRaw, sig] = parts;
  const expiresAtSeconds = Number.parseInt(expiresRaw, 10);

  if (!userId || !Number.isFinite(expiresAtSeconds) || !sig) {
    return { valid: false, reason: 'FORMAT' };
  }

  const payload = `${TOKEN_PREFIX}.${userId}.${expiresAtSeconds}`;
  const expected = signature(payload);

  const given = Buffer.from(sig);
  const want = Buffer.from(expected);
  const matches =
    given.length === want.length && timingSafeEqual(given, want);

  if (!matches) {
    return { valid: false, reason: 'SIGNATURE' };
  }

  const expiresAt = expiresAtSeconds * 1000;
  if (expiresAt <= now) {
    return { valid: false, userId, expiresAt, reason: 'EXPIRED' };
  }

  return { valid: true, userId, expiresAt, reason: null };
}
