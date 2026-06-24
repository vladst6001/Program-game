import uuid
from datetime import datetime

from pydantic import BaseModel


class GameCreate(BaseModel):
    name: str


class GameUpdate(BaseModel):
    name: str | None = None
    code: dict | None = None


class GameResponse(BaseModel):
    id: uuid.UUID
    name: str
    author_id: uuid.UUID
    code: dict
    is_published: bool
    likes: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GameListResponse(BaseModel):
    games: list[GameResponse]


class PublishResponse(BaseModel):
    success: bool
    game_id: uuid.UUID
