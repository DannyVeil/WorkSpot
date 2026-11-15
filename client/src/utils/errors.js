/**
 * Преобразование ошибок API в понятные сообщения для тостов и полей формы.
 * Коды ошибок описаны в server/README.md.
 */

const ERROR_PRESETS = {
  SLOT_TAKEN: {
    title: 'Время уже занято',
    message: 'Это время только что забронировали. Обновите карту и выберите другой интервал.',
  },
  SLOT_HELD: {
    title: 'Слот временно удерживают',
    message: 'Кто-то оформляет это время прямо сейчас. Через несколько секунд слот освободится — обновите карту.',
  },
  SPACE_BUSY: {
    title: 'Место оформляют прямо сейчас',
    message: 'Кто-то уже бронирует это место. Попробуйте ещё раз через пару секунд.',
  },
  USER_TIME_CONFLICT: {
    title: 'У вас уже есть бронь на это время',
    message: 'Одновременно можно занимать только одно место. Отмените существующую бронь или выберите другое время.',
  },
  HOLD_EXPIRED: {
    title: 'Время резерва истекло',
    message: 'Стол освобождён. Выберите место и время заново.',
  },
  HOLD_FOREIGN: {
    title: 'Чужой резерв',
    message: 'Этот резерв принадлежит другому пользователю.',
  },
  BOOKING_IN_PAST: {
    title: 'Прошедшее время',
    message: 'Нельзя забронировать место на время, которое уже прошло. Выберите будущую дату.',
  },
  TIME_NOT_ALIGNED: {
    title: 'Неверный шаг времени',
    message: 'Время должно быть кратно 30 минутам: 09:00, 09:30, 10:00 и так далее.',
  },
  INVALID_INTERVAL: {
    title: 'Неверный интервал',
    message: 'Время окончания должно быть позже времени начала.',
  },
  INVALID_DATE: {
    title: 'Неверная дата',
    message: 'Укажите дату в формате ГГГГ-ММ-ДД.',
  },
  INVALID_TIME: {
    title: 'Неверное время',
    message: 'Укажите время в формате ЧЧ:ММ.',
  },
  BOOKING_TOO_LONG: {
    title: 'Слишком длинная бронь',
    message: 'Максимальная длительность одной брони — 12 часов.',
  },
  BOOKING_TOO_FAR: {
    title: 'Слишком далёкая дата',
    message: 'Бронировать можно не более чем на 60 дней вперёд.',
  },
  BOOKING_NOT_FOUND: {
    title: 'Бронь не найдена',
    message: 'Возможно, она уже отменена или удалена.',
  },
  BOOKING_NOT_ACTIVE: {
    title: 'Бронь уже неактивна',
    message: 'Эта бронь уже отменена или завершена.',
  },
  BOOKING_FINISHED: {
    title: 'Бронь завершена',
    message: 'Нельзя отменить бронь, время которой уже прошло.',
  },
  SPACE_NOT_FOUND: {
    title: 'Место не найдено',
    message: 'Рабочее место больше недоступно. Обновите карту.',
  },
  INVALID_CREDENTIALS: {
    title: 'Неверный email или пароль',
    message: 'Проверьте данные и попробуйте снова.',
  },
  EMAIL_TAKEN: {
    title: 'Email уже зарегистрирован',
    message: 'Войдите в аккаунт или используйте другой адрес электронной почты.',
  },
  TOKEN_MISSING: {
    title: 'Требуется вход',
    message: 'Войдите в аккаунт, чтобы продолжить.',
  },
  TOKEN_INVALID: {
    title: 'Сессия истекла',
    message: 'Войдите в аккаунт заново.',
  },
  RATE_LIMITED: {
    title: 'Слишком много попыток',
    message: 'Подождите минуту и попробуйте снова.',
  },
  VALIDATION_ERROR: {
    title: 'Проверьте форму',
    message: 'Некоторые поля заполнены некорректно.',
  },
  NETWORK_ERROR: {
    title: 'Сервер недоступен',
    message: 'Не удалось связаться с API. Проверьте, что сервер запущен на порту 4000.',
  },
};

/** Вернуть { type, title, message } для тоста. */
export function describeApiError(error, fallbackTitle = 'Не удалось выполнить действие') {
  if (!error) {
    return { type: 'error', title: fallbackTitle, message: 'Неизвестная ошибка.' };
  }

  if (error.name === 'TypeError' && /fetch/i.test(error.message || '')) {
    return { type: 'error', ...ERROR_PRESETS.NETWORK_ERROR };
  }

  const preset = ERROR_PRESETS[error.code];
  if (preset) {
    return { type: 'error', title: preset.title, message: error.message || preset.message };
  }

  return {
    type: 'error',
    title: fallbackTitle,
    message: error.message || 'Попробуйте ещё раз чуть позже.',
  };
}

/** Превращает details из VALIDATION_ERROR в объект { field: message }. */
export function getFieldErrors(error) {
  const details = error?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, item) => {
    if (item?.field && item?.message) acc[item.field] = item.message;
    return acc;
  }, {});
}

/** Краткое сообщение об ошибке (для inline-подсказок). */
export function getErrorMessage(error) {
  return describeApiError(error).message;
}
