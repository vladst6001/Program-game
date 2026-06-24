from app.services.auth import AuthService
from app.services.multiplayer import MultiplayerService, ChatService, PresenceService, multiplayer_service, chat_service, presence_service
from app.services.telegram import TelegramService, telegram_service

__all__ = [
    "AuthService",
    "MultiplayerService",
    "ChatService",
    "PresenceService",
    "multiplayer_service",
    "chat_service",
    "presence_service",
    "TelegramService",
    "telegram_service",
]
