from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
import uuid
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
    phone: str | None
    age: int | None
    rental_experience_years: int | None
    average_monthly_reservations: int | None
    previous_platforms: list[str]
    preferences: dict[str, Any]
    onboarding_completed: bool
    onboarding_completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    """Campos que el usuario puede mantener desde Configuración."""

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    preferences: dict[str, Any] | None = None


Platform = Literal["airbnb", "booking", "vrbo", "direct", "other"]


class OnboardingProgressUpdate(BaseModel):
    """Actualización parcial y reanudable del cuestionario inicial."""

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    age: int | None = Field(default=None, ge=18, le=120)
    rental_experience_years: int | None = Field(default=None, ge=0, le=100)
    average_monthly_reservations: int | None = Field(default=None, ge=0, le=100_000)
    previous_platforms: list[Platform] | None = Field(default=None, max_length=10)
    complete: bool = False

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
