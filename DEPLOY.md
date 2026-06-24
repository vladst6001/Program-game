# Деплой на Render.com

Пошаговая инструкция по деплою Telegram Game Platform на Render.com.

## Предварительные требования

- Аккаунт на [GitHub](https://github.com)
- Аккаунт на [Render.com](https://render.com)
- Токен Telegram бота (получи у [@BotFather](https://t.me/BotFather))

---

## Шаг 1: Загрузи код на GitHub

```bash
cd telegram-game-platform
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/telegram-game-platform.git
git push -u origin main
```

## Шаг 2: Создай PostgreSQL базу данных

1. Зайди на [render.com/dashboard](https://render.com/dashboard)
2. Нажми **"New"** → **"PostgreSQL"**
3. Настройки:
   - **Name**: `game-platform-db`
   - **Database**: `gameplatform`
   - **User**: `gameuser`
   - **Plan**: Free
4. Нажми **"Create Database"**
5. Дождись создания (1-2 минуты)
6. Скопируй **Internal Database URL** — он будет вида:
   ```
   postgresql://gameuser:xxxxx@xxx.xxx.xxx.xxx:5432/gameplatform
   ```
   Это URL для `DATABASE_URL`.

> **Важно**: Internal URL доступен только между сервисами Render. Для локальной разработки используй External URL.

## Шаг 3: Создай Backend сервис

1. В дашборде нажми **"New"** → **"Web Service"**
2. Подключи GitHub репозиторий (может потребоваться авторизация GitHub)
3. Выбери репозиторий `telegram-game-platform`
4. Настройки сервиса:
   - **Name**: `game-platform-backend`
   - **Region**: Frankfurt (или ближайший к аудитории)
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: Free
5. В блоке **"Environment Variables"** добавь:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(вставь Internal URL из шага 2)* |
   | `JWT_SECRET` | *(сгенерируй случайную строку, 32+ символов)* |
   | `TELEGRAM_BOT_TOKEN` | *(твой токен от BotFather)* |
   | `TELEGRAM_WEBAPP_URL` | `https://game-platform-frontend.onrender.com` |

   > JWT_SECRET можно сгенерировать так: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

6. Нажми **"Create Web Service"**
7. Дождись деплоя (3-5 минут)
8. Скопируй URL сервиса — он будет вида:
   ```
   https://game-platform-backend-xxxx.onrender.com
   ```

## Шаг 4: Создай Frontend сервис

1. Нажми **"New"** → **"Web Service"**
2. Подключи тот же репозиторий
3. Настройки:
   - **Name**: `game-platform-frontend`
   - **Region**: Frankfurt
   - **Runtime**: Docker
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Plan**: Free
4. В **"Environment Variables"** добавь:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://game-platform-backend-xxxx.onrender.com` |
   | `VITE_WS_URL` | `wss://game-platform-backend-xxxx.onrender.com` |

   > Замени `xxxx` на реальный URL бэкенда из шага 3. Обрати внимание: `wss://` вместо `ws://` для HTTPS.

5. Нажми **"Create Web Service"**
6. Дождись деплоя
7. Скопируй URL фронтенда:
   ```
   https://game-platform-frontend-xxxx.onrender.com
   ```

## Шаг 5: Обнови URL фронтенда в бэкенде

1. Зайди в настройки backend сервиса → **"Environment"**
2. Обнови `TELEGRAM_WEBAPP_URL`:
   ```
   https://game-platform-frontend-xxxx.onrender.com
   ```
3. Нажми **"Save"** — сервис перезапустится автоматически

## Шаг 6: Создай Bot сервис

1. Нажми **"New"** → **"Background Worker"**

   > **Важно**: выбирай именно Background Worker, а не Web Service. Бот не слушает HTTP-порты, он поллит Telegram API.

2. Подключи репозиторий
3. Настройки:
   - **Name**: `game-platform-bot`
   - **Region**: Frankfurt
   - **Runtime**: Docker
   - **Dockerfile Path**: `./bot/Dockerfile`
   - **Plan**: Free
4. В **"Environment Variables"** добавь:

   | Key | Value |
   |-----|-------|
   | `TELEGRAM_BOT_TOKEN` | *(твой токен)* |
   | `BACKEND_URL` | `https://game-platform-backend-xxxx.onrender.com` |

5. Нажми **"Create Background Worker"**
6. Дождись запуска. В логах должно быть:
   ```
   Bot is running. Backend: https://game-platform-backend-xxxx.onrender.com
   ```

## Шаг 7: Настрой Telegram Mini App

### Через BotFather

1. Открой [@BotFather](https://t.me/BotFather)
2. Отправь `/mybots`
3. Выбери своего бота
4. Нажми **"Bot Settings"** → **"Menu Button"** → **"Configure menu button"**
5. Введи:
   - **Button text**: `Создать игру`
   - **URL**: `https://game-platform-frontend-xxxx.onrender.com`
6. Отправь `/newapp` для настройки WebApp
7. Выбери бота, введи URL фронтенда

### Альтернатива через API

```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Создать игру", "web_app": {"url": "https://game-platform-frontend-xxxx.onrender.com"}}}'
```

## Шаг 8: Проверь работу

1. Открой бота в Telegram
2. Нажми **"Создать игру"** в меню
3. Должен открыться WebApp с формой входа
4. Создай тестовую игру
5. Проверь, что бот отвечает на команды

---

## Частые проблемы

### Backend не стартует
- Проверь логи в Render Dashboard → Backend → Logs
- Убеди что `DATABASE_URL` правильный (Internal URL, не External)
- Проверь, что база данных создана и запущена

### Frontend не может подключиться к API
- Убеди что `VITE_API_URL` и `VITE_WS_URL` указаны правильно
- Обрати внимание: `https://` для API, `wss://` для WebSocket
- Проверь CORS — в `main.py` должно быть `allow_origins=["*"]`

### Бот не отвечает
- Проверь логи Bot сервиса
- Убеди что `TELEGRAM_BOT_TOKEN` правильный
- Убеди что `BACKEND_URL` доступен

### Бесплатный план засыпает
Render.com на бесплатном плане останавливает сервисы через 15 минут бездействия. При первом запросе сервис "просыпается" за 30-60 секунд.

Для продакшена рассмотри платный план ($7/мес за сервис).

### Ошибка "No space left on device"
Render Free план имеет лимит 512 MB RAM. Если бэкенд падает — проверь потребление памяти, возможно нужно оптимизировать или перейти на платный план.

---

## Полезные команды

```bash
# Локальный запуск
docker-compose up --build

# Остановка
docker-compose down

# Логи
docker-compose logs -f backend
docker-compose logs -f bot

# Пересборка
docker-compose up --build --force-recreate
```

## Автоматический деплой

После настройки Blueprint (`render.yaml`) Render автоматически деплоит при пуше в `main`分支. Для ручного деплоя нажми **"Manual Deploy"** → **"Deploy latest commit"** в настройках сервиса.
