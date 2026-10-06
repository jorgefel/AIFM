# ─────────────────────────────────────────────────────────────
# app/models/user.py — Modelo de Usuario
# Soft delete: is_active (cascada lógica a properties)
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property
    from app.models.subscription import Subscription
    from app.models.integration import ChannelConnection


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    apple_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    auth_provider: Mapped[str] = mapped_column(
        String(20), nullable=False, default="email", server_default="email"
    )
    full_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="admin"  # "admin" | "viewer"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True  # Soft delete
    )
    tier: Mapped[str] = mapped_column(
        String(10), nullable=False, default="free"  # "free" | "pro"
    )
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rental_experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    average_monthly_reservations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    previous_platforms: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list, server_default="[]"
    )
    preferences: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict, server_default="{}"
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relaciones ───────────────────────────────────────────
    properties: Mapped[list[Property]] = relationship(
        "Property", back_populates="owner", lazy="selectin"
    )
    subscriptions: Mapped[list[Subscription]] = relationship(
        "Subscription", back_populates="user", lazy="raise"
    )
    channels: Mapped[list[ChannelConnection]] = relationship(
        "ChannelConnection", back_populates="user", lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
