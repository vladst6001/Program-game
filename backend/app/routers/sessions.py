from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.game import Game
from app.models.game_session import GameSession
from app.models.user import User

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    game_id: str,
    max_players: int = 8,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    game_result = await db.execute(select(Game).where(Game.id == game_id))
    game = game_result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    session = GameSession(
        game_id=game_id,
        players=[str(user.id)],
        max_players=max_players,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    return {
        "id": str(session.id),
        "game_id": str(session.game_id),
        "players": session.players,
        "max_players": session.max_players,
        "created_at": session.created_at.isoformat(),
    }


@router.post("/{session_id}/join")
async def join_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id_str = str(user.id)
    if user_id_str in session.players:
        raise HTTPException(status_code=400, detail="Already in session")

    if len(session.players) >= session.max_players:
        raise HTTPException(status_code=400, detail="Session is full")

    session.players = session.players + [user_id_str]
    await db.flush()

    return {
        "id": str(session.id),
        "game_id": str(session.game_id),
        "players": session.players,
        "max_players": session.max_players,
    }


@router.post("/{session_id}/leave")
async def leave_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id_str = str(user.id)
    if user_id_str not in session.players:
        raise HTTPException(status_code=400, detail="Not in session")

    session.players = [p for p in session.players if p != user_id_str]

    if not session.players:
        await db.delete(session)
    else:
        await db.flush()

    return {"success": True, "message": "Left session"}


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "game_id": str(session.game_id),
        "players": session.players,
        "max_players": session.max_players,
        "created_at": session.created_at.isoformat(),
    }
