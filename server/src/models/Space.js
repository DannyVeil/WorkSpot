import mongoose from 'mongoose';

export const SPACE_TYPES = ['Рабочий стол', 'Переговорная', 'Кабинет'];

const spaceSchema = new mongoose.Schema(
  {
    // Публичный идентификатор, совпадает с id в React-макете: 'desk-14', 'meeting-1'
    slug: { type: String, required: true, unique: true, trim: true },
    shortLabel: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: SPACE_TYPES, required: true, index: true },
    zone: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    capacity: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret.slug;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Space = mongoose.model('Space', spaceSchema);
