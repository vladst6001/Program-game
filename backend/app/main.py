from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
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
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(games.router)
app.include_router(sprites.router)
app.include_router(friends.router)
app.include_router(messages.router)
app.include_router(gallery.router)
app.include_router(tutorials.router)
app.include_router(sessions.router)
app.include_router(ws.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
