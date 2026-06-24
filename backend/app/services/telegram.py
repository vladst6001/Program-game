from typing import Any

import aiohttp

from app.config import settings


class TelegramService:
    def __init__(self):
        self.base_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"

    async def send_message(self, chat_id: int, text: str, parse_mode: str = "HTML") -> dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/sendMessage"
            payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
            async with session.post(url, json=payload) as resp:
                return await resp.json()

    async def send_webapp_button(self, chat_id: int, text: str, url: str) -> dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            api_url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": text,
                "reply_markup": {
                    "inline_keyboard": [[{"text": "Open Game", "web_app": {"url": url}}]]
                },
            }
            async with session.post(api_url, json=payload) as resp:
                return await resp.json()

    async def send_photo(self, chat_id: int, photo: str, caption: str = "") -> dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/sendPhoto"
            payload: dict[str, Any] = {"chat_id": chat_id, "photo": photo}
            if caption:
                payload["caption"] = caption
            async with session.post(url, json=payload) as resp:
                return await resp.json()

    async def notify_game_published(self, telegram_id: int, game_name: str, game_url: str) -> dict[str, Any]:
        text = f"🎮 Your game <b>{game_name}</b> is now published!\n\nShare it with your friends:"
        return await self.send_webapp_button(telegram_id, text, game_url)

    async def notify_friend_request(self, telegram_id: int, from_name: str) -> dict[str, Any]:
        text = f"👋 {from_name} sent you a friend request!"
        return await self.send_message(telegram_id, text)

    async def notify_new_message(self, telegram_id: int, from_name: str) -> dict[str, Any]:
        text = f"💬 New message from {from_name}"
        return await self.send_message(telegram_id, text)


telegram_service = TelegramService()
