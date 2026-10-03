from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field


class Beds24ConnectionCreate(BaseModel):
    channel_account_id: str = Field(min_length=1, max_length=255)


class Beds24PropertyLinkCreate(BaseModel):
    property_id: uuid.UUID
    beds24_property_id: str = Field(min_length=1, max_length=100)


class Beds24PropertyLinkRead(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    beds24_property_id: str

    model_config = ConfigDict(from_attributes=True)


class Beds24ConnectionRead(BaseModel):
    id: uuid.UUID
    channel_account_id: str
    is_active: bool
    last_bookings_sync_at: datetime | None
    property_links: list[Beds24PropertyLinkRead] = []

    model_config = ConfigDict(from_attributes=True)


class SyncLogRead(BaseModel):
    id: uuid.UUID
    sync_type: str
    status: str
    error_message: str | None
    records_processed: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingSyncResult(BaseModel):
    status: str
    records_processed: int
    created: int
    updated: int
    cancelled: int
    last_synced_at: datetime

class OtaConnectionCreate(BaseModel):
    property_id: uuid.UUID
    beds24_property_link_id: uuid.UUID
    ota_name: str = Field(min_length=1, max_length=50)
    ota_listing_id: str | None = None

class OtaConnectionRead(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    beds24_property_link_id: uuid.UUID
    ota_name: str
    ota_listing_id: str | None
    status: str
    error_message: str | None

    model_config = ConfigDict(from_attributes=True)

class CalendarSnapshotRead(BaseModel):
    date: date
    available_units: int
    price: float | None
    source: str
    channel: str | None
    synced_at: datetime | None
    is_stale: bool

class OtaConnectionCreate(BaseModel):
    property_id: uuid.UUID
    beds24_property_link_id: uuid.UUID
    ota_name: str
    ota_listing_id: str | None = None

class OtaConnectionRead(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    beds24_property_link_id: uuid.UUID
    ota_name: str
    ota_listing_id: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
