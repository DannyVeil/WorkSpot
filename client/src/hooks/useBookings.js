import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

/** Брони текущего пользователя. */
export function useBookings(user) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!user) {
        setBookings([]);
        setError(null);
        return;
      }

      if (!silent) setLoading(true);
      try {
        const data = await api.getBookings('all');
        setBookings(data.bookings ?? []);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  /** Добавить подтверждённую бронь без повторного запроса. */
  const addBooking = useCallback((booking) => {
    setBookings((prev) => [booking, ...prev.filter((item) => item.id !== booking.id)]);
  }, []);

  const cancelBooking = useCallback(async (code) => {
    const data = await api.cancelBooking(code);
    const updated = data.booking;
    setBookings((prev) => prev.map((item) => (item.id === code ? { ...item, ...updated } : item)));
    return updated;
  }, []);

  const refresh = useCallback((options) => load(options), [load]);

  return { bookings, loading, error, refresh, addBooking, cancelBooking };
}
