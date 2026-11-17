from datetime import date, datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class GuestBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    document_or_keyword: Optional[str] = Field(default=None, max_length=100)


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    document_or_keyword: Optional[str] = Field(default=None, max_length=100)


class GuestStay(BaseModel):
    reservation_id: uuid.UUID
    property_id: uuid.UUID
    property_name: str
    check_in: date
    check_out: date
    nights: int
    status: str
    total_amount: float

    model_config = ConfigDict(from_attributes=True)


class GuestRead(GuestBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    total_nights: int = 0
    properties_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuestDetail(GuestRead):
    properties_stayed: List[str] = []
    stays: List[GuestStay] = []
