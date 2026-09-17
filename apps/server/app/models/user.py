# ─────────────────────────────────────────────────────────────
# app/models/user.py — Modelo de Usuario
# Soft delete: is_active (cascada lógica a properties)
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
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

    # ── Relaciones ───────────────────────────────────────────
    properties: Mapped[list[Property]] = relationship(
        "Property", back_populates="owner", lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
