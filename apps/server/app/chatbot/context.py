from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.registry import REGISTRY
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense
from app.services.forecast import generate_property_forecast
from app.services.predictive_recommendations import generate_predictive_recommendations


def compact_result(result: dict[str, Any]) -> dict[str, Any]:
    """Compacta el resultado de un handler a un formato ligero para la Capa 2."""
    metrics_map = {
        m["label"]: m["value"]
        for m in result.get("metrics", [])
        if isinstance(m, dict) and "label" in m and "value" in m
    }
    table = result.get("table", {})
    columns = table.get("columns", [])
    rows = table.get("rows", [])
    return {
        "resumen": result.get("summary", ""),
        "metricas": metrics_map,
        "tabla": {
            "columnas": columns,
            "filas": rows[:8],
        },
    }


async def build_context(db: AsyncSession, prop: Property) -> dict[str, Any]:
    """
    Construye el contexto financiero determinístico para la Capa 2 (Ollama).
    - propiedad, moneda, fecha_hoy
    - mes_actual: resultados compactos del catálogo
    - mes_anterior: ingresos_mes, gastos_categoria, ocupacion_mes compactos del mes previo
    - proyeccion: modelo, nivel de confianza, métricas de los próximos meses
    - recomendaciones_predictivas: recomendaciones determinísticas generadas por el mismo servicio del dashboard
    """
    today = date.today()
    cur_y, cur_m = today.year, today.month
    prev_m = cur_m - 1 if cur_m > 1 else 12
    prev_y = cur_y if cur_m > 1 else cur_y - 1

    mes_actual: dict[str, Any] = {}
    catalog_keys = [
        "resumen_mes",
        "ingresos_mes",
        "gastos_categoria",
        "ingresos_plataforma",
        "ocupacion_mes",
        "proximas_reservas",
        "utilidad_mes",
    ]
    for q_id in catalog_keys:
        if q_id in REGISTRY:
            handler = REGISTRY[q_id].handler
            raw = await handler(db, prop, cur_y, cur_m)
            mes_actual[q_id] = compact_result(raw)

    mes_anterior: dict[str, Any] = {}
    prev_catalog_keys = ["ingresos_mes", "gastos_categoria", "ocupacion_mes"]
    for q_id in prev_catalog_keys:
        if q_id in REGISTRY:
            handler = REGISTRY[q_id].handler
            raw = await handler(db, prop, prev_y, prev_m)
            mes_anterior[q_id] = compact_result(raw)

    # Consultar reservas y gastos para pronóstico y recomendaciones unificadas
    res_result = await db.execute(
        select(Reservation).where(Reservation.property_id == prop.id)
    )
    reservations = [
        {
            "id": str(r.id),
            "total_amount": float(r.total_amount),
            "platform_fee": float(r.platform_fee),
            "net_amount": float(r.net_amount),
            "status": r.status,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "platform": r.platform,
        }
        for r in res_result.scalars().all()
    ]

    exp_result = await db.execute(
        select(Expense).where(Expense.property_id == prop.id)
    )
    expenses = [
        {
            "id": str(e.id),
            "amount": float(e.amount),
            "is_deleted": e.is_deleted,
            "date": e.date,
        }
        for e in exp_result.scalars().all()
    ]

    forecasts, historical_count, meta = generate_property_forecast(
        property_id=str(prop.id),
        reservations=reservations,
        expenses=expenses,
        steps=3,
        return_metadata=True,
    )

    recs = generate_predictive_recommendations(
        property_id=str(prop.id),
        reservations=reservations,
        expenses=expenses,
        forecasts=forecasts,
        historical_count=historical_count,
    )

    proyeccion = {
        "modelo": meta["model"],
        "nivel_confianza": meta["confidence_level"],
        "meses_historial": meta["months_of_history"],
        "backtest_mape": meta["backtest_mape"],
        "meses": [
            {
                "mes": f.month,
                "ingreso_bruto_estimado": f.projected_gross_income,
                "rango_bruto": [f.gross_income_min, f.gross_income_max],
                "beneficio_neto_estimado": f.projected_net_profit,
                "rango_neto": [f.net_profit_min, f.net_profit_max],
            }
            for f in forecasts
        ],
    }

    return {
        "propiedad": {
            "id": str(prop.id),
            "nombre": prop.name,
            "tipo": prop.property_type,
            "capacidad": prop.max_guests,
            "habitaciones": prop.bedrooms,
            "banos": prop.bathrooms,
            "ciudad": prop.city or "",
            "pais": prop.country or "",
        },
        "moneda": prop.currency,
        "fecha_hoy": today.isoformat(),
        "mes_actual": mes_actual,
        "mes_anterior": mes_anterior,
        "proyeccion": proyeccion,
        "recomendaciones_predictivas": recs,
    }
