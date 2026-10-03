from datetime import date
from types import SimpleNamespace
from uuid import uuid4

from app.api.v1.routes.analysis import _portfolio_summary
from app.engine.golden_rule import aggregate_monthly_summaries


def test_aggregate_monthly_summaries_keeps_occupancy_as_a_property_average():
    result = aggregate_monthly_summaries([
        {"gross_income": 100, "total_fees": 10, "net_income": 90, "total_expenses": 20, "net_profit": 70, "occupancy_rate": 1, "reservation_count": 1, "expense_count": 1},
        {"gross_income": 50, "total_fees": 5, "net_income": 45, "total_expenses": 10, "net_profit": 35, "occupancy_rate": 0, "reservation_count": 1, "expense_count": 1},
    ], 2026, 10)

    assert result["net_profit"] == 105.0
    assert result["occupancy_rate"] == 0.5
    assert result["reservation_count"] == 2


def test_portfolio_summary_returns_a_row_for_each_property():
    first_id, second_id = uuid4(), uuid4()
    properties = [SimpleNamespace(id=first_id, name="Casa", currency="USD"), SimpleNamespace(id=second_id, name="Loft", currency="USD")]
    reservations = [{"property_id": first_id, "status": "confirmed", "check_in": date(2026, 10, 2), "check_out": date(2026, 10, 4), "total_amount": 100, "platform_fee": 10}]

    summary, rows = _portfolio_summary(properties, reservations, [], 2026, 10)

    assert len(rows) == 2
    assert summary["gross_income"] == 100.0
    assert summary["occupancy_rate"] > 0
