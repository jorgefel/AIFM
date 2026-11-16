# ─────────────────────────────────────────────────────────────
# app/services/advice_memory.py — Memoria determinista de consejos
# D6: Almacena exclusivamente recomendaciones calculadas por el backend.
# Nunca texto del LLM.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatbot_advice import ChatbotAdvice
from app.models.property import Property


def extract_metrics_dict(rec: Dict[str, Any]) -> Dict[str, Any]:
    """Extrae las cifras clave de una recomendación para guardar su fotografía en el tiempo."""
    metrics: Dict[str, Any] = {}
    evidence = rec.get("evidence") or []
    for item in evidence:
        if isinstance(item, dict) and "label" in item and "value" in item:
            metrics[item["label"]] = item["value"]
    return metrics


def compute_metric_evolution(
    metrics_then: Dict[str, Any], current_metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """Compara métricas de entonces con las recalculadas ahora para mostrar la variación."""
    evolution: Dict[str, Any] = {}
    for label, then_val in metrics_then.items():
        if label in current_metrics:
            now_val = current_metrics[label]
            diff_str = "Sin cambio"
            if isinstance(then_val, (int, float)) and isinstance(now_val, (int, float)):
                diff = round(now_val - then_val, 2)
                sign = "+" if diff > 0 else ""
                pct = round((diff / then_val) * 100, 1) if then_val != 0 else 0.0
                pct_str = f" ({sign}{pct}%)" if then_val != 0 else ""
                diff_str = f"{sign}{diff:,.2f}{pct_str}" if isinstance(diff, float) else f"{sign}{diff}"
            evolution[label] = {
                "entonces": then_val,
                "ahora": now_val,
                "variacion": diff_str,
            }
        else:
            evolution[label] = {
                "entonces": then_val,
                "ahora": "N/D",
                "variacion": "No disponible",
            }
    return evolution


async def record_advice_batch(
    db: AsyncSession,
    property_: Property,
    recommendations: List[Dict[str, Any]],
    as_of_date: Optional[date] = None,
) -> List[ChatbotAdvice]:
    """Guarda recomendaciones determinísticas con upsert idempotente por (property_id, rec_key, as_of_month).

    Ignora avisos informativos genéricos como rec-insufficient-history para no saturar memoria.
    """
    today = as_of_date or date.today()
    month_str = f"{today.year}-{today.month:02d}"
    saved: List[ChatbotAdvice] = []

    for rec in recommendations:
        rec_id = rec.get("id") or "rec-general"
        if rec_id == "rec-insufficient-history":
            continue

        title = rec.get("title", "")
        action = rec.get("action", "")
        evidence = rec.get("evidence") or []
        metrics_then = extract_metrics_dict(rec)

        stmt = select(ChatbotAdvice).where(
            ChatbotAdvice.property_id == property_.id,
            ChatbotAdvice.rec_key == rec_id,
            ChatbotAdvice.as_of_month == month_str,
        )
        res = await db.execute(stmt)
        existing = res.scalars().first()

        if existing:
            existing.title = title
            existing.action = action
            existing.evidence_json = evidence
            existing.metrics_json = metrics_then
            existing.as_of = today
            saved.append(existing)
        else:
            new_advice = ChatbotAdvice(
                property_id=property_.id,
                rec_key=rec_id,
                title=title,
                action=action,
                evidence_json=evidence,
                metrics_json=metrics_then,
                as_of=today,
                as_of_month=month_str,
            )
            db.add(new_advice)
            saved.append(new_advice)

    if saved:
        await db.commit()
        for item in saved:
            await db.refresh(item)

    return saved


async def get_advice_history(
    db: AsyncSession,
    property_: Property,
    limit: int = 5,
    current_metrics: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Recupera los últimos 'limit' (máx 5) consejos dados para la propiedad,

    comparando sus cifras de entonces con las recalculadas ahora por el motor.
    """
    stmt = (
        select(ChatbotAdvice)
        .where(ChatbotAdvice.property_id == property_.id)
        .order_by(ChatbotAdvice.created_at.desc(), ChatbotAdvice.as_of.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    cur_map = current_metrics or {}
    history: List[Dict[str, Any]] = []

    for adv in records:
        metrics_then = adv.metrics_json if isinstance(adv.metrics_json, dict) else {}
        evolution = compute_metric_evolution(metrics_then, cur_map)

        # Construir resumen de variación para presentación rápida
        variations = [f"{lbl}: {data['variacion']}" for lbl, data in evolution.items() if data["variacion"] != "No disponible"]
        var_summary = ", ".join(variations) if variations else "En seguimiento"

        history.append(
            {
                "id": str(adv.id),
                "rec_key": adv.rec_key,
                "title": adv.title,
                "action": adv.action,
                "as_of": adv.as_of.isoformat(),
                "as_of_month": adv.as_of_month,
                "metricas_entonces": metrics_then,
                "metricas_ahora": {lbl: data["ahora"] for lbl, data in evolution.items()},
                "evolucion": evolution,
                "variacion_resumen": var_summary,
            }
        )

    return history
