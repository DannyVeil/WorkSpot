import { formatClock } from '../utils/format.js';

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 1,
    sender: 'support',
    author: 'Елена • Поддержка WorkSpot',
    text: 'Здравствуйте! Я на связи 24/7. Подскажите, нужна ли помощь с выбором места, QR-пропуском или продлением брони?',
    time: '16:30',
  },
];

export const QUICK_QUESTIONS = [
  'Продлить текущую бронь',
  'Не срабатывает QR-код',
  'Пароль от Wi-Fi',
];

/** Автоответ поддержки на основе ключевых слов (демо-режим, без backend-чата). */
export function buildSupportReply(text) {
  const lower = String(text || '').toLowerCase();

  if (lower.includes('продл')) {
    return 'Вы можете продлить бронь на любое свободное время на вкладке «Бронирование» или напишите, до какого часа продлить текущее место — я оформлю всё вручную.';
  }
  if (lower.includes('qr') || lower.includes('код') || lower.includes('вход')) {
    return 'Я обновил ваш динамический QR-пропуск. Нажмите «Мой QR-код» в карточке профиля сверху — доступ на турникете активен.';
  }
  if (lower.includes('wi-fi') || lower.includes('вай') || lower.includes('парол')) {
    return 'Сеть для резидентов: WorkSpot_5G_Resident. Пароль: WS2026_FastWork. Приятной работы!';
  }
  return 'Спасибо за обращение! Оператор уже проверяет информацию по вашему аккаунту и поможет в течение минуты.';
}

export function createChatMessage({ sender, author, text, delay = 0 }) {
  return {
    id: Date.now() + delay,
    sender,
    author,
    text,
    time: formatClock(),
  };
}
