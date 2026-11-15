import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Авторизация WorkSpot.
 * Сессия хранится в api-клиенте (localStorage), хук только синхронизирует UI.
 */
export function useAuth() {
  const [user, setUser] = useState(() => api.user);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = api.subscribe((session) => setUser(session?.user ?? null));
    let cancelled = false;

    async function restoreSession() {
      if (!api.session?.accessToken) {
        if (!cancelled) setInitializing(false);
        return;
      }
      try {
        await api.me();
      } catch {
        // Токен мог истечь — клиент сам очистит сессию при неудачном refresh.
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, phone, password, confirmPassword }) => {
    const data = await api.register({ name, email, phone, password, confirmPassword });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return { user, initializing, login, register, logout };
}
