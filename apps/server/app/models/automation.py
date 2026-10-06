import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class AutomationAction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "automation_actions"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "adjust_price", "send_message", "block_dates"
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict) # JSON configuration for the action
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft") # "draft", "pending_approval", "executed", "failed", "cancelled"
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    user: Mapped["User"] = relationship("User", lazy="raise")
    property: Mapped["Property"] = relationship("Property", lazy="raise")

class AuditLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "audit_logs"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False) # "password_changed", "action_approved", "login", etc.
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    user: Mapped["User"] = relationship("User", lazy="raise")
