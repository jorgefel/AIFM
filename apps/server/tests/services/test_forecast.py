from datetime import date
from app.services.forecast import generate_property_forecast, compute_backtest_mape


def test_forecast_short_history():
    today = date.today()
    reservations = [
        {"total_amount": 1000.0, "platform_fee": 100.0, "status": "confirmed", "check_in": today.isoformat(), "check_out": today.isoformat()}
    ]
    expenses = [
        {"amount": 200.0, "is_deleted": False, "date": today.isoformat()}
    ]
    forecasts, count = generate_property_forecast(
        property_id="test-prop-1",
        reservations=reservations,
        expenses=expenses,
        steps=3
    )
    assert len(forecasts) == 3
    assert count >= 1
    for f in forecasts:
        assert f.is_forecast is True
        assert f.projected_gross_income >= 0
        assert f.gross_income_min <= f.gross_income_max
        assert f.net_profit_min <= f.net_profit_max
        assert f.confidence_level == "limited"
        assert f.model_used == "moving_average"
        assert f.projected_reservations is not None
        assert f.booked_reservations is not None


def test_forecast_multi_month_trend():
    today = date.today()
    reservations = []
    for i in range(6):
        month_idx = today.month - 5 + i
        year = today.year
        if month_idx <= 0:
            month_idx += 12
            year -= 1
        reservations.append({
            "total_amount": 1000.0 + i * 200.0,
            "platform_fee": 50.0,
            "status": "confirmed",
            "check_in": f"{year:04d}-{month_idx:02d}-10",
            "check_out": f"{year:04d}-{month_idx:02d}-15",
        })

    expenses = []
    forecasts, count, meta = generate_property_forecast(
        property_id="test-prop-2",
        reservations=reservations,
        expenses=expenses,
        steps=2,
        return_metadata=True
    )
    assert len(forecasts) == 2
    assert count >= 6
    assert forecasts[0].projected_gross_income > 0
    assert meta["model"] == "holt"
    assert meta["confidence_level"] == "medium"
    assert meta["backtest_mape"] is not None


def test_regression_net_profit_max_not_using_gross_upper_bound():
    """Test de regresión para el bug donde net_profit_max usaba up_gross.

    Con ingresos de 10,000 y gastos de 7,000, el beneficio neto es ~3,000.
    net_profit_max NUNCA debe ser igual a gross_income_max (~10,000+).
    """
    today = date.today()
    reservations = []
    expenses = []

    for i in range(5):
        m_idx = today.month - 4 + i
        yr = today.year
        if m_idx <= 0:
            m_idx += 12
            yr -= 1
        reservations.append({
            "total_amount": 10000.0,
            "platform_fee": 500.0,
            "net_amount": 9500.0,
            "status": "confirmed",
            "check_in": f"{yr:04d}-{m_idx:02d}-05",
            "check_out": f"{yr:04d}-{m_idx:02d}-15",
        })
        expenses.append({
            "amount": 7000.0,
            "is_deleted": False,
            "date": f"{yr:04d}-{m_idx:02d}-10",
        })

    forecasts, count = generate_property_forecast(
        property_id="test-prop-regression",
        reservations=reservations,
        expenses=expenses,
        steps=3
    )

    assert count >= 5
    for f in forecasts:
        # Beneficio neto proyectado debe ser considerablemente menor al ingreso bruto
        assert f.projected_net_profit < f.projected_gross_income
        # Corrección del bug: net_profit_max no debe ser igual a gross_income_max
        assert f.net_profit_max < f.gross_income_max
        assert f.net_profit_min <= f.net_profit_max


def test_forecast_zero_history():
    """Propiedad recién creada sin ningún registro histórico."""
    forecasts, count, meta = generate_property_forecast(
        property_id="test-prop-empty",
        reservations=[],
        expenses=[],
        steps=3,
        return_metadata=True
    )
    assert len(forecasts) == 3
    assert meta["confidence_level"] == "limited"
    assert meta["model"] == "moving_average"
    assert meta["backtest_mape"] is None
    for f in forecasts:
        assert f.projected_gross_income == 0.0
        assert f.projected_net_profit == 0.0
        assert f.confidence_level == "limited"


def test_forecast_long_history_holt_winters():
    """Propiedad con 24 meses continuos (2 ciclos anuales completos) aplica Holt-Winters."""
    today = date.today()
    reservations = []
    for i in range(24):
        # Generar 24 meses hacia atrás
        total_months = today.year * 12 + today.month - 23 + i
        yr = (total_months - 1) // 12
        m_idx = (total_months - 1) % 12 + 1
        reservations.append({
            "total_amount": 3000.0 + (i % 12) * 200.0,
            "platform_fee": 150.0,
            "status": "confirmed",
            "check_in": f"{yr:04d}-{m_idx:02d}-02",
            "check_out": f"{yr:04d}-{m_idx:02d}-10",
        })

    forecasts, count, meta = generate_property_forecast(
        property_id="test-prop-24m",
        reservations=reservations,
        expenses=[],
        steps=3,
        return_metadata=True
    )
    assert count >= 24
    assert meta["model"] == "holt_winters"
    assert meta["confidence_level"] == "high"
    assert meta["backtest_mape"] is not None
