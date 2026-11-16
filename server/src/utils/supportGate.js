/**
 * Правило отправки сообщений в чат поддержки.
 *
 * Пока оператор не ответил, пользователь ждёт: одно ожидающее сообщение за раз.
 * Если ответа нет 5 минут — можно написать снова (оператор мог не увидеть вопрос).
 * Ответ оператора открывает чат сразу, без ожидания.
 */
export const SUPPORT_REPLY_WAIT_MS = 5 * 60 * 1000;

/**
 * @param {{ direction: 'user'|'admin', createdAt: Date|string } | null} lastMessage
 * @param {number} [now]
 */
export function evaluateSupportGate(lastMessage, now = Date.now()) {
  if (!lastMessage) {
    return { canSend: true, waitingForReply: false, retryAfterSeconds: 0, lastMessageAt: null };
  }

  const lastMessageAt = new Date(lastMessage.createdAt).getTime();

  if (lastMessage.direction !== 'user') {
    return { canSend: true, waitingForReply: false, retryAfterSeconds: 0, lastMessageAt };
  }

  const elapsedMs = Math.max(0, now - lastMessageAt);
  const leftMs = SUPPORT_REPLY_WAIT_MS - elapsedMs;

  if (leftMs <= 0) {
    return { canSend: true, waitingForReply: false, retryAfterSeconds: 0, lastMessageAt };
  }

  return {
    canSend: false,
    waitingForReply: true,
    retryAfterSeconds: Math.ceil(leftMs / 1000),
    lastMessageAt,
  };
}

/** «4 мин 38 с» для текста ошибки. */
export function formatWaitLeft(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (!minutes) return `${rest} с`;
  return rest ? `${minutes} мин ${rest} с` : `${minutes} мин`;
}
