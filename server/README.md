# WorkSpot API

Сервер для React-проекта WorkSpot: бронирование рабочих мест, переговорных и кабинетов.

**Стек:** Node.js 20+, Express 5, MongoDB (Mongoose), Redis (ioredis), JWT, Zod.

---

## Зачем Redis, если есть MongoDB

Два человека могут нажать «Забронировать» один и тот же стол в одну и ту же секунду. Чтобы этого не случилось, оформление разбито на два шага:

```
Шаг 1. POST /api/bookings/hold      →  стол закрепляется в Redis на 10 минут
Шаг 2. POST /api/bookings           →  создаётся бронь в MongoDB, резерв снимается
```

Пока пользователь заполняет данные, слоты помечены в Redis как занятые (`SET NX PX`).
Другие пользователи видят их занятыми на карте и получают `409 SLOT_HELD` при попытке взять тот же слот.

От двойного бронирования защищают **три независимых механизма**:

1. **Redis-резерв на каждый 30-минутный слот** — `SET key value NX PX 600000`.
   Захват атомарный: если слот уже занят, вернётся ошибка.
2. **Распределённый мьютекс Redis** — `SET NX PX` на пару «место + дата».
   Сериализует критическую секцию «проверил пересечения → записал бронь».
3. **Уникальный multikey-индекс MongoDB** — `{ space: 1, slots: 1 }` с
   `partialFilterExpression: { status: 'confirmed' }`.
   Даже если Redis недоступен и проверки не сработали, MongoDB отклонит вторую бронь
   с ошибкой `E11000`.

Резерв истекает сам: если пользователь закрыл вкладку, слоты освободятся через `HOLD_TTL_SECONDS`.

---

## Быстрый старт

### Вариант 1. Только базы в Docker (рекомендуется для разработки)

```bash
cd server
cp .env.example .env          # значения по умолчанию подходят для локалки
docker compose up -d mongo redis
npm install
npm run seed                  # каталог мест + демо-аккаунт
npm run dev                   # http://localhost:4000
```

### Вариант 2. Всё в Docker

```bash
cd server
cp .env.example .env
docker compose up --build
```

### Вариант 3. Свои MongoDB и Redis

```bash
npm install
cp .env.example .env          # укажите MONGO_URI и REDIS_URL
npm run seed
npm run dev
```

### Вариант 4. Совсем без установки баз (только посмотреть API)

```bash
npm install
npm run dev:memory
```

Поднимает MongoDB в памяти и Redis-mock, наполняет каталог демо-данными.
Данные исчезают после остановки, реальную конкурентность между процессами такой режим не проверяет —
для этого нужен настоящий Redis (варианты 1–3).

Демо-аккаунт после `npm run seed`:

```
email:    demo@workspot.kz
password: WorkSpot2026
```

Полезные команды:

| Команда | Что делает |
| --- | --- |
| `npm run dev` | запуск с автоперезагрузкой (`node --watch`) |
| `npm run dev:memory` | демо-режим: MongoDB и Redis в памяти, без установки баз |
| `npm start` | production-запуск |
| `npm run seed` | каталог мест + демо-пользователь + две демо-брони (идемпотентно) |
| `npm run seed -- --reset` | предварительно очистить брони, уведомления и каталог |
| `npm test` | unit- и интеграционные тесты (MongoDB в памяти, Redis-mock) |

---

## API

Базовый URL: `http://localhost:4000/api`.
Все ответы — JSON. Авторизация — `Authorization: Bearer <accessToken>`.

Ошибка всегда в одном формате:

```json
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "Это время уже забронировано. Обновите карту и выберите другой интервал.",
    "details": { "busyFrom": "10:00", "busyTo": "12:00" }
  }
}
```

### Авторизация

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/auth/register` | регистрация: `name`, `email`, `phone?`, `password`, `confirmPassword?` |
| `POST` | `/auth/login` | вход: `email`, `password` |
| `POST` | `/auth/refresh` | обновление сессии: `refreshToken` (ротация, старый токен инвалидируется) |
| `POST` | `/auth/logout` | отзыв refresh-токена: `refreshToken` |
| `GET` | `/auth/me` | профиль текущего пользователя |

Ответ регистрации/входа:

```json
{
  "user": { "id": "…", "name": "Даниил Бугаев", "email": "demo@workspot.kz", "phone": "+7…", "role": "Резидент WorkSpot", "roleCode": "resident" },
  "accessToken": "eyJhbGciOi…",
  "refreshToken": "9f2c…",
  "tokenType": "Bearer",
  "accessTokenExpiresAt": "2026-11-15T14:20:00.000Z",
  "refreshTokenExpiresAt": "2026-12-15T12:20:00.000Z"
}
```

Access-токен живёт 2 часа, refresh-токен — 30 дней. В Redis хранится только SHA-256 refresh-токена,
поэтому дамп Redis не позволяет войти в аккаунт.

### Места и доступность

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/spaces` | список мест со статусами на интервал |
| `GET` | `/spaces/:slug` | одно место |
| `GET` | `/spaces/:slug/availability` | доступность одного места (слоты) |

Query-параметры: `date=YYYY-MM-DD`, `startTime=HH:mm`, `endTime=HH:mm`, `type=Рабочий стол|Переговорная|Кабинет|Все типы`.

* без параметров — ближайший час от текущего времени;
* только `date` — весь день `00:00–23:30`;
* `date` + время — указанное окно (время кратно 30 минутам).

`Authorization` не обязателен, но если передан — в ответе будет информация о собственном резерве пользователя.

```json
{
  "window": { "date": "2026-11-20", "startTime": "10:00", "endTime": "12:00", "slots": ["10:00", "10:30", "11:00", "11:30"] },
  "spaces": [
    {
      "id": "desk-12",
      "shortLabel": "Стол 12",
      "name": "Стол №12 (Open Space)",
      "type": "Рабочий стол",
      "zone": "Open Space",
      "price": 1800,
      "pricePerHour": 1800,
      "capacity": "1 место",
      "amenities": ["Быстрый Wi-Fi", "Розетки 220В", "Чай/кофе включены"],
      "description": "…",
      "status": "available",
      "available": true,
      "heldByMe": false,
      "holdExpiresAt": null,
      "busySlots": [],
      "heldSlots": [],
      "myHeldSlots": []
    }
  ]
}
```

Статусы: `available`, `booked` (подтверждённая бронь), `held` (резерв другого пользователя),
`held_by_you` (ваш резерв). Для карты из макета `booked`/`held` можно показывать как `occupied` —
см. `toFrontendSpace()` в `examples/workspot-api.js`.

### Бронирование

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/bookings/hold` | шаг 1: резерв в Redis на 10 минут |
| `GET` | `/bookings/hold/:holdId` | информация о резерве + `expiresAt` для таймера |
| `DELETE` | `/bookings/hold/:holdId` | досрочно освободить резерв |
| `POST` | `/bookings` | шаг 2: подтвердить резерв, создать бронь |
| `GET` | `/bookings?scope=active\|history\|all` | мои брони |
| `DELETE` | `/bookings/:code` | отменить бронь |

Пример полного цикла:

```bash
# 1. Вход
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@workspot.kz","password":"WorkSpot2026"}' | jq -r .accessToken)

# 2. Резерв (Redis)
HOLD=$(curl -s -X POST http://localhost:4000/api/bookings/hold \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"spaceId":"desk-13","date":"2026-11-20","startTime":"10:00","endTime":"12:00"}')
echo "$HOLD" | jq
# { "holdId": "…", "expiresAt": "…", "totalPrice": 3600, "slots": ["10:00", …] }

# 3. Подтверждение (MongoDB)
curl -s -X POST http://localhost:4000/api/bookings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"holdId\":\"$(echo "$HOLD" | jq -r .holdId)\"}" | jq
```

Ответ шага 2:

```json
{
  "booking": {
    "id": "BK-482913",
    "spotId": "desk-13",
    "spotName": "Стол №13 (Open Space)",
    "zone": "Open Space",
    "date": "2026-11-20",
    "startTime": "10:00",
    "endTime": "12:00",
    "hours": 2,
    "totalPrice": 3600,
    "pricePerHour": 1800,
    "status": "confirmed",
    "canCancel": true,
    "createdAt": "2026-11-15T12:30:00.000Z"
  }
}
```

Коды ошибок, важные для UI:

| HTTP | `code` | Когда |
| --- | --- | --- |
| `409` | `SLOT_HELD` | слот уже держит другой пользователь (Redis) |
| `409` | `SLOT_TAKEN` | слот уже забронирован (MongoDB) |
| `409` | `SPACE_BUSY` | место прямо сейчас оформляют, мьютекс не дождался |
| `409` | `USER_TIME_CONFLICT` | у пользователя уже есть бронь на это время |
| `410` | `HOLD_EXPIRED` | резерв истёк — нужно повторить шаг 1 |
| `403` | `HOLD_FOREIGN` | чужой резерв |
| `422` | `VALIDATION_ERROR` | некорректные поля (массив `details`) |

Цена **всегда считается на сервере** по `Space.pricePerHour`, данные клиента не используются.

### Уведомления

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/notifications` | последние 50 уведомлений |
| `POST` | `/notifications/read-all` | отметить все прочитанными |
| `POST` | `/notifications/:id/read` | отметить одно |

Формат совпадает с `INITIAL_NOTIFICATIONS` из макета: `id`, `title`, `message`, `time`, `unread`, `type`, `createdAt`.

### Прочее

`GET /healthz` → `{ "status": "ok", "mongo": "up", "redis": "up", "uptime": 42 }` (используется Docker healthcheck).

---

## Интеграция с React-макетом

Готовый клиент — `examples/workspot-api.js`. Он сам хранит токены, обновляет access-токен по 401
и инкапсулирует все запросы.

```js
import { createWorkSpotApi, toFrontendSpace } from './workspot-api';

const api = createWorkSpotApi({ baseUrl: 'http://localhost:4000/api' });

// 1. Авторизация
async function handleAuthSuccess(formData) {
  const { user } = await api.login({ email: formData.email, password: formData.password });
  setUser(user);
}

// 2. Карта мест — вместо INITIAL_SPACES
async function loadSpaces(filter) {
  const { spaces } = await api.getSpaces({
    date: filter.date,
    startTime: filter.startTime,
    endTime: filter.endTime,
    type: filter.type,
  });
  setSpaces(spaces.map(toFrontendSpace));
}

// 3. Бронирование — вместо handleCreateBooking
async function handleCreateBooking(spot, filter, hours, totalPrice) {
  try {
    // Шаг 1: резерв на 10 минут (Redis)
    const hold = await api.hold({
      spaceId: spot.id,
      date: filter.date,
      startTime: filter.startTime,
      endTime: filter.endTime,
    });

    setHold({ id: hold.holdId, expiresAt: hold.expiresAt }); // показать таймер

    // Шаг 2: подтверждение (MongoDB)
    const { booking } = await api.confirm(hold.holdId);
    setBookings((prev) => [booking, ...prev]);
    addToast({ type: 'success', title: 'Место забронировано', message: `Бронь ${booking.id}` });
    await loadSpaces(filter);
  } catch (error) {
    if (error.code === 'HOLD_EXPIRED') {
      addToast({ type: 'error', title: 'Время истекло', message: 'Выберите место заново' });
    } else {
      addToast({ type: 'error', title: 'Не удалось забронировать', message: error.message });
    }
  }
}

// 4. Отмена
async function handleCancelBooking(bookingId) {
  await api.cancelBooking(bookingId);
  setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
  await loadSpaces(bookingFilter);
}
```

Рекомендуемый UX: после `hold` показать модальное окно с обратным отсчётом до `expiresAt`
(обычно 10 минут). Если пользователь закрыл окно — вызвать `api.releaseHold(holdId)`,
чтобы не держать стол. По истечении таймера — предложить выбрать место заново.

Для карты доступности удобно периодически (раз в 15–30 секунд) обновлять `getSpaces`,
чтобы видеть чужие резервы и новые брони. Для продакшена можно заменить polling на WebSocket.

---

## Переменные окружения

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `PORT` | `4000` | порт HTTP-сервера |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/workspot` | строка подключения MongoDB |
| `REDIS_URL` | `redis://127.0.0.1:6379` | строка подключения Redis |
| `JWT_SECRET` | dev-секрет | **обязательно заменить в production** |
| `JWT_ACCESS_TTL` | `2h` | время жизни access-токена |
| `REFRESH_TTL_DAYS` | `30` | время жизни refresh-токена |
| `HOLD_TTL_SECONDS` | `600` | сколько секунд стол держится за пользователем |
| `MAX_BOOKING_HOURS` | `12` | максимальная длительность брони |
| `BOOKING_HORIZON_DAYS` | `60` | на сколько дней вперёд можно бронировать |
| `BUSINESS_TIMEZONE` | `Asia/Almaty` | часовой пояс коворкинга для проверки «не в прошлом» |
| `CORS_ORIGINS` | localhost-адреса | список origin через запятую |
| `TRUST_PROXY` | `1` | число прокси перед приложением (0 — отключить) |

---

## Структура

```
server/
├── src/
│   ├── index.js                 # запуск, graceful shutdown
│   ├── app.js                   # сборка Express-приложения
│   ├── config/                  # env, MongoDB, Redis
│   ├── models/                  # User, Space, Booking, Notification
│   ├── services/
│   │   ├── hold.service.js      # Redis: резервы + мьютекс
│   │   ├── booking.service.js   # бизнес-логика бронирования
│   │   ├── availability.service.js
│   │   ├── token.service.js     # JWT + refresh-токены в Redis
│   │   ├── auth.service.js
│   │   └── notification.service.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/              # auth, validation, errors, rate limit
│   ├── validation/              # zod-схемы
│   ├── utils/                   # время, DTO, ApiError, логгер
│   └── seed/                    # каталог мест и демо-данные
├── examples/workspot-api.js     # клиент для React
├── scripts/dev-memory.js        # демо-запуск без MongoDB/Redis
├── test/                        # node:test + supertest
├── docker-compose.yml
└── Dockerfile
```

---

## Тесты

```bash
npm test
```

20 тестов: расчёт слотов и времени, регистрация/вход/refresh, резерв и подтверждение,
конкурентная борьба двух пользователей за один слот, конфликт броней одного пользователя,
отмена и освобождение слотов, истёкший резерв, чужой резерв,
а также проверка, что уникальный индекс MongoDB не пропускает дубль в обход Redis.

Интеграционные тесты поднимают MongoDB в памяти (`mongodb-memory-server`) и Redis-mock.
Один раз при первом запуске mongodb-memory-server скачает бинарник MongoDB (~120 МБ).

---

## Production-чеклист

- [ ] Задать длинный `JWT_SECRET` (`openssl rand -hex 48`) и `NODE_ENV=production`.
- [ ] Поднять MongoDB как replica set (нужен для транзакций, если будете расширять логику).
- [ ] Включить аутентификацию MongoDB и Redis (`requirepass`), не публиковать порты наружу.
- [ ] Включить AOF в Redis (`--appendonly yes`) — чтобы refresh-токены и резервы переживали рестарт.
- [ ] Поставить сервер за HTTPS-прокси (Nginx/Traefik) и настроить `CORS_ORIGINS`.
- [ ] Вынести `express-rate-limit` в общий store на Redis, если экземпляров API несколько.
- [ ] Настроить резервное копирование MongoDB (`mongodump`) и мониторинг `/healthz`.

### Ограничения текущей версии

Не реализованы платежи, генерация QR-пропусков, чат поддержки и админ-панель — только модель
бронирования, авторизация, каталог мест, уведомления и защита от двойных броней.
