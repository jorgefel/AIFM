from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.registry import REGISTRY
from app.models.property import Property


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
    Estructura preparada para Sprints 6-8 (proyeccion, recomendaciones, mercado, consejos).
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
    }
