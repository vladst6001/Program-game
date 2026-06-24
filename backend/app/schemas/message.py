from datetime import datetime

from pydantic import BaseModel


class MessageSendRequest(BaseModel):
    to_user_id: str
    text: str


class MessageResponse(BaseModel):
    id: str
    from_user: str
    to_user: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
