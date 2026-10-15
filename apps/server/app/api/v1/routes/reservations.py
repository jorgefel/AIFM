import uuid
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.schemas.reservation import ReservationRead, ReservationCreate, ReservationUpdate
from app.services.cache import invalidate_summary_cache

router = APIRouter(prefix="/reservations", tags=["reservations"])


async def _ensure_no_overlap(
    *, property_id: uuid.UUID, check_in: date, check_out: date, db: AsyncSession, exclude_id: uuid.UUID | None = None
) -> None:
    """A stay occupies nights [check_in, check_out), so same-day turnover is valid."""
    query = select(Reservation.id).where(
        Reservation.property_id == property_id,
        Reservation.status != "cancelled",
        Reservation.check_in < check_out,
        Reservation.check_out > check_in,
    )
    if exclude_id:
        query = query.where(Reservation.id != exclude_id)
    conflict = (await db.execute(query.limit(1))).scalars().first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This reservation overlaps an existing active stay for this property.",
        )


@router.get("/calendar", response_model=List[ReservationRead])
async def get_calendar_reservations(
    start: date,
    end: date,
    property_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if end <= start:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end must be after start")
    query = select(Reservation).join(Property).where(
        Property.owner_id == current_user.id,
        Property.is_active.is_(True),
        Reservation.status != "cancelled",
        Reservation.check_in < end,
        Reservation.check_out > start,
    )
    if property_id:
        query = query.where(Reservation.property_id == property_id)
    result = await db.execute(query.order_by(Reservation.check_in, Reservation.created_at))
    return result.scalars().all()


@router.get("", response_model=List[ReservationRead], include_in_schema=False)
@router.get("/", response_model=List[ReservationRead])
async def get_reservations(property_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_property_access(property_id, current_user, db)
    
    result = await db.execute(
        select(Reservation).where(Reservation.property_id == property_id, Reservation.status != "cancelled")
    )
    return result.scalars().all()

@router.post("", response_model=ReservationRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ReservationRead, status_code=status.HTTP_201_CREATED)
async def create_reservation(reservation_in: ReservationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_property_access(reservation_in.property_id, current_user, db)
    if reservation_in.status != "cancelled":
        await _ensure_no_overlap(
            property_id=reservation_in.property_id,
            check_in=reservation_in.check_in,
            check_out=reservation_in.check_out,
            db=db,
        )
    data = reservation_in.model_dump()
    data["net_amount"] = data["total_amount"] - data.get("platform_fee", 0.0)
    
    db_reservation = Reservation(**data)
    db.add(db_reservation)
    await db.commit()
    await db.refresh(db_reservation)
    
    await invalidate_summary_cache(db_reservation.property_id)
    
    return db_reservation

@router.put("/{reservation_id}", response_model=ReservationRead)
async def update_reservation(reservation_id: uuid.UUID, reservation_in: ReservationUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Reservation).join(Property).where(
            Reservation.id == reservation_id, 
            Property.owner_id == current_user.id
        )
    )
    db_reservation = result.scalars().first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    update_data = reservation_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_reservation, field, value)
        
    if db_reservation.check_out <= db_reservation.check_in:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="check_out must be after check_in")

    if db_reservation.status != "cancelled":
        await _ensure_no_overlap(
            property_id=db_reservation.property_id,
            check_in=db_reservation.check_in,
            check_out=db_reservation.check_out,
            db=db,
            exclude_id=db_reservation.id,
        )

    # Re-calculate net_amount if total_amount or platform_fee changes
    if "total_amount" in update_data or "platform_fee" in update_data:
        db_reservation.net_amount = float(db_reservation.total_amount) - float(db_reservation.platform_fee)
        
    await db.commit()
    await db.refresh(db_reservation)
    
    await invalidate_summary_cache(db_reservation.property_id)
    
    return db_reservation

@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(reservation_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Reservation).join(Property).where(
            Reservation.id == reservation_id, 
            Property.owner_id == current_user.id,
            Reservation.status != "cancelled"
        )
    )
    db_reservation = result.scalars().first()
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    db_reservation.status = "cancelled" # Soft delete
    await db.commit()
    
    await invalidate_summary_cache(db_reservation.property_id)
    
    return None
