# ─────────────────────────────────────────────────────────────
# app/models/property.py — Modelo de Propiedad
# Soft delete: is_active
# FK indexada: owner_id
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.expense import Expense
    from app.models.reservation import Reservation
    from app.models.user import User


class Property(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "properties"

    name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    address: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="MXN"  # "USD" | "MXN" | "EUR"
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,  # Índice explícito para queries de multi-tenancy
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True  # Soft delete
    )

    # ── Relaciones ───────────────────────────────────────────
    owner: Mapped[User] = relationship(
        "User", back_populates="properties", lazy="selectin"
    )
    reservations: Mapped[list[Reservation]] = relationship(
        "Reservation", back_populates="property", lazy="selectin"
    )
    expenses: Mapped[list[Expense]] = relationship(
        "Expense", back_populates="property", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Property {self.name}>"
