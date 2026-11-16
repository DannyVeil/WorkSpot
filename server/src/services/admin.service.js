/**
 * Действия администратора из Telegram-бота.
 *
 * Все функции рассчитаны на вызов из чата оператора (проверка chat id — в bot-слое).
 * Пользователя можно указать email'ом, полным id или последними 6 символами id.
 */
import { env } from '../config/env.js';
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/adminCommands.js';
import { toBookingDTO } from '../utils/dto.js';
import {
  currentBusinessTime,
  durationHours,
  fromMinutes,
  slotKeys,
  toMinutes,
} from '../utils/time.js';
import { mutexKey, withMutex } from './hold.service.js';
import { createPass } from './pass.service.js';

const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: env.businessTimezone,
});

const MIN_EXTEND_MINUTES = 30;
const MAX_END_MINUTES = 23 * 60 + 30; // 23:30 — последний слот

export const shortenId = (id) => String(id ?? '').slice(-6).toUpperCase();
export const formatIsoDate = (date) => String(date ?? '').split('-').reverse().join('.');

/** Уведомление в личный кабинет; сбой не должен ломать админ-действие. */
async function notify(userId, { title, message, type = 'info' }) {
  try {
    await Notification.create({ user: userId, title, message, type });
  } catch (error) {
    console.error('[admin] не удалось сохранить уведомление:', error.message);
  }
}

/**
 * Ищет пользователя по email, полному ObjectId или его последним 6 символам.
 * Одинаковый суффикс id у нескольких пользователей — ошибка, а не случайный выбор.
 */
export async function resolveUser(ref) {
  const value = String(ref ?? '').trim();
  if (!value) throw ApiError.badRequest('Укажите пользователя: email или id.', 'USER_REF_REQUIRED');

  if (/^[0-9a-f]{24}$/i.test(value)) {
    const byId = await User.findById(value).lean();
    if (byId) return byId;
  }

  const byEmail = await User.findOne({ email: value.toLowerCase() }).lean();
  if (byEmail) return byEmail;

  if (/^[0-9a-f]{4,23}$/i.test(value)) {
    const matches = await User.aggregate([
      {
        $match: {
          $expr: {
            $regexMatch: {
              input: { $toString: '$_id' },
              regex: `${escapeRegex(value)}$`,
              options: 'i',
            },
          },
        },
      },
      { $limit: 2 },
    ]);

    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      throw ApiError.conflict(
        'Такой суффикс id подходит нескольким пользователям — укажите email или полный id.',
        'USER_AMBIGUOUS',
      );
    }
  }

  throw ApiError.notFound(`Пользователь не найден: ${value}`, 'USER_NOT_FOUND');
}

/** Список пользователей с количеством подтверждённых броней. */
export async function listUsers({ query = '', limit = 20 } = {}) {
  const search = String(query ?? '').trim();
  const filter = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: 'i' } },
          { email: { $regex: escapeRegex(search), $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const counts = new Map();
  if (users.length) {
    const rows = await Booking.aggregate([
      { $match: { user: { $in: users.map((user) => user._id) }, status: 'confirmed' } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    rows.forEach((row) => counts.set(String(row._id), row.count));
  }

  return {
    total,
    users: users.map((user) => ({
      id: String(user._id),
      shortId: shortenId(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      createdAt: user.createdAt,
      confirmedBookings: counts.get(String(user._id)) ?? 0,
    })),
  };
}

/** Карточка пользователя: профиль + активные и последние брони. */
export async function getUserProfile(ref) {
  const user = await resolveUser(ref);
  const now = currentBusinessTime(env.businessTimezone);
  const nowKey = `${now.date}T${now.time}`;

  const bookings = await Booking.find({ user: user._id })
    .sort({ date: -1, startTime: -1 })
    .limit(50)
    .lean();

  const dtos = bookings.map((booking) => toBookingDTO(booking, now));
  const active = dtos.filter(
    (booking) =>
      booking.status === 'confirmed' &&
      `${booking.date}T${booking.endTime}` > nowKey,
  );

  return {
    user: {
      id: String(user._id),
      shortId: shortenId(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      createdAt: user.createdAt,
    },
    active,
    recent: dtos.slice(0, 5),
    totalBookings: bookings.length,
  };
}

/** Переименование: пользователь сразу увидит новое имя в кабинете. */
export async function renameUser(ref, rawName) {
  const name = String(rawName ?? '').trim();
  if (name.length < 2) throw ApiError.badRequest('Имя слишком короткое.', 'NAME_TOO_SHORT');
  if (name.length > 80) throw ApiError.badRequest('Имя длиннее 80 символов.', 'NAME_TOO_LONG');

  const user = await resolveUser(ref);
  const previousName = user.name;
  const updated = await User.findByIdAndUpdate(
    user._id,
    { name },
    { returnDocument: 'after' },
  ).lean();

  await notify(user._id, {
    title: 'Имя обновлено',
    message: `Администратор изменил имя в профиле: «${previousName}» → «${name}».`,
    type: 'info',
  });

  return { user: updated, previousName };
}

/** Телефон: '-' или пустая строка очищают поле. */
export async function setUserPhone(ref, rawPhone) {
  const value = String(rawPhone ?? '').trim();
  const phone = value === '-' ? '' : value;

  if (phone.length > 30) {
    throw ApiError.badRequest('Телефон длиннее 30 символов.', 'PHONE_TOO_LONG');
  }
  if (phone && !/^[+\d][\d\s()-]{4,29}$/.test(phone)) {
    throw ApiError.badRequest(
      'Телефон должен содержать цифры, пробелы, скобки, дефис и начинаться с + или цифры.',
      'PHONE_INVALID',
    );
  }

  const user = await resolveUser(ref);
  const updated = await User.findByIdAndUpdate(
    user._id,
    { phone },
    { returnDocument: 'after' },
  ).lean();

  await notify(user._id, {
    title: 'Телефон обновлён',
    message: phone
      ? `Администратор изменил номер телефона в профиле: ${phone}.`
      : 'Администратор удалил номер телефона из профиля.',
    type: 'info',
  });

  return { user: updated, previousPhone: user.phone || '' };
}

/**
 * Новый QR-пропуск. Старый продолжает жить до истечения срока (5 минут),
 * новый выдаётся сразу с актуальными id и подписью.
 */
export async function issuePassForUser(ref) {
  const user = await resolveUser(ref);
  const pass = createPass(String(user._id));

  return { user, pass };
}

/** Последние брони пользователя. */
export async function listBookingsForUser(ref, { limit = 10 } = {}) {
  const user = await resolveUser(ref);
  const now = currentBusinessTime(env.businessTimezone);
  const bookings = await Booking.find({ user: user._id })
    .sort({ date: -1, startTime: -1 })
    .limit(limit)
    .lean();

  return { user, bookings: bookings.map((booking) => toBookingDTO(booking, now)) };
}

async function findByCode(rawCode) {
  const code = String(rawCode ?? '').trim().toUpperCase();
  if (!/^BK-\d{6}$/.test(code)) {
    throw ApiError.badRequest('Код брони выглядит как BK-123456.', 'BOOKING_CODE_INVALID');
  }

  const booking = await Booking.findOne({ code });
  if (!booking) throw ApiError.notFound(`Бронь ${code} не найдена.`, 'BOOKING_NOT_FOUND');
  return booking;
}

/**
 * Продление брони на N минут (кратно 30).
 *
 * Проверяет конец суток, максимальную длительность, занятость места и другие
 * брони пользователя — те же правила, что и при создании. Работает под мьютексом
 * места/даты, поэтому не пересечётся с обычным бронированием.
 */
export async function extendBooking({ code, minutes }) {
  const step = Number(minutes);
  if (!Number.isFinite(step) || step < MIN_EXTEND_MINUTES) {
    throw ApiError.badRequest(
      `Минимальное продление — ${MIN_EXTEND_MINUTES} минут.`,
      'EXTEND_TOO_SHORT',
    );
  }
  if (step % 30 !== 0) {
    throw ApiError.badRequest('Продление должно быть кратно 30 минутам.', 'EXTEND_NOT_ALIGNED');
  }

  const booking = await findByCode(code);
  if (booking.status !== 'confirmed') {
    throw ApiError.conflict('Бронь уже отменена или завершена.', 'BOOKING_NOT_ACTIVE');
  }

  const now = currentBusinessTime(env.businessTimezone);
  const nowKey = `${now.date}T${now.time}`;
  if (`${booking.date}T${booking.endTime}` <= nowKey) {
    throw ApiError.conflict('Бронь уже завершилась — продлить её нельзя.', 'BOOKING_FINISHED');
  }

  const newEndMinutes = toMinutes(booking.endTime) + step;
  if (newEndMinutes > MAX_END_MINUTES) {
    throw ApiError.badRequest(
      `Продлить можно максимум до ${fromMinutes(MAX_END_MINUTES)}.`,
      'EXTEND_TOO_LATE',
    );
  }

  const newEndTime = fromMinutes(newEndMinutes);
  const newHours = durationHours(booking.startTime, newEndTime);
  if (newHours > env.maxBookingHours) {
    throw ApiError.badRequest(
      `Итоговая длительность превысит лимит ${env.maxBookingHours} ч.`,
      'BOOKING_TOO_LONG',
    );
  }

  const addedSlots = slotKeys(booking.date, booking.endTime, newEndTime);
  const user = await User.findById(booking.user).lean();

  const result = await withMutex(mutexKey(booking.spaceSlug, booking.date), async () => {
    const spaceConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      space: booking.space,
      date: booking.date,
      status: 'confirmed',
      slots: { $in: addedSlots },
    })
      .select('startTime endTime code')
      .lean();

    if (spaceConflict) {
      throw ApiError.conflict(
        `Место занято: следующая бронь ${spaceConflict.code} начинается в ${spaceConflict.startTime}.`,
        'SLOT_TAKEN',
        { bookingCode: spaceConflict.code, busyFrom: spaceConflict.startTime },
      );
    }

    const userConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      user: booking.user,
      date: booking.date,
      status: 'confirmed',
      slots: { $in: addedSlots },
    })
      .select('startTime endTime code spaceName')
      .lean();

    if (userConflict) {
      throw ApiError.conflict(
        `У пользователя уже есть бронь «${userConflict.spaceName}» на это время (${userConflict.startTime}–${userConflict.endTime}).`,
        'USER_TIME_CONFLICT',
        { bookingCode: userConflict.code },
      );
    }

    const previousEnd = booking.endTime;
    booking.endTime = newEndTime;
    booking.hours = newHours;
    booking.slots = [...booking.slots, ...addedSlots];
    booking.totalPrice = Math.round(booking.pricePerHour * newHours);

    try {
      await booking.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw ApiError.conflict('Это время только что заняли.', 'SLOT_TAKEN');
      }
      throw error;
    }

    const previousHours = durationHours(booking.startTime, previousEnd);
    const extraPrice = Math.round(booking.pricePerHour * (newHours - previousHours));

    await notify(booking.user, {
      title: 'Бронь продлена',
      message: `Бронь ${booking.code} (${booking.spaceName}) продлена до ${newEndTime} (${formatIsoDate(booking.date)}). Доплата: ${extraPrice} ₸.`,
      type: 'info',
    });

    return {
      booking: toBookingDTO(booking, currentBusinessTime(env.businessTimezone)),
      previousEnd,
      newEnd: newEndTime,
      extraPrice,
      user,
      spaceName: booking.spaceName,
    };
  });

  return result;
}

/** Отмена брони администратором (без проверки владельца). */
export async function cancelBookingByAdmin(rawCode, reason = '') {
  const booking = await findByCode(rawCode);
  if (booking.status !== 'confirmed') {
    throw ApiError.conflict('Бронь уже отменена или завершена.', 'BOOKING_NOT_ACTIVE');
  }

  const now = currentBusinessTime(env.businessTimezone);
  if (`${booking.date}T${booking.endTime}` <= `${now.date}T${now.time}`) {
    throw ApiError.conflict('Бронь уже завершилась — отменять нечего.', 'BOOKING_FINISHED');
  }

  const user = await User.findById(booking.user).lean();
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  const note = String(reason ?? '').trim();
  await notify(booking.user, {
    title: 'Бронирование отменено',
    message: `Администратор отменил бронь ${booking.code} (${booking.spaceName}) на ${formatIsoDate(booking.date)}.${note ? ` Причина: ${note}` : ''}`,
    type: 'error',
  });

  return {
    booking: toBookingDTO(booking, now),
    user,
    spaceName: booking.spaceName,
  };
}

export const formatCreatedAt = (value) => dateTimeFormat.format(new Date(value));
