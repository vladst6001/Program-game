import random
import string
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

sms_codes: dict[str, tuple[str, datetime]] = {}


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(
        self,
        name: str,
        phone: str | None = None,
        email: str | None = None,
        password: str = "",
    ) -> User:
        if phone:
            existing = await self.db.execute(select(User).where(User.phone == phone))
            if existing.scalar_one_or_none():
                raise ValueError("Phone number already registered")

        if email:
            existing = await self.db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none():
                raise ValueError("Email already registered")

        password_hash = pwd_context.hash(password) if password else None
        user = User(name=name, phone=phone, email=email, password_hash=password_hash)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def login(self, phone: str, password: str) -> str:
        result = await self.db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        if not user.password_hash:
            raise ValueError("User has no password set")

        if not pwd_context.verify(password, user.password_hash):
            raise ValueError("Invalid password")

        return self.create_token(user.id)

    def send_sms_code(self, phone: str) -> str:
        code = "".join(random.choices(string.digits, k=6))
        sms_codes[phone] = (code, datetime.now(timezone.utc) + timedelta(minutes=5))
        return code

    def verify_sms_code(self, phone: str, code: str) -> bool:
        if phone not in sms_codes:
            return False
        stored_code, expires_at = sms_codes[phone]
        if datetime.now(timezone.utc) > expires_at:
            del sms_codes[phone]
            return False
        if stored_code != code:
            return False
        del sms_codes[phone]
        return True

    def create_token(self, user_id) -> str:
        payload = {
            "sub": str(user_id),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    async def get_current_user(self, token: str) -> User:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

        import uuid

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")

        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            raise ValueError("Invalid user ID in token")

        result = await self.db.execute(select(User).where(User.id == uid))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return user
