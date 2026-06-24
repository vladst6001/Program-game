import aiohttp
from aiogram import Router, F
from aiogram.types import Message

router = Router(name="messages")


@router.message(F.text.startswith("/send "))
async def cmd_send(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=2)
    if len(parts) < 3:
        await message.answer(
            "💬 <b>Отправка сообщения</b>\n\n"
            "Используй: /send <user_id> <текст>\n"
            "Или: /chat <user_id>"
        )
        return

    to_user_id = parts[1].strip()
    text = parts[2].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{backend_url}/api/messages/send",
                json={"to_user_id": to_user_id, "text": text},
            ) as resp:
                if resp.status in (200, 201):
                    await message.answer("✅ Сообщение отправлено!")
                elif resp.status == 404:
                    await message.answer("❌ Пользователь не найден")
                else:
                    data = await resp.json()
                    await message.answer(f"❌ {data.get('detail', 'Ошибка отправки')}")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/chat "))
async def cmd_chat(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer(
            "💬 <b>Чат с другом</b>\n\n"
            "Используй: /chat <user_id>\n"
            "Затем отправляй сообщения."
        )
        return

    friend_id = parts[1].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/messages/{friend_id}") as resp:
                if resp.status == 200:
                    messages = await resp.json()

                    if not messages:
                        await message.answer(
                            f"💬 Чат с пользователем <code>{friend_id}</code> пуст.\n"
                            f"Отправь первое сообщение: /send {friend_id} <текст>"
                        )
                        return

                    text = f"💬 <b>Чат с {friend_id}:</b>\n\n"
                    for msg in messages[-10:]:
                        sender = "Ты" if msg["from_user"] == user_info.get("id") else msg["from_user"]
                        text += f"<b>{sender}</b>: {msg['text']}\n"

                    await message.answer(text)
                else:
                    await message.answer("❌ Ошибка загрузки сообщений")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")
