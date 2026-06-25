from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
)

WEBAPP_URL = "https://vladst6001.github.io/Program-game/miniapp.html"


def main_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🎮 Играть"),
                KeyboardButton(text="✏️ Создать"),
            ],
            [
                KeyboardButton(text="📋 Мои игры"),
                KeyboardButton(text="💬 Чат"),
            ],
            [
                KeyboardButton(text="👥 Друзья"),
                KeyboardButton(text="👤 Профиль"),
            ],
            [
                KeyboardButton(text="📖 Уроки"),
                KeyboardButton(text="⚙️ Настройки"),
            ],
        ],
        resize_keyboard=True,
    )


def back_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🏠 Меню"), KeyboardButton(text="⬅️ Назад")],
        ],
        resize_keyboard=True,
    )


def play_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="▶ Играть в браузере", url=f"{WEBAPP_URL}")],
            [InlineKeyboardButton(text="✏️ Редактировать", url=f"{WEBAPP_URL}#/editor/new")],
        ]
    )


def game_keyboard(game_id: str, is_published: bool = False) -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="▶ Играть", url=f"{WEBAPP_URL}")],
        [InlineKeyboardButton(text="✏️ Редактировать", url=f"{WEBAPP_URL}#/editor/{game_id}")],
    ]
    if is_published:
        buttons.append([InlineKeyboardButton(text="📦 Снять с публикации", callback_data=f"unpublish:{game_id}")])
    else:
        buttons.append([InlineKeyboardButton(text="🌐 Опубликовать", callback_data=f"publish:{game_id}")])
    buttons.append([InlineKeyboardButton(text="🗑 Удалить", callback_data=f"delete:{game_id}")])
    buttons.append([InlineKeyboardButton(text="↩️ Назад", callback_data="cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def game_list_keyboard(games: list) -> InlineKeyboardMarkup:
    buttons = []
    for g in games[:10]:
        status = "🟢" if g.get("is_published") else "⚪"
        buttons.append([InlineKeyboardButton(
            text=f"{status} {g['name']}",
            callback_data=f"game:{g['id']}"
        )])
    buttons.append([InlineKeyboardButton(text="↩️ Назад", callback_data="cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def confirm_keyboard(action: str, game_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Да", callback_data=f"confirm:{action}:{game_id}"),
                InlineKeyboardButton(text="❌ Нет", callback_data="cancel"),
            ]
        ]
    )


def friend_keyboard(friend_id: str, name: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"💬 Написать {name}", callback_data=f"chat:{friend_id}")],
            [InlineKeyboardButton(text=f"🎮 Пригласить в игру", callback_data=f"invite:{friend_id}")],
            [InlineKeyboardButton(text="❌ Удалить из друзей", callback_data=f"remove_friend:{friend_id}")],
        ]
    )
