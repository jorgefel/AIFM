from __future__ import annotations
import uuid
from sqlalchemy import ForeignKey, String, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

class AIChatSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_chat_sessions"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False, default="Nueva conversación")
    message_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    user: Mapped["User"] = relationship("User", lazy="raise")
    property: Mapped["Property"] = relationship("Property", lazy="raise")
    messages: Mapped[list["AIChatMessage"]] = relationship("AIChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="raise")

class AIChatMessage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_chat_messages"
    
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False) # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # Metadatos para fuentes, tokens y costo
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    
    session: Mapped["AIChatSession"] = relationship("AIChatSession", back_populates="messages", lazy="raise")
