import aiohttp
from aiogram import Router, F
from aiogram.types import Message

router = Router(name="code")


@router.message(F.text.startswith("/code "))
async def cmd_code(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "📝 <b>Редактор кода</b>\n\n"
            "Используй: /code <game_id>\n"
            "Также доступно в веб-приложении."
        )
        return

    game_id = parts[1].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/games/{game_id}") as resp:
                if resp.status == 200:
                    game = await resp.json()
                    code = game.get("code", {})
                    code_str = str(code) if code else "{}"

                    await message.answer(
                        f"📝 <b>Код игры: {game['name']}</b>\n\n"
                        f"<code>{code_str[:1000]}</code>"
                        f"\n\nДля редактирования используй веб-приложение."
                    )
                else:
                    await message.answer("❌ Игра не найдена")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/add_sprite "))
async def cmd_add_sprite(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "🖼 <b>Добавление спрайта</b>\n\n"
            "Используй: /add_sprite <game_id>\n"
            "Затем отправь изображение боту."
        )
        return

    game_id = parts[1].strip()

    await message.answer(
        f"🖼 Отправь изображение для спрайта.\n"
        f"Игра: <code>{game_id}</code>"
    )


@router.message(F.photo)
async def handle_photo(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        return

    photo = message.photo[-1]
    file = await message.bot.get_file(photo.file_id)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.telegram.org/file/bot{message.bot.token}/{file.file_path}"
            ) as resp:
                if resp.status == 200:
                    photo_data = await resp.read()

                    data = aiohttp.FormData()
                    data.add_field(
                        "file",
                        photo_data,
                        filename=f"{file.file_id}.jpg",
                        content_type="image/jpeg",
                    )
                    data.add_field("name", file.file_id)

                    async with session.post(
                        f"{backend_url}/api/games/{user_info.get('id', '0')}/sprites",
                        data=data,
                    ) as upload_resp:
                        if upload_resp.status in (200, 201):
                            await message.answer("✅ Спрайт добавлен!")
                        else:
                            await message.answer(
                                "❌ Не удалось загрузить спрайт.\n"
                                "Укажи игру: /add_sprite <game_id>"
                            )
    except Exception:
        await message.answer("❌ Ошибка при загрузке")


@router.message(F.text.startswith("/add_sound "))
async def cmd_add_sound(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "🔊 <b>Добавление звука</b>\n\n"
            "Используй: /add_sound <game_id>\n"
            "Затем отправь аудиофайл боту."
        )
        return

    game_id = parts[1].strip()

    await message.answer(
        f"🔊 Отправь аудиофайл для игры.\n"
        f"Игра: <code>{game_id}</code>"
    )


@router.message(F.audio | F.voice | F.video_note)
async def handle_audio(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        return

    await message.answer(
        "⚠️ Загрузка звуков пока доступна только через веб-приложение.\n"
        "Используй /code для работы с кодом игры."
    )
