import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models import Expense, Property, Reservation, User

logger = logging.getLogger(__name__)
DEMO_DURATION = timedelta(hours=2)
DEMO_CLEANUP_INTERVAL_SECONDS = 10 * 60


async def create_demo_workspace(db: AsyncSession, *, now: datetime | None = None) -> User:
    """Create an isolated, synthetic Pro workspace for a short-lived demo."""
    created_at = now or datetime.now(timezone.utc)
    user = User(
        email=f"demo-{uuid4()}@demo.nomora.app",
        full_name="Demostración Nomora",
        role="admin",
        tier="pro",
        onboarding_completed=True,
        onboarding_completed_at=created_at,
        demo_expires_at=created_at + DEMO_DURATION,
    )
    db.add(user)
    await db.flush()

    property_ = Property(
        name="Apartamento demo Cartagena",
        address="Datos simulados — Cartagena",
        currency="COP",
        property_type="apartment",
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        nightly_rate=Decimal("420000.00"),
        owner_id=user.id,
    )
    db.add(property_)
    await db.flush()

    db.add_all(
        [
            Reservation(
                property_id=property_.id,
                guest_name="Huésped simulado",
                check_in=date(2026, 11, 7),
                check_out=date(2026, 11, 10),
                total_amount=Decimal("1260000.00"),
                platform_fee=Decimal("189000.00"),
                net_amount=Decimal("1071000.00"),
                currency="COP",
                platform="simulado",
                status="confirmed",
            ),
            Reservation(
                property_id=property_.id,
                guest_name="Huésped simulado",
                check_in=date(2026, 12, 20),
                check_out=date(2026, 12, 24),
                total_amount=Decimal("1680000.00"),
                platform_fee=Decimal("252000.00"),
                net_amount=Decimal("1428000.00"),
                currency="COP",
                platform="simulado",
                status="confirmed",
            ),
            Expense(
                property_id=property_.id,
                description="Limpieza — dato simulado",
                amount=Decimal("180000.00"),
                category="cleaning",
                date=date(2026, 11, 1),
                currency="COP",
            ),
        ]
    )
    return user


async def delete_expired_demo_workspaces(db: AsyncSession, *, now: datetime | None = None) -> int:
    """Delete only expired demo data, in FK order and without loading it into memory."""
    current_time = now or datetime.now(timezone.utc)
    expired_users = select(User.id).where(User.demo_expires_at <= current_time)
    expired_properties = select(Property.id).where(Property.owner_id.in_(expired_users))

    await db.execute(delete(Reservation).where(Reservation.property_id.in_(expired_properties)))
    await db.execute(delete(Expense).where(Expense.property_id.in_(expired_properties)))
    await db.execute(delete(Property).where(Property.owner_id.in_(expired_users)))
    result = await db.execute(delete(User).where(User.id.in_(expired_users)))
    await db.commit()
    return result.rowcount or 0


async def run_demo_cleanup_forever() -> None:
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await delete_expired_demo_workspaces(db)
        except Exception:
            logger.exception("Demo workspace cleanup failed")
        await asyncio.sleep(DEMO_CLEANUP_INTERVAL_SECONDS)
