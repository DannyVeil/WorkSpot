import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ProfileCard from '../components/account/ProfileCard.jsx';
import BookingsList from '../components/account/BookingsList.jsx';
import SupportChat from '../components/account/SupportChat.jsx';

/** Личный кабинет: профиль, бронирования и чат поддержки. */
export default function AccountPage({
  user,
  bookings,
  bookingsLoading,
  bookingsError,
  onCancelBooking,
  chatMessages,
  chatTyping,
  onSendMessage,
  onNavigate,
  onLogout,
  focusChatSignal,
}) {
  const [mobileSection, setMobileSection] = useState('bookings'); // 'bookings' | 'chat'

  useEffect(() => {
    if (focusChatSignal > 0) setMobileSection('chat');
  }, [focusChatSignal]);

  if (!user) return null;

  const activeBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const totalHours = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + (booking.hours || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Переключатель секций для мобильных устройств */}
      <div className="flex lg:hidden bg-white p-1.5 rounded-2xl border border-sky-100 mb-6 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSection('bookings')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            mobileSection === 'bookings'
              ? 'bg-[#19B5FE] text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Мои бронирования ({activeBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('chat')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileSection === 'chat' ? 'bg-[#19B5FE] text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Техподдержка 24/7
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileSection === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          <ProfileCard
            user={user}
            activeBookingsCount={activeBookings.length}
            totalHours={totalHours}
            onLogout={onLogout}
          />

          <BookingsList
            bookings={bookings}
            loading={bookingsLoading}
            error={bookingsError}
            onCancelBooking={onCancelBooking}
            onNavigate={onNavigate}
          />
        </div>

        <div
          className={`lg:col-span-5 ${
            mobileSection === 'bookings' ? 'hidden lg:block' : 'block'
          }`}
        >
          <SupportChat
            messages={chatMessages}
            typing={chatTyping}
            onSendMessage={onSendMessage}
            focusSignal={focusChatSignal}
          />
        </div>
      </div>
    </div>
  );
}
