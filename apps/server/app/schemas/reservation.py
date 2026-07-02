from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import date, datetime

class ReservationBase(BaseModel):
    property_id: uuid.UUID
    guest_name: str
    check_in: date
    check_out: date
    total_amount: float
    platform_fee: float = 0.0
    currency: str = "MXN"
    platform: str
    status: str = "confirmed"
    notes: Optional[str] = None

class ReservationCreate(ReservationBase):
    pass # net_amount is calculated on the server

class ReservationUpdate(BaseModel):
    guest_name: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    total_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    currency: Optional[str] = None
    platform: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ReservationRead(ReservationBase):
    id: uuid.UUID
    net_amount: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
