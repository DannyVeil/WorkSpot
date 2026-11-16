/**
 * Административные команды Telegram-бота.
 *
 * Работают только в чате оператора (TELEGRAM_ADMIN_CHAT_ID). Обычные сообщения
 * без «/» здесь не трогаем — их обрабатывает чат поддержки (Reply пользователю).
 */
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { log } from '../utils/logger.js';
import { formatDuration, parseCommand, parseDuration } from '../utils/adminCommands.js';
import * as admin from './admin.service.js';
import { isTelegramConfigured, telegram } from './telegram.service.js';

const MAX_MESSAGE_LENGTH = 3900;

const STATUS_LABELS = {
  confirmed: 'подтверждена',
  completed: 'завершена',
  cancelled: 'отменена',
};

export const ADMIN_HELP_TEXT = [
  '🤖 WorkSpot — управление через Telegram',
  '',
  'Пользователя можно указать email’ом, полным id или последними 6 символами id.',
  'Бронь — её кодом вида BK-123456.',
  '',
  'Команды:',
  '/users [поиск] — последние пользователи (по имени или email)',
  '/user <кто> — карточка: профиль и брони',
  '/bookings <кто> — последние брони пользователя',
  '/rename <кто> <новое имя> — изменить имя',
  '/phone <кто> <номер|-> — изменить или удалить телефон',
  '/qr <кто> — выдать новый QR-пропуск картинкой',
  '/extend <BK-123456> <30m|1h|90m> — продлить бронь',
  '/cancel <BK-123456> [причина] — отменить бронь',
  '/help — эта справка',
  '',
  'Ответ пользователю в чат поддержки — Reply на его сообщение (как раньше).',
].join('\n');

const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: env.businessTimezone,
});

const formatDateTime = (value) => dateTimeFormat.format(new Date(value));
const money = (value) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₸`;

function userLine(user) {
  return `${user.name} · ${user.email} · id …${admin.shortenId(user.id ?? user._id)}`;
}

function bookingLine(booking) {
  const space = booking.spotName ?? booking.spaceName ?? 'место';
  return `• ${booking.id} · ${space} · ${admin.formatIsoDate(booking.date)} ${booking.startTime}–${booking.endTime} · ${STATUS_LABELS[booking.status] ?? booking.status}`;
}

/** Telegram ограничивает сообщение 4096 символами — режем аккуратно по строкам. */
async function reply(chatId, text) {
  const chunks = [];
  let rest = String(text);

  while (rest.length > MAX_MESSAGE_LENGTH) {
    const cut = rest.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    const index = cut > 0 ? cut : MAX_MESSAGE_LENGTH;
    chunks.push(rest.slice(0, index));
    rest = rest.slice(index).replace(/^\n/, '');
  }
  chunks.push(rest);

  for (const chunk of chunks) {
    await telegram.sendMessage(chatId, chunk).catch((error) => {
      log.warn('[admin] не удалось отправить ответ:', error.message);
    });
  }
}

function usage(text) {
  return `ℹ️ ${text}\n\nСправка: /help`;
}

async function sendUsers(chatId, query) {
  const { users, total } = await admin.listUsers({ query });
  if (!users.length) {
    await reply(chatId, `Пользователей по запросу «${query}» не найдено.`);
    return;
  }

  const lines = users.map(
    (user) =>
      `• <b>${escapeHtml(user.name)}</b> — ${escapeHtml(user.email)}\n  id …${user.shortId} · ${user.role} · броней: ${user.confirmedBookings}`,
  );
  const hidden = total > users.length ? `\n\nПоказано ${users.length} из ${total}. Уточните запрос.` : '';
  await replyHtml(chatId, `👥 Пользователи (${total})\n\n${lines.join('\n')}${hidden}`);
}

async function sendUserCard(chatId, ref) {
  const profile = await admin.getUserProfile(ref);
  const { user, active, recent } = profile;

  const lines = [
    `👤 <b>${escapeHtml(user.name)}</b>`,
    `email: ${escapeHtml(user.email)}`,
    `телефон: ${user.phone ? escapeHtml(user.phone) : '—'}`,
    `роль: ${user.role}`,
    `id: ${user.id}`,
    `создан: ${formatDateTime(user.createdAt)}`,
    `броней всего: ${profile.totalBookings}`,
    '',
    `Активные брони (${active.length}):`,
  ];

  if (active.length) lines.push(...active.map(bookingLine));
  else lines.push('• нет');

  if (!active.length && recent.length) {
    lines.push('', 'Последние брони:');
    lines.push(...recent.slice(0, 3).map(bookingLine));
  }

  lines.push(
    '',
    `Новый QR: /qr ${user.email}`,
    `Продлить: /extend ${active[0]?.id ?? 'BK-XXXXXX'} 1h`,
  );

  await replyHtml(chatId, lines.join('\n'));
}

async function sendBookings(chatId, ref) {
  const { user, bookings } = await admin.listBookingsForUser(ref, { limit: 10 });
  if (!bookings.length) {
    await reply(chatId, `У ${user.name} (${user.email}) броней пока нет.`);
    return;
  }

  await replyHtml(
    chatId,
    `📅 Брони: <b>${escapeHtml(user.name)}</b> · ${escapeHtml(user.email)}\n\n${bookings
      .map(bookingLine)
      .join('\n')}`,
  );
}

async function sendQr(chatId, ref) {
  const { user, pass } = await admin.issuePassForUser(ref);
  const png = await QRCode.toBuffer(pass.token, {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  const caption = [
    '🎫 QR-пропуск WorkSpot',
    `${user.name} · ${user.email}`,
    `Ключ: ${pass.key}`,
    `Действует до ${formatDateTime(pass.expiresAt)} (${pass.ttlSeconds / 60} мин)`,
  ].join('\n');

  await telegram.sendPhoto(chatId, png, caption);
  await reply(
    chatId,
    `Ключ ${pass.key} выдан заново. Старый QR действует только до истечения своих 5 минут.`,
  );
}

async function rename(chatId, args) {
  const [ref, ...nameParts] = args;
  if (!ref || !nameParts.length) {
    await reply(chatId, usage('Формат: /rename <кто> <новое имя>'));
    return;
  }

  const { user, previousName } = await admin.renameUser(ref, nameParts.join(' '));
  await reply(
    chatId,
    `✅ Имя обновлено\nБыло: ${previousName}\nСтало: ${user.name}\n${user.email} · id …${admin.shortenId(user._id)}`,
  );
}

async function setPhone(chatId, args) {
  const [ref, ...phoneParts] = args;
  if (!ref || !phoneParts.length) {
    await reply(chatId, usage('Формат: /phone <кто> <номер|->. «-» удаляет номер.'));
    return;
  }

  const { user } = await admin.setUserPhone(ref, phoneParts.join(' '));
  await reply(
    chatId,
    `✅ Телефон обновлён\n${user.name} · ${user.email}\nТелефон: ${user.phone || '—'}`,
  );
}

async function extend(chatId, args) {
  const [code, durationRaw] = args;
  if (!code || !durationRaw) {
    await reply(chatId, usage('Формат: /extend <BK-123456> <30m|1h|90m>'));
    return;
  }

  const minutes = parseDuration(durationRaw);
  if (!minutes) {
    await reply(chatId, usage(`Не понял длительность «${durationRaw}». Примеры: 30m, 1h, 90m.`));
    return;
  }

  const result = await admin.extendBooking({ code, minutes });
  const { booking, user, previousEnd, newEnd, extraPrice } = result;

  const who = user ? `\nПользователь: ${user.name} (${user.email})` : '';
  await reply(
    chatId,
    [
      `✅ Бронь ${booking.id} продлена на ${formatDuration(minutes)}`,
      `Место: ${result.spaceName}`,
      `Было до: ${previousEnd} → стало до: ${newEnd} (${admin.formatIsoDate(booking.date)})`,
      `Итоговая длительность: ${booking.hours} ч · сумма: ${money(booking.totalPrice)}`,
      `Доплата: ${money(extraPrice)}${who}`,
    ].join('\n'),
  );
}

async function cancel(chatId, args) {
  const [code, ...reasonParts] = args;
  if (!code) {
    await reply(chatId, usage('Формат: /cancel <BK-123456> [причина]'));
    return;
  }

  const { booking, user, spaceName } = await admin.cancelBookingByAdmin(
    code,
    reasonParts.join(' '),
  );

  const who = user ? `\nПользователь: ${user.name} (${user.email})` : '';
  await reply(
    chatId,
    `✅ Бронь ${booking.id} (${spaceName}) на ${admin.formatIsoDate(booking.date)} отменена.${who}`,
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function replyHtml(chatId, text) {
  const chunks = [];
  let rest = String(text);
  while (rest.length > MAX_MESSAGE_LENGTH) {
    const cut = rest.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    const index = cut > 0 ? cut : MAX_MESSAGE_LENGTH;
    chunks.push(rest.slice(0, index));
    rest = rest.slice(index).replace(/^\n/, '');
  }
  chunks.push(rest);

  for (const chunk of chunks) {
    await telegram.sendMessage(chatId, chunk, { parse_mode: 'HTML' }).catch((error) => {
      log.warn('[admin] не удалось отправить HTML-ответ:', error.message);
    });
  }
}

/**
 * Возвращает true, если апдейт — команда из чата оператора и уже обработан.
 * false — отдаём апдейт чату поддержки.
 */
export async function handleAdminCommand(update) {
  const message = update?.message;
  if (!message || !isTelegramConfigured()) return false;

  const chatId = String(message.chat?.id ?? '');
  if (chatId !== String(env.telegram.adminChatId ?? '')) return false;

  const text = String(message.text ?? '').trim();
  if (!text.startsWith('/')) return false;

  const { command, args, rawArgs } = parseCommand(text);

  try {
    switch (command) {
      case '/start':
      case '/help':
        await reply(chatId, ADMIN_HELP_TEXT);
        break;

      case '/users':
        await sendUsers(chatId, rawArgs);
        break;

      case '/user':
        if (!args[0]) throw new Error('Формат: /user <email|id>');
        await sendUserCard(chatId, args[0]);
        break;

      case '/bookings':
        if (!args[0]) throw new Error('Формат: /bookings <email|id>');
        await sendBookings(chatId, args[0]);
        break;

      case '/rename':
        await rename(chatId, args);
        break;

      case '/phone':
        await setPhone(chatId, args);
        break;

      case '/qr':
        if (!args[0]) throw new Error('Формат: /qr <email|id>');
        await sendQr(chatId, args[0]);
        break;

      case '/extend':
        await extend(chatId, args);
        break;

      case '/cancel':
        await cancel(chatId, args);
        break;

      default:
        await reply(chatId, `Неизвестная команда ${command}.\n\n${ADMIN_HELP_TEXT}`);
    }
  } catch (error) {
    log.warn(`[admin] ${command}: ${error.message}`);
    await reply(chatId, `❌ ${error.message}`);
  }

  return true;
}
