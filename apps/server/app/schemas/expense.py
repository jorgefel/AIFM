from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import date as Date, datetime

ExpenseCategory = Literal[
    "cleaning", "maintenance", "supplies", "utilities", "platform_fees",
    "taxes", "insurance", "marketing", "other",
]


class ExpenseBase(BaseModel):
    property_id: uuid.UUID
    description: str = Field(min_length=1, max_length=500)
    amount: float = Field(gt=0, le=10_000_000)
    category: ExpenseCategory
    date: Date
    currency: str = Field(default="MXN", pattern=r"^[A-Z]{3}$")

class ExpenseCreate(ExpenseBase):
    receipt_url: str | None = Field(default=None, max_length=500)

class ExpenseUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=1, max_length=500)
    amount: float | None = Field(default=None, gt=0, le=10_000_000)
    category: ExpenseCategory | None = None
    date: Date | None = None
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    receipt_url: str | None = Field(default=None, max_length=500)
    is_deleted: bool | None = None

class ExpenseRead(ExpenseBase):
    id: uuid.UUID
    receipt_url: str | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
