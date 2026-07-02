# ─────────────────────────────────────────────────────────────
# app/models/__init__.py — Re-exportar todos los modelos
# Alembic necesita que todos estén importados para autogenerar migraciones.
# ─────────────────────────────────────────────────────────────
from app.models.user import User  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.reservation import Reservation  # noqa: F401
from app.models.expense import Expense  # noqa: F401

__all__ = ["User", "Property", "Reservation", "Expense"]
