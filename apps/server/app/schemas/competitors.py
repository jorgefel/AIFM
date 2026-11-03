from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class CompetitorListing(BaseModel):
    id: str
    title: str | None = None
    url: str | None = None
    nightly_rate: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=3)
    rating: float | None = Field(default=None, ge=0, le=5)
    public_review_count: int | None = Field(default=None, ge=0)
    bedrooms: int | None = Field(default=None, ge=0)
    beds: int | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    is_superhost: bool = False
    is_guest_favorite: bool = False


class CompetitorAggregates(BaseModel):
    listing_count: int
    median_nightly_rate: float | None = None
    average_nightly_rate: float | None = None
    p25_nightly_rate: float | None = None
    p75_nightly_rate: float | None = None


class CompetitorSnapshot(BaseModel):
    fetched_at: datetime
    expires_at: datetime
    checkin: date
    checkout: date
    resolved_level: Literal["neighborhood", "city"]
    currency: str
    listings: list[CompetitorListing]
    aggregates: CompetitorAggregates
