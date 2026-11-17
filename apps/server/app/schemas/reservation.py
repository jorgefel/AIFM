from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
import uuid
from datetime import date, datetime

class ReservationBase(BaseModel):
    property_id: uuid.UUID
    guest_id: uuid.UUID | None = None
    guest_name: str = Field(min_length=1, max_length=200)
    check_in: date
    check_out: date
    total_amount: float = Field(ge=0)
    platform_fee: float = Field(default=0.0, ge=0)
    currency: str = Field(default="MXN", pattern=r"^[A-Z]{3}$")
    platform: Literal["airbnb", "booking", "vrbo", "direct", "other"]
    status: Literal["confirmed", "pending", "cancelled", "completed"] = "confirmed"
    notes: str | None = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def check_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self

class ReservationCreate(ReservationBase):
    pass # net_amount is calculated on the server

class ReservationUpdate(BaseModel):
    guest_id: uuid.UUID | None = None
    guest_name: str | None = Field(default=None, min_length=1, max_length=200)
    check_in: date | None = None
    check_out: date | None = None
    total_amount: float | None = Field(default=None, ge=0)
    platform_fee: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    platform: Literal["airbnb", "booking", "vrbo", "direct", "other"] | None = None
    status: Literal["confirmed", "pending", "cancelled", "completed"] | None = None
    notes: str | None = Field(default=None, max_length=5000)

class ReservationRead(ReservationBase):
    id: uuid.UUID
    net_amount: float
    created_at: datetime
    updated_at: datetime
    beds24_booking_id: str | None = None
    sync_source: str | None = None
    synced_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
