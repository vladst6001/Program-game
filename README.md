# Telegram Game Platform

Платформа для создания игр в Telegram Mini App с визуальным редактором, мультиплеером и обучением.

## Что это?

Позволяет пользователям создавать 2D/3D игры прямо в Telegram без навыков программирования. Блоковый редактор (Blockly), 3D-сцены (Three.js), совместная игра по сети, публикация одной кнопкой.

## Быстрый старт

### 1. Получи токен бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Придумай имя и username бота
4. Скопируй токен

### 2. Клонируй проект

```bash
git clone https://github.com/YOUR_USERNAME/telegram-game-platform.git
cd telegram-game-platform
```

### 3. Настрой окружение

```bash
cp .env.example .env
```

Отредактируй `.env` — вставь токен бота и пароль БД:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
DB_PASSWORD=your_password_here
JWT_SECRET=any-random-string-at-least-32-chars
```

### 4. Запусти локально

```bash
docker-compose up --build
```

После запуска:

- Фронтенд: [http://localhost:3000](http://localhost:3000)
- Бэкенд API: [http://localhost:8000](http://localhost:8000)
- Swagger доки: [http://localhost:8000/docs](http://localhost:8000/docs)
- PostgreSQL: localhost:5432

### 5. Настрой Mini App в Telegram

1. Открой [@BotFather](https://t.me/BotFather)
2. Отправь `/newapp`
3. Выбери своего бота
4. Вставь URL фронтенда: `http://localhost:3000`
5. Загрузи иконку и описание

## Структура проекта

```
telegram-game-platform/
  backend/          # FastAPI сервер
    app/
      main.py       # Точка входа FastAPI
      models.py     # SQLAlchemy модели
      database.py   # Подключение к БД
      routers/      # API эндпоинты
        auth.py     # Авторизация
        games.py    # CRUD игр
        sprites.py  # Спрайты и ассеты
        sessions.py # Мультиплеер сессии
        ws.py       # WebSocket
        friends.py  # Друзья
        messages.py # Сообщения
        gallery.py  # Галерея игр
        tutorials.py # Обучение
    Dockerfile
  bot/              # Telegram бот (aiogram)
    bot.py          # Точка входа бота
    handlers/       # Обработчики команд
    middleware.py    # Middleware
    Dockerfile
  frontend/         # React SPA
    src/
    Dockerfile
    nginx.conf
  docker-compose.yml
  render.yaml       # Render.com Blueprint
```

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Приветствие и главное меню |
| `/new_game` | Создать новую игру |
| `/my_games` | Мои игры |
| `/edit` | Редактировать игру |
| `/delete` | Удалить игру |
| `/publish` | Опубликовать игру |
| `/code` | Открыть блоковый редактор кода |
| `/friends` | Управление друзьями |
| `/invite` | Пригласить друга |
| `/tutorial` | Обучающие уроки |

## Технологии

### Backend
- **FastAPI** — асинхронный REST API
- **SQLAlchemy + asyncpg** — ORM и подключение к PostgreSQL
- **Alembic** — миграции БД
- **PyJWT** — JWT-авторизация
- **WebSockets** — реалтайм обновления

### Frontend
- **React 18** — UI фреймворк
- **Three.js + React Three Fiber** — 3D рендеринг
- **Blockly** — блочный редактор логики
- **Tailwind CSS** — стили
- **Zustand** — управление состоянием
- **Telegram Mini App SDK** — интеграция с Telegram

### Bot
- **aiogram 3.x** — Telegram Bot API

### Инфраструктура
- **Docker** — контейнеризация
- **PostgreSQL 16** — база данных
- **Nginx** — раздача фронтенда + проксирование API

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | URL подключения к PostgreSQL | `postgresql+asyncpg://gameuser:pass@localhost:5432/gameplatform` |
| `DB_PASSWORD` | Пароль PostgreSQL | `mypassword` |
| `JWT_SECRET` | Секрет для JWT токенов | `random-string-32-chars` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `123456:ABC-DEF` |
| `TELEGRAM_WEBAPP_URL` | URL фронтенда для Telegram | `https://your-domain.com` |
| `BACKEND_URL` | URL бэкенда | `http://localhost:8000` |
| `VITE_API_URL` | API URL для фронтенда | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL для фронтенда | `ws://localhost:8000` |

## Деплой

См. [DEPLOY.md](DEPLOY.md) для пошаговой инструкции по деплою на Render.com.

Кратко:

```bash
docker-compose up --build -d    # локально
# или
render.yaml                     # на Render.com (Blueprint)
```

## Лицензия

MIT
