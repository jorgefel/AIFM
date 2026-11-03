from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class MarketListing(BaseModel):
    id: str
    title: str | None = None
    url: str | None = None
    nightly_rate: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=3)
    rating: float | None = Field(default=None, ge=0, le=5)
    public_review_count: int | None = Field(default=None, ge=0)
    max_guests: int | None = Field(default=None, ge=0)
    bedrooms: int | None = Field(default=None, ge=0)
    bathrooms: float | None = Field(default=None, ge=0)
    amenities: list[str] = Field(default_factory=list)


class MarketAggregates(BaseModel):
    listing_count: int
    median_nightly_rate: float | None = None
    median_rating: float | None = None
    median_public_review_count: float | None = None


class MarketComparison(BaseModel):
    status: Literal["EMPTY", "PENDING", "PROCESSING", "READY", "FAILED"]
    fetched_at: datetime | None = None
    expires_at: datetime | None = None
    currency: str | None = None
    listings: list[MarketListing] = Field(default_factory=list)
    aggregates: MarketAggregates | None = None
    error: str | None = None
    job_id: str | None = None
