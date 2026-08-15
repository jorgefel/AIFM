# ─────────────────────────────────────────────────────────────
# app/models/expense.py — Modelo de Gasto
# Soft delete: is_deleted
# FK indexada: property_id
# Montos: Numeric(10,2) — precisión financiera
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property


class Expense(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expenses"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,  # Índice explícito para queries de multi-tenancy
    )
    description: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(30), nullable=False
        # "cleaning" | "maintenance" | "supplies" | "utilities"
        # "platform_fees" | "taxes" | "insurance" | "marketing" | "other"
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False, index=True  # Index for monthly date-range filtering
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="MXN"  # "USD" | "MXN" | "EUR"
    )
    receipt_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True  # URL al comprobante (local o S3)
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False  # Soft delete
    )

    # ── Relaciones ───────────────────────────────────────────
    property: Mapped[Property] = relationship(
        "Property", back_populates="expenses", lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<Expense {self.description} ${self.amount}>"
