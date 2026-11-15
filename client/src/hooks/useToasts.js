import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 5500;

/** Всплывающие уведомления (тосты) с автоскрытием. */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, actionLabel, onAction, duration = DEFAULT_DURATION }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, title, message, actionLabel, onAction }]);

      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);

      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  return { toasts, addToast, removeToast };
}
