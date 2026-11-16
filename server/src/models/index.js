import { User } from './User.js';
import { Space } from './Space.js';
import { Booking } from './Booking.js';
import { Notification } from './Notification.js';
import { SupportMessage } from './SupportMessage.js';

/**
 * Гарантирует, что индексы (включая уникальный индекс слотов) построены
 * до того, как сервер начнёт принимать запросы.
 */
export async function ensureIndexes() {
  await Promise.all([
    User.init(),
    Space.init(),
    Booking.init(),
    Notification.init(),
    SupportMessage.init(),
  ]);
}

export { User, Space, Booking, Notification, SupportMessage };
