import aiohttp
from aiogram import Router, F
from aiogram.types import Message
from keyboards.main import main_keyboard, play_keyboard

router = Router(name="start")


@router.message(F.text == "⬅️ Назад")
@router.message(F.text == "🏠 Меню")
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

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{backend_url}/api/auth/auto-register",
                json={"name": name, "telegram_id": telegram_user_id},
            ) as resp:
                if resp.status in (200, 201):
                    await message.answer(
                        f"🎮 Добро пожаловать, <b>{name}</b>!\n\n"
                        f"Создавай и играй в 3D игры!",
                        reply_markup=main_keyboard(),
                    )
                    return
    except Exception:
        pass

    await message.answer(
        f"👋 Привет, <b>{name}</b>!\n\nНажми /start чтобы начать.",
        reply_markup=main_keyboard(),
    )


@router.message(F.text == "🎮 Играть")
async def cmd_play(message: Message):
    await message.answer(
        "🎮 <b>Выбери игру</b>\n\n"
        "Нажми на кнопку ниже чтобы открыть галерею в браузере:",
        reply_markup=play_keyboard(),
    )


@router.message(F.text == "✏️ Создать")
async def cmd_create(message: Message):
    await message.answer(
        "✏️ <b>Создай свою игру</b>\n\n"
        "Открой редактор в браузере:",
        reply_markup=play_keyboard(),
    )


@router.message(F.text == "📋 Мои игры")
async def cmd_my_games(message: Message, backend_url: str, user_info: dict | None, telegram_user_id: int):
    if not user_info:
        await message.answer("❌ Сначала нажми /start")
        return

    try:
        async with aiohttp.ClientSession() as session:
            headers = {"X-Telegram-User-ID": str(telegram_user_id)}
            async with session.get(f"{backend_url}/api/games", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    games = data.get("games", [])
                    if not games:
                        await message.answer("📋 У тебя пока нет игр.\nСоздай первую! ✏️")
                        return
                    from keyboards.main import game_list_keyboard
                    text = "🎮 <b>Твои игры:</b>\n\n"
                    for g in games:
                        status = "🟢" if g["is_published"] else "⚪"
                        text += f"{status} <b>{g['name']}</b>\n"
                    await message.answer(text, reply_markup=game_list_keyboard(games))
                else:
                    await message.answer("❌ Ошибка загрузки игр")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text == "💬 Чат")
async def cmd_chat(message: Message):
    await message.answer(
        "💬 <b>Чат</b>\n\n"
        "Для внутриигрового чата открой игру в браузере.\n"
        "Там есть панель чата с其他玩家.",
    )


@router.message(F.text == "👥 Друзья")
async def cmd_friends(message: Message, backend_url: str, user_info: dict | None, telegram_user_id: int):
    if not user_info:
        await message.answer("❌ Сначала нажми /start")
        return
    await message.answer(
        "👥 <b>Друзья</b>\n\n"
        "Добавляй друзей по имени или ID.\n"
        "Для этого используй:\n"
        "/add_friend имя_друга",
    )


@router.message(F.text == "📖 Уроки")
async def cmd_tutorials(message: Message):
    await message.answer(
        "📖 <b>Уроки</b>\n\n"
        "1. 🎲 Создай персонажа\n"
        "2. 🏃 Заставь его двигаться\n"
        "3. 🔊 Добавь звук\n"
        "4. 🎮 Сделай игру с друзьями\n\n"
        "Открой Mini App для прохождения уроков!",
        reply_markup=play_keyboard(),
    )


@router.message(F.text == "⚙️ Настройки")
async def cmd_settings(message: Message):
    await message.answer(
        "⚙️ <b>Настройки</b>\n\n"
        "Темы, шрифты и язык — в веб-приложении.",
        reply_markup=play_keyboard(),
    )


@router.message(F.text == "👤 Профиль")
async def cmd_profile(message: Message, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала нажми /start")
        return
    await message.answer(
        f"👤 <b>Профиль</b>\n\n"
        f"Имя: {user_info['name']}\n"
        f"Игр: {user_info.get('games_count', 0)}\n"
        f"Друзей: {user_info.get('friends_count', 0)}",
    )


@router.callback_query(F.data.startswith("chat:"))
async def cb_chat(callback_query):
    await callback_query.message.answer("💬 Открой игру в браузере для чата.")
    await callback_query.answer()


@router.callback_query(F.data.startswith("invite:"))
async def cb_invite(callback_query):
    await callback_query.message.answer("🎮 Ссылка на игру отправлена!")
    await callback_query.answer()


@router.callback_query(F.data == "cancel")
async def cb_cancel(callback_query):
    await callback_query.message.edit_text("Отменено")
    await callback_query.answer()


@router.callback_query(F.data == "noop")
async def cb_noop(callback_query):
    await callback_query.answer()
