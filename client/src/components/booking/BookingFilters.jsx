import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { BOOKING_TYPES } from '../../constants/config.js';
import { formatClock, toDateInputValue } from '../../utils/format.js';

/** 00:00, 00:30, … 23:30 — сервер принимает только кратные 30 минутам слоты. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

/** Панель фильтров: дата, интервал, тип места. */
export default function BookingFilters({
  filter,
  onChange,
  onSubmit,
  loading,
  usingFallback,
  error,
  lastUpdated,
  onRefresh,
}) {
  const today = toDateInputValue(new Date());

  const update = (patch) => onChange({ ...filter, ...patch });

  return (
    <div className="mb-8 max-w-4xl mx-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-sky-100"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Дата */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5" htmlFor="booking-date">
              Дата
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="booking-date"
                type="date"
                min={today}
                value={filter.date}
                onChange={(e) => update({ date: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white"
              />
            </div>
          </div>

          {/* Время */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Время</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  aria-label="Время начала"
                  value={filter.startTime}
                  onChange={(e) => update({ startTime: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] appearance-none focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white cursor-pointer"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-slate-400 font-bold">—</span>
              <div className="relative flex-1">
                <select
                  aria-label="Время окончания"
                  value={filter.endTime}
                  onChange={(e) => update({ endTime: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] appearance-none focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white cursor-pointer"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Тип места */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5" htmlFor="booking-type">
              Тип места
            </label>
            <div className="relative">
              <select
                id="booking-type"
                value={filter.type}
                onChange={(e) => update({ type: e.target.value })}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] appearance-none focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white cursor-pointer"
              >
                {BOOKING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Кнопка поиска */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm shadow-sky-200 transition-all cursor-pointer"
            >
              Найти места
            </button>
          </div>
        </div>
      </form>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          {loading ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-[#19B5FE]" />
              Обновляем карту доступности…
            </>
          ) : lastUpdated ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Карта обновлена в {formatClock(new Date(lastUpdated))}
            </>
          ) : (
            'Ожидаем данные о доступности'
          )}
        </span>

        <span className="flex items-center gap-3">
          {error && (
            <span className="text-amber-600 font-semibold">
              {usingFallback
                ? 'Демо-каталог: API временно недоступен'
                : 'Нет связи с API — данные могли устареть'}
            </span>
          )}
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="inline-flex items-center gap-1 font-semibold text-[#19B5FE] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Обновить
          </button>
        </span>
      </div>
    </div>
  );
}
