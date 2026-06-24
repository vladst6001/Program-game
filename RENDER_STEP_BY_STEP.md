# Render.com — Точная инструкция поле за полем

---

## ШАГ 1: PostgreSQL база данных

1. Открой https://render.com/dashboard
2. Наверху нажми синюю кнопку **"New +"**
3. Выбери **"PostgreSQL"**

Что ты увидишь и что ставить:

| Поле на экране | Что выбрать/написать |
|---|---|
| **Name** | Напиши: `game-platform-db` |
| **Database** | Напиши: `gameplatform` |
| **User** | Напиши: `gameuser` |
| **PostgreSQL Version** | Выбери: `16` |
| **Region** | Выбери ближайший: `Frankfurt (EU)` или `Oregon (US)` |
| **Plan** | Выбери: **Free** |
| **IP Requests** | Оставь как есть |
| **Data Persistence** | Оставь как есть |

Внизу нажми **"Create Database"**.

Жди 1-2 минуты. Когда статус станет **"Available"** — нажми на название базы → вкладка **"Connections"** → скопируй **"Internal Database URL"**. Сохрани где-нибудь.

---

## ШАГ 2: Backend (FastAPI сервер)

1. Опять наверху **"New +"**
2. Выбери **"Web Service"**
3. Увидишь экран "Build and deploy from a Git provider" — нажми **"Build a Docker-based web service"**
4. Выбери GitHub → разреши доступ → выбери репозиторий `telegram-game-platform`

Что ты увидишь и что ставить:

| Поле на экране | Что выбрать/написать |
|---|---|
| **Name** | `game-platform-backend` |
| **Region** | Тот же регион что и база |
| **Branch** | `main` |
| **Root Directory** | Оставь пустым |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Docker Context** | Оставь пустым |
| **Port** | `8000` |
| **Plan** | **Free** |

Далее жми **"Advanced"** или прокрути вниз до **"Environment Variables"**.

Нажми **"+ Add Environment Variable"** и добавь по одной:

**Первая переменная:**
- Key: `DATABASE_URL`
- Value: вставь Internal URL из шага 1 (тот что скопировал)

**Вторая переменная:**
- Key: `JWT_SECRET`
- Value: напиши любую длинную строку, например: `super-secret-key-2026-game-platform`

**Третья переменная:**
- Key: `TELEGRAM_BOT_TOKEN`
- Value: пока напиши `placeholder` (потом заменишь на настоящий)

**Четвёртая переменная:**
- Key: `TELEGRAM_WEBAPP_URL`
- Value: пока напиши `https://game-platform-frontend.onrender.com`

**Галочки внизу:**
- ✅ Auto Deploy — **включи** (ставь галочку)
- Остальные галочки **не трогай**

Нажми **"Create Web Service"**.

Жди 3-5 минут. Когда deploiment станет **"Live"** — скопируй URL сервиса (напр. `https://game-platform-backend-abc123.onrender.com`).

---

## ШАГ 3: Frontend (React приложение)

1. **"New +"** → **"Web Service"**
2. Снова **"Build a Docker-based web service"** → выбери тот же репозиторий

| Поле | Значение |
|---|---|
| **Name** | `game-platform-frontend` |
| **Region** | Тот же регион |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./frontend/Dockerfile` |
| **Port** | `80` |
| **Plan** | **Free** |

Environment Variables:
- Key: `VITE_API_URL` → Value: `https://game-platform-backend-ТВОЙ_ID.onrender.com`
- Key: `VITE_WS_URL` → Value: `wss://game-platform-backend-ТВОЙ_ID.onrender.com`

> Замени `ТВОЙ_ID` на реальный ID из шага 2. Обрати внимание: `wss://` не `ws://`!

✅ Auto Deploy — **включи**

**"Create Web Service"** → жди → скопируй URL фронтенда.

---

## ШАГ 4: Telegram Bot

1. **"New +"** → **"Background Worker"** ← ВАЖНО: именно Background Worker, НЕ Web Service!

| Поле | Значение |
|---|---|
| **Name** | `game-platform-bot` |
| **Region** | Тот же регион |
| **Branch** | `main` |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./bot/Dockerfile` |
| **Plan** | **Free** |

Environment Variables:
- Key: `TELEGRAM_BOT_TOKEN` → Value: твой токен от @BotFather
- Key: `BACKEND_URL` → Value: `https://game-platform-backend-ТВОЙ_ID.onrender.com`

✅ Auto Deploy — **включи**

**"Create Background Worker"**.

---

## ШАГ 5: Вернись в Backend и обнови URL

1. Зайди в Backend сервис → вкладка **"Environment"**
2. Найди `TELEGRAM_WEBAPP_URL`
3. Замени на реальный URL фронтенда из шага 3
4. Нажми **"Save"** → бэкенд перезапустится

---

## Итого у тебя будет 4 сервиса на Render:

1. `game-platform-db` — PostgreSQL
2. `game-platform-backend` — FastAPI
3. `game-platform-frontend` — React
4. `game-platform-bot` — Telegram бот
