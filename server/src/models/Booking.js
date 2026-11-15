import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['confirmed', 'cancelled', 'completed'];

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },

    // Снимок данных места: бронь должна читаться даже если место переименуют/удалят
    spaceSlug: { type: String, required: true },
    spaceName: { type: String, required: true },
    zone: { type: String, required: true },

    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },

    hours: { type: Number, required: true, min: 0 },
    pricePerHour: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    /*
     * Ключи 30-минутных слотов: ['2026-11-16T09:00', '2026-11-16T09:30'].
     * Уникальный multikey-индекс ниже — последняя линия обороны от двойного бронирования:
     * даже если Redis и проверка пересечений дадут сбой, MongoDB отклонит вторую бронь (E11000).
     */
    slots: { type: [String], required: true, validate: (v) => v.length > 0 },

    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed', index: true },
    cancelledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

bookingSchema.index(
  { space: 1, slots: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
    name: 'uniq_confirmed_space_slot',
  },
);

bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ user: 1, date: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
