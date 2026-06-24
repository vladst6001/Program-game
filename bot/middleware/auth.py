from typing import Any, Awaitable, Callable, Dict

import aiohttp
from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery


class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Message, Dict[str, Any]], Awaitable[Any]],
        event: Message | CallbackQuery,
        data: Dict[str, Any],
    ) -> Any:
        telegram_user_id = event.from_user.id if event.from_user else None
        data["telegram_user_id"] = telegram_user_id

        backend_url = data.get("backend_url", "http://localhost:8000")

        if telegram_user_id is not None:
            data["user_info"] = await self._fetch_user_info(
                backend_url, telegram_user_id
            )

        return await handler(event, data)

    async def _fetch_user_info(
        self, backend_url: str, telegram_user_id: int
    ) -> dict | None:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{backend_url}/api/auth/me",
                    headers={"X-Telegram-User-ID": str(telegram_user_id)},
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception:
            pass
        return None
