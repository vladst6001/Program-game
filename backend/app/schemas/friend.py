from datetime import datetime

from pydantic import BaseModel


class FriendAddRequest(BaseModel):
    user_id: str | None = None
    name: str | None = None


class FriendResponse(BaseModel):
    user_id: str
    friend_id: str
    friend_name: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FriendListResponse(BaseModel):
    friends: list[FriendResponse]
