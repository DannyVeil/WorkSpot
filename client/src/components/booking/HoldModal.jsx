import { CheckCircle2, Clock, Loader2, ShieldCheck, TimerOff, X } from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/format.js';

/**
 * Шаг 2 бронирования: пока пользователь подтверждает, слоты удерживаются в Redis.
 * Таймер показывает, сколько осталось до автоматического освобождения стола.
 */
export default function HoldModal({
  hold,
  secondsLeft,
  expired,
  busy,
  confirming,
  onConfirm,
  onRelease,
  onDismissExpired,
}) {
  if (!hold) return null;

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const progress = Math.min(100, Math.max(0, (secondsLeft / 600) * 100));
  const isUrgent = secondsLeft <= 60;
  const space = hold.space;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2942]/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hold-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                expired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {expired ? <TimerOff className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h2 id="hold-modal-title" className="text-lg font-extrabold text-[#0F2942]">
                {expired ? 'Резерв истёк' : 'Стол закреплён за вами'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {expired
                  ? 'Слоты освобождены и снова доступны другим резидентам.'
                  : 'Шаг 2 из 2 — подтвердите бронь, пока действует резерв.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={expired ? onDismissExpired : onRelease}
            disabled={busy}
            aria-label="Закрыть"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-sky-100 bg-[#F8FBFF] p-4">
            <div className="font-extrabold text-[#0F2942]">{space?.name || hold.spaceSlug}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
              <span>{formatDate(hold.date)}</span>
              <span>
                {hold.startTime} – {hold.endTime}
              </span>
              <span>{hold.hours} ч.</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">К оплате на месте</span>
              <span className="text-lg font-extrabold text-[#19B5FE]">
                {formatPrice(hold.totalPrice)} ₸
              </span>
            </div>
          </div>

          {!expired ? (
            <>
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-[#0F2942]">
                    <Clock className="w-3.5 h-3.5 text-[#19B5FE]" />
                    Резерв действует ещё
                  </span>
                  <span
                    className={`tabular-nums text-sm ${
                      isUrgent ? 'text-red-600' : 'text-[#0F2942]'
                    }`}
                  >
                    {minutes}:{seconds}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                      isUrgent ? 'bg-red-500' : 'bg-[#19B5FE]'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Пока таймер идёт, слоты защищены в Redis: другой пользователь не сможет
                  забронировать это же место на то же время.
                </p>
              </div>

              <button
                type="button"
                onClick={onConfirm}
                disabled={busy || confirming}
                className="w-full py-3.5 px-5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-md shadow-sky-200/80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait inline-flex items-center justify-center gap-2"
              >
                {busy || confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Подтверждаем…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Подтвердить бронь
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRelease}
                disabled={busy}
                className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                Освободить место и выбрать другое
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDismissExpired}
              className="w-full py-3.5 px-5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-md shadow-sky-200/80 transition-all cursor-pointer"
            >
              Выбрать другое место
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
