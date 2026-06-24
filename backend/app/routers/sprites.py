from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.game import Game
from app.models.sprite import Sprite
from app.models.user import User
from app.schemas.game import GameResponse

router = APIRouter(prefix="/api/games/{game_id}/sprites", tags=["sprites"])


async def _get_game_owner(game_id: str, user: User, db: AsyncSession) -> Game:
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return game


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_sprite(
    game_id: str,
    file: UploadFile,
    name: str = "",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_game_owner(game_id, user, db)

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    sprite_name = name or file.filename or "sprite"

    sprite = Sprite(
        game_id=game_id,
        name=sprite_name,
        image_data=content,
        width=0,
        height=0,
    )
    db.add(sprite)
    await db.flush()
    await db.refresh(sprite)

    return {
        "id": str(sprite.id),
        "name": sprite.name,
        "game_id": str(sprite.game_id),
        "created_at": sprite.created_at.isoformat(),
    }


@router.get("")
async def list_sprites(
    game_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sprite).where(Sprite.game_id == game_id).order_by(Sprite.created_at.desc())
    )
    sprites = result.scalars().all()
    return {
        "sprites": [
            {
                "id": str(s.id),
                "name": s.name,
                "game_id": str(s.game_id),
                "width": s.width,
                "height": s.height,
                "created_at": s.created_at.isoformat(),
            }
            for s in sprites
        ]
    }


@router.delete("/{sprite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sprite(
    game_id: str,
    sprite_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_game_owner(game_id, user, db)

    result = await db.execute(
        select(Sprite).where(Sprite.id == sprite_id, Sprite.game_id == game_id)
    )
    sprite = result.scalar_one_or_none()
    if not sprite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprite not found")

    await db.delete(sprite)
