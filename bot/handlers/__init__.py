from .start import router as start_router
from .games import router as games_router
from .code import router as code_router
from .friends import router as friends_router
from .messages import router as messages_router
from .tutorials import router as tutorials_router

__all__ = [
    "start_router",
    "games_router",
    "code_router",
    "friends_router",
    "messages_router",
    "tutorials_router",
]
