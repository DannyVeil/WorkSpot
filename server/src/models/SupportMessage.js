import mongoose from 'mongoose';

/**
 * Сообщение чата техподдержки.
 * direction='user' — написал клиент на сайте, direction='admin' — ответил оператор
 * (через Telegram, Reply на пересланное сообщение).
 */
const supportMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    direction: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },

    // Снимок автора на момент отправки: имя/email для сообщений оператору.
    authorName: { type: String, default: '' },
    authorEmail: { type: String, default: '' },

    // id сообщения в чате Telegram-бота. По нему Reply оператора находит адресата.
    // Уникальный индекс защищает от повторной обработки одного и того же апдейта
    // после перезапуска сервера.
    telegramMessageId: { type: Number, unique: true, sparse: true },
    telegramChatId: { type: String, default: '' },
    delivered: { type: Boolean, default: false },
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

supportMessageSchema.index({ user: 1, createdAt: 1 });

export const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
