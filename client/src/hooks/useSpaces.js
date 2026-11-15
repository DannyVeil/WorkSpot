import { useCallback, useEffect, useRef, useState } from 'react';
import { api, toFrontendSpace } from '../api/client.js';
import { INITIAL_SPACES } from '../data/catalog.js';
import { SPACES_DEBOUNCE, SPACES_POLL_INTERVAL } from '../constants/config.js';

/**
 * Карта доступности мест:
 *  - debounce при изменении фильтра;
 *  - защита от устаревших ответов (race condition);
 *  - опрос каждые 30 секунд, чтобы видеть чужие резервы;
 *  - fallback на каталог из макета, если API недоступен.
 */
export function useSpaces(filter) {
  const [spaces, setSpaces] = useState(INITIAL_SPACES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [usingFallback, setUsingFallback] = useState(true);

  const requestRef = useRef(0);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++requestRef.current;
    if (!silent) setLoading(true);

    try {
      const { date, startTime, endTime, type } = filterRef.current;
      const data = await api.getSpaces({ date, startTime, endTime, type });

      // Пока запрос летел, пользователь мог изменить фильтр — отбрасываем старый ответ.
      if (requestId !== requestRef.current) return;

      if (Array.isArray(data?.spaces)) {
        setSpaces(data.spaces.map(toFrontendSpace));
        setUsingFallback(false);
      }
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err);
      // Если API уже отдавал данные, оставляем последнюю успешную карту,
      // а не подменяем её демо-каталогом.
    } finally {
      if (requestId === requestRef.current && !silent) setLoading(false);
    }
  }, []);

  const filterKey = `${filter.date}|${filter.startTime}|${filter.endTime}|${filter.type}`;

  useEffect(() => {
    const debounceTimer = setTimeout(() => load(), SPACES_DEBOUNCE);
    const pollTimer = setInterval(() => load({ silent: true }), SPACES_POLL_INTERVAL);

    return () => {
      clearTimeout(debounceTimer);
      clearInterval(pollTimer);
    };
    // Перезапускаем только при реальном изменении фильтра.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Обновление при возврате на вкладку — резервы могли появиться, пока вкладка спала.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const refresh = useCallback((options) => load(options), [load]);

  return {
    spaces,
    loading,
    error,
    lastUpdated,
    usingFallback,
    refresh,
  };
}
