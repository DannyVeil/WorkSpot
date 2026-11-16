import { z } from 'zod';

const email = z
  .string()
  .trim()
  .max(160)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Укажите корректный email');

const phone = z.string().trim().max(30).optional().default('');

const password = z
  .string()
  .min(6, 'Пароль должен содержать минимум 6 символов')
  .max(128, 'Пароль слишком длинный');

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD');
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Формат времени: HH:mm');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Введите имя и фамилию').max(80),
    email,
    phone,
    password,
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.confirmPassword || data.confirmPassword === data.password, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль').max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Некорректный refresh-токен').max(256),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).max(256).optional(),
});

export const holdSchema = z.object({
  spaceId: z.string().trim().min(1, 'Укажите рабочее место'),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
});

export const confirmSchema = z.object({
  holdId: z.string().trim().min(10, 'Некорректный идентификатор резерва').max(100),
});

export const availabilityQuerySchema = z.object({
  date: z.string().trim().optional(),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  type: z.string().trim().optional(),
});

export const bookingListQuerySchema = z.object({
  scope: z.enum(['active', 'history', 'all']).optional().default('all'),
});

export const bookingCodeParamsSchema = z.object({
  code: z.string().trim().min(3).max(40),
});

export const holdParamsSchema = z.object({
  holdId: z.string().trim().min(10).max(100),
});

export const notificationParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Некорректный идентификатор уведомления'),
});

export const spaceSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(60),
});

export const supportMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Введите сообщение')
    .max(2000, 'Сообщение слишком длинное — до 2000 символов'),
});
