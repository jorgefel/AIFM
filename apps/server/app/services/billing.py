"""Provider-neutral billing rules kept separate from HTTP and Stripe SDK code."""
from datetime import datetime, timezone
from typing import Any


# Nomora grants paid functionality only for an active Stripe subscription.
PRO_SUBSCRIPTION_STATUSES = {"active"}


def tier_for_subscription_status(status: str | None) -> str:
    return "pro" if status in PRO_SUBSCRIPTION_STATUSES else "free"


def unix_timestamp_to_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    return datetime.fromtimestamp(int(value), tz=timezone.utc)


def subscription_price_id(subscription: dict[str, Any]) -> str | None:
    items = subscription.get("items", {}).get("data", [])
    if not items:
        return None
    price = items[0].get("price", {})
    return price.get("id")
