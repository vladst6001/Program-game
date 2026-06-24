from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.tutorial import Tutorial, TutorialProgress
from app.models.user import User

router = APIRouter(prefix="/api/tutorials", tags=["tutorials"])


@router.get("")
async def list_tutorials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tutorial).order_by(Tutorial.created_at.desc()))
    tutorials = result.scalars().all()
    return {
        "tutorials": [
            {
                "id": str(t.id),
                "name": t.name,
                "description": t.description,
                "steps": t.steps,
                "created_at": t.created_at.isoformat(),
            }
            for t in tutorials
        ]
    }


@router.get("/progress")
async def get_user_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TutorialProgress).where(TutorialProgress.user_id == user.id)
    )
    progress_list = result.scalars().all()
    return {
        "progress": [
            {
                "tutorial_id": str(p.tutorial_id),
                "completed_steps": p.completed_steps,
                "is_completed": p.is_completed,
                "created_at": p.created_at.isoformat(),
            }
            for p in progress_list
        ]
    }


@router.get("/{tutorial_id}")
async def get_tutorial(tutorial_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
    tutorial = result.scalar_one_or_none()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    return {
        "id": str(tutorial.id),
        "name": tutorial.name,
        "description": tutorial.description,
        "steps": tutorial.steps,
        "created_at": tutorial.created_at.isoformat(),
    }


@router.post("/{tutorial_id}/complete")
async def mark_step_complete(
    tutorial_id: str,
    step_index: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tutorial_result = await db.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
    tutorial = tutorial_result.scalar_one_or_none()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")

    if step_index >= len(tutorial.steps):
        raise HTTPException(status_code=400, detail="Invalid step index")

    progress_result = await db.execute(
        select(TutorialProgress).where(
            TutorialProgress.user_id == user.id,
            TutorialProgress.tutorial_id == tutorial_id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        progress = TutorialProgress(user_id=user.id, tutorial_id=tutorial_id, completed_steps=[step_index])
        db.add(progress)
    else:
        if step_index not in progress.completed_steps:
            progress.completed_steps = progress.completed_steps + [step_index]

    total_steps = len(tutorial.steps)
    progress.is_completed = len(progress.completed_steps) >= total_steps

    await db.flush()
    return {
        "success": True,
        "completed_steps": progress.completed_steps,
        "is_completed": progress.is_completed,
    }
