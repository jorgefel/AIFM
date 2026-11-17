from datetime import date
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.competitors.provider import (
    ProviderConfigurationError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

APIFY_API_BASE = "https://api.apify.com/v2"
ACTOR_NAME = "tri_angle~airbnb-scraper"


class ApifyProvider:
    """Proveedor de competidores de Airbnb usando el actor tri_angle/airbnb-scraper en Apify."""

    def __init__(self, token: str | None = None):
        self.token = (
            token
            or settings.APIFY_TOKEN
            or settings.APIFY_API_KEY
            or settings.APIFY_KEY
            or settings.APIFY_AUTH_TOKEN
        )

    async def _fetch_dataset_items(self, client: httpx.AsyncClient, dataset_id: str) -> list[dict[str, Any]]:
        url = f"{APIFY_API_BASE}/datasets/{dataset_id}/items"
        params = {"token": self.token, "limit": 30}
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []

    async def _run_actor(
        self, client: httpx.AsyncClient, query: str, checkin: date, checkout: date, adults: int
    ) -> list[dict[str, Any]]:
        payload = {
            "locationQueries": [query],
            "maxListings": 20,
            "checkIn": checkin.isoformat(),
            "checkOut": checkout.isoformat(),
            "adults": adults,
            "includeReviews": False,
        }
        url = f"{APIFY_API_BASE}/acts/{ACTOR_NAME}/runs"
        params = {"token": self.token, "waitForFinish": 45}

        try:
            response = await client.post(url, params=params, json=payload)
            if response.status_code in (401, 403):
                raise ProviderConfigurationError("El token de Apify es inválido o no tiene permisos.")
            response.raise_for_status()
            run_data = response.json().get("data", {})
            dataset_id = run_data.get("defaultDatasetId")
            if not dataset_id:
                return []
            return await self._fetch_dataset_items(client, dataset_id)
        except httpx.TimeoutException as exc:
            logger.exception("Apify actor HTTP timeout for query %s", query)
            raise ProviderTimeoutError("La consulta a Airbnb en Apify tardó más tiempo del esperado.") from exc
        except httpx.HTTPStatusError as exc:
            logger.exception(
                "Apify provider returned HTTP %s for query %s: %s",
                exc.response.status_code, query, exc.response.text[:200]
            )
            if exc.response.status_code in (401, 403):
                raise ProviderConfigurationError("El token de Apify es inválido o no tiene permisos.") from exc
            if exc.response.status_code == 402:
                logger.warning("Apify account has insufficient credits (HTTP 402): %s", exc.response.text[:200])
                raise ProviderRateLimitError("La cuenta de Apify ha agotado sus créditos de uso disponibles.") from exc
            if exc.response.status_code == 429:
                logger.warning("Apify rate limit exceeded (HTTP 429)")
                raise ProviderRateLimitError("Límite de peticiones alcanzado en Apify.") from exc
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.exception("Apify provider error for query %s: %s", query, exc)
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc

    async def search(
        self,
        *,
        query: str,
        domain: str,
        checkin: date,
        checkout: date,
        adults: int,
        fallback_to_city: bool,
        **kwargs: Any,
    ) -> tuple[list[dict], str]:
        if not self.token:
            logger.error("ApifyProvider requested but no APIFY_TOKEN is configured.")
            raise ProviderConfigurationError("La comparación de competidores no está configurada (falta APIFY_TOKEN).")

        async with httpx.AsyncClient(timeout=65) as client:
            raw_items = await self._run_actor(client, query, checkin, checkout, adults)

            resolved_level = "neighborhood"
            if not raw_items and fallback_to_city:
                parts = [part.strip() for part in query.split(",") if part.strip()]
                if len(parts) >= 2:
                    city_query = ", ".join(parts[-2:])
                    logger.info("Apify: sin resultados en barrio, reintentando con ciudad: %s", city_query)
                    try:
                        city_items = await self._run_actor(client, city_query, checkin, checkout, adults)
                        if city_items:
                            raw_items = city_items
                            resolved_level = "city"
                    except Exception as exc:
                        logger.exception("Apify city fallback query failed for %s: %s", city_query, exc)

        normalized_listings: list[dict[str, Any]] = []
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            item_id = item.get("id") or item.get("listingId") or item.get("room_id")
            if not item_id:
                continue

            # Extracción flexible de precio (soporta estructura simple y estructura anidada de tri_angle)
            price_val = None
            price_curr = "USD"
            pricing = item.get("pricing") or item.get("price")
            if isinstance(pricing, dict):
                breakdown = pricing.get("breakDown") if isinstance(pricing.get("breakDown"), dict) else {}
                total_dict = breakdown.get("total") if isinstance(breakdown.get("total"), dict) else {}
                price_val = (
                    pricing.get("rate")
                    or pricing.get("amount")
                    or total_dict.get("price")
                    or pricing.get("price")
                    or pricing.get("total")
                )
                price_curr = pricing.get("currency") or total_dict.get("currency") or price_curr
            elif isinstance(pricing, (int, float, str)):
                price_val = pricing

            # Extracción flexible de rating y reseñas
            rating_raw = item.get("rating")
            rating_val = None
            reviews_count = None
            if isinstance(rating_raw, dict):
                rating_val = rating_raw.get("guestSatisfaction") or rating_raw.get("accuracy")
                reviews_count = rating_raw.get("reviewsCount")
            elif isinstance(rating_raw, (int, float, str)):
                rating_val = rating_raw

            if reviews_count is None:
                reviews_count = item.get("reviewsCount") or item.get("numberOfReviews") or item.get("review_count")

            # Extracción de imágenes
            images = item.get("images") or []
            if not images:
                single_img = item.get("pictureUrl") or item.get("imageUrl") or item.get("thumbnail")
                if single_img:
                    images = [single_img]

            normalized_listings.append({
                "id": str(item_id),
                "name": item.get("name") or item.get("title"),
                "link": item.get("link") or item.get("url") or f"https://www.airbnb.com/rooms/{item_id}",
                "images": images,
                "price": {"amount": price_val, "currency": price_curr},
                "rating": rating_val,
                "reviews_count": reviews_count,
                "bedrooms": item.get("bedrooms") or item.get("bedroomCount"),
                "beds": item.get("beds") or item.get("bedCount"),
                "bathrooms": item.get("bathrooms") or item.get("bathroomCount"),
                "is_superhost": item.get("isSuperhost") is True or item.get("is_superhost") is True,
                "is_guest_favorite": item.get("isGuestFavorite") is True or item.get("is_guest_favorite") is True,
            })

        return normalized_listings, resolved_level

