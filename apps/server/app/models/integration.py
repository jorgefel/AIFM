# ─────────────────────────────────────────────────────────────
# app/models/integration.py — Modelos para integraciones de canales
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.property import Property

class ChannelConnection(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "channel_connections"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    channel_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # "beds24"
    channel_account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    credentials: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped[User] = relationship("User", back_populates="channels", lazy="raise")
    sync_logs: Mapped[list[SyncLog]] = relationship("SyncLog", back_populates="connection", lazy="raise", cascade="all, delete-orphan")
    inventory_days: Mapped[list[ChannelInventoryDay]] = relationship("ChannelInventoryDay", back_populates="connection", lazy="raise", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ChannelConnection {self.channel_name} - User {self.user_id}>"

class SyncLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sync_logs"

    channel_connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channel_connections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sync_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "inventory", "bookings"
    status: Mapped[str] = mapped_column(String(20), nullable=False) # "success", "error", "pending"
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    records_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    connection: Mapped[ChannelConnection] = relationship("ChannelConnection", back_populates="sync_logs", lazy="raise")

class ChannelInventoryDay(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "channel_inventory_days"

    channel_connection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("channel_connections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    available_units: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    connection: Mapped[ChannelConnection] = relationship("ChannelConnection", back_populates="inventory_days", lazy="raise")
    property: Mapped[Property] = relationship("Property", lazy="raise")
