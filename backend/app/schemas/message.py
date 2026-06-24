import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageSendRequest(BaseModel):
    to_user_id: uuid.UUID
    text: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    from_user: uuid.UUID
    to_user: uuid.UUID
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
