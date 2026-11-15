import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { issueTokens, revokeRefreshToken, rotateRefreshToken } from './token.service.js';

const BCRYPT_ROUNDS = 12;

const ROLE_LABELS = {
  resident: 'Резидент WorkSpot',
  admin: 'Администратор WorkSpot',
};

export function toUserDTO(user) {
  const roleCode = user.role ?? 'resident';

  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    // role — готовая подпись для интерфейса, roleCode — машинное значение
    role: ROLE_LABELS[roleCode] ?? roleCode,
    roleCode,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, phone, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw ApiError.conflict(
      'Пользователь с таким email уже зарегистрирован. Попробуйте войти.',
      'EMAIL_TAKEN',
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() ?? '',
      passwordHash,
      role: 'resident',
    });
  } catch (error) {
    // Гонка двух одновременных регистраций: уникальный индекс email
    if (error?.code === 11000) {
      throw ApiError.conflict(
        'Пользователь с таким email уже зарегистрирован. Попробуйте войти.',
        'EMAIL_TAKEN',
      );
    }
    throw error;
  }

  return { user: toUserDTO(user), tokens: await issueTokens(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  // Одинаковый текст ошибки, чтобы нельзя было перебором узнать, есть ли такой email
  const invalidCredentials = ApiError.unauthorized('Неверный email или пароль', 'INVALID_CREDENTIALS');
  if (!user) throw invalidCredentials;

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials;

  return { user: toUserDTO(user), tokens: await issueTokens(user) };
}

export async function refreshSession(refreshToken) {
  const { user, tokens } = await rotateRefreshToken(refreshToken);
  return { user: toUserDTO(user), tokens };
}

export async function logoutUser(refreshToken) {
  await revokeRefreshToken(refreshToken);
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Пользователь не найден', 'USER_NOT_FOUND');
  return toUserDTO(user);
}
