# ─────────────────────────────────────────────────────────────
# app/models/market_snapshot.py — Snapshots compactos de mercado en Postgres
# Persiste el historial de comparaciones sin depender de la caducidad de Redis.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property


class MarketSnapshot(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "market_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "property_id", "snapshot_date", name="uq_market_snapshots_property_date"
        ),
    )

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    snapshot_date: Mapped[date] = mapped_column(
        Date, nullable=False, default=date.today
    )
    comparables_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    median_price: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    price_min: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    price_max: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    own_price: Mapped[float | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    position: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="MXN"
    )

    # ── Relaciones ───────────────────────────────────────────
    property: Mapped[Property] = relationship("Property", lazy="selectin")

    def __repr__(self) -> str:
        return f"<MarketSnapshot {self.property_id} on {self.snapshot_date}>"
