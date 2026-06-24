import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageResponse, MessageSendRequest

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    request: MessageSendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_result = await db.execute(select(User).where(User.id == request.to_user_id))
    target_user = target_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    message = Message(from_user=user.id, to_user=request.to_user_id, text=request.text)
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


@router.get("/{friend_id}", response_model=list[MessageResponse])
async def get_message_history(
    friend_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message).where(
            or_(
                (Message.from_user == user.id) & (Message.to_user == friend_id),
                (Message.from_user == friend_id) & (Message.to_user == user.id),
            )
        ).order_by(Message.created_at.desc()).limit(100)
    )
    messages = result.scalars().all()
    return list(reversed(messages))
