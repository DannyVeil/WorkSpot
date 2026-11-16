import { env } from '../config/env.js';
import { log } from '../utils/logger.js';
import { handleAdminCommand } from './admin.bot.js';
import { handleTelegramUpdate } from './support.service.js';
import { isTelegramConfigured, telegram } from './telegram.service.js';

/**
 * Long polling Telegram: не требует публичного URL и вебхука,
 * поэтому работает и локально, и за ngrok-туннелем.
 */
const state = {
  running: false,
  offset: 0,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loop() {
  while (state.running) {
    try {
      const updates = await telegram.getUpdates(state.offset, env.telegram.pollTimeoutSeconds);

      for (const update of updates) {
        state.offset = Math.max(state.offset, update.update_id + 1);
        try {
          // Сначала админ-команды из чата оператора, иначе — обычный Reply в поддержку.
          if (await handleAdminCommand(update)) continue;
          await handleTelegramUpdate(update);
        } catch (error) {
          log.error('[telegram] ошибка обработки апдейта:', error.message);
        }
      }
    } catch (error) {
      if (!state.running) break;
      log.warn('[telegram] getUpdates:', error.message);
      await sleep(3_000);
    }
  }
}

export async function startTelegramPoller() {
  if (!env.telegram.polling || !isTelegramConfigured()) {
    log.info('[telegram] чат поддержки работает без Telegram (бот не настроен)');
    return;
  }

  try {
    await telegram.deleteWebhook();
    const me = await telegram.getMe();

    // Не пропускаем накопившиеся апдейты: ответы, отправленные оператором,
    // пока сервер был выключен, должны дойти до пользователей. Дубли отсекает
    // уникальный индекс telegramMessageId.
    state.offset = 0;
    state.running = true;
    void loop();

    log.info(
      `[telegram] бот @${me.username ?? 'bot'} слушает чат оператора ${env.telegram.adminChatId}`,
    );
  } catch (error) {
    log.error('[telegram] не удалось запустить бота:', error.message);
  }
}

export function stopTelegramPoller() {
  state.running = false;
}
