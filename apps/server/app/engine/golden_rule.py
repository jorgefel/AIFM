# ─────────────────────────────────────────────────────────────
# app/engine/golden_rule.py — Motor Financiero Determinístico
#
# Única fuente de verdad para cálculos financieros.
# Si hay discrepancias con los resultados del agente IA,
# el motor determinista tiene siempre la última palabra.
#
# Todos los cálculos usan Decimal para precisión exacta.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import calendar
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any


def to_decimal(value: Any) -> Decimal:
    """Convierte un valor a Decimal con precisión de 2 decimales."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_net_amount(total_amount: Any, platform_fee: Any) -> Decimal:
    """
    Regla de Oro: net_amount = total_amount - platform_fee
    Siempre calculado server-side, ignorando cualquier input del cliente.
    """
    total = to_decimal(total_amount)
    fee = to_decimal(platform_fee)
    return to_decimal(total - fee)


def calculate_occupancy_rate(
    reservations: list[dict],
    year: int,
    month: int,
) -> float:
    """
    Calcula la tasa de ocupación de una propiedad para un mes dado.

    Sólo se cuentan reservaciones con status 'confirmed' o 'completed'.
    Se cuentan los días únicos ocupados (check_in <= día < check_out)
    dentro del mes solicitado.

    Returns:
        float entre 0.0 y 1.0
    """
    days_in_month = calendar.monthrange(year, month)[1]
    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)

    occupied_days: set[date] = set()

    for res in reservations:
        status = res.get("status", "")
        if status not in ("confirmed", "completed"):
            continue

        check_in = res["check_in"] if isinstance(res["check_in"], date) else date.fromisoformat(str(res["check_in"]))
        check_out = res["check_out"] if isinstance(res["check_out"], date) else date.fromisoformat(str(res["check_out"]))

        # Clamp to month boundaries
        eff_start = max(check_in, month_start)
        eff_end = min(check_out, month_end + timedelta(days=1))

        current = eff_start
        while current < eff_end:
            if month_start <= current <= month_end:
                occupied_days.add(current)
            current += timedelta(days=1)

    if days_in_month == 0:
        return 0.0

    return round(len(occupied_days) / days_in_month, 4)


def calculate_monthly_summary(
    reservations: list[dict],
    expenses: list[dict],
    year: int,
    month: int,
) -> dict:
    """
    Genera el resumen financiero mensual de una propiedad.

    Args:
        reservations: lista de dicts con keys: total_amount, platform_fee,
                      net_amount, status, check_in, check_out, currency
        expenses: lista de dicts con keys: amount, is_deleted, date, currency
        year: año del reporte
        month: mes del reporte

    Returns:
        dict con: gross_income, total_fees, net_income, total_expenses,
                  net_profit, occupancy_rate, reservation_count, expense_count
    """
    month_start = date(year, month, 1)
    days_in_month = calendar.monthrange(year, month)[1]
    month_end = date(year, month, days_in_month)

    # Filter reservations for this month (by check_in date)
    month_reservations = []
    for res in reservations:
        status = res.get("status", "")
        if status == "cancelled":
            continue

        check_in = res["check_in"] if isinstance(res["check_in"], date) else date.fromisoformat(str(res["check_in"]))
        if month_start <= check_in <= month_end:
            month_reservations.append(res)

    # Filter expenses for this month
    month_expenses = []
    for exp in expenses:
        if exp.get("is_deleted", False):
            continue

        exp_date = exp["date"] if isinstance(exp["date"], date) else date.fromisoformat(str(exp["date"]))
        if month_start <= exp_date <= month_end:
            month_expenses.append(exp)

    # Calculate financial metrics
    gross_income = Decimal("0.00")
    total_fees = Decimal("0.00")

    for res in month_reservations:
        gross_income += to_decimal(res["total_amount"])
        total_fees += to_decimal(res.get("platform_fee", 0))

    net_income = to_decimal(gross_income - total_fees)

    total_expenses_amount = Decimal("0.00")
    for exp in month_expenses:
        total_expenses_amount += to_decimal(exp["amount"])

    net_profit = to_decimal(net_income - total_expenses_amount)
    occupancy = calculate_occupancy_rate(reservations, year, month)

    return {
        "year": year,
        "month": month,
        "gross_income": float(gross_income),
        "total_fees": float(total_fees),
        "net_income": float(net_income),
        "total_expenses": float(total_expenses_amount),
        "net_profit": float(net_profit),
        "occupancy_rate": occupancy,
        "reservation_count": len(month_reservations),
        "expense_count": len(month_expenses),
    }


def calculate_daily_chart_data(
    reservations: list[dict],
    expenses: list[dict],
    year: int,
    month: int,
) -> list[dict]:
    """Return a point for every calendar day in a month."""
    days_in_month = calendar.monthrange(year, month)[1]
    daily_points = []

    for day in range(1, days_in_month + 1):
        current_date = date(year, month, day)
        gross_income = Decimal("0.00")
        total_expenses = Decimal("0.00")

        for reservation in reservations:
            if reservation.get("status") == "cancelled":
                continue
            check_in = reservation["check_in"]
            if not isinstance(check_in, date):
                check_in = date.fromisoformat(str(check_in))
            if check_in == current_date:
                gross_income += to_decimal(reservation["total_amount"])

        for expense in expenses:
            if expense.get("is_deleted", False):
                continue
            expense_date = expense["date"]
            if not isinstance(expense_date, date):
                expense_date = date.fromisoformat(str(expense_date))
            if expense_date == current_date:
                total_expenses += to_decimal(expense["amount"])

        daily_points.append({
            "year": year,
            "month": month,
            "day": day,
            "gross_income": float(gross_income),
            "total_expenses": float(total_expenses),
        })

    return daily_points


def detect_discrepancies(reservations: list[dict]) -> list[dict]:
    """
    Detecta reservaciones donde net_amount != total_amount - platform_fee.

    Returns:
        Lista de dicts con: reservation_id, expected_net, actual_net, diff
    """
    discrepancies = []

    for res in reservations:
        if res.get("status") == "cancelled":
            continue

        expected_net = calculate_net_amount(
            res["total_amount"],
            res.get("platform_fee", 0),
        )
        actual_net = to_decimal(res.get("net_amount", 0))

        if expected_net != actual_net:
            discrepancies.append({
                "reservation_id": str(res.get("id", "unknown")),
                "guest_name": res.get("guest_name", "N/A"),
                "expected_net": float(expected_net),
                "actual_net": float(actual_net),
                "diff": float(to_decimal(expected_net - actual_net)),
            })

    return discrepancies
