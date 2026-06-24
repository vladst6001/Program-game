import aiohttp
from aiogram import Router, F
from aiogram.types import Message

router = Router(name="tutorials")


@router.message(F.text == "📖 Туториалы")
@router.message(F.text == "/tutorial")
async def cmd_tutorials(message: Message, backend_url: str):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tutorials") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    tutorials = data.get("tutorials", [])

                    if not tutorials:
                        await message.answer("📖 Туториалы пока не доступны.")
                        return

                    text = "📖 <b>Доступные туториалы:</b>\n\n"
                    for t in tutorials:
                        step_count = len(t.get("steps", []))
                        text += f"📚 <b>{t['name']}</b>\n"
                        text += f"   {t.get('description', '')}\n"
                        text += f"   Шагов: {step_count}\n"
                        text += f"   ID: <code>{t['id']}</code>\n\n"

                    text += "Используй /tutorial <id> чтобы начать."
                    await message.answer(text)
                else:
                    await message.answer("❌ Ошибка загрузки туториалов")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/tutorial "))
async def cmd_tutorial(message: Message, backend_url: str):
    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Используй: /tutorial <tutorial_id>")
        return

    tutorial_id = parts[1].strip()

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tutorials/{tutorial_id}") as resp:
                if resp.status == 200:
                    tutorial = await resp.json()
                    steps = tutorial.get("steps", [])

                    text = f"📖 <b>{tutorial['name']}</b>\n\n"
                    text += f"{tutorial.get('description', '')}\n\n"
                    text += f"Всего шагов: {len(steps)}\n\n"

                    if steps:
                        first_step = steps[0]
                        if isinstance(first_step, dict):
                            text += f"<b>Шаг 1:</b> {first_step.get('title', '')}\n"
                            text += f"{first_step.get('content', first_step.get('description', ''))}\n"
                        else:
                            text += f"<b>Шаг 1:</b> {first_step}\n"

                    text += f"\nID: <code>{tutorial_id}</code>"
                    text += "\nИспользуй /next {tutorial_id} {step_index} для следующего шага."

                    await message.answer(text)
                elif resp.status == 404:
                    await message.answer("❌ Туториал не найден")
                else:
                    await message.answer("❌ Ошибка загрузки туториала")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")


@router.message(F.text.startswith("/next "))
async def cmd_next_step(message: Message, backend_url: str, user_info: dict | None):
    if not user_info:
        await message.answer("❌ Сначала зарегистрируйся: /start")
        return

    parts = message.text.split()
    if len(parts) < 3:
        await message.answer(
            "Используй: /next <tutorial_id> <step_index>\n"
            "Например: /next abc123 1"
        )
        return

    tutorial_id = parts[1].strip()
    try:
        step_index = int(parts[2].strip())
    except ValueError:
        await message.answer("❌ Неверный индекс шага")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{backend_url}/api/tutorials/{tutorial_id}") as resp:
                if resp.status != 200:
                    await message.answer("❌ Туториал не найден")
                    return

                tutorial = await resp.json()
                steps = tutorial.get("steps", [])

                if step_index >= len(steps):
                    await message.answer("❌ Такого шага нет")
                    return

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{backend_url}/api/tutorials/{tutorial_id}/complete",
                    params={"step_index": step_index},
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        is_completed = result.get("is_completed", False)

                        step = steps[step_index]
                        text = ""
                        if isinstance(step, dict):
                            text = f"<b>Шаг {step_index + 1}:</b> {step.get('title', '')}\n"
                            text += f"{step.get('content', step.get('description', ''))}\n"
                        else:
                            text = f"<b>Шаг {step_index + 1}:</b> {step}\n"

                        if is_completed:
                            text += "\n🎉 <b>Туториал завершён!</b>"
                        else:
                            next_index = step_index + 1
                            text += f"\n/use /next {tutorial_id} {next_index} для следующего шага"

                        await message.answer(text)
                    else:
                        await message.answer("❌ Ошибка сохранения прогресса")
    except Exception:
        await message.answer("❌ Ошибка соединения с сервером")
