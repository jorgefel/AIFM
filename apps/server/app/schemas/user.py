from pydantic import BaseModel, EmailStr, ConfigDict
import uuid
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "admin"

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    tier: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
