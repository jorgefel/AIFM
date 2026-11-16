# ─────────────────────────────────────────────────────────────
# app/models/__init__.py — Re-exportar todos los modelos
# Alembic necesita que todos estén importados para autogenerar migraciones.
# ─────────────────────────────────────────────────────────────
from app.models.user import User  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.reservation import Reservation  # noqa: F401
from app.models.expense import Expense  # noqa: F401
from app.models.dashboard import DashboardLayout  # noqa: F401
from app.models.subscription import Subscription, BillingEvent  # noqa: F401
from app.models.integration import ChannelConnection, SyncLog, ChannelInventoryDay, Beds24PropertyLink, OtaConnection  # noqa: F401
from app.models.market_snapshot import MarketSnapshot  # noqa: F401
from app.models.chatbot_advice import ChatbotAdvice  # noqa: F401

__all__ = [
    "User", "Property", "Reservation", "Expense", "DashboardLayout", 
    "Subscription", "BillingEvent", "ChannelConnection", "SyncLog", 
    "ChannelInventoryDay", "Beds24PropertyLink", "OtaConnection", "MarketSnapshot", "ChatbotAdvice"
]

from app.models.chat import AIChatSession, AIChatMessage

from app.models.automation import AutomationAction, AuditLog
