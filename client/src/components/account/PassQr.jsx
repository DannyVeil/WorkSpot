import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { KeyRound, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';
import { describeApiError } from '../../utils/errors.js';

/** Пропуск живёт 5 минут, обновляем заранее — раз в 30 секунд, пока блок открыт. */
const REFRESH_INTERVAL = 30_000;

function formatLeft(seconds) {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/**
 * Настоящий QR-пропуск: значение — подписанный сервером ключ
 * WSP1.<userId>.<expiresAt>.<hmac>. По нему считыватель проверяет,
 * что пропуск выдан именно этому пользователю и ещё не истёк.
 */
export default function PassQr({ active }) {
  const [pass, setPass] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      const data = await api.getPass();
      setPass(data);
      setError(null);
      setNow(Date.now());
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    load();
    const timer = setInterval(load, REFRESH_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active, load]);

  useEffect(() => {
    if (!active) return undefined;
    const ticker = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(ticker);
  }, [active]);

  const secondsLeft = pass ? Math.max(0, Math.ceil((pass.expiresAt - now) / 1000)) : 0;

  // Вкладку могли свернуть и таймер обновления «уснул» — не показываем мёртвый код.
  useEffect(() => {
    if (active && pass && secondsLeft === 0) load();
  }, [active, pass, secondsLeft, load]);

  return (
    <div className="my-5 p-4 rounded-2xl bg-[#F2F7FC] border border-sky-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <div className="w-28 h-28 bg-white p-2 rounded-xl border border-sky-100 flex items-center justify-center shrink-0">
        {pass ? (
          <QRCodeSVG
            value={pass.token}
            size={96}
            level="M"
            marginSize={0}
            bgColor="#FFFFFF"
            fgColor="#0F2942"
            title="Персональный QR-пропуск WorkSpot"
            className="w-full h-full"
          />
        ) : error ? (
          <button
            type="button"
            onClick={load}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-red-600 cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Повторить
          </button>
        ) : (
          <div className="w-full h-full rounded-lg bg-slate-100 animate-pulse" />
        )}
      </div>

      <div className="text-center sm:text-left min-w-0">
        <div className="text-sm font-extrabold text-[#0F2942]">Персональный пропуск 24/7</div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Поднесите этот QR-код к считывателю на входе в коворкинг или у двери переговорной.
        </p>

        {pass ? (
          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#0F2942]">
              <KeyRound className="w-3.5 h-3.5 text-[#19B5FE]" />
              {pass.key}
            </span>
            <span className="text-[11px] text-slate-500">
              обновится через {formatLeft(secondsLeft)}
            </span>
            <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Статус: Активен
            </span>
          </div>
        ) : error ? (
          <p className="mt-2 text-[11px] font-semibold text-red-600">{error}</p>
        ) : (
          <p className="mt-2 text-[11px] font-semibold text-slate-500">Готовлю пропуск…</p>
        )}
      </div>
    </div>
  );
}
