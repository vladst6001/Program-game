import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatMessageSendRequest(BaseModel):
    text: str | None = None
    voice_url: str | None = None


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    sender_id: uuid.UUID
    text: str | None
    voice_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
