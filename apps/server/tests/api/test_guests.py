"""Pruebas unitarias para el módulo de Huéspedes (/api/v1/guests)."""

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from fastapi import HTTPException

from app.api.v1.routes.guests import (
    create_guest,
    delete_guest,
    get_guest,
    get_guests,
    update_guest,
)
from app.models.guest import Guest
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.guest import GuestCreate, GuestUpdate


@pytest.mark.asyncio
async def test_create_guest_success():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")

    # No existing guest with this document
    mock_existing = MagicMock()
    mock_existing.scalars.return_value.first.return_value = None

    # Stays for enrichment
    mock_stays = MagicMock()
    mock_stays.all.return_value = []

    mock_db.execute.side_effect = [mock_existing, mock_stays]

    guest_in = GuestCreate(
        first_name="Carlos",
        last_name="Gómez",
        document_or_keyword="CC123456",
    )

    # Calling create_guest
    created = await create_guest(guest_in, db=mock_db, current_user=user)
    assert created.first_name == "Carlos"
    assert created.last_name == "Gómez"
    assert created.document_or_keyword == "CC123456"
    assert created.owner_id == user_id
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_create_guest_duplicate_document_raises_409():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")

    existing_guest = Guest(
        id=uuid.uuid4(),
        owner_id=user_id,
        first_name="Carlos",
        last_name="Gómez",
        document_or_keyword="CC123456",
    )

    mock_existing = MagicMock()
    mock_existing.scalars.return_value.first.return_value = existing_guest
    mock_db.execute.return_value = mock_existing

    guest_in = GuestCreate(
        first_name="Otro",
        last_name="Gómez",
        document_or_keyword="CC123456",
    )

    with pytest.raises(HTTPException) as exc:
        await create_guest(guest_in, db=mock_db, current_user=user)
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_get_guest_detail_calculates_stays_and_nights():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")
    guest_id = uuid.uuid4()

    guest = Guest(
        id=guest_id,
        owner_id=user_id,
        first_name="Ana",
        last_name="Martínez",
        document_or_keyword="PASSPORT99",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    mock_guest_res = MagicMock()
    mock_guest_res.scalars.return_value.first.return_value = guest

    res1 = Reservation(
        id=uuid.uuid4(),
        property_id=uuid.uuid4(),
        guest_id=guest_id,
        guest_name="Ana Martínez",
        check_in=date(2026, 1, 10),
        check_out=date(2026, 1, 15),  # 5 nights
        total_amount=500.0,
        status="confirmed",
    )
    res2 = Reservation(
        id=uuid.uuid4(),
        property_id=uuid.uuid4(),
        guest_id=guest_id,
        guest_name="Ana Martínez",
        check_in=date(2026, 2, 1),
        check_out=date(2026, 2, 4),  # 3 nights
        total_amount=300.0,
        status="completed",
    )
    res_cancelled = Reservation(
        id=uuid.uuid4(),
        property_id=uuid.uuid4(),
        guest_id=guest_id,
        guest_name="Ana Martínez",
        check_in=date(2026, 3, 1),
        check_out=date(2026, 3, 5),  # 4 nights cancelled -> 0 nights counted
        total_amount=400.0,
        status="cancelled",
    )

    mock_stays_res = MagicMock()
    mock_stays_res.all.return_value = [
        (res1, "Casa Campestre"),
        (res2, "Apartamento Poblado"),
        (res_cancelled, "Loft Centro"),
    ]

    mock_db.execute.side_effect = [mock_guest_res, mock_stays_res]

    detail = await get_guest(guest_id, db=mock_db, current_user=user)
    assert detail.id == guest_id
    assert detail.total_nights == 8  # 5 + 3, cancelled ignored
    assert detail.properties_count == 2
    assert "Casa Campestre" in detail.properties_stayed
    assert "Apartamento Poblado" in detail.properties_stayed
    assert len(detail.stays) == 3


@pytest.mark.asyncio
async def test_get_guest_unowned_returns_404():
    mock_db = AsyncMock()
    user = User(id=uuid.uuid4(), email="owner@example.com")
    guest_id = uuid.uuid4()

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    with pytest.raises(HTTPException) as exc:
        await get_guest(guest_id, db=mock_db, current_user=user)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_guest_unlinks_reservations():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")
    guest_id = uuid.uuid4()

    guest = Guest(id=guest_id, owner_id=user_id, first_name="Juan", last_name="Pérez")
    mock_guest_res = MagicMock()
    mock_guest_res.scalars.return_value.first.return_value = guest

    res = Reservation(
        id=uuid.uuid4(),
        property_id=uuid.uuid4(),
        guest_id=guest_id,
        guest_name="Juan Pérez",
        check_in=date(2026, 1, 1),
        check_out=date(2026, 1, 3),
        total_amount=200.0,
        status="confirmed",
    )
    mock_res_list = MagicMock()
    mock_res_list.scalars.return_value.all.return_value = [res]

    mock_db.execute.side_effect = [mock_guest_res, mock_res_list]

    await delete_guest(guest_id, db=mock_db, current_user=user)
    assert res.guest_id is None
    assert mock_db.delete.called
    assert mock_db.commit.called
