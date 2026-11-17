from datetime import date
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.competitors.provider import (
    ProviderConfigurationError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

APIFY_API_BASE = "https://api.apify.com/v2"
ACTOR_NAME = "tri_angle~airbnb-scraper"


class ApifyProvider:
    """Proveedor de competidores de Airbnb usando el actor tri_angle/airbnb-scraper en Apify."""

    def __init__(self, token: str | None = None):
        self.token = token or settings.APIFY_TOKEN or settings.APIFY_API_KEY

    async def search(
        self,
        *,
        query: str,
        domain: str,
        checkin: date,
        checkout: date,
        adults: int,
        fallback_to_city: bool,
    ) -> tuple[list[dict], str]:
        if not self.token:
            logger.error("ApifyProvider requested but neither APIFY_TOKEN nor APIFY_API_KEY is configured.")
            raise ProviderConfigurationError("La comparación de competidores no está configurada (falta APIFY_TOKEN).")

        # Preparar payload conforme a tri_angle/airbnb-scraper
        payload = {
            "locationQueries": [query],
            "maxListings": 40,
            "checkIn": checkin.isoformat(),
            "checkOut": checkout.isoformat(),
            "adults": adults,
            "includeReviews": False,
        }

        url = f"{APIFY_API_BASE}/acts/{ACTOR_NAME}/run-sync-get-dataset-items"
        params = {"token": self.token, "timeout": 50, "format": "json"}

        try:
            async with httpx.AsyncClient(timeout=55) as client:
                response = await client.post(url, params=params, json=payload)
                if response.status_code == 408:
                    logger.warning("Apify actor execution timed out on sync run for query %s", query)
                    raise ProviderTimeoutError("La consulta de Airbnb en Apify excedió el tiempo límite.")
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as exc:
            logger.exception("Apify provider HTTP timeout for query %s", query)
            raise ProviderTimeoutError("La consulta a Airbnb tardó más tiempo del esperado.") from exc
        except httpx.HTTPStatusError as exc:
            logger.exception(
                "Apify provider returned HTTP %s for query %s: %s",
                exc.response.status_code, query, exc.response.text[:200]
            )
            if exc.response.status_code in (401, 403):
                raise ProviderConfigurationError("El token de Apify es inválido o no tiene permisos.") from exc
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.exception("Apify provider error for query %s: %s", query, exc)
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc

        raw_items = data if isinstance(data, list) else []

        # Si no hubo resultados a nivel barrio y fallback_to_city está activo, intentamos con la ciudad
        resolved_level = "neighborhood"
        if not raw_items and fallback_to_city:
            parts = [part.strip() for part in query.split(",") if part.strip()]
            if len(parts) >= 2:
                city_query = ", ".join(parts[-2:])
                logger.info("Apify: sin resultados en barrio, reintentando con ciudad: %s", city_query)
                payload["locationQueries"] = [city_query]
                try:
                    async with httpx.AsyncClient(timeout=55) as client:
                        response = await client.post(url, params=params, json=payload)
                        response.raise_for_status()
                        city_data = response.json()
                        if isinstance(city_data, list) and city_data:
                            raw_items = city_data
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

            # Extracción flexible de precio
            price_val = None
            price_curr = "COP"
            pricing = item.get("pricing") or item.get("price")
            if isinstance(pricing, dict):
                price_val = pricing.get("rate") or pricing.get("amount") or pricing.get("total")
                price_curr = pricing.get("currency") or price_curr
            elif isinstance(pricing, (int, float, str)):
                price_val = pricing

            # Extracción de imágenes
            images = item.get("images") or []
            if not images:
                single_img = item.get("pictureUrl") or item.get("imageUrl")
                if single_img:
                    images = [single_img]

            normalized_listings.append({
                "id": str(item_id),
                "name": item.get("name") or item.get("title"),
                "link": item.get("link") or item.get("url") or f"https://www.airbnb.com/rooms/{item_id}",
                "images": images,
                "price": {"amount": price_val, "currency": price_curr},
                "rating": item.get("rating") or item.get("stars") or item.get("guestSatisfaction"),
                "reviews_count": item.get("reviewsCount") or item.get("numberOfReviews") or item.get("review_count"),
                "bedrooms": item.get("bedrooms") or item.get("bedroomCount"),
                "beds": item.get("beds") or item.get("bedCount"),
                "bathrooms": item.get("bathrooms") or item.get("bathroomCount"),
                "is_superhost": item.get("isSuperhost") is True or item.get("is_superhost") is True,
                "is_guest_favorite": item.get("isGuestFavorite") is True or item.get("is_guest_favorite") is True,
            })

        return normalized_listings, resolved_level
