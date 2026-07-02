# ─────────────────────────────────────────────────────────────
# app/core/seed.py — Datos de prueba para desarrollo
# Ejecutar:  python -m app.core.seed  (desde apps/server/)
# ─────────────────────────────────────────────────────────────
import asyncio
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.models import User, Property, Reservation, Expense


# ── IDs fijos para consistencia en desarrollo ────────────────
ADMIN_ID = uuid.UUID("00000000-0000-4000-a000-000000000001")
PROP_TULUM_ID = uuid.UUID("00000000-0000-4000-a000-000000000010")
PROP_CDMX_ID = uuid.UUID("00000000-0000-4000-a000-000000000011")
PROP_CANCUN_ID = uuid.UUID("00000000-0000-4000-a000-000000000012")


async def seed() -> None:
    """Inserta datos de prueba si la BD está vacía."""
    async with AsyncSessionLocal() as session:
        # Verificar si ya hay datos
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            print("⚠️  La base de datos ya tiene datos. Seed cancelado.")
            return

        # ── Usuario Admin ────────────────────────────────────
        admin = User(
            id=ADMIN_ID,
            email="admin@aifm.dev",
            hashed_password="$2b$12$placeholder_hash_change_me",  # Se reemplazará con hash real en Fase 2
            full_name="Jorge Fernández",
            role="admin",
            is_active=True,
        )
        session.add(admin)

        # ── Propiedades ──────────────────────────────────────
        props = [
            Property(
                id=PROP_TULUM_ID,
                name="Villa Tulum",
                address="Calle Orquídeas 42, Tulum, Q.Roo, México",
                currency="MXN",
                owner_id=ADMIN_ID,
                is_active=True,
            ),
            Property(
                id=PROP_CDMX_ID,
                name="CDMX Loft",
                address="Av. Ámsterdam 123, Condesa, CDMX, México",
                currency="MXN",
                owner_id=ADMIN_ID,
                is_active=True,
            ),
            Property(
                id=PROP_CANCUN_ID,
                name="Cancún Suite",
                address="Blvd. Kukulcán Km 12, Zona Hotelera, Cancún, Q.Roo",
                currency="USD",
                owner_id=ADMIN_ID,
                is_active=True,
            ),
        ]
        session.add_all(props)

        # ── Reservaciones ────────────────────────────────────
        reservations = [
            Reservation(
                property_id=PROP_TULUM_ID,
                guest_name="María García",
                check_in=date(2025, 6, 1),
                check_out=date(2025, 6, 5),
                total_amount=Decimal("8500.00"),
                platform_fee=Decimal("1275.00"),
                net_amount=Decimal("7225.00"),
                currency="MXN",
                platform="airbnb",
                status="completed",
            ),
            Reservation(
                property_id=PROP_TULUM_ID,
                guest_name="John Smith",
                check_in=date(2025, 6, 10),
                check_out=date(2025, 6, 15),
                total_amount=Decimal("12000.00"),
                platform_fee=Decimal("1800.00"),
                net_amount=Decimal("10200.00"),
                currency="MXN",
                platform="booking",
                status="completed",
            ),
            Reservation(
                property_id=PROP_TULUM_ID,
                guest_name="Ana López",
                check_in=date(2025, 7, 1),
                check_out=date(2025, 7, 8),
                total_amount=Decimal("15400.00"),
                platform_fee=Decimal("2310.00"),
                net_amount=Decimal("13090.00"),
                currency="MXN",
                platform="airbnb",
                status="confirmed",
            ),
            Reservation(
                property_id=PROP_CDMX_ID,
                guest_name="Carlos Ruiz",
                check_in=date(2025, 6, 5),
                check_out=date(2025, 6, 8),
                total_amount=Decimal("4500.00"),
                platform_fee=Decimal("675.00"),
                net_amount=Decimal("3825.00"),
                currency="MXN",
                platform="vrbo",
                status="completed",
            ),
            Reservation(
                property_id=PROP_CDMX_ID,
                guest_name="Emily Chen",
                check_in=date(2025, 6, 20),
                check_out=date(2025, 6, 25),
                total_amount=Decimal("7500.00"),
                platform_fee=Decimal("1125.00"),
                net_amount=Decimal("6375.00"),
                currency="MXN",
                platform="airbnb",
                status="completed",
            ),
            Reservation(
                property_id=PROP_CANCUN_ID,
                guest_name="Robert Johnson",
                check_in=date(2025, 6, 1),
                check_out=date(2025, 6, 7),
                total_amount=Decimal("1200.00"),
                platform_fee=Decimal("180.00"),
                net_amount=Decimal("1020.00"),
                currency="USD",
                platform="airbnb",
                status="completed",
            ),
            Reservation(
                property_id=PROP_CANCUN_ID,
                guest_name="Sophie Martin",
                check_in=date(2025, 7, 10),
                check_out=date(2025, 7, 17),
                total_amount=Decimal("1750.00"),
                platform_fee=Decimal("262.50"),
                net_amount=Decimal("1487.50"),
                currency="USD",
                platform="direct",
                status="pending",
            ),
            Reservation(
                property_id=PROP_TULUM_ID,
                guest_name="Pedro Martínez",
                check_in=date(2025, 5, 15),
                check_out=date(2025, 5, 18),
                total_amount=Decimal("6000.00"),
                platform_fee=Decimal("900.00"),
                net_amount=Decimal("5100.00"),
                currency="MXN",
                platform="airbnb",
                status="cancelled",
                notes="Cancelación por parte del huésped, sin penalidad.",
            ),
        ]
        session.add_all(reservations)

        # ── Gastos ───────────────────────────────────────────
        expenses = [
            Expense(
                property_id=PROP_TULUM_ID,
                description="Limpieza post-checkout (María García)",
                amount=Decimal("450.00"),
                category="cleaning",
                date=date(2025, 6, 5),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_TULUM_ID,
                description="Reparación aire acondicionado",
                amount=Decimal("2800.00"),
                category="maintenance",
                date=date(2025, 6, 8),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_TULUM_ID,
                description="Suministros de amenidades (jabones, shampoo)",
                amount=Decimal("350.00"),
                category="supplies",
                date=date(2025, 6, 1),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_TULUM_ID,
                description="Recibo de luz - Junio 2025",
                amount=Decimal("1200.00"),
                category="utilities",
                date=date(2025, 6, 30),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_CDMX_ID,
                description="Limpieza profunda mensual",
                amount=Decimal("600.00"),
                category="cleaning",
                date=date(2025, 6, 15),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_CDMX_ID,
                description="Seguro de propiedad - Trimestre 2",
                amount=Decimal("3500.00"),
                category="insurance",
                date=date(2025, 6, 1),
                currency="MXN",
            ),
            Expense(
                property_id=PROP_CANCUN_ID,
                description="Pool maintenance service",
                amount=Decimal("85.00"),
                category="maintenance",
                date=date(2025, 6, 10),
                currency="USD",
            ),
            Expense(
                property_id=PROP_CANCUN_ID,
                description="Cleaning service (Robert Johnson checkout)",
                amount=Decimal("45.00"),
                category="cleaning",
                date=date(2025, 6, 7),
                currency="USD",
            ),
            Expense(
                property_id=PROP_CANCUN_ID,
                description="Airbnb promotional listing boost",
                amount=Decimal("25.00"),
                category="marketing",
                date=date(2025, 6, 1),
                currency="USD",
            ),
            Expense(
                property_id=PROP_TULUM_ID,
                description="Impuesto predial - Junio 2025",
                amount=Decimal("800.00"),
                category="taxes",
                date=date(2025, 6, 15),
                currency="MXN",
            ),
        ]
        session.add_all(expenses)

        await session.commit()
        print("✅  Seed completado:")
        print(f"    → 1 usuario (admin@aifm.dev)")
        print(f"    → 3 propiedades")
        print(f"    → {len(reservations)} reservaciones")
        print(f"    → {len(expenses)} gastos")


async def main() -> None:
    seed_data = await seed()


if __name__ == "__main__":
    asyncio.run(main())
