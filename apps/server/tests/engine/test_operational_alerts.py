from datetime import date
from types import SimpleNamespace
from uuid import uuid4

from app.api.v1.routes.analysis import _build_operational_alerts


def test_operational_alerts_include_loss_and_upcoming_checkin():
    property_id = uuid4()
    alerts = _build_operational_alerts(
        [SimpleNamespace(id=property_id, name="Casa Norte", currency="USD")],
        [{"id": "r1", "property_id": property_id, "status": "pending", "check_in": date(2026, 10, 2), "check_out": date(2026, 10, 4), "guest_name": "Ana", "total_amount": 20, "platform_fee": 0}],
        [{"property_id": property_id, "date": date(2026, 10, 1), "amount": 100, "category": "maintenance", "is_deleted": False}],
        date(2026, 10, 1),
    )

    assert alerts[0]["type"] == "profit"
    assert any(alert["type"] == "checkin" for alert in alerts)
