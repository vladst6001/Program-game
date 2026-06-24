from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        user = await service.register(
            name=request.name,
            phone=request.phone,
            email=request.email,
            password=request.password,
        )
        token = service.create_token(user.id)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        token = await service.login(phone=request.phone, password=request.password)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/send-code")
async def send_code(request: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    code = service.send_sms_code(request.phone)
    return {"success": True, "message": "Code sent", "debug_code": code}


@router.post("/verify-code")
async def verify_code(request: VerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    valid = service.verify_sms_code(phone=request.phone, code=request.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")
    return {"success": True}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "friends_count": user.friends_count,
        "games_count": user.games_count,
        "created_at": user.created_at.isoformat(),
    }
