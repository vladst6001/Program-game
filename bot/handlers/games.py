import aiohttp
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from keyboards.main import main_keyboard, back_keyboard
from keyboards.games import game_keyboard, game_list_keyboard, confirm_keyboard

router = Router(name="games")


@router.message(F.text == "➕ Новая игра")
@router.message(F.text == "/new_game")
async def cmd_new_game(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    await message.answer("✏️ Введи название новой игры:", reply_markup=back_keyboard())


@router.message(F.text.startswith("🎮 ") | F.text.startswith("➕ ") | F.text.startswith("🌐 ") | F.text.startswith("👥 ") | F.text.startswith("📖 ") | F.text.startswith("👤 "))
async def skip_main_buttons(message: Message):
    pass


@router.message(F.text == "🎮 Мои игры")
@router.message(F.text == "/my_games")
async def cmd_my_games(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/games") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    games = data.get("games", [])

                    if not games:
                        await message.answer(
                            "📋 У тебя пока нет игр.\nСоздай первую!",
                            reply_markup=back_keyboard(),
                        )
                        return

                    text = "🎮 <b>Твои игры:</b>\n\n"
                    for g in games:
                        status = "🟢" if g["is_published"] else "⚪"
                        text += f"{status} <b>{g['name']}</b>\n"

                    await message.answer(
                        text,
                        reply_markup=game_list_keyboard(games),
                    )
                else:
                    await message.answer("❌ Ошибка загрузки игр")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.callback_query(F.data.startswith("game:"))
async def cb_game_info(callback: CallbackQuery, backend_url: str):
    game_id = callback.data.split(":", 1)[1]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/games/{game_id}") as resp:
                if resp.status == 200:
                    game = await resp.json()
                    status = "🟢 Опубликована" if game["is_published"] else "⚪ Черновик"
                    text = (
                        f"🎮 <b>{game['name']}</b>\n\n"
                        f"Статус: {status}\n"
                        f"❤️ Лайков: {game.get('likes', 0)}\n"
                        f"Создана: {game.get('created_at', '?')[:10]}\n"
                    )
                    await callback.message.edit_text(
                        text,
                        reply_markup=game_keyboard(game_id, game["is_published"]),
                    )
                else:
                    await callback.message.answer("❌ Игра не найдена")
    except Exception:
        await callback.message.answer("❌ Ошибка соединения с сервером")

    await callback.answer()


@router.callback_query(F.data.startswith("delete:"))
async def cb_delete_game(callback: CallbackQuery):
    game_id = callback.data.split(":", 1)[1]
    await callback.message.edit_text(
        "⚠️ Ты уверен, что хочешь удалить игру?",
        reply_markup=confirm_keyboard("delete", game_id),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("confirm:delete:"))
async def cb_confirm_delete(callback: CallbackQuery, backend_url: str):
    game_id = callback.data.split(":", 2)[2]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.delete(f"{backend_url}/api/games/{game_id}") as resp:
                if resp.status in (200, 204):
                    await callback.message.edit_text("✅ Игра удалена")
                else:
                    await callback.message.edit_text("❌ Не удалось удалить игру")
    except Exception:
        await callback.message.edit_text("❌ Ошибка соединения с сервером")

    await callback.answer()


@router.callback_query(F.data.startswith("publish:"))
async def cb_publish(callback: CallbackQuery, backend_url: str):
    game_id = callback.data.split(":", 1)[1]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{backend_url}/api/games/{game_id}/publish") as resp:
                if resp.status == 200:
                    await callback.message.edit_reply_markup(
                        reply_markup=game_keyboard(game_id, is_published=True)
                    )
                    await callback.message.answer("✅ Игра опубликована!")
                else:
                    await callback.message.answer("❌ Не удалось опубликовать")
    except Exception:
        await callback.message.answer("❌ Ошибка соединения с сервером")

    await callback.answer()


@router.callback_query(F.data.startswith("unpublish:"))
async def cb_unpublish(callback: CallbackQuery, backend_url: str):
    game_id = callback.data.split(":", 1)[1]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{backend_url}/api/games/{game_id}/unpublish") as resp:
                if resp.status == 200:
                    await callback.message.edit_reply_markup(
                        reply_markup=game_keyboard(game_id, is_published=False)
                    )
                    await callback.message.answer("📦 Игра снята с публикации")
                else:
                    await callback.message.answer("❌ Не удалось снять с публикации")
    except Exception:
        await callback.message.answer("❌ Ошибка соединения с сервером")

    await callback.answer()


@router.callback_query(F.data.startswith("edit:"))
async def cb_edit_game(callback: CallbackQuery, backend_url: str):
    game_id = callback.data.split(":", 1)[1]
    await callback.message.edit_text(
        f"✏️ Отредактируй игру в веб-приложении.\n"
        f"Или используй /code {game_id} для работы с кодом.",
    )
    await callback.answer()


@router.callback_query(F.data == "cancel")
async def cb_cancel(callback: CallbackQuery):
    await callback.message.edit_text("Отменено")
    await callback.answer()


@router.callback_query(F.data == "noop")
async def cb_noop(callback: CallbackQuery):
    await callback.answer()


@router.message(F.text.startswith("/edit "))
async def cmd_edit(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Используй: /edit <game_id>")
        return

    game_id = parts[1].strip()
    await message.answer(
        f"✏️ Редактируй игру в веб-приложении.\n"
        f"Или используй /code {game_id} для работы с кодом."
    )


@router.message(F.text.startswith("/delete "))
async def cmd_delete(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Используй: /delete <game_id>")
        return

    game_id = parts[1].strip()
    await message.answer(
        "⚠️ Ты уверен, что хочешь удалить игру?",
        reply_markup=confirm_keyboard("delete", game_id),
    )


@router.message(F.text.startswith("/publish "))
async def cmd_publish(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Используй: /publish <game_id>")
        return

    game_id = parts[1].strip()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{backend_url}/api/games/{game_id}/publish") as resp:
                if resp.status == 200:
                    await message.answer("✅ Игра опубликована!")
                else:
                    await message.answer("❌ Не удалось опубликовать игру")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/unpublish "))
async def cmd_unpublish(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Используй: /unpublish <game_id>")
        return

    game_id = parts[1].strip()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{backend_url}/api/games/{game_id}/unpublish") as resp:
                if resp.status == 200:
                    await message.answer("📦 Игра снята с публикации")
                else:
                    await message.answer("❌ Не удалось снять с публикации")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")
