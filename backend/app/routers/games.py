import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.game import Game, GameLike
from app.models.user import User
from app.schemas.game import (
    GameCreate,
    GameListResponse,
    GameResponse,
    GameUpdate,
    PublishResponse,
)

router = APIRouter(prefix="/api/games", tags=["games"])


@router.post("", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    request: GameCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    game = Game(name=request.name, author_id=user.id)
    db.add(game)
    user.games_count += 1
    await db.flush()
    await db.refresh(game)
    return game


@router.get("", response_model=GameListResponse)
async def list_my_games(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Game).where(Game.author_id == user.id).order_by(Game.created_at.desc())
    )
    games = result.scalars().all()
    return GameListResponse(games=games)


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return game


@router.put("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: uuid.UUID,
    request: GameUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if request.name is not None:
        game.name = request.name
    if request.code is not None:
        game.code = request.code

    await db.flush()
    await db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.delete(game)
    user.games_count = max(0, user.games_count - 1)


@router.post("/{game_id}/publish", response_model=PublishResponse)
async def publish_game(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    game.is_published = True
    await db.flush()
    return PublishResponse(success=True, game_id=game.id)


@router.post("/{game_id}/unpublish", response_model=PublishResponse)
async def unpublish_game(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    game.is_published = False
    await db.flush()
    return PublishResponse(success=True, game_id=game.id)


@router.post("/{game_id}/like")
async def toggle_like(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    existing = await db.execute(
        select(GameLike).where(GameLike.user_id == user.id, GameLike.game_id == game_id)
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        game.likes = max(0, game.likes - 1)
        liked = False
    else:
        new_like = GameLike(user_id=user.id, game_id=game_id)
        db.add(new_like)
        game.likes += 1
        liked = True

    await db.flush()
    return {"liked": liked, "likes": game.likes}


@router.get("/{game_id}/likes")
async def get_likes(
    game_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    existing = await db.execute(
        select(GameLike).where(GameLike.user_id == user.id, GameLike.game_id == game_id)
    )
    liked = existing.scalar_one_or_none() is not None

    return {"likes": game.likes, "liked": liked}
