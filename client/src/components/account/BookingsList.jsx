import { useState } from 'react';
import { Building2, Calendar, Clock, Loader2 } from 'lucide-react';
import { formatDate, formatPrice } from '../../utils/format.js';

const STATUS_BADGES = {
  confirmed: { label: 'Подтверждено', className: 'text-emerald-700 bg-emerald-100' },
  cancelled: { label: 'Отменено', className: 'text-red-700 bg-red-100' },
  completed: { label: 'Завершено', className: 'text-slate-600 bg-slate-200' },
};

/** Список «Мои бронирования» с вкладками активных и истории. */
export default function BookingsList({ bookings, loading, error, onCancelBooking, onNavigate }) {
  const [bookingTab, setBookingTab] = useState('active');
  const [cancellingId, setCancellingId] = useState(null);

  const activeBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const historyBookings = bookings.filter((booking) => booking.status !== 'confirmed');
  const displayedBookings = bookingTab === 'active' ? activeBookings : historyBookings;

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await onCancelBooking(bookingId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F2942]">Мои бронирования</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Управляйте текущими записями или оформите новую бронь
          </p>
        </div>

        <div className="inline-flex bg-[#F2F7FC] p-1 rounded-xl self-start sm:self-auto border border-sky-100">
          <button
            type="button"
            onClick={() => setBookingTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              bookingTab === 'active'
                ? 'bg-white text-[#0F2942] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            Активные брони ({activeBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setBookingTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              bookingTab === 'history'
                ? 'bg-white text-[#0F2942] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            История ({historyBookings.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
          Не удалось загрузить список броней. Проверьте соединение с сервером и обновите страницу.
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="text-center py-10 px-4 bg-[#F2F7FC] rounded-2xl border border-sky-100">
          <Loader2 className="w-8 h-8 text-[#19B5FE] mx-auto mb-3 animate-spin" />
          <p className="text-sm font-bold text-[#0F2942]">Загружаем ваши бронирования…</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-10 px-4 bg-[#F2F7FC] rounded-2xl border border-dashed border-sky-200">
          <Calendar className="w-10 h-10 text-sky-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#0F2942] mb-1">
            {bookingTab === 'active'
              ? 'У вас пока нет активных бронирований'
              : 'История бронирований пуста'}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Выберите свободный стол или переговорную на интерактивной карте
          </p>
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="inline-flex items-center gap-1.5 bg-[#19B5FE] hover:bg-[#0099E5] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Перейти к карте мест
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => {
            const badge = STATUS_BADGES[booking.status] || STATUS_BADGES.confirmed;
            const canCancel = booking.status === 'confirmed' && booking.canCancel !== false;

            return (
              <div
                key={booking.id}
                className="p-4 sm:p-5 rounded-2xl border border-sky-100 bg-[#F8FBFF] hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{booking.id}</span>
                    <h3 className="font-extrabold text-[#0F2942] text-base">{booking.spotName}</h3>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#19B5FE]" />
                      {booking.zone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#19B5FE]" />
                      {formatDate(booking.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#19B5FE]" />
                      {booking.startTime} – {booking.endTime} ({booking.hours} ч.)
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-sky-100 shrink-0">
                  <div className="text-base font-extrabold text-[#0F2942]">
                    {formatPrice(booking.totalPrice)} ₸
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait inline-flex items-center gap-1.5"
                    >
                      {cancellingId === booking.id && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      Отменить бронь
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
