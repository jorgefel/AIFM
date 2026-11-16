from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Callable, Coroutine
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.golden_rule import (
    calculate_occupancy_breakdown,
    calculate_remaining_free_days,
    to_decimal,
)
from app.models.expense import Expense
from app.models.property import Property
from app.models.reservation import Reservation


@dataclass
class Question:
    id: str
    label: str
    category: str
    handler: Callable[[AsyncSession, Property, int | None, int | None], Coroutine[Any, Any, dict]]
    match: tuple[tuple[str, ...], ...]
    priority: int = 0


REGISTRY: dict[str, Question] = {}


def question(
    id: str,
    label: str,
    category: str,
    match: list[list[str]] | tuple[tuple[str, ...], ...],
    priority: int = 0,
):
    """Decorador para registrar una pregunta del catálogo en REGISTRY."""
    normalized_match = tuple(tuple(group) for group in match)

    def decorator(fn: Callable[[AsyncSession, Property, int | None, int | None], Coroutine[Any, Any, dict]]):
        REGISTRY[id] = Question(
            id=id,
            label=label,
            category=category,
            handler=fn,
            match=normalized_match,
            priority=priority,
        )
        return fn

    return decorator


def month_range(year: int | None = None, month: int | None = None) -> tuple[date, date]:
    """Retorna (inicio_inclusivo, fin_exclusivo). Default: mes y año actual."""
    today = date.today()
    y = year if year is not None else today.year
    m = month if month is not None else today.month

    start_date = date(y, m, 1)
    if m == 12:
        end_date = date(y + 1, 1, 1)
    else:
        end_date = date(y, m + 1, 1)
    return start_date, end_date


def money(value: Any) -> float:
    """Convierte un valor Decimal/None/numérico a float redondeado a 2 decimales."""
    if value is None:
        return 0.0
    try:
        return float(to_decimal(value))
    except Exception:
        return 0.0


def build(
    summary: str,
    metrics: list[dict],
    columns: list[str] | None = None,
    rows: list[list[Any]] | None = None,
) -> dict:
    """Contrato fijo para el resultado de todos los handlers."""
    return {
        "summary": summary,
        "metrics": metrics,
        "table": {
            "columns": columns or [],
            "rows": rows or [],
        },
    }


# ─────────────────────────────────────────────────────────────────────────
# Catálogo Sprint 1 (5 preguntas base)
# ─────────────────────────────────────────────────────────────────────────


@question(
    id="ingresos_mes",
    label="¿Cuánto gané este mes?",
    category="Ingresos",
    match=[["gane", "gano", "ingres", "ganancia", "factur"]],
    priority=1,
)
async def handle_ingresos_mes(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = (
        select(
            func.coalesce(func.sum(Reservation.total_amount), 0),
            func.coalesce(func.sum(Reservation.platform_fee), 0),
            func.coalesce(func.sum(Reservation.net_amount), 0),
            func.count(Reservation.id),
        )
        .where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
    )
    res = await db.execute(stmt)
    gross, fees, net, count = res.first() or (0, 0, 0, 0)

    count_int = int(count)
    gross_val = money(gross)
    fees_val = money(fees)
    net_val = money(net)

    if count_int == 0:
        summary = "No registraste ingresos con check-in en este período."
    else:
        summary = f"Generaste {prop.currency} {net_val:,.2f} netos con {count_int} reservación(es)."

    metrics = [
        {"label": "Ingreso bruto", "value": gross_val, "format": "currency"},
        {"label": "Comisiones", "value": fees_val, "format": "currency"},
        {"label": "Ingreso neto", "value": net_val, "format": "currency"},
        {"label": "Reservas", "value": count_int, "format": "number"},
    ]
    columns = ["Concepto", "Monto"]
    rows = [
        ["Ingreso bruto", gross_val],
        ["Comisiones plataformas", fees_val],
        ["Ingreso neto", net_val],
        ["Reservas confirmadas", count_int],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="gastos_categoria",
    label="¿En qué estoy gastando más?",
    category="Gastos",
    match=[["gast"]],
    priority=1,
)
async def handle_gastos_categoria(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = (
        select(
            Expense.category,
            func.sum(Expense.amount).label("cat_total"),
        )
        .where(
            Expense.property_id == prop.id,
            Expense.is_deleted == False,
            Expense.date >= start_d,
            Expense.date < end_d,
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
    )
    res = await db.execute(stmt)
    records = res.all()

    total = sum(Decimal(str(r[1])) for r in records) if records else Decimal("0.00")
    total_val = money(total)

    if total == 0:
        return build(
            summary="No registraste gastos en este período.",
            metrics=[{"label": "Total gastos", "value": 0.0, "format": "currency"}],
            columns=["Categoría", "Monto", "Porcentaje"],
            rows=[],
        )

    top_cat = records[0][0]
    top_amt = Decimal(str(records[0][1]))
    top_pct = round(float((top_amt / total) * 100), 1) if total > 0 else 0.0

    summary = f"Tu mayor gasto fue en {top_cat} ({top_pct}% del total gastado)."
    metrics = [
        {"label": "Total gastos", "value": total_val, "format": "currency"},
        {"label": f"Mayor gasto ({top_cat})", "value": money(top_amt), "format": "currency"},
    ]
    columns = ["Categoría", "Monto", "Porcentaje"]
    rows = [
        [
            cat,
            money(amt),
            f"{(Decimal(str(amt)) / total * 100):.1f}%",
        ]
        for cat, amt in records
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="ingresos_plataforma",
    label="¿Qué plataforma me deja más?",
    category="Ingresos",
    match=[
        ["plataforma", "airbnb", "booking", "canal"],
        ["ingres", "gane", "deja", "gano", "rinde", "mas"],
    ],
    priority=2,
)
async def handle_ingresos_plataforma(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = (
        select(
            Reservation.platform,
            func.count(Reservation.id),
            func.coalesce(func.sum(Reservation.total_amount), 0),
            func.coalesce(func.sum(Reservation.net_amount), 0),
        )
        .where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
        .group_by(Reservation.platform)
        .order_by(func.sum(Reservation.net_amount).desc())
    )
    res = await db.execute(stmt)
    records = res.all()

    if not records:
        return build(
            summary="No registraste ingresos por plataforma en este período.",
            metrics=[{"label": "Ingreso neto", "value": 0.0, "format": "currency"}],
            columns=["Plataforma", "Reservas", "Ingreso bruto", "Ingreso neto"],
            rows=[],
        )

    top_platform, top_count, _, top_net = records[0]
    top_name = top_platform.title()
    summary = f"{top_name} fue tu plataforma más rentable con {prop.currency} {money(top_net):,.2f} netos."

    metrics = [
        {"label": f"Neto {top_name}", "value": money(top_net), "format": "currency"},
        {"label": f"Reservas {top_name}", "value": int(top_count), "format": "number"},
    ]
    columns = ["Plataforma", "Reservas", "Ingreso bruto", "Ingreso neto"]
    rows = [
        [p.title(), int(count), money(gross), money(net)]
        for p, count, gross, net in records
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="ocupacion_mes",
    label="¿Cuál es mi ocupación este mes?",
    category="Ocupación",
    match=[["ocupa"]],
    priority=1,
)
async def handle_ocupacion_mes(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in < end_d,
        Reservation.check_out > start_d,
    )
    res = await db.execute(stmt)
    reservations = [
        {"status": r.status, "check_in": r.check_in, "check_out": r.check_out}
        for r in res.scalars().all()
    ]

    target_year = start_d.year
    target_month = start_d.month
    details = calculate_occupancy_breakdown(reservations, target_year, target_month)
    occ_pct = round(details["occupancy_rate"] * 100, 1)

    summary = (
        f"Tu tasa de ocupación es del {occ_pct}% "
        f"({details['occupied_days']} de {details['days_in_month']} días ocupados)."
    )
    metrics = [
        {"label": "Ocupación", "value": occ_pct, "format": "percent"},
        {"label": "Días ocupados", "value": details["occupied_days"], "format": "number"},
        {"label": "Días libres", "value": details["free_days"], "format": "number"},
    ]
    columns = ["Estado", "Días"]
    rows = [
        ["Días ocupados", details["occupied_days"]],
        ["Días libres", details["free_days"]],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="proximas_reservas",
    label="¿Cuáles son mis próximas reservas?",
    category="Reservas",
    match=[
        ["proxim", "siguiente", "llegan", "vienen"],
        ["reserva", "huesped", "llegada", "check"],
    ],
    priority=2,
)
async def handle_proximas_reservas(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    today = date.today()
    stmt = (
        select(Reservation)
        .where(
            Reservation.property_id == prop.id,
            Reservation.status == "confirmed",
            Reservation.check_in >= today,
        )
        .order_by(Reservation.check_in.asc())
        .limit(5)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    if not records:
        return build(
            summary="No tienes próximas reservas confirmadas.",
            metrics=[{"label": "Próximas reservas", "value": 0, "format": "number"}],
            columns=["Huésped", "Check-in", "Check-out", "Noches", "Neto", "Plataforma"],
            rows=[],
        )

    total_net = sum(to_decimal(r.net_amount) for r in records)
    summary = f"Tienes {len(records)} próxima(s) reserva(s) confirmada(s)."
    metrics = [
        {"label": "Próximas reservas", "value": len(records), "format": "number"},
        {"label": "Total neto próximo", "value": money(total_net), "format": "currency"},
    ]
    columns = ["Huésped", "Check-in", "Check-out", "Noches", "Neto", "Plataforma"]
    rows = [
        [
            r.guest_name,
            str(r.check_in),
            str(r.check_out),
            (r.check_out - r.check_in).days,
            money(r.net_amount),
            r.platform.title(),
        ]
        for r in records
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


# ─────────────────────────────────────────────────────────────────────────
# Catálogo Sprint 2 (9 preguntas ampliadas)
# ─────────────────────────────────────────────────────────────────────────


@question(
    id="resumen_mes",
    label="Dame un resumen del mes",
    category="Resumen",
    match=[["resumen", "balance", "panorama", "consolid"]],
    priority=2,
)
async def handle_resumen_mes(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)

    # 1. Ingresos y reservas
    stmt_res = (
        select(
            func.coalesce(func.sum(Reservation.total_amount), 0),
            func.coalesce(func.sum(Reservation.platform_fee), 0),
            func.coalesce(func.sum(Reservation.net_amount), 0),
            func.count(Reservation.id),
        )
        .where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
    )
    res_res = await db.execute(stmt_res)
    row = res_res.first()
    if row and len(row) == 4:
        _, _, net_val, res_count = row
    elif row and len(row) >= 2:
        net_val, res_count = row[0], row[1]
    else:
        net_val, res_count = 0, 0

    # 2. Gastos
    stmt_exp = (
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(
            Expense.property_id == prop.id,
            Expense.is_deleted == False,
            Expense.date >= start_d,
            Expense.date < end_d,
        )
    )
    res_exp = await db.execute(stmt_exp)
    exp_val = res_exp.scalar() or 0

    # 3. Ocupación
    stmt_occ = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in < end_d,
        Reservation.check_out > start_d,
    )
    res_occ = await db.execute(stmt_occ)
    occ_dicts = [
        {"status": r.status, "check_in": r.check_in, "check_out": r.check_out}
        for r in res_occ.scalars().all()
    ]
    details = calculate_occupancy_breakdown(occ_dicts, start_d.year, start_d.month)

    net_money = money(net_val)
    exp_money = money(exp_val)
    profit_money = money(Decimal(str(net_val)) - Decimal(str(exp_val)))
    occ_pct = round(details["occupancy_rate"] * 100, 1)
    res_count_int = int(res_count)

    summary = (
        f"Resumen de {start_d.strftime('%B %Y')}: "
        f"Ingreso neto {prop.currency} {net_money:,.2f}, gastos {prop.currency} {exp_money:,.2f}, "
        f"utilidad {prop.currency} {profit_money:,.2f}, ocupación {occ_pct}% y {res_count_int} reserva(s)."
    )
    metrics = [
        {"label": "Ingreso neto", "value": net_money, "format": "currency"},
        {"label": "Gastos totales", "value": exp_money, "format": "currency"},
        {"label": "Utilidad neta", "value": profit_money, "format": "currency"},
        {"label": "Ocupación", "value": occ_pct, "format": "percent"},
        {"label": "Reservas", "value": res_count_int, "format": "number"},
    ]
    columns = ["Concepto", "Monto"]
    rows = [
        ["Ingreso neto", net_money],
        ["Gastos totales", exp_money],
        ["Utilidad neta", profit_money],
        ["Tasa de ocupación", f"{occ_pct}%"],
        ["Reservaciones", res_count_int],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="utilidad_mes",
    label="¿Cuál es mi utilidad este mes?",
    category="Ingresos",
    match=[["utilid", "margen", "rentabil", "beneficio"]],
    priority=2,
)
async def handle_utilidad_mes(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)

    stmt_res = (
        select(func.coalesce(func.sum(Reservation.net_amount), 0))
        .where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
    )
    res_res = await db.execute(stmt_res)
    net_val = res_res.scalar() or 0

    stmt_exp = (
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(
            Expense.property_id == prop.id,
            Expense.is_deleted == False,
            Expense.date >= start_d,
            Expense.date < end_d,
        )
    )
    res_exp = await db.execute(stmt_exp)
    exp_val = res_exp.scalar() or 0

    net_d = Decimal(str(net_val))
    exp_d = Decimal(str(exp_val))
    profit_d = net_d - exp_d

    net_money = money(net_d)
    exp_money = money(exp_d)
    profit_money = money(profit_d)
    margin_pct = round(float((profit_d / net_d) * 100), 1) if net_d > 0 else 0.0

    summary = (
        f"Tu utilidad neta este mes es de {prop.currency} {profit_money:,.2f} "
        f"(margen del {margin_pct}% sobre ingresos netos)."
    )
    metrics = [
        {"label": "Utilidad neta", "value": profit_money, "format": "currency"},
        {"label": "Margen neto", "value": margin_pct, "format": "percent"},
        {"label": "Ingreso neto", "value": net_money, "format": "currency"},
        {"label": "Gastos totales", "value": exp_money, "format": "currency"},
    ]
    columns = ["Concepto", "Monto"]
    rows = [
        ["Ingreso neto", net_money],
        ["Gastos totales", exp_money],
        ["Utilidad neta", profit_money],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="comparar_mes_anterior",
    label="¿Cómo voy frente al mes pasado?",
    category="Comparación",
    match=[
        ["frente", "compar", "versus", "vs", "contra", "voy"],
        ["anterior", "pasad"],
    ],
    priority=3,
)
async def handle_comparar_mes_anterior(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    today = date.today()
    cur_y = year if year is not None else today.year
    cur_m = month if month is not None else today.month

    prev_m = cur_m - 1 if cur_m > 1 else 12
    prev_y = cur_y if cur_m > 1 else cur_y - 1

    cur_start, cur_end = month_range(cur_y, cur_m)
    prev_start, prev_end = month_range(prev_y, prev_m)

    # 1. Ingresos
    async def get_financials(start_d: date, end_d: date, y: int, m: int):
        stmt_res = select(func.coalesce(func.sum(Reservation.net_amount), 0)).where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
        res_res = await db.execute(stmt_res)
        net = Decimal(str(res_res.scalar() or 0))

        stmt_exp = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.property_id == prop.id,
            Expense.is_deleted == False,
            Expense.date >= start_d,
            Expense.date < end_d,
        )
        res_exp = await db.execute(stmt_exp)
        exp = Decimal(str(res_exp.scalar() or 0))

        stmt_occ = select(Reservation).where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_in < end_d,
            Reservation.check_out > start_d,
        )
        res_occ = await db.execute(stmt_occ)
        occ_dicts = [
            {"status": r.status, "check_in": r.check_in, "check_out": r.check_out}
            for r in res_occ.scalars().all()
        ]
        occ = calculate_occupancy_breakdown(occ_dicts, y, m)["occupancy_rate"]
        return net, exp, occ

    cur_net, cur_exp, cur_occ = await get_financials(cur_start, cur_end, cur_y, cur_m)
    prev_net, prev_exp, prev_occ = await get_financials(prev_start, prev_end, prev_y, prev_m)

    delta_net = cur_net - prev_net
    pct_net = round(float((delta_net / prev_net) * 100), 1) if prev_net > 0 else None

    delta_exp = cur_exp - prev_exp
    pct_exp = round(float((delta_exp / prev_exp) * 100), 1) if prev_exp > 0 else None

    delta_occ_pct = round((cur_occ - prev_occ) * 100, 1)

    pct_net_str = f"{pct_net:+.1f}%" if pct_net is not None else "N/A"
    pct_exp_str = f"{pct_exp:+.1f}%" if pct_exp is not None else "N/A"

    summary = (
        f"Frente al mes anterior: ingresos netos variaron {prop.currency} {money(delta_net):+,.2f} ({pct_net_str}), "
        f"gastos {prop.currency} {money(delta_exp):+,.2f} ({pct_exp_str}) y la ocupación varió {delta_occ_pct:+.1f}%."
    )

    metrics = [
        {"label": "Variación ingreso neto", "value": money(delta_net), "format": "currency"},
        {"label": "Variación gastos", "value": money(delta_exp), "format": "currency"},
        {"label": "Variación ocupación", "value": delta_occ_pct, "format": "percent"},
    ]
    columns = ["Métrica", "Mes evaluado", "Mes anterior", "Diferencia", "% Cambio"]
    rows = [
        [
            "Ingreso neto",
            money(cur_net),
            money(prev_net),
            money(delta_net),
            pct_net_str,
        ],
        [
            "Gastos",
            money(cur_exp),
            money(prev_exp),
            money(delta_exp),
            pct_exp_str,
        ],
        [
            "Ocupación",
            f"{cur_occ*100:.1f}%",
            f"{prev_occ*100:.1f}%",
            f"{delta_occ_pct:+.1f}%",
            f"{round(float((cur_occ - prev_occ) / prev_occ * 100), 1):+.1f}%" if prev_occ > 0 else "N/A",
        ],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="tarifa_promedio",
    label="¿Cuál es mi tarifa promedio por noche?",
    category="Ingresos",
    match=[["tarifa", "precio", "adr"], ["promedio", "noche"]],
    priority=2,
)
async def handle_tarifa_promedio(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    """Convención documentada: Ingreso bruto dividido entre total de noches de reservas con check-in en el mes."""
    start_d, end_d = month_range(year, month)
    stmt = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in >= start_d,
        Reservation.check_in < end_d,
    )
    res = await db.execute(stmt)
    reservations = res.scalars().all()

    total_gross = sum(to_decimal(r.total_amount) for r in reservations)
    total_nights = sum((r.check_out - r.check_in).days for r in reservations)
    avg_rate = round(float(total_gross / total_nights), 2) if total_nights > 0 else 0.0

    summary = (
        f"Convención: Ingreso bruto sobre noches de reservas con check-in en el período. "
        f"Tu tarifa promedio por noche fue de {prop.currency} {avg_rate:,.2f} ({total_nights} noches vendidas)."
    )
    metrics = [
        {"label": "Tarifa promedio / noche", "value": avg_rate, "format": "currency"},
        {"label": "Noches vendidas", "value": total_nights, "format": "number"},
    ]
    columns = ["Concepto", "Valor"]
    rows = [
        ["Ingreso bruto total", money(total_gross)],
        ["Noches vendidas", total_nights],
        ["Tarifa promedio por noche", avg_rate],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="estancia_promedio",
    label="¿Cuánto dura en promedio una estadía?",
    category="Reservas",
    match=[["estancia", "estadia", "duracion"], ["promedio", "dur", "larg"]],
    priority=2,
)
async def handle_estancia_promedio(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in >= start_d,
        Reservation.check_in < end_d,
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    total_reservas = len(records)
    total_nights = sum((r.check_out - r.check_in).days for r in records)
    avg_stay = round(total_nights / total_reservas, 1) if total_reservas > 0 else 0.0

    summary = f"La duración promedio de estadía fue de {avg_stay} noches por reserva ({total_reservas} reservas)."
    metrics = [
        {"label": "Estadía promedio", "value": avg_stay, "format": "number"},
        {"label": "Reservas analizadas", "value": total_reservas, "format": "number"},
    ]
    columns = ["Concepto", "Valor"]
    rows = [
        ["Total de noches", total_nights],
        ["Total de reservas", total_reservas],
        ["Promedio noches/reserva", avg_stay],
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="cancelaciones_mes",
    label="¿Cuántas reservas se cancelaron?",
    category="Reservas",
    match=[["cancel", "anul"]],
    priority=1,
)
async def handle_cancelaciones_mes(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    start_d, end_d = month_range(year, month)
    stmt = (
        select(Reservation)
        .where(
            Reservation.property_id == prop.id,
            Reservation.status == "cancelled",
            Reservation.check_in >= start_d,
            Reservation.check_in < end_d,
        )
        .order_by(Reservation.check_in.asc())
    )
    res = await db.execute(stmt)
    cancelled = res.scalars().all()

    count = len(cancelled)
    lost_money = money(sum(to_decimal(r.total_amount) for r in cancelled))

    if count == 0:
        summary = "No registraste cancelaciones con check-in en este período."
    else:
        summary = f"Tuviste {count} reserva(s) cancelada(s), representando {prop.currency} {lost_money:,.2f} no percibidos."

    metrics = [
        {"label": "Reservas canceladas", "value": count, "format": "number"},
        {"label": "Monto cancelado", "value": lost_money, "format": "currency"},
    ]
    columns = ["Huésped", "Check-in", "Check-out", "Monto", "Plataforma"]
    rows = [
        [
            r.guest_name,
            str(r.check_in),
            str(r.check_out),
            money(r.total_amount),
            r.platform.title(),
        ]
        for r in cancelled[:8]
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="llegadas_semana",
    label="¿Quién llega esta semana?",
    category="Reservas",
    match=[["quien", "llega", "llegada", "salida"], ["semana", "proxim", "vienen"]],
    priority=2,
)
async def handle_llegadas_semana(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    today = date.today()
    limit_7 = today + timedelta(days=7)

    stmt_in = (
        select(Reservation)
        .where(
            Reservation.property_id == prop.id,
            Reservation.status == "confirmed",
            Reservation.check_in >= today,
            Reservation.check_in <= limit_7,
        )
        .order_by(Reservation.check_in.asc())
    )
    res_in = await db.execute(stmt_in)
    ins = res_in.scalars().all()

    stmt_out = (
        select(Reservation)
        .where(
            Reservation.property_id == prop.id,
            Reservation.status.in_(["confirmed", "completed"]),
            Reservation.check_out >= today,
            Reservation.check_out <= limit_7,
        )
        .order_by(Reservation.check_out.asc())
    )
    res_out = await db.execute(stmt_out)
    outs = res_out.scalars().all()

    summary = f"En los próximos 7 días tienes {len(ins)} llegada(s) y {len(outs)} salida(s)."
    metrics = [
        {"label": "Llegadas (7 días)", "value": len(ins), "format": "number"},
        {"label": "Salidas (7 días)", "value": len(outs), "format": "number"},
    ]
    columns = ["Movimiento", "Huésped", "Fecha", "Plataforma"]
    rows = [
        ["Llegada", r.guest_name, str(r.check_in), r.platform.title()]
        for r in ins
    ] + [
        ["Salida", r.guest_name, str(r.check_out), r.platform.title()]
        for r in outs
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="dias_libres_proximos",
    label="¿Qué días tengo libres este mes?",
    category="Ocupación",
    match=[["libre", "disponib", "desocup"]],
    priority=2,
)
async def handle_dias_libres_proximos(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    today = date.today()
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month

    start_d, end_d = month_range(target_year, target_month)
    stmt = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in < end_d,
        Reservation.check_out > start_d,
    )
    res = await db.execute(stmt)
    reservations = [
        {"status": r.status, "check_in": r.check_in, "check_out": r.check_out}
        for r in res.scalars().all()
    ]

    free_dates = calculate_remaining_free_days(
        reservations, target_year, target_month, from_date=today
    )

    if not free_dates:
        summary = "No tienes días libres disponibles en lo que queda del período."
    else:
        summary = f"Tienes {len(free_dates)} día(s) libre(s) disponible(s) en el período."

    metrics = [
        {"label": "Días libres disponibles", "value": len(free_dates), "format": "number"},
    ]
    columns = ["Fecha libre"]
    rows = [[str(d)] for d in free_dates[:8]]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)


@question(
    id="mejores_meses",
    label="¿Cuáles han sido mis mejores meses?",
    category="Ingresos",
    match=[["mejor", "top", "record", "pico"], ["mes", "histor"]],
    priority=2,
)
async def handle_mejores_meses(
    db: AsyncSession,
    prop: Property,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    today = date.today()
    twelve_months_ago = date(today.year - 1, today.month, 1)

    stmt = select(Reservation).where(
        Reservation.property_id == prop.id,
        Reservation.status.in_(["confirmed", "completed"]),
        Reservation.check_in >= twelve_months_ago,
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    # Agrupar por (year, month) del check_in en Python para garantizar Decimal exacto
    monthly_map: dict[tuple[int, int], dict[str, Any]] = {}
    for r in records:
        key = (r.check_in.year, r.check_in.month)
        if key not in monthly_map:
            monthly_map[key] = {"net": Decimal("0.00"), "count": 0}
        monthly_map[key]["net"] += to_decimal(r.net_amount)
        monthly_map[key]["count"] += 1

    ranked = sorted(monthly_map.items(), key=lambda item: item[1]["net"], reverse=True)

    if not ranked:
        return build(
            summary="No hay suficiente historial para generar el ranking de mejores meses.",
            metrics=[{"label": "Mejor mes", "value": 0.0, "format": "currency"}],
            columns=["Posición", "Período", "Ingreso neto", "Reservas"],
            rows=[],
        )

    (best_y, best_m), best_data = ranked[0]
    best_net = money(best_data["net"])
    best_label = f"{best_y}-{best_m:02d}"

    summary = f"Tu mejor mes en el último año fue {best_label} con {prop.currency} {best_net:,.2f} netos."
    metrics = [
        {"label": f"Mejor mes ({best_label})", "value": best_net, "format": "currency"},
        {"label": "Meses analizados", "value": len(ranked), "format": "number"},
    ]
    columns = ["Posición", "Período", "Ingreso neto", "Reservas"]
    rows = [
        [f"#{idx+1}", f"{y}-{m:02d}", money(d["net"]), d["count"]]
        for idx, ((y, m), d) in enumerate(ranked[:8])
    ]
    return build(summary=summary, metrics=metrics, columns=columns, rows=rows)
