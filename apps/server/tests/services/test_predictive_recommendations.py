from datetime import date
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.services.predictive_recommendations import generate_predictive_recommendations
from app.schemas.forecast import MonthForecast
from app.chatbot.context import build_context


def test_recommendations_insufficient_data():
    """Con menos de 2 meses o sin reservas, retorna recomendación de información insuficiente sin métricas inventadas."""
    recs = generate_predictive_recommendations(
        property_id="prop-new",
        reservations=[],
        expenses=[],
        historical_count=0,
    )
    assert len(recs) == 1
    assert recs[0]["id"] == "rec-insufficient-history"
    assert recs[0]["severity"] == "info"
    assert recs[0]["evidence_source"] == "own_history"
    # Sin porcentajes comerciales inventados
    assert "%" not in recs[0]["action"]


def test_recommendations_trend_positive():
    """Tendencia positiva cuando la proyección supera el promedio reciente."""
    today = date.today()
    reservations = [
        {
            "total_amount": 1000.0,
            "platform_fee": 50.0,
            "net_amount": 950.0,
            "status": "confirmed",
            "check_in": f"{today.year}-{today.month:02d}-01",
            "check_out": f"{today.year}-{today.month:02d}-05",
            "platform": "Airbnb",
        },
        {
            "total_amount": 1000.0,
            "platform_fee": 50.0,
            "net_amount": 950.0,
            "status": "confirmed",
            "check_in": f"{today.year}-{today.month:02d}-15",
            "check_out": f"{today.year}-{today.month:02d}-20",
            "platform": "Booking",
        },
    ]
    # Forecast simulado con próximo mes superior a 1000
    mock_forecast = [
        MonthForecast(
            month="2026-12",
            projected_gross_income=2500.0,
            gross_income_min=2000.0,
            gross_income_max=3000.0,
            projected_net_profit=2000.0,
            net_profit_min=1500.0,
            net_profit_max=2500.0,
            confidence_level="medium",
            model_used="holt",
            is_forecast=True,
        )
    ]
    recs = generate_predictive_recommendations(
        property_id="prop-pos",
        reservations=reservations,
        expenses=[],
        forecasts=mock_forecast,
        historical_count=4,
    )
    rec_ids = [r["id"] for r in recs]
    assert "rec-trend-positive" in rec_ids
    pos_rec = next(r for r in recs if r["id"] == "rec-trend-positive")
    assert pos_rec["severity"] == "info"
    # Evidencia con datos reales
    ev_labels = [e["label"] for e in pos_rec["evidence"]]
    assert "Promedio reciente" in ev_labels
    assert "Proyección próximo mes" in ev_labels


def test_recommendations_trend_negative():
    """Tendencia negativa cuando la proyección es menor al promedio reciente."""
    today = date.today()
    prev_m = today.month - 1 if today.month > 1 else 12
    prev_y = today.year if today.month > 1 else today.year - 1
    reservations = [
        {
            "total_amount": 5000.0,
            "platform_fee": 250.0,
            "net_amount": 4750.0,
            "status": "confirmed",
            "check_in": f"{prev_y}-{prev_m:02d}-05",
            "check_out": f"{prev_y}-{prev_m:02d}-10",
            "platform": "Airbnb",
        },
        {
            "total_amount": 5000.0,
            "platform_fee": 250.0,
            "net_amount": 4750.0,
            "status": "confirmed",
            "check_in": f"{today.year}-{today.month:02d}-05",
            "check_out": f"{today.year}-{today.month:02d}-10",
            "platform": "Airbnb",
        },
    ]
    mock_forecast = [
        MonthForecast(
            month="2026-12",
            projected_gross_income=2000.0,  # 2000 < 5000 * 0.95
            gross_income_min=1500.0,
            gross_income_max=2500.0,
            projected_net_profit=1500.0,
            net_profit_min=1000.0,
            net_profit_max=2000.0,
            confidence_level="medium",
            model_used="holt",
            is_forecast=True,
        )
    ]
    recs = generate_predictive_recommendations(
        property_id="prop-neg",
        reservations=reservations,
        expenses=[],
        forecasts=mock_forecast,
        historical_count=3,
    )
    rec_ids = [r["id"] for r in recs]
    assert "rec-trend-negative" in rec_ids
    neg_rec = next(r for r in recs if r["id"] == "rec-trend-negative")
    assert neg_rec["severity"] == "warning"


def test_recommendations_margin_negative():
    """Alerta crítica cuando el beneficio neto proyectado es negativo."""
    mock_forecast = [
        MonthForecast(
            month="2026-12",
            projected_gross_income=3000.0,
            gross_income_min=2500.0,
            gross_income_max=3500.0,
            projected_net_profit=-500.0,  # Negativo
            net_profit_min=-1000.0,
            net_profit_max=-200.0,
            confidence_level="medium",
            model_used="holt",
            is_forecast=True,
        )
    ]
    recs = generate_predictive_recommendations(
        property_id="prop-loss",
        reservations=[
            {
                "total_amount": 3000.0,
                "status": "confirmed",
                "check_in": "2026-10-01",
                "check_out": "2026-10-05",
            }
        ],
        expenses=[{"amount": 4000.0, "is_deleted": False, "date": "2026-10-05"}],
        forecasts=mock_forecast,
        historical_count=3,
    )
    rec_ids = [r["id"] for r in recs]
    assert "rec-margin-negative" in rec_ids
    crit_rec = next(r for r in recs if r["id"] == "rec-margin-negative")
    assert crit_rec["severity"] == "critical"


@pytest.mark.asyncio
async def test_dashboard_and_context_same_recommendations():
    """El dashboard y el contexto de capa 2 reciben exactamente la misma salida del servicio."""
    mock_prop = MagicMock()
    mock_prop.id = "prop-sync-test"
    mock_prop.name = "Prop Sync"
    mock_prop.property_type = "apartment"
    mock_prop.max_guests = 4
    mock_prop.bedrooms = 2
    mock_prop.bathrooms = 1
    mock_prop.city = "Medellin"
    mock_prop.country = "Colombia"
    mock_prop.currency = "COP"

    # AsyncSession mockeada
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_result.scalars.return_value.all.return_value = []
    mock_result.first.return_value = (0, 0, 0, 0)
    mock_result.scalar.return_value = 0
    mock_db.execute.return_value = mock_result

    ctx = await build_context(mock_db, mock_prop)

    # El servicio llamado directamente con los mismos datos
    direct_recs = generate_predictive_recommendations(
        property_id="prop-sync-test",
        reservations=[],
        expenses=[],
    )

    assert "proyeccion" in ctx
    assert "recomendaciones_predictivas" in ctx
    assert ctx["recomendaciones_predictivas"] == direct_recs
