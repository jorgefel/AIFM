import uuid
from datetime import date

import pytest

from app.api.v1.routes import analysis
from app.engine.golden_rule import calculate_daily_chart_data
from app.schemas.analysis import DashboardData


def test_daily_chart_data_includes_every_day_and_aggregates_transactions():
    points = calculate_daily_chart_data(
        reservations=[
            {"status": "confirmed", "check_in": date(2026, 8, 5), "total_amount": 100},
            {"status": "cancelled", "check_in": date(2026, 8, 5), "total_amount": 50},
        ],
        expenses=[
            {"is_deleted": False, "date": date(2026, 8, 5), "amount": 20},
            {"is_deleted": True, "date": date(2026, 8, 5), "amount": 10},
        ],
        year=2026,
        month=8,
    )

    assert len(points) == 31
    assert points[0] == {
        "year": 2026,
        "month": 8,
        "day": 1,
        "gross_income": 0.0,
        "total_expenses": 0.0,
    }
    assert points[4]["gross_income"] == 100.0
    assert points[4]["total_expenses"] == 20.0


@pytest.mark.asyncio
async def test_dashboard_accepts_range_query_without_shadowing_builtin(monkeypatch):
    """The public `range` query parameter must not hide Python's range()."""
    async def verify_access(*_args):
        return None

    async def property_data(*_args):
        return [], [], None

    async def cached_summary(*_args):
        return None

    async def cache_summary(*_args):
        return None

    def monthly_summary(*_args):
        return {
            "year": 2026,
            "month": 8,
            "gross_income": 0,
            "total_fees": 0,
            "net_income": 0,
            "total_expenses": 0,
            "net_profit": 0,
            "occupancy_rate": 0,
            "reservation_count": 0,
            "expense_count": 0,
        }

    monkeypatch.setattr(analysis, "verify_property_access", verify_access)
    monkeypatch.setattr(analysis, "_get_property_data", property_data)
    monkeypatch.setattr(analysis, "get_cached_summary", cached_summary)
    monkeypatch.setattr(analysis, "set_cached_summary", cache_summary)
    monkeypatch.setattr(analysis, "calculate_monthly_summary", monthly_summary)

    response = await analysis.get_dashboard_data(
        property_id=uuid.uuid4(),
        year=2026,
        month=8,
        range_="3m",
        db=None,
        current_user=None,
    )

    assert len(response["chart_data"]) == 3


@pytest.mark.asyncio
async def test_dashboard_returns_daily_series_for_one_month(monkeypatch):
    async def verify_access(*_args):
        return None

    async def property_data(*_args):
        return [], [], None

    async def cached_summary(*_args):
        return None

    async def cache_summary(*_args):
        return None

    def monthly_summary(*_args):
        return {
            "year": 2026, "month": 8, "gross_income": 0, "total_fees": 0,
            "net_income": 0, "total_expenses": 0, "net_profit": 0,
            "occupancy_rate": 0, "reservation_count": 0, "expense_count": 0,
        }

    monkeypatch.setattr(analysis, "verify_property_access", verify_access)
    monkeypatch.setattr(analysis, "_get_property_data", property_data)
    monkeypatch.setattr(analysis, "get_cached_summary", cached_summary)
    monkeypatch.setattr(analysis, "set_cached_summary", cache_summary)
    monkeypatch.setattr(analysis, "calculate_monthly_summary", monthly_summary)

    response = await analysis.get_dashboard_data(
        property_id=uuid.uuid4(), year=2026, month=8, range_="1m", db=None, current_user=None,
    )

    assert len(response["chart_data"]) == 31
    assert response["chart_data"][0]["day"] == 1
    DashboardData.model_validate(response)
