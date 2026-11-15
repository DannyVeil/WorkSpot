import { Check, CheckCircle2 } from 'lucide-react';
import WorkspaceIllustration from '../brand/WorkspaceIllustration.jsx';
import { formatDate, formatPrice } from '../../utils/format.js';

/** Правая панель «Детали бронирования». */
export default function BookingDetails({
  spot,
  filter,
  hours,
  totalCost,
  user,
  activeBookingForSpot,
  pending,
  onBook,
  onCancelSpotBooking,
}) {
  if (!spot) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100 lg:sticky lg:top-24">
        <h3 className="text-xl font-extrabold text-[#0F2942] mb-3">Детали бронирования</h3>
        <p className="text-sm text-slate-600">
          По выбранному фильтру нет мест. Измените тип места или интервал времени.
        </p>
      </div>
    );
  }

  const isAvailable = spot.status === 'available';
  const canBook = isAvailable && hours > 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100 lg:sticky lg:top-24">
      <h3 className="text-xl font-extrabold text-[#0F2942] mb-4">Детали бронирования</h3>

      <div className="mb-5">
        <WorkspaceIllustration type={spot.type} />
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h4 className="text-lg font-extrabold text-[#0F2942] leading-snug">{spot.name}</h4>
        <span className="text-lg font-extrabold text-[#19B5FE] shrink-0">
          {formatPrice(spot.price)} ₸/час
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[#19B5FE] bg-[#F2F7FC] border border-sky-100 px-2.5 py-0.5 rounded-md">
          {spot.zone}
        </span>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
          {spot.capacity}
        </span>
        {!isAvailable && (
          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
            Занято на выбранное время
          </span>
        )}
        {spot.heldByMe && isAvailable && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
            Ваш резерв
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">{spot.description}</p>

      <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100 mb-5 space-y-2">
        {spot.amenities?.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2 text-xs font-semibold text-[#0F2942]">
            <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>{amenity}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm py-3 px-4 rounded-xl bg-[#E8F3FF]/80 border border-sky-200/70 mb-5">
        <div>
          <span className="text-[#0F2942] font-bold block">
            {formatDate(filter.date)} • {filter.startTime}–{filter.endTime}
          </span>
          <span className="block text-xs text-slate-600 mt-0.5">
            {hours > 0
              ? `${hours} ч. × ${formatPrice(spot.price)} ₸`
              : 'Укажите интервал'}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-slate-500 block">Итого</span>
          <span className="text-lg font-extrabold text-[#19B5FE]">
            {formatPrice(totalCost)} ₸
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeBookingForSpot ? (
          <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            Место забронировано вами
          </div>
        ) : (
          <button
            type="button"
            onClick={onBook}
            disabled={!canBook || pending}
            className={`w-full py-3.5 px-5 rounded-xl font-bold text-base shadow-md transition-all ${
              canBook && !pending
                ? 'bg-[#19B5FE] hover:bg-[#0099E5] text-white shadow-sky-200/80 cursor-pointer'
                : 'bg-slate-200 text-slate-500 shadow-none cursor-not-allowed'
            }`}
          >
            {pending
              ? 'Резервируем место…'
              : !isAvailable
                ? 'Место занято'
                : hours <= 0
                  ? 'Выберите корректное время'
                  : 'Забронировать сейчас'}
          </button>
        )}

        {user && (
          <button
            type="button"
            onClick={() => onCancelSpotBooking(spot.id)}
            className="w-full py-2 text-center text-sm font-medium text-slate-500 hover:text-red-600 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Отменить бронирование
          </button>
        )}

        {!user && (
          <p className="text-center text-[11px] text-slate-500">
            Для оформления брони потребуется аккаунт WorkSpot
          </p>
        )}
      </div>
    </div>
  );
}
