# ─────────────────────────────────────────────────────────────
# app/models/reservation.py — Modelo de Reservación
# Soft delete: status = "cancelled"
# FK indexada: property_id
# Montos: Numeric(10,2) — precisión financiera
# net_amount: calculado 100% server-side
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property


class Reservation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reservations"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,  # Índice explícito para queries de multi-tenancy
    )
    guest_name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    check_in: Mapped[date] = mapped_column(
        Date, nullable=False, index=True  # Index for monthly date-range filtering
    )
    check_out: Mapped[date] = mapped_column(
        Date, nullable=False, index=True  # Index for monthly date-range filtering
    )

    # ── Montos financieros (Numeric(10,2) estricto) ──────────
    total_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    platform_fee: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    net_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
        # Calculado server-side: total_amount - platform_fee
    )

    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="MXN"  # "USD" | "MXN" | "EUR"
    )
    platform: Mapped[str] = mapped_column(
        String(20), nullable=False  # "airbnb" | "booking" | "vrbo" | "direct"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="confirmed"
        # "confirmed" | "pending" | "cancelled" (Soft delete) | "completed"
    )
    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # ── Relaciones ───────────────────────────────────────────
    property: Mapped[Property] = relationship(
        "Property", back_populates="reservations", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Reservation {self.guest_name} @ {self.check_in}>"
