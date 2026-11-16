import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import WorkSpotLogo from '../components/brand/WorkSpotLogo.jsx';
import { describeApiError, getFieldErrors } from '../utils/errors.js';

/** Страница регистрации и входа. Работает с реальным API. */
export default function AuthPage({
  user,
  authBannerMessage,
  onAuthSubmit,
  onNavigate,
  onShowToast,
}) {
  const [mode, setMode] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeRules: true,
  });

  const [errors, setErrors] = useState({});

  // Если пользователь уже вошёл — сразу в личный кабинет.
  useEffect(() => {
    if (user) onNavigate('profile');
  }, [user, onNavigate]);

  if (user) return null;

  const validate = () => {
    const nextErrors = {};

    if (mode === 'register' && !formData.name.trim()) {
      nextErrors.name = 'Введите ваше имя и фамилию';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      nextErrors.email = 'Укажите корректный адрес электронной почты';
    }
    if (mode === 'register' && !formData.phone.trim()) {
      nextErrors.phone = 'Введите контактный номер телефона';
    }
    if (!formData.password || formData.password.length < 6) {
      nextErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (mode === 'register' && !formData.agreeRules) {
      nextErrors.agreeRules = 'Необходимо принять правила коворкинга WorkSpot';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async ({ nextMode = mode, payload }) => {
    setSubmitting(true);
    setFormError('');
    try {
      await onAuthSubmit({ mode: nextMode, payload });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const description = describeApiError(error, 'Не удалось войти в аккаунт');
      setErrors(fieldErrors);
      setFormError(description.message);
      onShowToast(description);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      onShowToast({
        type: 'error',
        title: 'Проверьте форму',
        message: 'Пожалуйста, исправьте ошибки в заполнении полей.',
      });
      return;
    }

    const payload =
      mode === 'register'
        ? {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          };

    await submit({ payload });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setFormError('');
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
      errors[field] ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-[#19B5FE]'
    }`;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-sky-100 shadow-sm">
        <div className="flex justify-center mb-5">
          <WorkSpotLogo size="lg" onClick={() => onNavigate('home')} />
        </div>

        <div className="mb-6 p-3.5 rounded-2xl bg-[#F2F7FC] border border-sky-200/80 flex items-start gap-2.5 text-xs text-[#0F2942]">
          <Info className="w-4 h-4 text-[#19B5FE] shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">
            {authBannerMessage ||
              'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями'}
          </span>
        </div>

        <div className="grid grid-cols-2 bg-[#F2F7FC] p-1.5 rounded-2xl mb-6 border border-sky-100">
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#19B5FE] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Регистрация
          </button>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#19B5FE] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Вход в аккаунт
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#0F2942]">
            {mode === 'register' ? 'Регистрация в WorkSpot' : 'Вход в аккаунт WorkSpot'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            {mode === 'register'
              ? 'Заполните данные, чтобы получить персональный QR-пропуск и оформлять брони'
              : 'Введите email и пароль от вашей учётной записи WorkSpot'}
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                Имя и фамилия
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Даниил Бугаев"
                  className={inputClass('name')}
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.kz"
                className={inputClass('email')}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (701) 555-01-99"
                  className={inputClass('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
                className={`${inputClass('password')} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Повторите пароль"
                    className={inputClass('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.agreeRules}
                    onChange={(e) => setFormData({ ...formData, agreeRules: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-[#19B5FE] focus:ring-[#19B5FE]"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Я принимаю{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('rules')}
                      className="text-[#19B5FE] font-bold hover:underline cursor-pointer"
                    >
                      правила коворкинга WorkSpot
                    </button>{' '}
                    и соглашаюсь на обработку персональных данных.
                  </span>
                </label>
                {errors.agreeRules && (
                  <p className="text-xs text-red-600 mt-1">{errors.agreeRules}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-md shadow-sky-200/80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'register' ? 'Зарегистрироваться и продолжить' : 'Войти в аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
