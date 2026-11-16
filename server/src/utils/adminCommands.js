/**
 * Разбор админ-команд Telegram-бота.
 *
 * Команды приходят обычными сообщениями из чата оператора:
 *   /rename demo@workspot.kz Даниил Бугаев
 *
 * Поддерживается суффикс бота (/users@My_message_portfolio_bot), как это делает
 * Telegram в группах, и регистр не важен.
 */

/** '/rename@bot Иван' → { command: '/rename', args: ['Иван'], rawArgs: 'Иван' } */
export function parseCommand(text) {
  const raw = String(text ?? '').trim();
  if (!raw.startsWith('/')) return { command: '', args: [], rawArgs: '' };

  const match = /^(\S+)\s*([\s\S]*)$/.exec(raw);
  const command = (match?.[1] ?? '').split('@')[0].toLowerCase();
  const rawArgs = (match?.[2] ?? '').trim();

  return { command, args: rawArgs ? rawArgs.split(/\s+/) : [], rawArgs };
}

/** Регулярка для поиска по имени/email без спецсимволов. */
export function escapeRegex(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DURATION_RE = /^(\d+)\s*(m|min|mins|minute|minutes|м|мин|минут[аы]?|h|hr|hrs|hour|hours|ч|час|часа|часов)?$/i;

/**
 * '30m' → 30, '2h' → 120, '90' → 90, '1ч' → 60.
 * Возвращает null, если строку не разобрать.
 */
export function parseDuration(value) {
  const match = DURATION_RE.exec(String(value ?? '').trim());
  if (!match) return null;

  const amount = Number.parseInt(match[1], 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = (match[2] ?? '').toLowerCase();
  const isHours = ['h', 'hr', 'hrs', 'hour', 'hours', 'ч', 'час', 'часа', 'часов'].includes(unit);

  return isHours ? amount * 60 : amount;
}

/** Минуты → '1 ч 30 мин' для ответов в Telegram. */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} мин`;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
