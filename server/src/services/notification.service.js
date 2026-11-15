import { Notification } from '../models/Notification.js';

function relativeTime(date) {
  const diffMs = Math.max(0, Date.now() - new Date(date).getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export function toNotificationDTO(notification) {
  return {
    id: String(notification._id ?? notification.id),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    unread: !notification.read,
    time: relativeTime(notification.createdAt),
    createdAt: notification.createdAt,
  };
}

export async function listNotifications(userId, { limit = 50 } = {}) {
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map(toNotificationDTO);
}

export async function markAllRead(userId) {
  const result = await Notification.updateMany({ user: userId, read: false }, { read: true });
  return { updated: result.modifiedCount };
}

export async function markRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { returnDocument: 'after' },
  ).lean();

  return notification ? toNotificationDTO(notification) : null;
}
