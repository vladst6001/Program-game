from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ChatMessageSendRequest(BaseModel):
    text: str | None = None
    voice_url: str | None = None


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    sender_id: str
    text: str | None
    voice_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
