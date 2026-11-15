# WorkSpot

Полноценное веб-приложение для бронирования мест в коворкинге: React-фронтенд,
REST API на Node.js/Express, MongoDB и Redis для защиты от двойных броней.

## Что внутри

```
WorkSpot/
├── client/          # React 19 + Vite + Tailwind CSS 4
├── server/          # Express 5 + MongoDB (Mongoose) + Redis
└── workspot.tsx     # исходный дизайн-макет (сохранён как референс)
```

- **Frontend** — `/client`, инструкция в [`client/README.md`](client/README.md).
- **Backend** — `/server`, API и схема данных в [`server/README.md`](server/README.md).
- **Дизайн** — `workspot.tsx` не изменялся; его вёрстка разложена по компонентам
  и страницам в `client/src`.

## Быстрый старт

```bash
# 1. Базы данных (в этой системе — user-сервисы)
systemctl --user start mongodb redis

# 2. Бэкенд
cd server
npm install
cp .env.example .env          # при необходимости
npm run seed                  # каталог мест + демо-аккаунт + демо-брони
npm run dev                   # http://localhost:4000

# 3. Фронтенд (в новом терминале)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Демо-аккаунт:

```
email:    demo@workspot.kz
password: WorkSpot2026
```

## Как защищены брони

Оформление разбито на два шага:

1. `POST /api/bookings/hold` — Redis атомарно (`SET NX PX`) закрепляет слоты
   на 10 минут. Другие пользователи сразу видят их занятыми.
2. `POST /api/bookings` — после подтверждения создаётся бронь в MongoDB.

Дополнительно работают распределённый мьютекс Redis и уникальный multikey-индекс
MongoDB `{ space, slots }`, поэтому один и тот же слот нельзя забронировать дважды
даже при одновременных запросах.

Подробности — в `server/README.md`.

## Проверка

```bash
cd server && npm test         # 20 unit/integration тестов
cd client && npm run build    # production-сборка фронтенда
```

Сквозной сценарий (вход → карта → резерв → подтверждение → кабинет → отмена)
проверен через Vite-прокси и headless-браузер.
