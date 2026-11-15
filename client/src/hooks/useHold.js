import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Двухшаговое бронирование:
 *  1) hold  — Redis закрепляет слоты на 10 минут;
 *  2) confirm — создаётся бронь в MongoDB.
 * Хук хранит резерв и обратный отсчёт для модального окна.
 */
export function useHold() {
  const [hold, setHold] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | active | expired | confirming

  useEffect(() => {
    if (!hold?.expiresAt) {
      setSecondsLeft(0);
      return undefined;
    }

    const tick = () => {
      const msLeft = new Date(hold.expiresAt).getTime() - Date.now();
      const next = Math.max(0, Math.ceil(msLeft / 1000));
      setSecondsLeft(next);
      if (next === 0) {
        setPhase((prev) => (prev === 'active' ? 'expired' : prev));
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [hold]);

  const startHold = useCallback(async ({ spaceId, date, startTime, endTime }) => {
    setBusy(true);
    try {
      const data = await api.hold({ spaceId, date, startTime, endTime });
      setHold(data);
      setPhase('active');
      return data;
    } finally {
      setBusy(false);
    }
  }, []);

  const confirmHold = useCallback(async () => {
    if (!hold) throw new Error('Нет активного резерва');
    setBusy(true);
    setPhase('confirming');
    try {
      const data = await api.confirm(hold.holdId);
      setHold(null);
      setPhase('idle');
      return data.booking;
    } catch (error) {
      setPhase('active');
      throw error;
    } finally {
      setBusy(false);
    }
  }, [hold]);

  const releaseHold = useCallback(
    async ({ silent = false } = {}) => {
      if (!hold) return;
      const { holdId } = hold;
      setHold(null);
      setPhase('idle');
      try {
        await api.releaseHold(holdId);
      } catch (error) {
        if (!silent) throw error;
      }
    },
    [hold],
  );

  const reset = useCallback(() => {
    setHold(null);
    setPhase('idle');
    setSecondsLeft(0);
  }, []);

  return {
    hold,
    secondsLeft,
    busy,
    phase,
    expired: phase === 'expired',
    confirming: phase === 'confirming',
    startHold,
    confirmHold,
    releaseHold,
    reset,
  };
}
