from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.reservation import ReservationCreate, ReservationUpdate


def reservation_payload():
    return {
        "property_id": uuid4(),
        "guest_name": "María Gómez",
        "check_in": date(2026, 10, 10),
        "check_out": date(2026, 10, 13),
        "total_amount": 400,
        "platform": "airbnb",
    }


def test_reservation_requires_checkout_after_checkin():
    payload = reservation_payload()
    payload["check_out"] = payload["check_in"]

    with pytest.raises(ValidationError):
        ReservationCreate(**payload)


def test_reservation_rejects_negative_platform_fee():
    payload = reservation_payload()
    payload["platform_fee"] = -1

    with pytest.raises(ValidationError):
        ReservationCreate(**payload)


def test_reservation_update_accepts_a_partial_status_change():
    update = ReservationUpdate(status="completed")

    assert update.status == "completed"
