from datetime import date, datetime, timedelta, timezone
import math
import statistics
from typing import Any

from app.core.redis import redis_client
from app.models.property import Property
from app.schemas.competitors import CompetitorAggregates, CompetitorListing, CompetitorSnapshot
from app.services.competitors.omkar import OmkarProvider
from app.services.competitors.provider import CompetitorProvider

CACHE_TTL_SECONDS = 24 * 60 * 60
COUNTRY_DOMAINS = {
    "colombia": "airbnb.com.co",
    "méxico": "airbnb.com", "mexico": "airbnb.com", "españa": "airbnb.com", "espana": "airbnb.com",
    "argentina": "airbnb.com", "chile": "airbnb.com", "perú": "airbnb.com", "peru": "airbnb.com",
    "ecuador": "airbnb.com", "panamá": "airbnb.com", "panama": "airbnb.com",
    "costa rica": "airbnb.com", "estados unidos": "airbnb.com", "ee. uu.": "airbnb.com",
}


def country_domain(country: str) -> str:
    normalized = country.casefold().strip()
    return COUNTRY_DOMAINS.get(normalized, "airbnb.com")


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        number = float(value)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def _quantile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    position = (len(ordered) - 1) * percentile
    low, high = int(position), min(int(position) + 1, len(ordered) - 1)
    return ordered[low] + (ordered[high] - ordered[low]) * (position - low)


def _image_url(raw: dict[str, Any]) -> str | None:
    images = raw.get("images")
    if not isinstance(images, list) or not images:
        return None
    first = images[0]
    if isinstance(first, str) and first.startswith("https://"):
        return first
    if isinstance(first, dict):
        url = first.get("url")
        if isinstance(url, str) and url.startswith("https://"):
            return url
    return None


def build_competitor_snapshot(
    results: list[Any], *, stay_nights: int, currency: str, resolved_level: str,
) -> CompetitorSnapshot:
    listings: list[CompetitorListing] = []
    for raw in results:
        if not isinstance(raw, dict) or not isinstance(raw.get("id"), (str, int)):
            continue
        price = raw.get("price") if isinstance(raw.get("price"), dict) else {}
        total = _number(price.get("amount"))
        listings.append(CompetitorListing(
            id=str(raw["id"]),
            title=raw.get("name") if isinstance(raw.get("name"), str) else raw.get("title") if isinstance(raw.get("title"), str) else None,
            url=raw.get("link") if isinstance(raw.get("link"), str) and raw["link"].startswith("https://") else None,
            image_url=_image_url(raw),
            nightly_rate=total / stay_nights if total is not None and stay_nights else None,
            currency=price.get("currency") if isinstance(price.get("currency"), str) else currency,
            rating=_number(raw.get("rating")),
            public_review_count=raw.get("reviews_count") if isinstance(raw.get("reviews_count"), int) and raw["reviews_count"] >= 0 else None,
            bedrooms=raw.get("bedrooms") if isinstance(raw.get("bedrooms"), int) and raw["bedrooms"] >= 0 else None,
            beds=raw.get("beds") if isinstance(raw.get("beds"), int) and raw["beds"] >= 0 else None,
            bathrooms=_number(raw.get("bathrooms")),
            is_superhost=raw.get("is_superhost") is True,
            is_guest_favorite=raw.get("is_guest_favorite") is True,
        ))
    prices = [item.nightly_rate for item in listings if item.nightly_rate is not None]
    now = datetime.now(timezone.utc)
    return CompetitorSnapshot(
        fetched_at=now, expires_at=now + timedelta(seconds=CACHE_TTL_SECONDS),
        checkin=date.today() + timedelta(days=7), checkout=date.today() + timedelta(days=8),
        resolved_level="city" if resolved_level == "city" else "neighborhood", currency=currency,
        listings=listings,
        aggregates=CompetitorAggregates(
            listing_count=len(listings), median_nightly_rate=float(statistics.median(prices)) if prices else None,
            average_nightly_rate=float(statistics.mean(prices)) if prices else None,
            p25_nightly_rate=_quantile(prices, 0.25), p75_nightly_rate=_quantile(prices, 0.75),
        ),
    )


def _cache_key(property_id: str, fallback_to_city: bool) -> str:
    return f"competitors:{property_id}:fallback:{int(fallback_to_city)}"


def _lock_key(property_id: str, fallback_to_city: bool) -> str:
    return f"{_cache_key(property_id, fallback_to_city)}:lock"


async def invalidate_competitors(property_id: str) -> None:
    """Location and capacity changes make both cache variants stale."""
    try:
        await redis_client.delete(_cache_key(property_id, False), _cache_key(property_id, True))
    except Exception:
        # Cache invalidation must not turn a valid property edit into a 500.
        pass


async def get_competitors(
    property_: Property, *, fallback_to_city: bool = True, force: bool = False, provider: CompetitorProvider | None = None,
) -> CompetitorSnapshot:
    if not property_.country or not property_.city or not property_.neighborhood:
        raise ValueError("Completa país, ciudad y barrio de la propiedad antes de compararla.")
    key = _cache_key(str(property_.id), fallback_to_city)
    cached = await redis_client.get(key)
    if cached and not force:
        return CompetitorSnapshot.model_validate_json(cached)
    lock_key = _lock_key(str(property_.id), fallback_to_city)
    if not await redis_client.set(lock_key, "1", ex=30, nx=True):
        raise ValueError("La comparación se está actualizando. Intenta de nuevo en unos segundos.")
    try:
        query = ", ".join([property_.neighborhood, property_.city, property_.country])
        checkin, checkout = date.today() + timedelta(days=7), date.today() + timedelta(days=8)
        results, level = await (provider or OmkarProvider()).search(
            query=query, domain=country_domain(property_.country), checkin=checkin, checkout=checkout,
            adults=property_.max_guests, fallback_to_city=fallback_to_city,
        )
        snapshot = build_competitor_snapshot(results, stay_nights=(checkout - checkin).days, currency=property_.currency, resolved_level=level)
        snapshot.checkin, snapshot.checkout = checkin, checkout
        await redis_client.setex(key, CACHE_TTL_SECONDS, snapshot.model_dump_json())
        return snapshot
    finally:
        await redis_client.delete(lock_key)
