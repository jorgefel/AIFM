"""Script de sembrado de datos sintéticos para demostración de Nomora.

Genera 24 meses de historial financiero realista (reservas y gastos)
para una propiedad de prueba, reflejando estacionalidad y categorías variadas.

Idempotente: Si la propiedad demo ya cuenta con datos suficientes, no duplica.
"""

import asyncio
from datetime import date, timedelta
from decimal import Decimal
import logging
from typing import Any
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.expense import Expense
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.user import User

logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo-analitica@nomora.app"
DEMO_PROPERTY_NAME = "Apartamento Vista Mar - Bocagrande"


def _month_year_sub(year: int, month: int, months_back: int) -> tuple[int, int]:
    """Resta `months_back` meses a una fecha (año, mes)."""
    total_months = year * 12 + (month - 1) - months_back
    return total_months // 12, (total_months % 12) + 1


def _get_season_multiplier(month: int) -> float:
    """Multiplicador de estacionalidad turística para Cartagena / Caribe.
    
    Temporada alta: Diciembre (12), Enero (1), Julio (7), Agosto (8), Semana Santa (mar/abr).
    Temporada media: Marzo (3), Abril (4), Junio (6), Noviembre (11).
    Temporada baja: Febrero (2), Mayo (5), Septiembre (9), Octubre (10).
    """
    if month in (12, 1):
        return 1.45
    elif month in (7, 8):
        return 1.35
    elif month in (3, 4, 6, 11):
        return 1.10
    else:
        return 0.85


async def seed_demo_data(
    db: AsyncSession,
    *,
    ref_year: int = 2026,
    ref_month: int = 11,
) -> dict[str, Any]:
    """Siembra 24 meses de historial sintético de forma idempotente."""
    # 1. Obtener o crear usuario demo Pro
    stmt_user = select(User).where(User.email == DEMO_USER_EMAIL)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=DEMO_USER_EMAIL,
            full_name="Anfitrión Demo Nomora",
            role="admin",
            tier="pro",
            onboarding_completed=True,
        )
        db.add(user)
        await db.flush()

    # 2. Obtener o crear propiedad demo
    stmt_prop = select(Property).where(
        Property.owner_id == user.id,
        Property.name == DEMO_PROPERTY_NAME,
        Property.is_active.is_(True),
    )
    res_prop = await db.execute(stmt_prop)
    prop = res_prop.scalar_one_or_none()

    if not prop:
        prop = Property(
            id=uuid.uuid4(),
            owner_id=user.id,
            name=DEMO_PROPERTY_NAME,
            address="Carrera 1 # 10-20, Bocagrande, Cartagena",
            city="Cartagena",
            country="Colombia",
            neighborhood="Bocagrande",
            currency="COP",
            property_type="apartment",
            max_guests=4,
            bedrooms=2,
            bathrooms=2,
            nightly_rate=Decimal("380000.00"),
            amenities=["wifi", "aire_acondicionado", "piscina", "cocina", "vista_mar", "ascensor"],
            published_platforms=["airbnb", "booking", "direct"],
        )
        db.add(prop)
        await db.flush()

    # 3. Verificar idempotencia: si ya tiene 24 o más reservas, no duplicar
    stmt_count = select(func.count(Reservation.id)).where(Reservation.property_id == prop.id)
    count_res = await db.scalar(stmt_count) or 0

    if count_res >= 24:
        return {
            "status": "skipped",
            "message": f"La propiedad demo '{prop.name}' ya cuenta con {count_res} reservas sintéticas.",
            "property_id": str(prop.id),
            "reservations_count": count_res,
        }

    # 4. Generar 24 meses de reservas y gastos
    # shortcut: generamos patrones sinusoidales/estacionales deterministas con semilla temporal fija
    guest_names = [
        "Carlos Mendoza", "Laura Gómez", "David Smith", "Elena Torres",
        "Jean Dupont", "Sofía Herrera", "Mateo Silva", "Camila Restrepo",
        "Alexander Müller", "Valentina Rojas", "Andrés Cepeda", "Mariana Ochoa",
    ]
    platforms = ["airbnb", "booking", "airbnb", "direct", "booking", "vrbo"]

    reservations_to_add: list[Reservation] = []
    expenses_to_add: list[Expense] = []

    # Recorrer 24 meses desde 23 meses atrás hasta el mes de referencia
    for offset in range(23, -1, -1):
        y, m = _month_year_sub(ref_year, ref_month, offset)
        mult = _get_season_multiplier(m)

        # Número de reservas del mes según estacionalidad (3 a 6)
        num_reservations = int(round(3 * mult))
        num_reservations = max(2, min(num_reservations, 6))

        # Tarifa nocturna ajustada por temporada
        base_rate = Decimal("380000.00") * Decimal(str(round(mult, 2)))

        # Días distribuidos en el mes
        # shortcut: bloques fijos que no se traslapan dentro del mes
        day_blocks = [
            (2, 6),    # 4 noches
            (8, 12),   # 4 noches
            (14, 19),  # 5 noches
            (21, 24),  # 3 noches
            (25, 28),  # 3 noches
            (28, 30),  # 2 noches
        ]

        for r_idx in range(num_reservations):
            d_start, d_end = day_blocks[r_idx]
            check_in = date(y, m, d_start)
            check_out = date(y, m, d_end)
            nights = (check_out - check_in).days

            platform = platforms[(offset + r_idx) % len(platforms)]
            guest = guest_names[(offset * 2 + r_idx) % len(guest_names)]

            total_amount = Decimal(nights) * base_rate
            # Comisiones de plataforma
            fee_pct = Decimal("0.15") if platform in ("airbnb", "booking") else (
                Decimal("0.03") if platform == "direct" else Decimal("0.10")
            )
            platform_fee = (total_amount * fee_pct).quantize(Decimal("0.01"))
            net_amount = total_amount - platform_fee

            # Si es el mes de referencia o anterior, marcamos confirmada o completada
            is_past = (y < ref_year) or (y == ref_year and m < ref_month)
            status = "completed" if is_past else "confirmed"

            reservations_to_add.append(
                Reservation(
                    id=uuid.uuid4(),
                    property_id=prop.id,
                    guest_name=guest,
                    check_in=check_in,
                    check_out=check_out,
                    total_amount=total_amount.quantize(Decimal("0.01")),
                    platform_fee=platform_fee,
                    net_amount=net_amount.quantize(Decimal("0.01")),
                    currency="COP",
                    platform=platform,
                    status=status,
                    sync_source="demo_seed",
                )
            )

            # Gasto de limpieza asociado a cada reserva
            expenses_to_add.append(
                Expense(
                    id=uuid.uuid4(),
                    property_id=prop.id,
                    description=f"Limpieza checkout {guest}",
                    amount=Decimal("120000.00"),
                    category="cleaning",
                    date=check_out,
                    currency="COP",
                    is_deleted=False,
                )
            )

        # Gastos fijos y operativos mensuales
        # Servicios públicos
        expenses_to_add.append(
            Expense(
                id=uuid.uuid4(),
                property_id=prop.id,
                description=f"Servicios públicos {y}-{m:02d} (luz, agua, internet)",
                amount=Decimal(str(round(350000 * mult, 2))),
                category="utilities",
                date=date(y, m, 15),
                currency="COP",
                is_deleted=False,
            )
        )

        # Suministros (amenities y lencería)
        expenses_to_add.append(
            Expense(
                id=uuid.uuid4(),
                property_id=prop.id,
                description="Reposición suministros y amenidades",
                amount=Decimal("160000.00"),
                category="supplies",
                date=date(y, m, 5),
                currency="COP",
                is_deleted=False,
            )
        )

        # Mantenimiento preventivo / correctivo (cada 3 meses)
        if m in (2, 5, 8, 11):
            expenses_to_add.append(
                Expense(
                    id=uuid.uuid4(),
                    property_id=prop.id,
                    description="Mantenimiento preventivo aire acondicionado y cerrajería",
                    amount=Decimal("280000.00"),
                    category="maintenance",
                    date=date(y, m, 20),
                    currency="COP",
                    is_deleted=False,
                )
            )

        # Impuestos trimestrales
        if m in (3, 6, 9, 12):
            expenses_to_add.append(
                Expense(
                    id=uuid.uuid4(),
                    property_id=prop.id,
                    description="Impuesto predial / municipal trimestral",
                    amount=Decimal("450000.00"),
                    category="taxes",
                    date=date(y, m, 25),
                    currency="COP",
                    is_deleted=False,
                )
            )

    db.add_all(reservations_to_add)
    db.add_all(expenses_to_add)
    await db.commit()

    return {
        "status": "seeded",
        "message": f"Sembrados exitosamente 24 meses para '{prop.name}'.",
        "property_id": str(prop.id),
        "property_name": prop.name,
        "reservations_count": len(reservations_to_add),
        "expenses_count": len(expenses_to_add),
    }


async def main() -> None:
    """Punto de entrada de línea de comandos."""
    logging.basicConfig(level=logging.INFO)
    print("Iniciando sembrado de datos demo para Nomora...")
    async with AsyncSessionLocal() as session:
        result = await seed_demo_data(session)
        print(f"Resultado: {result}")


if __name__ == "__main__":
    asyncio.run(main())
