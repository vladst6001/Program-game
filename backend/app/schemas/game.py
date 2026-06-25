from __future__ import annotations

import json
from datetime import datetime

from pydantic import BaseModel, field_validator


class GameCreate(BaseModel):
    name: str


class GameUpdate(BaseModel):
    name: str | None = None
    code: dict | None = None
    price: int | None = None
    is_hidden: bool | None = None


class GameResponse(BaseModel):
    id: str
    name: str
    author_id: str
    code: dict = {}
    is_published: bool
    likes: int
    price: int = 0
    creator_name: str | None = None
    is_hidden: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("code", mode="before")
    @classmethod
    def parse_code(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return {}
        return v or {}


class GameListResponse(BaseModel):
    games: list[GameResponse]


class PublishResponse(BaseModel):
    success: bool
    game_id: str
