from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import date, datetime

class ExpenseBase(BaseModel):
    property_id: uuid.UUID
    description: str
    amount: float
    category: str
    date: date
    currency: str = "MXN"

class ExpenseCreate(ExpenseBase):
    receipt_url: Optional[str] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[date] = None
    currency: Optional[str] = None
    receipt_url: Optional[str] = None
    is_deleted: Optional[bool] = None

class ExpenseRead(ExpenseBase):
    id: uuid.UUID
    receipt_url: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
