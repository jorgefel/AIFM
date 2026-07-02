# ─────────────────────────────────────────────────────────────
# tests/models/test_financial_precision.py
# Valida que Numeric(10,2) retiene la precisión financiera
# sin errores de redondeo al insertar y recuperar datos.
# ─────────────────────────────────────────────────────────────
import uuid
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.models import User, Property, Reservation, Expense


@pytest.mark.asyncio
async def test_reservation_numeric_precision(db_session):
    """Verifica que los montos de reservación mantienen 2 decimales exactos."""
    # Crear usuario y propiedad de prueba
    user_id = uuid.uuid4()
    prop_id = uuid.uuid4()

    user = User(
        id=user_id,
        email=f"test-{user_id}@precision.test",
        hashed_password="$2b$12$test_hash",
        full_name="Test Precision User",
        role="admin",
    )
    db_session.add(user)

    prop = Property(
        id=prop_id,
        name="Test Precision Property",
        address="123 Test St",
        currency="MXN",
        owner_id=user_id,
    )
    db_session.add(prop)
    await db_session.flush()

    # Insertar reservación con montos que suelen causar errores de punto flotante
    reservation = Reservation(
        property_id=prop_id,
        guest_name="Precision Test Guest",
        check_in=date(2025, 1, 1),
        check_out=date(2025, 1, 5),
        total_amount=Decimal("9999.99"),
        platform_fee=Decimal("1499.99"),
        net_amount=Decimal("8500.00"),
        currency="MXN",
        platform="airbnb",
        status="confirmed",
    )
    db_session.add(reservation)
    await db_session.flush()

    # Recuperar y validar precisión
    result = await db_session.execute(
        select(Reservation).where(Reservation.id == reservation.id)
    )
    retrieved = result.scalar_one()

    assert retrieved.total_amount == Decimal("9999.99"), (
        f"total_amount perdió precisión: {retrieved.total_amount}"
    )
    assert retrieved.platform_fee == Decimal("1499.99"), (
        f"platform_fee perdió precisión: {retrieved.platform_fee}"
    )
    assert retrieved.net_amount == Decimal("8500.00"), (
        f"net_amount perdió precisión: {retrieved.net_amount}"
    )


@pytest.mark.asyncio
async def test_expense_numeric_precision(db_session):
    """Verifica que los montos de gasto mantienen 2 decimales exactos."""
    user_id = uuid.uuid4()
    prop_id = uuid.uuid4()

    user = User(
        id=user_id,
        email=f"test-{user_id}@expense-precision.test",
        hashed_password="$2b$12$test_hash",
        full_name="Test Expense Precision",
        role="admin",
    )
    db_session.add(user)

    prop = Property(
        id=prop_id,
        name="Test Expense Property",
        address="456 Test Ave",
        currency="USD",
        owner_id=user_id,
    )
    db_session.add(prop)
    await db_session.flush()

    # Usar un valor que es problemático en punto flotante (ej. 0.1 + 0.2 ≠ 0.3)
    expense = Expense(
        property_id=prop_id,
        description="Precision edge case",
        amount=Decimal("0.10"),
        category="supplies",
        date=date(2025, 1, 1),
        currency="USD",
    )
    db_session.add(expense)
    await db_session.flush()

    result = await db_session.execute(
        select(Expense).where(Expense.id == expense.id)
    )
    retrieved = result.scalar_one()

    assert retrieved.amount == Decimal("0.10"), (
        f"amount perdió precisión: {retrieved.amount}"
    )


@pytest.mark.asyncio
async def test_boundary_values(db_session):
    """Verifica los valores límite de Numeric(10,2): máximo y cero."""
    user_id = uuid.uuid4()
    prop_id = uuid.uuid4()

    user = User(
        id=user_id,
        email=f"test-{user_id}@boundary.test",
        hashed_password="$2b$12$test_hash",
        full_name="Test Boundary",
        role="admin",
    )
    db_session.add(user)

    prop = Property(
        id=prop_id,
        name="Test Boundary Property",
        address="789 Test Blvd",
        currency="MXN",
        owner_id=user_id,
    )
    db_session.add(prop)
    await db_session.flush()

    # Valor máximo para Numeric(10,2): 99999999.99
    reservation_max = Reservation(
        property_id=prop_id,
        guest_name="Max Amount Guest",
        check_in=date(2025, 1, 1),
        check_out=date(2025, 1, 2),
        total_amount=Decimal("99999999.99"),
        platform_fee=Decimal("0.00"),
        net_amount=Decimal("99999999.99"),
        currency="MXN",
        platform="direct",
        status="confirmed",
    )
    db_session.add(reservation_max)

    # Valor cero
    reservation_zero = Reservation(
        property_id=prop_id,
        guest_name="Zero Fee Guest",
        check_in=date(2025, 2, 1),
        check_out=date(2025, 2, 2),
        total_amount=Decimal("500.00"),
        platform_fee=Decimal("0.00"),
        net_amount=Decimal("500.00"),
        currency="MXN",
        platform="direct",
        status="confirmed",
    )
    db_session.add(reservation_zero)
    await db_session.flush()

    # Verificar max
    result_max = await db_session.execute(
        select(Reservation).where(Reservation.id == reservation_max.id)
    )
    max_retrieved = result_max.scalar_one()
    assert max_retrieved.total_amount == Decimal("99999999.99")

    # Verificar zero
    result_zero = await db_session.execute(
        select(Reservation).where(Reservation.id == reservation_zero.id)
    )
    zero_retrieved = result_zero.scalar_one()
    assert zero_retrieved.platform_fee == Decimal("0.00")
    assert zero_retrieved.net_amount == Decimal("500.00")
