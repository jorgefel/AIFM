import uuid

import pytest

from app.api.v1.routes import analysis


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
