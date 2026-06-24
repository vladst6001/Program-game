import asyncio
import logging
import os
import threading

from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties

from handlers import (
    code_router,
    friends_router,
    games_router,
    messages_router,
    start_router,
    tutorials_router,
)
from middleware import AuthMiddleware

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def health_handler(request):
    return web.json_response({"status": "ok"})


def start_http_server():
    app = web.Application()
    app.router.add_get("/", health_handler)
    app.router.add_get("/health", health_handler)
    threading.Thread(target=lambda: asyncio.run(web.run_app(app, port=8080)), daemon=True).start()


async def main():
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set")
        return

    start_http_server()

    bot = Bot(token=TELEGRAM_BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
    dp = Dispatcher()

    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())

    dp["backend_url"] = BACKEND_URL
    dp["bot"] = bot

    dp.include_router(start_router)
    dp.include_router(games_router)
    dp.include_router(code_router)
    dp.include_router(friends_router)
    dp.include_router(messages_router)
    dp.include_router(tutorials_router)

    logger.info("Bot is running. Backend: %s", BACKEND_URL)

    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
