from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import datetime

PropertyType = Literal["apartment", "house", "cabin", "room", "hotel", "other"]
Platform = Literal["airbnb", "booking", "vrbo", "direct", "other"]


class PropertyBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    currency: str = Field(default="MXN", pattern=r"^[A-Z]{3}$")
    property_type: PropertyType = "apartment"
    max_guests: int = Field(default=1, ge=1, le=100)
    bedrooms: int = Field(default=1, ge=0, le=50)
    bathrooms: int = Field(default=1, ge=0, le=50)
    description: str | None = Field(default=None, max_length=5000)
    nightly_rate: float | None = Field(default=None, ge=0, le=10_000_000)
    amenities: list[str] = Field(default_factory=list, max_length=50)
    published_platforms: list[Platform] = Field(default_factory=list, max_length=10)
    photo_urls: list[str] = Field(default_factory=list, max_length=20)

class PropertyCreate(PropertyBase):
    published_platforms: list[Platform] = Field(min_length=1, max_length=10)

class PropertyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    currency: str | None = Field(default=None, pattern=r"^[A-Z]{3}$")
    property_type: PropertyType | None = None
    max_guests: int | None = Field(default=None, ge=1, le=100)
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
    description: str | None = Field(default=None, max_length=5000)
    nightly_rate: float | None = Field(default=None, ge=0, le=10_000_000)
    amenities: list[str] | None = Field(default=None, max_length=50)
    published_platforms: list[Platform] | None = Field(default=None, max_length=10)
    photo_urls: list[str] | None = Field(default=None, max_length=20)
    is_active: bool | None = None

class PropertyRead(PropertyBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
