import * as notificationService from '../services/notification.service.js';
import { ApiError } from '../utils/ApiError.js';

export async function list(req, res) {
  const notifications = await notificationService.listNotifications(req.auth.userId);
  res.json({ notifications });
}

export async function readAll(req, res) {
  const result = await notificationService.markAllRead(req.auth.userId);
  res.json(result);
}

export async function readOne(req, res) {
  const notification = await notificationService.markRead(req.auth.userId, req.params.id);
  if (!notification) throw ApiError.notFound('Уведомление не найдено', 'NOTIFICATION_NOT_FOUND');
  res.json({ notification });
}
