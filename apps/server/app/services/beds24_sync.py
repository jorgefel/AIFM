"""Idempotent Beds24 booking import. No OTA writes are performed here."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import Beds24PropertyLink, ChannelConnection, ChannelInventoryDay
from app.models.reservation import Reservation
from app.services.beds24 import Beds24Client
from app.services.cache import invalidate_summary_cache


class BookingSyncSummary(TypedDict):
    records_processed: int
    created: int
    updated: int
    cancelled: int
    last_synced_at: datetime


class InventorySyncSummary(TypedDict):
    records_processed: int
    last_synced_at: datetime


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


def normalize_beds24_inventory(remote: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten a Beds24 room calendar response into daily, property-scoped rows.

    Beds24 responses have varied slightly between API versions, so accept both
    ``calendar`` and ``dates`` while requiring the immutable property id.
    """
    property_id = _first(remote, "propertyId", "property_id")
    if property_id is None:
        raise ValueError("Beds24 inventory row is missing propertyId")
    calendar = _first(remote, "calendar", "dates", default=[])
    if not isinstance(calendar, list):
        raise ValueError("Beds24 inventory calendar must be a list")
    normalized: list[dict[str, Any]] = []
    for row in calendar:
        value_date = _first(row, "date", "from")
        if not value_date:
            continue
        available = _first(row, "numAvail", "available", "availableUnits")
        price = _first(row, "price1", "price", "dailyPrice")
        normalized.append({
            "beds24_property_id": str(property_id),
            "date": _as_date(value_date),
            "available_units": max(0, int(available)) if available is not None else 0,
            "price": _as_decimal(price) if price is not None else None,
        })
    return normalized


async def sync_beds24_bookings(connection: ChannelConnection, db: AsyncSession) -> BookingSyncSummary:
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
    return {
        "records_processed": len(remote_bookings),
        "created": counters["created"],
        "updated": counters["updated"],
        "cancelled": counters["cancelled"],
        "last_synced_at": sync_started_at,
    }


async def sync_beds24_inventory(
    connection: ChannelConnection,
    db: AsyncSession,
    *,
    start: date | None = None,
    end: date | None = None,
) -> InventorySyncSummary:
    """Persist a cached read-only snapshot of Beds24 prices and availability."""
    start = start or date.today()
    end = end or start + timedelta(days=365)
    if end <= start or (end - start).days > 366:
        raise ValueError("Inventory sync range must be between 1 and 366 days")
    links = (await db.execute(select(Beds24PropertyLink).where(Beds24PropertyLink.channel_connection_id == connection.id))).scalars().all()
    property_by_remote_id = {link.beds24_property_id: link.property_id for link in links}
    if not property_by_remote_id:
        raise ValueError("Connect at least one Nomora property to a Beds24 property before syncing.")

    synced_at = datetime.now(timezone.utc)
    rows = await Beds24Client.get_room_calendar(start, end)
    by_day: dict[tuple[object, date], dict[str, Any]] = {}
    for remote in rows:
        for item in normalize_beds24_inventory(remote):
            property_id = property_by_remote_id.get(item.pop("beds24_property_id"))
            if property_id is None:
                continue
            key = (property_id, item["date"])
            # Several rooms belonging to a property aggregate their inventory.
            aggregate = by_day.setdefault(key, {"available_units": 0, "price": None})
            aggregate["available_units"] += item["available_units"]
            if item["price"] is not None:
                aggregate["price"] = item["price"] if aggregate["price"] is None else min(aggregate["price"], item["price"])

    for (property_id, inventory_date), values in by_day.items():
        existing = (await db.execute(select(ChannelInventoryDay).where(
            ChannelInventoryDay.channel_connection_id == connection.id,
            ChannelInventoryDay.property_id == property_id,
            ChannelInventoryDay.date == inventory_date,
        ))).scalars().first()
        if existing:
            existing.available_units, existing.price, existing.source = values["available_units"], values["price"], "beds24"
        else:
            db.add(ChannelInventoryDay(channel_connection_id=connection.id, property_id=property_id, date=inventory_date, source="beds24", **values))
    connection.last_inventory_sync_at = synced_at
    await db.commit()
    return {"records_processed": len(by_day), "last_synced_at": synced_at}
