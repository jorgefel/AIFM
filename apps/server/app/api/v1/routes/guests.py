from datetime import datetime, timezone
import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.guest import Guest
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.guest import GuestCreate, GuestDetail, GuestRead, GuestStay, GuestUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/guests", tags=["guests"])


async def _enrich_guest_read(guest: Guest, db: AsyncSession) -> GuestRead:
    res = await db.execute(
        select(Reservation.check_in, Reservation.check_out, Reservation.property_id)
        .where(
            Reservation.guest_id == guest.id,
            Reservation.status.in_(["confirmed", "completed"]),
        )
    )
    rows = res.all()
    total_nights = sum(max(0, (row[1] - row[0]).days) for row in rows)
    distinct_properties = len({row[2] for row in rows})

    return GuestRead(
        id=guest.id,
        owner_id=guest.owner_id,
        first_name=guest.first_name,
        last_name=guest.last_name,
        document_or_keyword=guest.document_or_keyword,
        total_nights=total_nights,
        properties_count=distinct_properties,
        created_at=guest.created_at or datetime.now(timezone.utc),
        updated_at=guest.updated_at or datetime.now(timezone.utc),
    )


@router.get("", response_model=List[GuestRead], include_in_schema=False)
@router.get("/", response_model=List[GuestRead])
async def get_guests(
    q: Optional[str] = Query(None, description="Search by name or document/keyword"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Guest).where(Guest.owner_id == current_user.id)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        full_name = func.lower(Guest.first_name + " " + Guest.last_name)
        query = query.where(
            or_(
                func.lower(Guest.first_name).like(term),
                func.lower(Guest.last_name).like(term),
                full_name.like(term),
                func.lower(func.coalesce(Guest.document_or_keyword, "")).like(term),
            )
        )

    result = await db.execute(
        query.order_by(Guest.first_name, Guest.last_name).limit(limit).offset(offset)
    )
    guests = result.scalars().all()

    enriched = [await _enrich_guest_read(g, db) for g in guests]
    return enriched


@router.post("", response_model=GuestRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=GuestRead, status_code=status.HTTP_201_CREATED)
async def create_guest(
    guest_in: GuestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check uniqueness of document_or_keyword under this owner
    if guest_in.document_or_keyword and guest_in.document_or_keyword.strip():
        doc = guest_in.document_or_keyword.strip()
        existing = await db.execute(
            select(Guest).where(
                Guest.owner_id == current_user.id,
                Guest.document_or_keyword == doc,
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un huésped con este documento o palabra clave.",
            )

    guest = Guest(
        id=uuid.uuid4(),
        owner_id=current_user.id,
        first_name=guest_in.first_name.strip(),
        last_name=guest_in.last_name.strip(),
        document_or_keyword=guest_in.document_or_keyword.strip() if guest_in.document_or_keyword else None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(guest)
    await db.commit()
    await db.refresh(guest)
    return await _enrich_guest_read(guest, db)


@router.get("/{guest_id}", response_model=GuestDetail)
async def get_guest(
    guest_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Guest).where(Guest.id == guest_id, Guest.owner_id == current_user.id)
    )
    guest = result.scalars().first()
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Huésped no encontrado")

    # Fetch stay history with property names
    res_query = (
        select(Reservation, Property.name)
        .join(Property, Reservation.property_id == Property.id)
        .where(
            Reservation.guest_id == guest.id,
            Property.owner_id == current_user.id,
        )
        .order_by(Reservation.check_in.desc())
    )
    res_result = await db.execute(res_query)
    rows = res_result.all()

    stays: List[GuestStay] = []
    properties_set = set()
    total_nights = 0

    for r, prop_name in rows:
        nights = max(0, (r.check_out - r.check_in).days)
        if r.status in ("confirmed", "completed"):
            total_nights += nights
            properties_set.add(prop_name)

        stays.append(
            GuestStay(
                reservation_id=r.id,
                property_id=r.property_id,
                property_name=prop_name,
                check_in=r.check_in,
                check_out=r.check_out,
                nights=nights,
                status=r.status,
                total_amount=float(r.total_amount),
            )
        )

    return GuestDetail(
        id=guest.id,
        owner_id=guest.owner_id,
        first_name=guest.first_name,
        last_name=guest.last_name,
        document_or_keyword=guest.document_or_keyword,
        total_nights=total_nights,
        properties_count=len(properties_set),
        properties_stayed=sorted(list(properties_set)),
        stays=stays,
        created_at=guest.created_at,
        updated_at=guest.updated_at,
    )


@router.put("/{guest_id}", response_model=GuestRead)
async def update_guest(
    guest_id: uuid.UUID,
    guest_in: GuestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Guest).where(Guest.id == guest_id, Guest.owner_id == current_user.id)
    )
    guest = result.scalars().first()
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Huésped no encontrado")

    update_data = guest_in.model_dump(exclude_unset=True)
    if "document_or_keyword" in update_data and update_data["document_or_keyword"]:
        doc = update_data["document_or_keyword"].strip()
        existing = await db.execute(
            select(Guest).where(
                Guest.owner_id == current_user.id,
                Guest.document_or_keyword == doc,
                Guest.id != guest_id,
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe otro huésped con este documento o palabra clave.",
            )
        guest.document_or_keyword = doc

    if "first_name" in update_data and update_data["first_name"]:
        guest.first_name = update_data["first_name"].strip()
    if "last_name" in update_data and update_data["last_name"]:
        guest.last_name = update_data["last_name"].strip()

    await db.commit()
    await db.refresh(guest)
    return await _enrich_guest_read(guest, db)


@router.delete("/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guest(
    guest_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Guest).where(Guest.id == guest_id, Guest.owner_id == current_user.id)
    )
    guest = result.scalars().first()
    if not guest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Huésped no encontrado")

    # Unlink reservations
    res_update = await db.execute(
        select(Reservation).where(Reservation.guest_id == guest.id)
    )
    for res in res_update.scalars().all():
        res.guest_id = None

    await db.delete(guest)
    await db.commit()
    return None
