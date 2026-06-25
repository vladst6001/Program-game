from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.models.user import User
from app.models.game import Game, GameLike, GamePurchase
from app.models.sprite import Sprite
from app.models.friend import Friend
from app.models.message import Message
from app.models.game_session import GameSession
from app.models.chat_message import ChatMessage
from app.models.tutorial import Tutorial, TutorialProgress
from app.routers import (
    auth,
    friends,
    games,
    gallery,
    messages,
    sessions,
    sprites,
    tutorials,
    ws,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Telegram Game Platform",
    description="Backend API for Telegram Mini App game creation platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth)
app.include_router(games)
app.include_router(sprites)
app.include_router(friends)
app.include_router(messages)
app.include_router(gallery)
app.include_router(tutorials)
app.include_router(sessions)
app.include_router(ws)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}
