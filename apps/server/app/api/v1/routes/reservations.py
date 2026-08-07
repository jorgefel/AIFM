import uuid
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

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("/", response_model=List[ReservationRead])
async def get_reservations(property_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_property_access(property_id, current_user, db)
    
    result = await db.execute(
        select(Reservation).where(Reservation.property_id == property_id, Reservation.status != "cancelled")
    )
    return result.scalars().all()

@router.post("/", response_model=ReservationRead, status_code=status.HTTP_201_CREATED)
async def create_reservation(reservation_in: ReservationCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_property_access(reservation_in.property_id, current_user, db)
    
    data = reservation_in.model_dump()
    data["net_amount"] = data["total_amount"] - data.get("platform_fee", 0.0)
    
    db_reservation = Reservation(**data)
    db.add(db_reservation)
    await db.commit()
    await db.refresh(db_reservation)
    return db_reservation

@router.put("/{reservation_id}", response_model=ReservationRead)
async def update_reservation(reservation_id: uuid.UUID, reservation_in: ReservationUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
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
        
    update_data = reservation_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_reservation, field, value)
        
    # Re-calculate net_amount if total_amount or platform_fee changes
    if "total_amount" in update_data or "platform_fee" in update_data:
        db_reservation.net_amount = float(db_reservation.total_amount) - float(db_reservation.platform_fee)
        
    await db.commit()
    await db.refresh(db_reservation)
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
    return None
