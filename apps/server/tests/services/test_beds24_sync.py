from datetime import date
from decimal import Decimal

import pytest

from app.services.beds24_sync import normalize_beds24_booking, normalize_beds24_inventory


def test_normalizes_remote_booking_without_storing_unneeded_fields():
    booking = normalize_beds24_booking({
        "id": 4455, "propertyId": 22, "arrival": "2026-10-12", "departure": "2026-10-15",
        "firstName": "Ana", "lastName": "Gómez", "price": "350.50", "commission": "35.25",
        "currency": "usd", "apiSource": "airbnb", "status": "confirmed", "cardNumber": "must-not-be-kept",
    })
    assert booking["beds24_booking_id"] == "4455"
    assert booking["beds24_property_id"] == "22"
    assert booking["guest_name"] == "Ana Gómez"
    assert booking["check_in"] == date(2026, 10, 12)
    assert booking["total_amount"] == Decimal("350.50")
    assert booking["net_amount"] == Decimal("315.25")
    assert booking["platform"] == "airbnb"
    assert "cardNumber" not in booking


@pytest.mark.parametrize("status", ["cancelled", "canceled", "void"])
def test_remote_cancellations_become_soft_cancelled(status: str):
    booking = normalize_beds24_booking({
        "id": "remote-1", "propertyId": "one", "arrival": "2026-10-12", "departure": "2026-10-13", "status": status,
    })
    assert booking["status"] == "cancelled"


def test_invalid_remote_dates_are_rejected():
    with pytest.raises(ValueError, match="invalid stay dates"):
        normalize_beds24_booking({"id": "1", "propertyId": "one", "arrival": "2026-10-12", "departure": "2026-10-12"})


def test_normalizes_daily_inventory_without_retaining_remote_extras():
    days = normalize_beds24_inventory({
        "propertyId": 22,
        "calendar": [{"date": "2026-10-12", "numAvail": 2, "price1": "125.50", "internalNote": "ignore"}],
    })
    assert days == [{
        "beds24_property_id": "22", "date": date(2026, 10, 12), "available_units": 2, "price": Decimal("125.50"),
    }]


def test_inventory_requires_a_property_identifier():
    with pytest.raises(ValueError, match="missing propertyId"):
        normalize_beds24_inventory({"calendar": []})
