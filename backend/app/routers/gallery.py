import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.game import Game
from app.models.user import User
from app.schemas.game import GameResponse

router = APIRouter(prefix="/api/gallery", tags=["gallery"])


@router.get("")
async def list_published_games(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Game).where(Game.is_published == True)

    if search:
        query = query.join(User, Game.author_id == User.id).where(
            or_(
                Game.name.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Game.likes.desc(), Game.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    games = result.scalars().all()

    return {
        "games": [GameResponse.model_validate(g).model_dump() for g in games],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/{game_id}/copy", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def copy_game(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id, Game.is_published == True))
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Published game not found")

    copy = Game(
        name=f"{original.name} (Copy)",
        author_id=user.id,
        code=original.code,
    )
    db.add(copy)
    user.games_count += 1
    await db.flush()
    await db.refresh(copy)
    return copy
