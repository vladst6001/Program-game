import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(Text, default="{}")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[int] = mapped_column(Integer, default=0)
    creator_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class GameLike(Base):
    __tablename__ = "game_likes"
    __table_args__ = (UniqueConstraint("user_id", "game_id", name="uq_game_like"),)

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GamePurchase(Base):
    __tablename__ = "game_purchases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
