import { env } from '../config/env.js';

const API_ROOT = 'https://api.telegram.org';

/** Бот настроен, если есть токен и чат оператора. */
export function isTelegramConfigured() {
  return Boolean(env.telegram.botToken && env.telegram.adminChatId);
}

async function parseResult(response, method) {
  const data = await response.json().catch(() => ({}));

  if (!data?.ok) {
    const description = data?.description || `HTTP ${response.status}`;
    throw new Error(`Telegram ${method}: ${description}`);
  }

  return data.result;
}

/**
 * Вызов Telegram Bot API. Бросает ошибку с описанием от Telegram,
 * чтобы вызывающий код мог показать её в логе.
 */
async function call(method, payload = {}, { timeoutMs = 15_000 } = {}) {
  if (!env.telegram.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан');
  }

  const response = await fetch(`${API_ROOT}/bot${env.telegram.botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  return parseResult(response, method);
}

/** multipart — для картинок: QR-пропуск отправляется фотографией. */
async function callMultipart(method, form, { timeoutMs = 20_000 } = {}) {
  if (!env.telegram.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан');
  }

  const response = await fetch(`${API_ROOT}/bot${env.telegram.botToken}/${method}`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });

  return parseResult(response, method);
}

export const telegram = {
  getMe: () => call('getMe'),

  sendMessage: (chatId, text, extra = {}) =>
    call('sendMessage', {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...extra,
    }),

  /** Отправка PNG (QR-пропуск) с подписью. */
  sendPhoto: (chatId, png, caption = '') => {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    if (caption) form.append('caption', caption);
    form.append('photo', new Blob([png], { type: 'image/png' }), 'workspot-pass.png');
    return callMultipart('sendPhoto', form);
  },

  getUpdates: (offset, timeoutSeconds) =>
    call(
      'getUpdates',
      { offset, timeout: timeoutSeconds, allowed_updates: ['message'] },
      // Запрос висит на стороне Telegram всё время long polling — даём запас.
      { timeoutMs: (timeoutSeconds + 15) * 1000 },
    ),

  deleteWebhook: () => call('deleteWebhook', { drop_pending_updates: false }),
};
