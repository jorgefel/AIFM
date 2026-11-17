import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.reservation import Reservation
    from app.models.user import User


class Guest(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "guests"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    document_or_keyword: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    __table_args__ = (
        Index(
            "uq_guests_owner_document_or_keyword",
            "owner_id",
            "document_or_keyword",
            unique=True,
            postgresql_where=text("document_or_keyword IS NOT NULL"),
        ),
    )

    owner: Mapped["User"] = relationship("User", lazy="selectin")
    reservations: Mapped[List["Reservation"]] = relationship(
        "Reservation", back_populates="guest", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Guest {self.first_name} {self.last_name}>"
