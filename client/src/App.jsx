import { useCallback, useEffect, useState } from 'react';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Toasts from './components/layout/Toasts.jsx';
import SupportWidget from './components/layout/SupportWidget.jsx';
import HoldModal from './components/booking/HoldModal.jsx';
import HomePage from './pages/HomePage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useToasts } from './hooks/useToasts.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useSpaces } from './hooks/useSpaces.js';
import { useBookings } from './hooks/useBookings.js';
import { useHold } from './hooks/useHold.js';
import { useSupportChat } from './hooks/useSupportChat.js';
import { DEFAULT_AUTH_BANNER } from './constants/config.js';
import { PAGE_TITLES } from './constants/navigation.js';
import { describeApiError } from './utils/errors.js';
import { formatDate, formatPrice, tomorrowInputValue } from './utils/format.js';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [pendingRedirect, setPendingRedirect] = useState('profile');
  const [authBannerMessage, setAuthBannerMessage] = useState(DEFAULT_AUTH_BANNER);

  const [selectedSpotId, setSelectedSpotId] = useState('desk-14');
  const [bookingFilter, setBookingFilter] = useState({
    date: tomorrowInputValue(),
    startTime: '09:00',
    endTime: '16:00',
    type: 'Все типы',
  });

  const [focusChatSignal, setFocusChatSignal] = useState(0);

  const { user, initializing, login, register, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const {
    notifications,
    unreadCount,
    markAllRead,
    refresh: refreshNotifications,
    addLocalNotification,
  } = useNotifications(user);
  const spacesState = useSpaces(bookingFilter);
  const bookingsState = useBookings(user);
  const holdState = useHold();
  const chat = useSupportChat(user);

  useEffect(() => {
    document.title = PAGE_TITLES[activePage] || PAGE_TITLES.home;
  }, [activePage]);

  // Защита маршрутов: кабинет только для авторизованных, страница входа — только для гостей.
  useEffect(() => {
    if (initializing) return;
    if (activePage === 'profile' && !user) {
      setPendingRedirect('profile');
      setActivePage('auth');
    } else if (activePage === 'auth' && user) {
      setActivePage('profile');
    }
  }, [activePage, user, initializing]);

  const navigateTo = useCallback((page) => {
      setMobileMenuOpen(false);
      setNotificationsOpen(false);

      if (page === 'profile' && !user) {
        setPendingRedirect('profile');
        setAuthBannerMessage(DEFAULT_AUTH_BANNER);
        setActivePage('auth');
      } else if (page === 'auth' && user) {
        setActivePage('profile');
      } else {
        setActivePage(page);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [user],
  );

  const handleOpenAuthFromHeader = useCallback(() => {
    setPendingRedirect('profile');
    setAuthBannerMessage(DEFAULT_AUTH_BANNER);
    navigateTo('auth');
  }, [navigateTo]);

  const handleRequireAuthForBooking = useCallback(
    (
      message = 'Зарегистрируйтесь или войдите в аккаунт, чтобы завершить бронирование выбранного места',
    ) => {
      setPendingRedirect('booking');
      setAuthBannerMessage(message);
      addToast({
        type: 'info',
        title: 'Требуется аккаунт WorkSpot',
        message,
      });
      navigateTo('auth');
    },
    [addToast, navigateTo],
  );

  const handleHeroBookingTrigger = useCallback(() => {
    if (!user) {
      handleRequireAuthForBooking(
        'Зарегистрируйтесь или войдите в аккаунт, чтобы забронировать рабочее место',
      );
      return;
    }
    navigateTo('booking');
  }, [user, handleRequireAuthForBooking, navigateTo]);

  const handleSelectTariffFromHome = useCallback(
    (filterType) => {
      setBookingFilter((prev) => ({ ...prev, type: filterType }));

      const matchingSpot = spacesState.spaces.find(
        (space) => space.status === 'available' && space.type === filterType,
      );
      if (matchingSpot) setSelectedSpotId(matchingSpot.id);

      if (!user) {
        handleRequireAuthForBooking(
          `Зарегистрируйтесь или войдите в аккаунт, чтобы забронировать пространство категории «${filterType}»`,
        );
        return;
      }

      navigateTo('booking');
    },
    [spacesState.spaces, user, handleRequireAuthForBooking, navigateTo],
  );

  /** Успешный вход/регистрация → возврат на страницу, с которой пришёл пользователь. */
  const handleAuthSubmit = useCallback(
    async ({ mode, payload }) => {
      const newUser = mode === 'register' ? await register(payload) : await login(payload);

      addToast({
        type: 'success',
        title: 'Вы вошли в систему',
        message: `Добро пожаловать, ${newUser.name}!`,
      });
      addLocalNotification({
        title: 'Добро пожаловать в WorkSpot!',
        message: `Аккаунт ${newUser.name} активирован. Доступ 24/7 открыт.`,
        type: 'success',
      });

      const target = pendingRedirect || 'profile';
      setPendingRedirect('profile');
      setActivePage(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      return newUser;
    },
    [register, login, addToast, addLocalNotification, pendingRedirect],
  );

  /** Шаг 1: Redis-резерв + открытие модального окна с таймером. */
  const handleCreateBooking = useCallback(
    async (spot, filter) => {
      if (!user) {
        handleRequireAuthForBooking();
        return;
      }

      try {
        await holdState.startHold({
          spaceId: spot.id,
          date: filter.date,
          startTime: filter.startTime,
          endTime: filter.endTime,
        });
      } catch (error) {
        const description = describeApiError(error, 'Не удалось зарезервировать место');
        addToast(description);

        if (['SLOT_TAKEN', 'SLOT_HELD', 'SPACE_BUSY'].includes(error.code)) {
          spacesState.refresh({ silent: true });
        }
      }
    },
    [user, holdState, handleRequireAuthForBooking, addToast, spacesState],
  );

  /** Шаг 2: подтверждение резерва в MongoDB. */
  const handleConfirmHold = useCallback(async () => {
    const snapshot = holdState.hold;

    try {
      const booking = await holdState.confirmHold();
      bookingsState.addBooking(booking);
      spacesState.refresh({ silent: true });
      refreshNotifications();

      addToast({
        type: 'success',
        title: 'Место успешно забронировано!',
        message: `${booking.spotName} закреплён за вами на ${formatDate(booking.date)} — ${formatPrice(booking.totalPrice)} ₸.`,
        actionLabel: 'Открыть в кабинете',
        onAction: () => navigateTo('profile'),
      });
    } catch (error) {
      const description = describeApiError(error, 'Не удалось подтвердить бронь');
      addToast(description);

      // Резерв больше не нужен: освобождаем слоты, чтобы их не держать до TTL.
      await holdState.releaseHold({ silent: true });
      spacesState.refresh({ silent: true });
    } finally {
      if (!snapshot) holdState.reset();
    }
  }, [holdState, bookingsState, spacesState, refreshNotifications, addToast, navigateTo]);

  const handleReleaseHold = useCallback(async () => {
    try {
      await holdState.releaseHold();
      addToast({
        type: 'info',
        title: 'Резерв снят',
        message: 'Место снова доступно другим резидентам.',
      });
    } catch (error) {
      addToast(describeApiError(error, 'Не удалось снять резерв'));
    } finally {
      spacesState.refresh({ silent: true });
    }
  }, [holdState, addToast, spacesState]);

  const handleDismissExpiredHold = useCallback(() => {
    holdState.reset();
    spacesState.refresh({ silent: true });
  }, [holdState, spacesState]);

  const handleCancelBookingById = useCallback(
    async (bookingId) => {
      const target = bookingsState.bookings.find((booking) => booking.id === bookingId);
      if (!target) return;

      try {
        await bookingsState.cancelBooking(bookingId);
        spacesState.refresh({ silent: true });
        refreshNotifications();

        addToast({
          type: 'info',
          title: 'Бронь отменена',
          message: `Бронирование «${target.spotName}» отменено без штрафа.`,
        });
      } catch (error) {
        addToast(describeApiError(error, 'Не удалось отменить бронь'));
      }
    },
    [bookingsState, spacesState, refreshNotifications, addToast],
  );

  const handleCancelSpotBooking = useCallback(
    async (spotId) => {
      if (!user) {
        handleRequireAuthForBooking();
        return;
      }

      const activeBooking = bookingsState.bookings.find(
        (booking) => booking.spotId === spotId && booking.status === 'confirmed',
      );

      if (activeBooking) {
        await handleCancelBookingById(activeBooking.id);
      } else {
        addToast({
          type: 'info',
          title: 'Нет активной брони',
          message: 'Для выбранного места у вас сейчас нет оформленной брони.',
        });
      }
    },
    [user, bookingsState.bookings, handleRequireAuthForBooking, handleCancelBookingById, addToast],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    holdState.reset();
    setNotificationsOpen(false);
    setActivePage('home');
    addToast({
      type: 'info',
      title: 'Вы вышли из аккаунта',
      message: 'Вы вернулись на главную страницу в режиме гостя.',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [logout, holdState, addToast]);

  const handleOpenSupport = useCallback(() => {    setFocusChatSignal((value) => value + 1);

    if (!user) {
      setPendingRedirect('profile');
      setAuthBannerMessage(
        'Войдите или зарегистрируйтесь, чтобы открыть чат с техподдержкой 24/7',
      );
      navigateTo('auth');
      return;
    }

    navigateTo('profile');
  }, [user, navigateTo]);

  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F7FC] text-[#0F2942] font-sans">
      <Header
        activePage={activePage}
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        notificationsOpen={notificationsOpen}
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={navigateTo}
        onOpenAuth={handleOpenAuthFromHeader}
        onToggleNotifications={() => setNotificationsOpen((value) => !value)}
        onCloseNotifications={closeNotifications}
        onMarkAllRead={markAllRead}
        onToggleMobileMenu={() => setMobileMenuOpen((value) => !value)}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            spaces={spacesState.spaces}
            onNavigate={navigateTo}
            onBookingTrigger={handleHeroBookingTrigger}
            onSelectTariff={handleSelectTariffFromHome}
          />
        )}

        {activePage === 'booking' && (
          <BookingPage
            user={user}
            spaces={spacesState.spaces}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={setSelectedSpotId}
            filter={bookingFilter}
            setFilter={setBookingFilter}
            bookings={bookingsState.bookings}
            spacesLoading={spacesState.loading}
            usingFallback={spacesState.usingFallback}
            spacesError={spacesState.error}
            lastUpdated={spacesState.lastUpdated}
            onRefreshSpaces={spacesState.refresh}
            holdBusy={holdState.busy}
            onCreateBooking={handleCreateBooking}
            onCancelSpotBooking={handleCancelSpotBooking}
            onRequireAuthForBooking={handleRequireAuthForBooking}
            onShowToast={addToast}
          />
        )}

        {activePage === 'rules' && <RulesPage onNavigate={navigateTo} />}

        {activePage === 'profile' && (
          <AccountPage
            user={user}
            bookings={bookingsState.bookings}
            bookingsLoading={bookingsState.loading}
            bookingsError={bookingsState.error}
            onCancelBooking={handleCancelBookingById}
            chatMessages={chat.messages}
            chatTyping={chat.typing}
            chatError={chat.error}
            chatCanSend={chat.canSend}
            chatRetryInSeconds={chat.retryInSeconds}
            onSendMessage={chat.sendMessage}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            focusChatSignal={focusChatSignal}
          />
        )}

        {activePage === 'auth' && (
          <AuthPage
            user={user}
            authBannerMessage={authBannerMessage}
            onAuthSubmit={handleAuthSubmit}
            onNavigate={navigateTo}
            onShowToast={addToast}
          />
        )}
      </main>

      <Footer onNavigate={navigateTo} />

      <SupportWidget onClick={handleOpenSupport} />
      <Toasts toasts={toasts} onRemove={removeToast} />

      <HoldModal
        hold={holdState.hold}
        secondsLeft={holdState.secondsLeft}
        expired={holdState.expired}
        busy={holdState.busy}
        confirming={holdState.confirming}
        onConfirm={handleConfirmHold}
        onRelease={handleReleaseHold}
        onDismissExpired={handleDismissExpiredHold}
      />
    </div>
  );
}
