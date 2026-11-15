import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

/** Стек всплывающих уведомлений. */
export default function Toasts({ toasts, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl p-4 shadow-lg border backdrop-blur-md transition-all flex items-start gap-3 ${
              isError
                ? 'bg-red-50/95 border-red-200 text-red-900'
                : isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                  : 'bg-white/95 border-sky-200 text-[#0F2942]'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#19B5FE] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <div className="font-extrabold text-sm mb-0.5">{toast.title}</div>
              <p className="opacity-90 leading-relaxed">{toast.message}</p>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction();
                    onRemove(toast.id);
                  }}
                  className="mt-2 inline-block font-extrabold text-[#19B5FE] hover:underline cursor-pointer"
                >
                  {toast.actionLabel} →
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              aria-label="Закрыть уведомление"
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
