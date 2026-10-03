"""Idempotent Beds24 booking import. No OTA writes are performed here."""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import Beds24PropertyLink, ChannelConnection
from app.models.reservation import Reservation
from app.services.beds24 import Beds24Client
from app.services.cache import invalidate_summary_cache


def _first(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        value = data.get(key)
        if value is not None:
            return value
    return default


def _as_date(value: Any) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def _as_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Beds24 booking has an invalid amount") from exc


def normalize_beds24_booking(remote: dict[str, Any]) -> dict[str, Any]:
    """Map only the booking fields Nomora needs; never retain guest PII extras."""
    booking_id = _first(remote, "id", "bookingId")
    property_id = _first(remote, "propertyId", "property_id")
    check_in = _first(remote, "arrival", "checkIn", "check_in")
    check_out = _first(remote, "departure", "checkOut", "check_out")
    if booking_id is None or property_id is None or not check_in or not check_out:
        raise ValueError("Beds24 booking is missing id, property or stay dates")
    raw_status = str(_first(remote, "status", "bookingStatus", default="confirmed")).lower()
    is_cancelled = raw_status in {"cancelled", "canceled", "cancel", "void"}
    guest_name = _first(remote, "guestName", "name")
    if not guest_name:
        first = str(_first(remote, "firstName", default="")).strip()
        last = str(_first(remote, "lastName", default="")).strip()
        guest_name = (f"{first} {last}").strip() or "Huésped sincronizado"
    total_amount = _as_decimal(_first(remote, "price", "total", "totalAmount", default=0))
    fee = _as_decimal(_first(remote, "commission", "channelCommission", "platformFee", default=0))
    source = str(_first(remote, "apiSource", "source", default="beds24")).lower()
    platform = source if source in {"airbnb", "booking", "vrbo", "direct"} else "other"
    if _as_date(check_out) <= _as_date(check_in):
        raise ValueError("Beds24 booking has invalid stay dates")
    return {
        "beds24_booking_id": str(booking_id),
        "beds24_property_id": str(property_id),
        "guest_name": str(guest_name)[:200],
        "check_in": _as_date(check_in),
        "check_out": _as_date(check_out),
        "total_amount": total_amount,
        "platform_fee": fee,
        "net_amount": total_amount - fee,
        "currency": str(_first(remote, "currency", default="USD")).upper()[:3],
        "platform": platform,
        "status": "cancelled" if is_cancelled else ("pending" if raw_status in {"pending", "request"} else "confirmed"),
    }


async def sync_beds24_bookings(connection: ChannelConnection, db: AsyncSession) -> dict[str, int | datetime]:
    """Fetch, upsert and soft-cancel remote bookings for one mapped connection."""
    links_result = await db.execute(
        select(Beds24PropertyLink).where(Beds24PropertyLink.channel_connection_id == connection.id)
    )
    property_by_remote_id = {
        link.beds24_property_id: link.property_id for link in links_result.scalars().all()
    }
    if not property_by_remote_id:
        raise ValueError("Connect at least one Nomora property to a Beds24 property before syncing.")

    # Saving the start timestamp as the next cursor ensures updates occurring
    # while this request runs are included in the following (overlapping) run.
    sync_started_at = datetime.now(timezone.utc)
    cursor = connection.bookings_cursor
    remote_bookings = await Beds24Client.get_bookings(cursor)
    counters = {"created": 0, "updated": 0, "cancelled": 0}
    changed_properties = set()

    for raw_booking in remote_bookings:
        normalized = normalize_beds24_booking(raw_booking)
        property_id = property_by_remote_id.get(normalized.pop("beds24_property_id"))
        if property_id is None:
            continue
        existing_result = await db.execute(
            select(Reservation).where(Reservation.beds24_booking_id == normalized["beds24_booking_id"])
        )
        reservation = existing_result.scalars().first()
        if reservation is None:
            reservation = Reservation(property_id=property_id, sync_source="beds24", synced_at=sync_started_at, **normalized)
            db.add(reservation)
            counters["created"] += 1
        else:
            # An ID may never move between owned properties; this prevents a
            # malformed response from crossing tenancy boundaries.
            if reservation.property_id != property_id:
                raise ValueError("Beds24 booking ownership does not match its stored Nomora property.")
            for field, value in normalized.items():
                setattr(reservation, field, value)
            reservation.sync_source = "beds24"
            reservation.synced_at = sync_started_at
            counters["updated"] += 1
        if normalized["status"] == "cancelled":
            counters["cancelled"] += 1
        changed_properties.add(property_id)

    connection.bookings_cursor = sync_started_at
    connection.last_bookings_sync_at = sync_started_at
    await db.commit()
    for property_id in changed_properties:
        await invalidate_summary_cache(property_id)
    return {"records_processed": len(remote_bookings), **counters, "last_synced_at": sync_started_at}
