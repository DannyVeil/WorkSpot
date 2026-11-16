import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { getRedis } from '../config/redis.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { log } from '../utils/logger.js';
import { evaluateSupportGate, formatWaitLeft } from '../utils/supportGate.js';
import { isTelegramConfigured, telegram } from './telegram.service.js';

export const SUPPORT_AUTHOR = 'Поддержка WorkSpot';

export const SUPPORT_HELP_TEXT = [
  'Это служебный бот чата поддержки WorkSpot.',
  'Сюда приходят сообщения пользователей с сайта.',
  '',
  'Чтобы ответить пользователю: выделите сообщение и нажмите «Ответить» (Reply),',
  'затем отправьте текст — он появится в чате на сайте у этого пользователя.',
  '',
  `Ваш chat id: ${env.telegram.adminChatId || 'не задан'}`,
].join('\n');

const clockFormat = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: env.businessTimezone,
});

const fullFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: env.businessTimezone,
});

/** DTO для фронтенда: чат на сайте ждёт { id, sender, author, text, time }. */
export function toSupportMessageDTO(document) {
  return {
    id: String(document._id ?? document.id),
    sender: document.direction === 'admin' ? 'support' : 'user',
    author: document.direction === 'admin' ? SUPPORT_AUTHOR : document.authorName || 'Клиент',
    text: document.text,
    time: clockFormat.format(new Date(document.createdAt)),
    createdAt: document.createdAt,
  };
}

export async function listSupportMessages(userId, { limit = 200 } = {}) {
  const documents = await SupportMessage.find({ user: userId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  return documents.map(toSupportMessageDTO);
}

/**
 * Состояние «можно ли писать»: пока оператор не ответил, ждём до 5 минут.
 * Клиент использует это, чтобы заблокировать поле ввода и показать таймер.
 */
export async function getSupportState(userId) {
  const lastMessage = await SupportMessage.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return evaluateSupportGate(lastMessage);
}

const SEND_LOCK_TTL_MS = 5_000;
const sendLockKey = (userId) => `workspot:support:send:${userId}`;

/** Короткая блокировка на пользователя: два одновременных POST не создадут два сообщения. */
async function withSendLock(userId, fn) {
  const redis = getRedis();
  const key = sendLockKey(userId);
  const token = randomUUID();

  const acquired = await redis.set(key, token, 'PX', SEND_LOCK_TTL_MS, 'NX');
  if (acquired !== 'OK') {
    throw ApiError.tooManyRequests(
      'Сообщение уже отправляется. Подождите пару секунд.',
      'SUPPORT_SEND_IN_PROGRESS',
    );
  }

  try {
    return await fn();
  } finally {
    try {
      const current = await redis.get(key);
      if (current === token) await redis.del(key);
    } catch (error) {
      log.warn('[support] не удалось снять блокировку отправки:', error.message);
    }
  }
}

function buildAdminNotification({ text, user, createdAt }) {
  const name = user?.name || 'Клиент';
  const email = user?.email || '—';
  const id = user?._id ? String(user._id) : '—';

  return [
    '💬 WorkSpot · чат поддержки',
    '',
    `👤 ${name}`,
    `📧 ${email} · id ${id}`,
    `🕐 ${fullFormat.format(new Date(createdAt))}`,
    '',
    text,
    '',
    '↩️ Ответьте на это сообщение (Reply), чтобы отправить ответ пользователю на сайт.',
  ].join('\n');
}

/**
 * Сообщение клиента из чата на сайте: сохраняем и пересылаем оператору в Telegram.
 * Если Telegram недоступен, сообщение всё равно остаётся в переписке.
 *
 * Одно ожидающее сообщение за раз: пока оператор не ответил, повторная отправка
 * блокируется на 5 минут (см. utils/supportGate.js).
 */
export async function sendUserMessage(userId, text) {
  return withSendLock(userId, async () => {
    const gate = await getSupportState(userId);

    if (!gate.canSend) {
      throw new ApiError(
        429,
        `Дождитесь ответа поддержки: следующее сообщение можно отправить через ${formatWaitLeft(gate.retryAfterSeconds)}.`,
        'SUPPORT_REPLY_PENDING',
        { retryAfterSeconds: gate.retryAfterSeconds },
      );
    }

    const user = await User.findById(userId).lean();
    const document = await SupportMessage.create({
      user: userId,
      direction: 'user',
      text,
      authorName: user?.name ?? '',
      authorEmail: user?.email ?? '',
    });

    let warning = null;

    if (!isTelegramConfigured()) {
      warning =
        'Чат работает в локальном режиме: оператор не получит сообщение, пока не настроен Telegram-бот.';
    } else {
      try {
        const sent = await telegram.sendMessage(
          env.telegram.adminChatId,
          buildAdminNotification({ text, user, createdAt: document.createdAt }),
        );
        document.telegramMessageId = sent.message_id;
        document.telegramChatId = String(sent.chat?.id ?? env.telegram.adminChatId);
        document.delivered = true;
        await document.save();
      } catch (error) {
        warning = 'Сообщение сохранено, но оператор пока его не получил. Мы уже разбираемся.';
        log.error('[support] не удалось переслать сообщение в Telegram:', error.message);
      }
    }

    return {
      message: toSupportMessageDTO(document),
      warning,
      ...(await getSupportState(userId)),
    };
  });
}

/**
 * Разбор апдейта Telegram: оператор отвечает Reply'ем на пересланное сообщение,
 * находим по telegramMessageId автора и сохраняем ответ в его переписку.
 */
export async function handleTelegramUpdate(update) {
  const message = update?.message;
  if (!message) return;

  const chatId = String(message.chat?.id ?? '');
  const adminChatId = String(env.telegram.adminChatId ?? '');
  const text = String(message.text ?? '').trim();

  // Пишут не из чата оператора — подсказываем, как пользоваться ботом.
  if (chatId !== adminChatId) {
    await telegram
      .sendMessage(chatId, SUPPORT_HELP_TEXT)
      .catch((error) => log.warn('[support] не удалось ответить в чужой чат:', error.message));
    return;
  }

  if (text.startsWith('/start') || text.startsWith('/help')) {
    await telegram.sendMessage(chatId, SUPPORT_HELP_TEXT).catch(() => {});
    return;
  }

  if (!text) {
    await telegram
      .sendMessage(chatId, 'Поддерживаются только текстовые сообщения.')
      .catch(() => {});
    return;
  }

  if (!message.reply_to_message?.message_id) {
    log.warn(`[support] апдейт ${update.update_id}: сообщение оператора без Reply — подсказываю`);
    await telegram
      .sendMessage(
        chatId,
        'Чтобы ответить пользователю, нажмите «Ответить» (Reply) на его сообщение из чата поддержки и отправьте текст.',
      )
      .catch(() => {});
    return;
  }

  const origin = await SupportMessage.findOne({
    telegramMessageId: message.reply_to_message.message_id,
    direction: 'user',
  }).lean();

  if (!origin) {
    log.warn(`[support] апдейт ${update.update_id}: reply на неизвестное сообщение ${message.reply_to_message.message_id}`);
    await telegram
      .sendMessage(
        chatId,
        'Не нашёл пользователя для этого сообщения. Ответьте Reply’ем на исходное сообщение из чата поддержки.',
      )
      .catch(() => {});
    return;
  }

  const reply = await SupportMessage.create({
    user: origin.user,
    direction: 'admin',
    text,
    authorName: SUPPORT_AUTHOR,
    authorEmail: env.telegram.adminChatId,
    telegramMessageId: message.message_id,
    telegramChatId: chatId,
    delivered: true,
  }).catch((error) => {
    // Тот же апдейт уже обработан (например, после рестарта) — молча пропускаем.
    if (error?.code === 11000) return null;
    throw error;
  });

  if (!reply) return;

  log.info(
    `[support] ответ оператора отправлен пользователю ${origin.authorEmail || origin.user} (${reply._id})`,
  );

  await telegram
    .sendMessage(chatId, `✅ Отправлено пользователю: ${origin.authorName || 'клиент'} (${origin.authorEmail || '—'})`)
    .catch(() => {});
}
