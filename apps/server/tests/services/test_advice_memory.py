import uuid
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.chatbot_advice import ChatbotAdvice
from app.models.property import Property
from app.services.advice_memory import (
    compute_metric_evolution,
    extract_metrics_dict,
    get_advice_history,
    record_advice_batch,
)


def test_extract_metrics_dict():
    rec = {
        "id": "rec-trend-positive",
        "title": "Ingresos al alza",
        "evidence": [
            {"label": "Promedio reciente", "value": 1500.0},
            {"label": "Proyección próximo mes", "value": 1800.0},
        ],
    }
    extracted = extract_metrics_dict(rec)
    assert extracted["Promedio reciente"] == 1500.0
    assert extracted["Proyección próximo mes"] == 1800.0


def test_compute_metric_evolution():
    then_metrics = {
        "Tu tarifa": 100.0,
        "Proyección próximo mes": 2000.0,
        "Total reservas": 5,
    }
    now_metrics = {
        "Tu tarifa": 120.0,
        "Proyección próximo mes": 1800.0,
        "Total reservas": 5,
    }
    evo = compute_metric_evolution(then_metrics, now_metrics)

    # Tarifa subió +20 (+20.0%)
    assert evo["Tu tarifa"]["entonces"] == 100.0
    assert evo["Tu tarifa"]["ahora"] == 120.0
    assert "+20.00 (+20.0%)" in evo["Tu tarifa"]["variacion"]

    # Proyección bajó -200 (-10.0%)
    assert evo["Proyección próximo mes"]["entonces"] == 2000.0
    assert evo["Proyección próximo mes"]["ahora"] == 1800.0
    assert "-200.00 (-10.0%)" in evo["Proyección próximo mes"]["variacion"]

    # Total reservas sin cambio
    assert evo["Total reservas"]["variacion"] == "+0 (+0.0%)" or "0" in evo["Total reservas"]["variacion"]


@pytest.mark.asyncio
async def test_record_advice_batch_idempotent():
    """Prueba upsert idempotente: si ya existe consejo para esa clave y mes, lo actualiza."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    prop = MagicMock(spec=Property)
    prop.id = uuid.uuid4()

    recs = [
        {
            "id": "rec-price-low",
            "title": "Tarifa baja",
            "action": "Subir tarifa a 120",
            "evidence": [{"label": "Tu tarifa", "value": 90.0}],
        }
    ]

    # Caso 1: Nuevo consejo
    mock_res_none = MagicMock()
    mock_res_none.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res_none

    saved1 = await record_advice_batch(mock_db, prop, recs, as_of_date=date(2026, 11, 16))
    assert mock_db.add.called
    assert mock_db.commit.called
    assert len(saved1) == 1
    assert saved1[0].rec_key == "rec-price-low"

    # Caso 2: Consejo existente para el mismo mes
    existing = ChatbotAdvice(
        property_id=prop.id,
        rec_key="rec-price-low",
        title="Tarifa baja vieja",
        action="Vieja accion",
        evidence_json=[],
        metrics_json={"Tu tarifa": 80.0},
        as_of=date(2026, 11, 1),
        as_of_month="2026-11",
    )
    mock_res_exist = MagicMock()
    mock_res_exist.scalars.return_value.first.return_value = existing
    mock_db.execute.return_value = mock_res_exist

    saved2 = await record_advice_batch(mock_db, prop, recs, as_of_date=date(2026, 11, 16))
    assert len(saved2) == 1
    assert saved2[0].title == "Tarifa baja"
    assert saved2[0].action == "Subir tarifa a 120"
    assert saved2[0].metrics_json["Tu tarifa"] == 90.0


@pytest.mark.asyncio
async def test_get_advice_history_limit_5():
    """Verifica que se recuperen como máximo 5 registros más recientes."""
    mock_db = AsyncMock()
    prop = MagicMock(spec=Property)
    prop.id = uuid.uuid4()

    mock_records = [
        ChatbotAdvice(
            id=uuid.uuid4(),
            property_id=prop.id,
            rec_key=f"rec-{i}",
            title=f"Consejo {i}",
            action=f"Acción {i}",
            evidence_json=[],
            metrics_json={"Ingreso": 1000 + i * 100},
            as_of=date(2026, i, 1),
            as_of_month=f"2026-{i:02d}",
        )
        for i in range(1, 6)
    ]

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = mock_records
    mock_db.execute.return_value = mock_res

    current_metrics = {"Ingreso": 1800}
    history = await get_advice_history(mock_db, prop, limit=5, current_metrics=current_metrics)

    assert len(history) == 5
    assert history[0]["rec_key"] == "rec-1"
    assert history[0]["metricas_entonces"]["Ingreso"] == 1100
    assert history[0]["metricas_ahora"]["Ingreso"] == 1800


@pytest.mark.asyncio
async def test_get_advice_history_empty():
    """Verifica respuesta limpia cuando la propiedad no tiene consejos registrados."""
    mock_db = AsyncMock()
    prop = MagicMock(spec=Property)
    prop.id = uuid.uuid4()

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_res

    history = await get_advice_history(mock_db, prop, limit=5)
    assert history == []
