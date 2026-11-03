import json
import statistics
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis import redis_client
from app.models.property import Property
from app.schemas.market_comparison import MarketAggregates, MarketComparison, MarketListing
from app.services.job_manager import update_job

ACTOR_URL = "https://api.apify.com/v2/acts/tri_angle~airbnb-scraper/run-sync-get-dataset-items"
CACHE_TTL_SECONDS = 25 * 60 * 60
LOCK_TTL_SECONDS = 10 * 60


def _cache_key(property_id: str) -> str:
    return f"market-comparison:{property_id}"


def _lock_key(property_id: str) -> str:
    return f"market-comparison:lock:{property_id}"


def _active_job_key(property_id: str) -> str:
    return f"market-comparison:active-job:{property_id}"


def _number(value: Any) -> float | None:
    return float(value) if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def _price(item: dict[str, Any]) -> float | None:
    value = item.get("price")
    if isinstance(value, dict):
        for key in ("amount", "price", "rate", "value"):
            parsed = _number(value.get(key))
            if parsed is not None:
                return parsed
    return _number(value) or _number(item.get("pricePerNight"))


def normalize_listing(item: Any, currency: str) -> MarketListing | None:
    if not isinstance(item, dict) or not isinstance(item.get("id"), (str, int)):
        return None
    rating = item.get("rating")
    rating_data = rating if isinstance(rating, dict) else {}
    raw_rating = _number(rating_data.get("guestSatisfaction")) or _number(rating)
    if raw_rating is not None and raw_rating > 5:
        raw_rating = raw_rating / 20 if raw_rating <= 100 else None
    amenities = item.get("amenities")
    return MarketListing(
        id=str(item["id"]),
        title=item.get("title") if isinstance(item.get("title"), str) else None,
        url=item.get("url") if isinstance(item.get("url"), str) and item["url"].startswith("https://") else None,
        nightly_rate=_price(item),
        currency=item.get("currency") if isinstance(item.get("currency"), str) else currency,
        rating=raw_rating,
        public_review_count=int(rating_data["reviewsCount"]) if isinstance(rating_data.get("reviewsCount"), int) and rating_data["reviewsCount"] >= 0 else None,
        max_guests=item.get("personCapacity") if isinstance(item.get("personCapacity"), int) and item["personCapacity"] >= 0 else None,
        bedrooms=item.get("bedrooms") if isinstance(item.get("bedrooms"), int) and item["bedrooms"] >= 0 else None,
        bathrooms=_number(item.get("bathrooms")),
        amenities=[value for value in amenities if isinstance(value, str)][:50] if isinstance(amenities, list) else [],
    )


def _median(values: list[float]) -> float | None:
    return float(statistics.median(values)) if values else None


def build_snapshot(items: list[Any], currency: str) -> MarketComparison:
    listings = [listing for item in items if (listing := normalize_listing(item, currency))]
    return MarketComparison(
        status="READY",
        fetched_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS),
        currency=currency,
        listings=listings,
        aggregates=MarketAggregates(
            listing_count=len(listings),
            median_nightly_rate=_median([listing.nightly_rate for listing in listings if listing.nightly_rate is not None]),
            median_rating=_median([listing.rating for listing in listings if listing.rating is not None]),
            median_public_review_count=_median([float(listing.public_review_count) for listing in listings if listing.public_review_count is not None]),
        ),
    )


async def get_snapshot(property_id: str) -> MarketComparison | None:
    raw = await redis_client.get(_cache_key(property_id))
    return MarketComparison.model_validate_json(raw) if raw else None


async def create_or_get_refresh_job(property_id: str, user_id: str, job_id: str) -> str:
    active = await redis_client.get(_active_job_key(property_id))
    if active:
        return active
    created = await redis_client.set(_active_job_key(property_id), job_id, ex=LOCK_TTL_SECONDS, nx=True)
    return job_id if created else (await redis_client.get(_active_job_key(property_id)) or job_id)


async def _fetch(property_: Property) -> MarketComparison:
    if not settings.APIFY_TOKEN:
        raise RuntimeError("La comparación no está configurada todavía.")
    payload = {
        "locationQueries": [property_.address],
        "currency": property_.currency,
        "adults": property_.max_guests,
        "minBedrooms": property_.bedrooms,
        "minBathrooms": property_.bathrooms,
        "maxResults": 50,
        "enrichUserProfiles": False,
    }
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(ACTOR_URL, params={"token": settings.APIFY_TOKEN}, json=payload)
        response.raise_for_status()
    data = response.json()
    return build_snapshot(data if isinstance(data, list) else [], property_.currency)


async def run_refresh(property_id: str, user_id: str, job_id: str) -> None:
    if not await redis_client.set(_lock_key(property_id), job_id, ex=LOCK_TTL_SECONDS, nx=True):
        return
    await update_job(job_id, "processing")
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Property).where(Property.id == property_id, Property.owner_id == user_id, Property.is_active.is_(True)))
            property_ = result.scalars().first()
        if not property_:
            raise RuntimeError("Propiedad no encontrada.")
        snapshot = await _fetch(property_)
        await redis_client.setex(_cache_key(property_id), CACHE_TTL_SECONDS, snapshot.model_dump_json())
        await update_job(job_id, "completed", result={"property_id": property_id})
    except (httpx.HTTPError, ValueError, RuntimeError) as exc:
        # httpx errors can include a request URL, which carries the Apify token.
        error = "No fue posible consultar Airbnb en este momento." if isinstance(exc, httpx.HTTPError) else str(exc)[:160]
        await update_job(job_id, "failed", error=error)
    finally:
        await redis_client.delete(_active_job_key(property_id), _lock_key(property_id))
