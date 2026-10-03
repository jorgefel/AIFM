from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.dependencies import require_tier
from app.services.billing import subscription_price_id, tier_for_subscription_status, unix_timestamp_to_datetime


def test_only_active_subscription_grants_pro_access():
    assert tier_for_subscription_status("active") == "pro"
    assert tier_for_subscription_status("trialing") == "free"
    assert tier_for_subscription_status("past_due") == "free"
    assert tier_for_subscription_status("canceled") == "free"


def test_stripe_subscription_values_are_normalized():
    assert subscription_price_id({"items": {"data": [{"price": {"id": "price_pro"}}]}}) == "price_pro"
    assert unix_timestamp_to_datetime(0) is None
    assert unix_timestamp_to_datetime(1_728_000_000) == datetime(2024, 10, 4, 0, 0, tzinfo=timezone.utc)


def test_pro_dependency_rejects_free_user():
    dependency = require_tier("pro")
    free_user = type("User", (), {"tier": "free"})()
    try:
        dependency(free_user)
    except HTTPException as exc:
        assert exc.status_code == 403
    else:
        raise AssertionError("Free users must not pass the Pro dependency")

    pro_user = type("User", (), {"tier": "pro"})()
    assert dependency(pro_user) is pro_user
