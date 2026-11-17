"""Pruebas unitarias para finanzas consolidadas ('Todas las propiedades')."""

from datetime import date
from decimal import Decimal
import uuid

import pytest

from app.engine.golden_rule import (
    aggregate_monthly_summaries,
    calculate_expense_breakdown,
    calculate_monthly_summary,
)


def test_consolidated_totals_match_sum_of_individual_properties():
    """Verifica que los totales consolidados coinciden exactamente con la suma de propiedades individuales."""
    prop1_id = uuid.uuid4()
    prop2_id = uuid.uuid4()

    # Propiedad 1: 2 reservas y 1 gasto
    res_prop1 = [
        {
            "id": str(uuid.uuid4()),
            "property_id": prop1_id,
            "guest_name": "Huésped 1",
            "check_in": date(2026, 11, 2),
            "check_out": date(2026, 11, 6),
            "total_amount": 1200000.0,
            "platform_fee": 180000.0,
            "net_amount": 1020000.0,
            "status": "confirmed",
            "currency": "COP",
        },
        {
            "id": str(uuid.uuid4()),
            "property_id": prop1_id,
            "guest_name": "Huésped 2",
            "check_in": date(2026, 11, 10),
            "check_out": date(2026, 11, 14),
            "total_amount": 800000.0,
            "platform_fee": 120000.0,
            "net_amount": 680000.0,
            "status": "confirmed",
            "currency": "COP",
        },
    ]
    exp_prop1 = [
        {
            "id": str(uuid.uuid4()),
            "property_id": prop1_id,
            "amount": 200000.0,
            "category": "cleaning",
            "date": date(2026, 11, 6),
            "is_deleted": False,
        }
    ]

    # Propiedad 2: 1 reserva y 2 gastos
    res_prop2 = [
        {
            "id": str(uuid.uuid4()),
            "property_id": prop2_id,
            "guest_name": "Huésped 3",
            "check_in": date(2026, 11, 15),
            "check_out": date(2026, 11, 20),
            "total_amount": 1500000.0,
            "platform_fee": 225000.0,
            "net_amount": 1275000.0,
            "status": "confirmed",
            "currency": "COP",
        }
    ]
    exp_prop2 = [
        {
            "id": str(uuid.uuid4()),
            "property_id": prop2_id,
            "amount": 150000.0,
            "category": "utilities",
            "date": date(2026, 11, 15),
            "is_deleted": False,
        },
        {
            "id": str(uuid.uuid4()),
            "property_id": prop2_id,
            "amount": 100000.0,
            "category": "supplies",
            "date": date(2026, 11, 20),
            "is_deleted": False,
        },
    ]

    # Cálculos individuales
    sum1 = calculate_monthly_summary(res_prop1, exp_prop1, 2026, 11)
    sum2 = calculate_monthly_summary(res_prop2, exp_prop2, 2026, 11)

    # Cálculo consolidado vía motor
    consolidated = aggregate_monthly_summaries([sum1, sum2], 2026, 11)

    # Verificación de coincidencia matemática exacta
    expected_gross = sum1["gross_income"] + sum2["gross_income"]
    expected_fees = sum1["total_fees"] + sum2["total_fees"]
    expected_net = sum1["net_income"] + sum2["net_income"]
    expected_expenses = sum1["total_expenses"] + sum2["total_expenses"]
    expected_profit = sum1["net_profit"] + sum2["net_profit"]
    expected_reservations = sum1["reservation_count"] + sum2["reservation_count"]
    expected_expenses_count = sum1["expense_count"] + sum2["expense_count"]

    assert consolidated["gross_income"] == expected_gross
    assert consolidated["total_fees"] == expected_fees
    assert consolidated["net_income"] == expected_net
    assert consolidated["total_expenses"] == expected_expenses
    assert consolidated["net_profit"] == expected_profit
    assert consolidated["reservation_count"] == expected_reservations
    assert consolidated["expense_count"] == expected_expenses_count

    # Desglose de gastos consolidado
    all_expenses = exp_prop1 + exp_prop2
    breakdown = calculate_expense_breakdown(all_expenses, 2026, 11)
    breakdown_total = sum(item["amount"] for item in breakdown)
    assert breakdown_total == expected_expenses
