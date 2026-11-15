import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { formatRelativeTime } from '../utils/format.js';

/** Уведомления пользователя: загрузка, отметка прочитанными, локальные события. */
export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications ?? []);
    } catch {
      // Уведомления не критичны для работы приложения — молча оставляем текущий список.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // При ошибке просто перезагрузим настоящие статусы.
      refresh();
    }
  }, [refresh]);

  const addLocalNotification = useCallback(({ title, message, type = 'info' }) => {
    setNotifications((prev) => [
      {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        message,
        type,
        unread: true,
        time: formatRelativeTime(new Date()),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  return {
    notifications,
    loading,
    unreadCount,
    refresh,
    markAllRead,
    addLocalNotification,
  };
}
