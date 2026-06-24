import aiohttp
from aiogram import Router, F
from aiogram.types import Message
from keyboards.main import main_keyboard

router = Router(name="start")


@router.message(F.text == "⬅️ Назад")
@router.message(F.text == "/start")
async def cmd_start(message: Message, backend_url: str, telegram_user_id: int, user_info: dict | None):
    if user_info:
        await message.answer(
            f"👋 С возвращением, <b>{user_info['name']}</b>!\n\n"
            f"🎮 Игр: {user_info.get('games_count', 0)}\n"
            f"👥 Друзей: {user_info.get('friends_count', 0)}\n\n"
            f"Выбери действие:",
            reply_markup=main_keyboard(),
        )
        return

    name = message.from_user.first_name or "Игрок"
    password = f"tg_{telegram_user_id}"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{backend_url}/api/auth/register",
                json={
                    "name": name,
                    "password": password,
                },
            ) as resp:
                if resp.status in (200, 201):
                    await message.answer(
                        f"🎮 Добро пожаловать, <b>{name}</b>!\n\n"
                        f"Ты автоматически зарегистрирован.\n"
                        f"Создавай игры, добавляй спрайты и делись с друзьями!",
                        reply_markup=main_keyboard(),
                    )
                    return
    except Exception:
        pass

    await message.answer(
        f"👋 Привет, <b>{name}</b>!\n\n"
        f"Используй /start чтобы начать.",
        reply_markup=main_keyboard(),
    )


@router.message(F.text == "👤 Профиль")
async def cmd_profile(message: Message, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Ты не зарегистрирован. Используй /start")
        return

    await message.answer(
        f"👤 <b>Профиль</b>\n\n"
        f"Имя: {user_info['name']}\n"
        f"Игр: {user_info.get('games_count', 0)}\n"
        f"Друзей: {user_info.get('friends_count', 0)}\n"
        f"Зарегистрирован: {user_info.get('created_at', '?')[:10]}",
    )
