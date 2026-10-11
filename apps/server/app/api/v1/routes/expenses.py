import uuid
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.models.user import User
from app.models.property import Property
from app.models.expense import Expense
from app.schemas.expense import ExpenseRead, ExpenseCreate, ExpenseUpdate
from app.services.storage import save_receipt
from app.services.cache import invalidate_summary_cache

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=List[ExpenseRead], include_in_schema=False)
@router.get("/", response_model=List[ExpenseRead])
async def get_expenses(
    property_id: uuid.UUID,
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await verify_property_access(property_id, current_user, db)
    if start and end and end < start:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end must not be before start")
    query = select(Expense).where(Expense.property_id == property_id, Expense.is_deleted.is_(False))
    if start:
        query = query.where(Expense.date >= start)
    if end:
        query = query.where(Expense.date <= end)
    result = await db.execute(query.order_by(Expense.date.desc(), Expense.created_at.desc()))
    return result.scalars().all()

@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_expense(expense_in: ExpenseCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await verify_property_access(expense_in.property_id, current_user, db)
    
    db_expense = Expense(**expense_in.model_dump())
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    
    await invalidate_summary_cache(db_expense.property_id)
    
    return db_expense

@router.post("/{expense_id}/receipt", response_model=ExpenseRead)
async def upload_expense_receipt(expense_id: uuid.UUID, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Expense).join(Property).where(
            Expense.id == expense_id, 
            Property.owner_id == current_user.id,
            Expense.is_deleted == False
        )
    )
    db_expense = result.scalars().first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    receipt_url = await save_receipt(file)
    db_expense.receipt_url = receipt_url
    await db.commit()
    await db.refresh(db_expense)
    
    return db_expense

@router.put("/{expense_id}", response_model=ExpenseRead)
async def update_expense(expense_id: uuid.UUID, expense_in: ExpenseUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Expense).join(Property).where(
            Expense.id == expense_id, 
            Property.owner_id == current_user.id,
            Expense.is_deleted == False
        )
    )
    db_expense = result.scalars().first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    update_data = expense_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_expense, field, value)
        
    await db.commit()
    await db.refresh(db_expense)
    
    await invalidate_summary_cache(db_expense.property_id)
    
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Expense).join(Property).where(
            Expense.id == expense_id, 
            Property.owner_id == current_user.id,
            Expense.is_deleted == False
        )
    )
    db_expense = result.scalars().first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db_expense.is_deleted = True # Soft delete
    await db.commit()
    
    await invalidate_summary_cache(db_expense.property_id)
    
    return None
