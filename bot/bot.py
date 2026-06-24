import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

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


async def main():
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set")
        return

    bot = Bot(token=TELEGRAM_BOT_TOKEN, parse_mode=ParseMode.HTML)
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
