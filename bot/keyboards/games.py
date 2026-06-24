from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def game_keyboard(game_id: str, is_published: bool = False) -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="✏️ Редактировать", callback_data=f"edit:{game_id}"),
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"delete:{game_id}"),
        ],
    ]

    if is_published:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="📦 Снять с публикации",
                    callback_data=f"unpublish:{game_id}",
                )
            ]
        )
    else:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="🚀 Опубликовать",
                    callback_data=f"publish:{game_id}",
                )
            ]
        )

    return InlineKeyboardMarkup(inline_keyboard=buttons)


def game_list_keyboard(games: list[dict]) -> InlineKeyboardMarkup:
    buttons = []
    for game in games:
        status = "🟢" if game.get("is_published") else "⚪"
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"{status} {game['name']}",
                    callback_data=f"game:{game['id']}",
                )
            ]
        )

    if not buttons:
        buttons.append(
            [InlineKeyboardButton(text="Нет игр. Создайте первую!", callback_data="noop")]
        )

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


def gallery_keyboard(games: list[dict], page: int, total: int) -> InlineKeyboardMarkup:
    buttons = []
    for game in games:
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"🎮 {game['name']} ❤️ {game.get('likes', 0)}",
                    callback_data=f"gallery_game:{game['id']}",
                )
            ]
        )

    nav = []
    if page > 1:
        nav.append(InlineKeyboardButton(text="⬅️", callback_data=f"gallery_page:{page - 1}"))
    nav.append(InlineKeyboardButton(text=f"{page}/{total}", callback_data="noop"))
    if page < total:
        nav.append(InlineKeyboardButton(text="➡️", callback_data=f"gallery_page:{page + 1}"))

    buttons.append(nav)
    return InlineKeyboardMarkup(inline_keyboard=buttons)
