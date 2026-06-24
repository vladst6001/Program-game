from handlers.start import router as start_router
from handlers.games import router as games_router
from handlers.code import router as code_router
from handlers.friends import router as friends_router
from handlers.messages import router as messages_router
from handlers.tutorials import router as tutorials_router

__all__ = [
    "start_router",
    "games_router",
    "code_router",
    "friends_router",
    "messages_router",
    "tutorials_router",
]
