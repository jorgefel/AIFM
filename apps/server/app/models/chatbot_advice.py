# ─────────────────────────────────────────────────────────────
# app/models/chatbot_advice.py — Memoria de consejos deterministas
# D6: Guarda solo lo que recomendó el backend determinista, nunca texto de LLM.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date
from typing import Any, TYPE_CHECKING
import uuid

from sqlalchemy import Date, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.property import Property


class ChatbotAdvice(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chatbot_advice"
    __table_args__ = (
        UniqueConstraint(
            "property_id",
            "rec_key",
            "as_of_month",
            name="uq_chatbot_advice_property_rec_month",
        ),
    )

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rec_key: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    action: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    evidence_json: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list, server_default="[]"
    )
    metrics_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict, server_default="{}"
    )
    as_of: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    as_of_month: Mapped[str] = mapped_column(
        String(7), nullable=False, index=True  # Formato "YYYY-MM"
    )

    # ── Relaciones ───────────────────────────────────────────
    property: Mapped[Property] = relationship("Property", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ChatbotAdvice {self.rec_key} on {self.as_of_month} for property {self.property_id}>"
