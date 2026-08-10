# ─────────────────────────────────────────────────────────────
# app/models/dashboard.py — Modelo de Dashboard Layout
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class DashboardLayout(Base, UUIDMixin, TimestampMixin):
    """
    Guarda la configuración del grid de widgets del usuario.
    Se utiliza JSONB para guardar el array del layout entero, ya que
    las librerías de UI (como react-grid-layout) consumen y producen
    el layout como un array de objetos masivo.
    """
    __tablename__ = "dashboard_layouts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False, 
        index=True
    )
    
    layout_data: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )

    # ── Relaciones ───────────────────────────────────────────
    user: Mapped[User] = relationship(
        "User", backref="dashboard_layout", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<DashboardLayout user_id={self.user_id}>"
