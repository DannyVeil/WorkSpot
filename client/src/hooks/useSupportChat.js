import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { createPendingMessage } from '../data/chat.js';
import { describeApiError } from '../utils/errors.js';

/** Как часто забираем новые ответы оператора из Telegram. */
const SUPPORT_POLL_INTERVAL = 5_000;

/**
 * Чат техподдержки через API: сообщения уходят оператору в Telegram,
 * ответы приходят сюда опросом (webhook не нужен).
 *
 * Одно ожидающее сообщение за раз: пока оператор не ответил, сервер блокирует
 * повторную отправку на 5 минут. Клиент повторяет это правило таймером.
 */
export function useSupportChat(user) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef(0);

  const applyGate = useCallback((state) => {
    if (!state) return;
    setBlockedUntil(
      state.canSend ? 0 : Date.now() + Math.max(0, state.retryAfterSeconds || 0) * 1000,
    );
    setNow(Date.now());
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) return;
      const requestId = ++requestRef.current;

      try {
        const data = await api.getSupportMessages();
        if (requestId !== requestRef.current) return;
        if (Array.isArray(data?.messages)) {
          setMessages((prev) => {
            // Локальные сообщения, которые ещё не подтвердил сервер, не теряем.
            const pending = prev.filter((item) => item.pending);
            return [...data.messages, ...pending];
          });
          setLoaded(true);
        }
        applyGate(data);
        if (!silent) setError(null);
      } catch (err) {
        if (requestId !== requestRef.current) return;
        if (err?.status === 401) return;
        setError(describeApiError(err).message);
      }
    },
    [user, applyGate],
  );

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoaded(false);
      setError(null);
      setBlockedUntil(0);
      return undefined;
    }

    load();
    const timer = setInterval(() => load({ silent: true }), SUPPORT_POLL_INTERVAL);

    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, load]);

  // Обратный отсчёт, пока ждём ответа оператора.
  useEffect(() => {
    if (!blockedUntil) return undefined;
    const ticker = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(ticker);
  }, [blockedUntil]);

  const retryInSeconds = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;
  const canSend = retryInSeconds === 0;

  const sendMessage = useCallback(
    async (text) => {
      const value = String(text || '').trim();
      if (!value || !user || !canSend) return;

      const local = createPendingMessage({ author: user.name, text: value });
      setMessages((prev) => [...prev, local]);
      setSending(true);
      setError(null);

      try {
        const result = await api.sendSupportMessage(value);
        applyGate(result);
        setMessages((prev) => prev.filter((item) => item.id !== local.id));
        await load({ silent: true });
      } catch (err) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === local.id ? { ...item, pending: false, failed: true } : item,
          ),
        );

        if (err?.code === 'SUPPORT_REPLY_PENDING') {
          // Сервер посчитал ожидание иначе (например, страница была свёрнута).
          const seconds = Number(err.details?.retryAfterSeconds ?? 0);
          if (seconds > 0) applyGate({ canSend: false, retryAfterSeconds: seconds });
        } else {
          setError(describeApiError(err).message);
        }
      } finally {
        setSending(false);
      }
    },
    [user, canSend, load, applyGate],
  );

  return {
    messages,
    // Показываем «печатает», пока наше сообщение не подтвердил сервер.
    typing: sending && messages.some((item) => item.pending),
    sending,
    loaded,
    error,
    canSend,
    retryInSeconds,
    sendMessage,
  };
}
