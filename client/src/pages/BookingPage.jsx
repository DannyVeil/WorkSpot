import { useEffect } from 'react';
import FloorPlanMap from '../components/booking/FloorPlanMap.jsx';
import BookingFilters from '../components/booking/BookingFilters.jsx';
import BookingDetails from '../components/booking/BookingDetails.jsx';
import { calculateHours } from '../utils/format.js';

/** Страница бронирования: фильтры, карта и панель деталей. */
export default function BookingPage({
  user,
  spaces,
  selectedSpotId,
  setSelectedSpotId,
  filter,
  setFilter,
  bookings,
  spacesLoading,
  usingFallback,
  spacesError,
  lastUpdated,
  onRefreshSpaces,
  holdBusy,
  onCreateBooking,
  onCancelSpotBooking,
  onRequireAuthForBooking,
  onShowToast,
}) {
  const selectedSpot =
    spaces.find((space) => space.id === selectedSpotId) ||
    spaces.find((space) => space.status === 'available') ||
    spaces[0] ||
    null;

  // Если фильтр сменил набор мест — выбираем первое доступное.
  useEffect(() => {
    if (!spaces.length) return;
    const exists = spaces.some((space) => space.id === selectedSpotId);
    if (!exists) {
      const first = spaces.find((space) => space.status === 'available') || spaces[0];
      if (first) setSelectedSpotId(first.id);
    }
  }, [spaces, selectedSpotId, setSelectedSpotId]);

  const hours = calculateHours(filter.startTime, filter.endTime);
  const totalCost = selectedSpot
    ? hours > 0
      ? Math.round(selectedSpot.price * hours)
      : selectedSpot.price
    : 0;

  const userActiveBookingForSpot = user && selectedSpot
    ? bookings.find(
        (booking) => booking.spotId === selectedSpot.id && booking.status === 'confirmed',
      )
    : null;

  const handleFindPlaces = (event) => {
    event.preventDefault();

    if (hours <= 0) {
      onShowToast({
        type: 'error',
        title: 'Некорректное время',
        message: 'Время окончания бронирования должно быть позже времени начала.',
      });
      return;
    }

    const availableMatching = spaces.filter(
      (space) =>
        space.status === 'available' &&
        (filter.type === 'Все типы' || space.type === filter.type),
    );

    if (availableMatching.length > 0) {
      if (!availableMatching.some((space) => space.id === selectedSpotId)) {
        setSelectedSpotId(availableMatching[0].id);
      }
      onShowToast({
        type: 'success',
        title: 'Места обновлены',
        message: `Доступно свободных вариантов (${filter.type}): ${availableMatching.length} шт.`,
      });
    } else {
      onShowToast({
        type: 'error',
        title: 'Нет свободных мест',
        message: 'По выбранному типу мест сейчас всё занято. Попробуйте выбрать другой тип.',
      });
    }

    onRefreshSpaces?.();
  };

  const handleBookClick = () => {
    if (!user) {
      onRequireAuthForBooking();
      return;
    }

    if (!selectedSpot) {
      onShowToast({
        type: 'error',
        title: 'Место не выбрано',
        message: 'Выберите свободное место на интерактивной карте.',
      });
      return;
    }

    if (hours <= 0) {
      onShowToast({
        type: 'error',
        title: 'Ошибка выбора времени',
        message: 'Укажите корректный интервал времени бронирования.',
      });
      return;
    }

    if (selectedSpot.status !== 'available') {
      onShowToast({
        type: 'error',
        title: 'Место занято',
        message: 'Это место уже занято на выбранное время. Выберите свободный зелёный стол.',
      });
      return;
    }

    onCreateBooking(selectedSpot, filter, hours, totalCost);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] tracking-tight mb-3">
          Забронируйте рабочее место за пару кликов
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Современный коворкинг для продуктивной работы. Доступ 24/7.
          <br className="hidden sm:inline" /> Быстро, просто и безопасно.
        </p>
      </div>

      <BookingFilters
        filter={filter}
        onChange={setFilter}
        onSubmit={handleFindPlaces}
        loading={spacesLoading}
        usingFallback={usingFallback}
        error={spacesError}
        lastUpdated={lastUpdated}
        onRefresh={onRefreshSpaces}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8">
          <FloorPlanMap
            spaces={spaces}
            selectedSpotId={selectedSpot?.id}
            activeTypeFilter={filter.type}
            onSelectSpot={(id) => setSelectedSpotId(id)}
            onOccupiedClick={(spot) => {
              const ownBooking = user
                ? bookings.find(
                    (booking) => booking.spotId === spot.id && booking.status === 'confirmed',
                  )
                : null;

              if (ownBooking) {
                setSelectedSpotId(spot.id);
                onShowToast({
                  type: 'info',
                  title: 'Ваша активная бронь',
                  message: `Вы уже забронировали «${spot.name}». При необходимости вы можете отменить бронь в панели справа.`,
                });
              } else {
                onShowToast({
                  type: 'error',
                  title: 'Место занято',
                  message: 'Это место уже занято на выбранное время.',
                });
              }
            }}
          />
        </div>

        <div className="lg:col-span-4">
          <BookingDetails
            spot={selectedSpot}
            filter={filter}
            hours={hours}
            totalCost={totalCost}
            user={user}
            activeBookingForSpot={userActiveBookingForSpot}
            pending={holdBusy}
            onBook={handleBookClick}
            onCancelSpotBooking={onCancelSpotBooking}
          />
        </div>
      </div>
    </div>
  );
}
