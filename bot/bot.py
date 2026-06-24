import asyncio
import logging
import os
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

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


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status": "ok"}')

    def log_message(self, format, *args):
        pass


def start_http_server():
    server = HTTPServer(("0.0.0.0", 8080), HealthHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info("Health server started on port 8080")


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
