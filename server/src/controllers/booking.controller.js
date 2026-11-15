import * as bookingService from '../services/booking.service.js';

/** POST /api/bookings/hold — временно закрепить стол на время оформления */
export async function hold(req, res) {
  const result = await bookingService.holdSpace({
    userId: req.auth.userId,
    ...req.body,
  });
  res.status(201).json(result);
}

/** POST /api/bookings — подтвердить резерв и создать бронь */
export async function confirm(req, res) {
  const booking = await bookingService.confirmHold({
    userId: req.auth.userId,
    holdId: req.body.holdId,
  });
  res.status(201).json({ booking });
}

/** GET /api/bookings?scope=active|history|all */
export async function list(req, res) {
  const bookings = await bookingService.listUserBookings({
    userId: req.auth.userId,
    scope: req.validatedQuery.scope,
  });
  res.json({ bookings });
}

/** DELETE /api/bookings/:code */
export async function cancel(req, res) {
  const booking = await bookingService.cancelBooking({
    userId: req.auth.userId,
    code: req.params.code,
  });
  res.json({ booking });
}

/** GET /api/bookings/hold/:holdId */
export async function getHold(req, res) {
  const hold = await bookingService.getHoldForUser({
    userId: req.auth.userId,
    holdId: req.params.holdId,
  });
  res.json({ hold });
}

/** DELETE /api/bookings/hold/:holdId */
export async function releaseHold(req, res) {
  const result = await bookingService.releaseUserHold({
    userId: req.auth.userId,
    holdId: req.params.holdId,
  });
  res.json(result);
}
