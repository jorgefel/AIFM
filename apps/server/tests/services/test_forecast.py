from datetime import date
from app.services.forecast import generate_property_forecast


def test_forecast_short_history():
    reservations = [
        {"total_amount": 1000.0, "platform_fee": 100.0, "status": "confirmed", "check_in": "2026-08-01", "check_out": "2026-08-05"}
    ]
    expenses = [
        {"amount": 200.0, "is_deleted": False, "date": "2026-08-10"}
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
        assert f.confidence_level == 0.80


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
    forecasts, count = generate_property_forecast(
        property_id="test-prop-2",
        reservations=reservations,
        expenses=expenses,
        steps=2
    )
    assert len(forecasts) == 2
    assert count >= 6
    assert forecasts[0].projected_gross_income > 0
    assert "holt" in forecasts[0].model_used or "average" in forecasts[0].model_used
