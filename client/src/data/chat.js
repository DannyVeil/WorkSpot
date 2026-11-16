import { formatClock } from '../utils/format.js';

/** Приветствие, пока в переписке нет сообщений. */
export const SUPPORT_WELCOME = {
  id: 'welcome',
  sender: 'support',
  author: 'Поддержка WorkSpot',
  text: 'Здравствуйте! Опишите вопрос — сообщение сразу уйдёт оператору, а ответ появится здесь.',
  time: null,
};

export const QUICK_QUESTIONS = [
  'Продлить текущую бронь',
  'Не срабатывает QR-код',
  'Пароль от Wi-Fi',
];

/** Локальное (оптимистичное) сообщение до ответа сервера. */
export function createPendingMessage({ author, text }) {
  return {
    id: `local-${Date.now()}`,
    sender: 'user',
    author,
    text,
    time: formatClock(),
    pending: true,
  };
}
