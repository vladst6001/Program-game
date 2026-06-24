import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.friend import Friend, FriendStatus
from app.models.user import User
from app.schemas.friend import FriendAddRequest, FriendListResponse, FriendResponse

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.post("/add", status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    request: FriendAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not request.user_id and not request.name:
        raise HTTPException(status_code=400, detail="Provide user_id or name")

    target_user = None
    if request.user_id:
        result = await db.execute(select(User).where(User.id == request.user_id))
        target_user = result.scalar_one_or_none()
    elif request.name:
        result = await db.execute(select(User).where(User.name == request.name))
        target_user = result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    existing = await db.execute(
        select(Friend).where(
            or_(
                (Friend.user_id == user.id) & (Friend.friend_id == target_user.id),
                (Friend.user_id == target_user.id) & (Friend.friend_id == user.id),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Friend request already exists")

    friend = Friend(user_id=user.id, friend_id=target_user.id, status=FriendStatus.pending.value)
    db.add(friend)
    await db.flush()

    return {"success": True, "message": "Friend request sent"}


@router.post("/accept")
async def accept_friend_request(
    request: FriendAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    result = await db.execute(
        select(Friend).where(
            Friend.user_id == request.user_id,
            Friend.friend_id == user.id,
            Friend.status == FriendStatus.pending.value,
        )
    )
    friend = result.scalar_one_or_none()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend request not found")

    friend.status = FriendStatus.confirmed.value

    reverse = Friend(user_id=user.id, friend_id=request.user_id, status=FriendStatus.confirmed.value)
    db.add(reverse)

    user.friends_count += 1
    target_result = await db.execute(select(User).where(User.id == request.user_id))
    target_user = target_result.scalar_one_or_none()
    if target_user:
        target_user.friends_count += 1

    await db.flush()
    return {"success": True, "message": "Friend request accepted"}


@router.post("/reject")
async def reject_friend_request(
    request: FriendAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not request.user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    result = await db.execute(
        select(Friend).where(
            Friend.user_id == request.user_id,
            Friend.friend_id == user.id,
            Friend.status == FriendStatus.pending.value,
        )
    )
    friend = result.scalar_one_or_none()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend request not found")

    await db.delete(friend)
    await db.flush()
    return {"success": True, "message": "Friend request rejected"}


@router.get("", response_model=FriendListResponse)
async def list_friends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friend).where(
            or_(
                (Friend.user_id == user.id) & (Friend.status == FriendStatus.confirmed.value),
                (Friend.friend_id == user.id) & (Friend.status == FriendStatus.confirmed.value),
            )
        )
    )
    friendships = result.scalars().all()

    friends = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == user.id else f.user_id
        user_result = await db.execute(select(User).where(User.id == friend_id))
        friend_user = user_result.scalar_one_or_none()
        if friend_user:
            friends.append(
                FriendResponse(
                    user_id=f.user_id,
                    friend_id=f.friend_id,
                    friend_name=friend_user.name,
                    status=f.status,
                    created_at=f.created_at,
                )
            )

    return FriendListResponse(friends=friends)
