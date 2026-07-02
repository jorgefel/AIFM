from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import datetime

class PropertyBase(BaseModel):
    name: str
    address: str
    currency: str = "MXN"

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None

class PropertyRead(PropertyBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
