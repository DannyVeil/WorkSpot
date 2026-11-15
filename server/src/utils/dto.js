/** Преобразование документов БД в формат, который ждёт React-фронтенд. */

export function toSpaceDTO(space) {
  return {
    id: space.slug,
    shortLabel: space.shortLabel,
    name: space.name,
    type: space.type,
    zone: space.zone,
    price: space.pricePerHour,
    pricePerHour: space.pricePerHour,
    capacity: space.capacity,
    amenities: space.amenities ?? [],
    description: space.description ?? '',
  };
}

/**
 * Бронь в формате INITIAL_BOOKINGS из workspot.tsx.
 * Статус confirmed с прошедшим временем отдаётся как completed (без записи в БД).
 */
export function toBookingDTO(booking, now) {
  const nowKey = `${now.date}T${now.time}`;
  const endKey = `${booking.date}T${booking.endTime}`;
  const isFinished = endKey <= nowKey;

  const status = booking.status === 'confirmed' && isFinished ? 'completed' : booking.status;

  return {
    id: booking.code,
    spotId: booking.spaceSlug,
    spotName: booking.spaceName,
    zone: booking.zone,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    hours: booking.hours,
    totalPrice: booking.totalPrice,
    pricePerHour: booking.pricePerHour,
    status,
    canCancel: status === 'confirmed',
    createdAt: booking.createdAt,
  };
}
