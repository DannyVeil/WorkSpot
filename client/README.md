# WorkSpot — фронтенд

React 19 + Vite 8 + Tailwind CSS 4. Интерфейс коворкинга: интерактивная карта,
двухшаговое бронирование через Redis-резерв, личный кабинет, уведомления и чат поддержки.

Дизайн полностью перенесён из исходного макета `../workspot.tsx` и разложен по
компонентам, страницам и хукам.

## Запуск

```bash
# 1. Бэкенд и базы (в отдельных терминалах / как user-сервисы)
systemctl --user start mongodb redis
cd ../server && npm run seed && npm run dev     # http://localhost:4000

# 2. Фронтенд
cd ../client
npm install
npm run dev                                     # http://localhost:5173
```

Vite проксирует `/api` и `/healthz` на `http://127.0.0.1:4000`, поэтому CORS
в разработке не нужен.

Демо-аккаунт после `npm run seed`:

```
demo@workspot.kz / WorkSpot2026
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер Vite с HMR |
| `npm run build` | production-сборка в `dist/` |
| `npm run preview` | локальный просмотр production-сборки |

## Переменные окружения

Скопируйте `.env.example` в `.env` при необходимости:

```env
# По умолчанию /api — используется прокси Vite
VITE_API_URL=/api

# Для отдельного деплоя:
# VITE_API_URL=https://api.workspot.kz/api
```

## Структура

```
src/
├── api/
│   └── client.js                 # singleton API-клиента, refresh-токены, toFrontendSpace
├── components/
│   ├── brand/
│   │   ├── WorkSpotLogo.jsx      # фирменный SVG-логотип
│   │   └── WorkspaceIllustration.jsx
│   ├── layout/
│   │   ├── Header.jsx            # навигация, уведомления, вход/профиль, мобильное меню
│   │   ├── NotificationsDropdown.jsx
│   │   ├── Footer.jsx
│   │   ├── SupportWidget.jsx     # плавающая кнопка «Онлайн 24/7»
│   │   └── Toasts.jsx
│   ├── booking/
│   │   ├── FloorPlanMap.jsx      # интерактивная карта зала
│   │   ├── BookingFilters.jsx    # дата, время (шаг 30 мин), тип места
│   │   ├── BookingDetails.jsx    # карточка выбранного места и итог
│   │   └── HoldModal.jsx         # таймер Redis-резерва и подтверждение
│   └── account/
│       ├── ProfileCard.jsx       # профиль, QR-пропуск, статистика
│       ├── BookingsList.jsx      # активные брони и история, отмена
│       └── SupportChat.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── BookingPage.jsx
│   ├── RulesPage.jsx
│   ├── AccountPage.jsx
│   └── AuthPage.jsx
├── hooks/
│   ├── useAuth.js                # вход/регистрация/выход, восстановление сессии
│   ├── useSpaces.js              # debounce, защита от гонок, polling 30 сек
│   ├── useBookings.js
│   ├── useHold.js                # hold → countdown → confirm/release
│   ├── useNotifications.js
│   ├── useSupportChat.js
│   └── useToasts.js
├── data/
│   ├── catalog.js                # fallback-каталог, тарифы, правила, FAQ
│   └── chat.js                   # приветствие и быстрые вопросы поддержки
├── constants/
│   ├── config.js                 # API URL и интервалы опроса
│   └── navigation.js
├── utils/
│   ├── format.js                 # цены, даты, часы, инициалы
│   └── errors.js                 # коды ошибок API → русские сообщения
├── App.jsx                       # маршрутизация и связка всех сценариев
├── main.jsx
└── index.css
```

## Как работает бронирование

1. Пользователь выбирает зелёное место на карте и нажимает «Забронировать сейчас».
2. `POST /api/bookings/hold` — Redis атомарно закрепляет 30-минутные слоты на 10 минут.
3. Открывается модальное окно с обратным отсчётом (`expiresAt`).
4. «Подтвердить бронь» → `POST /api/bookings` создаёт документ в MongoDB.
5. «Освободить место» / закрытие окна → `DELETE /api/bookings/hold/:id`.
6. Если резерв истёк или слот заняли — UI показывает понятную ошибку
   (`HOLD_EXPIRED`, `SLOT_HELD`, `SLOT_TAKEN`, `USER_TIME_CONFLICT`) и обновляет карту.

Карта доступности обновляется каждые 30 секунд и при возврате на вкладку,
поэтому чужие резервы видны почти сразу. Если API недоступен, показывается
каталог из макета с предупреждением.

## Используемые эндпоинты

| Метод | Путь | Назначение |
| --- | --- | --- |
| `POST` | `/api/auth/register` | регистрация |
| `POST` | `/api/auth/login` | вход |
| `POST` | `/api/auth/refresh` | обновление сессии |
| `GET` | `/api/auth/me` | профиль |
| `GET` | `/api/spaces` | карта доступности на интервал |
| `POST` | `/api/bookings/hold` | шаг 1: Redis-резерв |
| `POST` | `/api/bookings` | шаг 2: подтверждение |
| `GET` | `/api/bookings` | мои брони |
| `DELETE` | `/api/bookings/:code` | отмена |
| `GET` | `/api/notifications` | уведомления |
| `POST` | `/api/notifications/read-all` | отметить прочитанными |
| `GET` | `/api/pass` | персональный QR-пропуск (подписанный ключ) |

Полный контракт — в `../server/README.md`.

## Особенности реализации

- Токены хранятся в `localStorage` (`workspot.auth`), access-токен обновляется
  автоматически при `401` (кроме самих auth-эндпоинтов).
- Все ошибки API приводятся к русским заголовкам и подсказкам в `utils/errors.js`.
- Время бронирования выбирается из списка с шагом 30 минут — сервер не принимает
  произвольные минуты.
- `useSpaces` отбрасывает устаревшие ответы, чтобы быстрая смена фильтров не
  перезаписывала карту старыми данными.
- Чат поддержки работает через API: сообщение уходит оператору в Telegram-бот,
  ответ оператора (Reply на пересланное сообщение) появляется в чате на сайте
  в течение 5 секунд — `useSupportChat` опрашивает `GET /support/messages`.
- Пока оператор не ответил, отправка заблокирована: поле ввода и быстрые вопросы
  неактивны, показывается обратный отсчёт. Через 5 минут ожидания отправка
  снова доступна, а ответ оператора открывает чат сразу.
- QR-пропуск в профиле — настоящий: `PassQr` получает с `GET /pass` подписанный
  ключ `WSP1.<userId>.<expiresAt>.<hmac>` и рисует его через `qrcode.react`
  (SVG 96×96). Ключ обновляется каждые 30 секунд, пока блок открыт; рядом видны
  короткий ключ и обратный отсчёт. Такой QR читается любым сканером и содержит
  именно серверный ключ, а не картинку-заглушку.
