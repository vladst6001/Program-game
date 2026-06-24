import aiohttp
from aiogram import Router, F
from aiogram.types import Message

router = Router(name="friends")


@router.message(F.text == "👥 Друзья")
@router.message(F.text == "/friends")
async def cmd_friends(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/friends") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    friends = data.get("friends", [])

                    if not friends:
                        await message.answer(
                            "👥 У тебя пока нет друзей.\n"
                            "Используй /add_friend чтобы добавить первого!"
                        )
                        return

                    text = "👥 <b>Твои друзья:</b>\n\n"
                    for f in friends:
                        name = f.get("friend_name", "Unknown")
                        status = f.get("status", "")
                        emoji = "✅" if status == "confirmed" else "⏳"
                        text += f"{emoji} {name}\n"

                    await message.answer(text)
                else:
                    await message.answer("❌ Ошибка загрузки друзей")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/add_friend "))
async def cmd_add_friend(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "👥 <b>Добавление друга</b>\n\n"
            "Используй: /add_friend <имя_пользователя>"
        )
        return

    friend_name = parts[1].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{backend_url}/api/friends/add",
                json={"name": friend_name},
            ) as resp:
                if resp.status in (200, 201):
                    await message.answer(f"✅ Заявка отправлена пользователю {friend_name}!")
                elif resp.status == 404:
                    await message.answer(f"❌ Пользователь {friend_name} не найден")
                elif resp.status == 400:
                    data = await resp.json()
                    await message.answer(f"❌ {data.get('detail', 'Невозможно добавить')}")
                else:
                    await message.answer("❌ Ошибка добавления друга")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/invite "))
async def cmd_invite(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "📨 <b>Приглашение друга</b>\n\n"
            "Используй: /invite <имя_пользователя>\n"
            "Чтобы пригласить друга в игру."
        )
        return

    friend_name = parts[1].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{backend_url}/api/friends/add",
                json={"name": friend_name},
            ) as resp:
                if resp.status in (200, 201):
                    bot = message.bot
                    bot_username = (await bot.get_me()).username
                    invite_link = f"https://t.me/{bot_username}?start=invite_{user_info.get('id', '')}"
                    await message.answer(
                        f"📨 Приглашение для <b>{friend_name}</b>:\n\n"
                        f"Скопируй и отправь другу:\n"
                        f"<code>{invite_link}</code>"
                    )
                else:
                    await message.answer("❌ Не удалось создать приглашение")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")
