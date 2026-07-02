import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.property import Property
from app.schemas.property import PropertyRead, PropertyCreate, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])

@router.get("/", response_model=List[PropertyRead])
async def get_properties(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Property).where(Property.owner_id == current_user.id, Property.is_active == True)
    )
    return result.scalars().all()

@router.post("/", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
async def create_property(property_in: PropertyCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_property = Property(**property_in.model_dump(), owner_id=current_user.id)
    db.add(db_property)
    await db.commit()
    await db.refresh(db_property)
    return db_property

@router.get("/{property_id}", response_model=PropertyRead)
async def get_property(property_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.owner_id == current_user.id, Property.is_active == True)
    )
    db_property = result.scalars().first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

@router.put("/{property_id}", response_model=PropertyRead)
async def update_property(property_id: uuid.UUID, property_in: PropertyUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.owner_id == current_user.id, Property.is_active == True)
    )
    db_property = result.scalars().first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
        
    update_data = property_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_property, field, value)
        
    await db.commit()
    await db.refresh(db_property)
    return db_property

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(property_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Property).where(Property.id == property_id, Property.owner_id == current_user.id, Property.is_active == True)
    )
    db_property = result.scalars().first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
        
    db_property.is_active = False # Soft delete
    await db.commit()
    return None
