from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    SendCodeRequest,
    TokenResponse,
    VerifyCodeRequest,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/api", tags=["auth"])


class AutoRegisterRequest(BaseModel):
    name: str
    telegram_id: int


class PhoneRegisterRequest(BaseModel):
    name: str
    phone: str
    code: str


class UserPublicResponse(BaseModel):
    id: str
    name: str
    bio: str | None = None
    friends_count: int
    games_count: int
    created_at: str


class UserSearchResponse(BaseModel):
    users: list[UserPublicResponse]


class BanUserRequest(BaseModel):
    user_id: str


class BanGameRequest(BaseModel):
    game_id: str


class PlatformStatsResponse(BaseModel):
    total_users: int
    total_games: int
    published_games: int
    total_likes: int
    active_users: int


def require_admin(user: User) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.post("/auth/auto-register", response_model=TokenResponse)
async def auto_register(request: AutoRegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == request.telegram_id))
    user = result.scalar_one_or_none()
    if user:
        service = AuthService(db)
        token = service.create_token(user.id)
        return TokenResponse(access_token=token)

    user = User(name=request.name, telegram_id=request.telegram_id)
    db.add(user)
    await db.flush()
    await db.refresh(user)

    service = AuthService(db)
    token = service.create_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        user = await service.register(
            name=request.name,
            phone=request.phone,
            email=request.email,
            password=request.password,
            telegram_id=request.telegram_id,
        )
        token = service.create_token(user.id)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/auth/register-phone", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_phone(request: PhoneRegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    valid = service.verify_sms_code(phone=request.phone, code=request.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

    existing = await db.execute(select(User).where(User.phone == request.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already registered")

    user = User(name=request.name, phone=request.phone)
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = service.create_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        token = await service.login(phone=request.phone, password=request.password)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/auth/send-code")
async def send_code(request: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    code = service.send_sms_code(request.phone)
    return {"success": True, "message": "Code sent", "debug_code": code}


@router.post("/auth/verify-code")
async def verify_code(request: VerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    valid = service.verify_sms_code(phone=request.phone, code=request.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")
    return {"success": True}


@router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "friends_count": user.friends_count,
        "games_count": user.games_count,
        "coins": user.coins,
        "bio": user.bio,
        "is_banned": user.is_banned,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/users/{user_id}")
async def get_user_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserPublicResponse(
        id=user.id,
        name=user.name,
        bio=user.bio,
        friends_count=user.friends_count,
        games_count=user.games_count,
        created_at=user.created_at.isoformat(),
    )


@router.get("/users/search")
async def search_users(q: str = Query("", min_length=1), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.name.ilike(f"%{q}%"),
            User.is_banned == False,
        ).limit(20)
    )
    users = result.scalars().all()
    return UserSearchResponse(
        users=[
            UserPublicResponse(
                id=u.id,
                name=u.name,
                bio=u.bio,
                friends_count=u.friends_count,
                games_count=u.games_count,
                created_at=u.created_at.isoformat(),
            )
            for u in users
        ]
    )


@router.post("/admin/ban-user/{user_id}")
async def ban_user(user_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target.is_banned = True
    await db.flush()
    return {"success": True, "message": f"User {user_id} banned"}


@router.post("/admin/ban-game/{game_id}")
async def ban_game(game_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    from app.models.game import Game
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    game.is_hidden = True
    game.is_published = False
    await db.flush()
    return {"success": True, "message": f"Game {game_id} banned"}


@router.get("/admin/stats", response_model=PlatformStatsResponse)
async def get_admin_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    from app.models.game import Game, GameLike

    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    total_games_result = await db.execute(select(func.count(Game.id)))
    total_games = total_games_result.scalar() or 0

    published_result = await db.execute(select(func.count(Game.id)).where(Game.is_published == True))
    published_games = published_result.scalar() or 0

    likes_result = await db.execute(select(func.coalesce(func.sum(Game.likes), 0)))
    total_likes = likes_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(func.distinct(Game.author_id))).where(Game.is_published == True)
    )
    active_users = active_result.scalar() or 0

    return PlatformStatsResponse(
        total_users=total_users,
        total_games=total_games,
        published_games=published_games,
        total_likes=total_likes,
        active_users=active_users,
    )
