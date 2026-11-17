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

BASE_URL = "https://airbnb-scraper-api.omkar.cloud/airbnb/rooms"


class OmkarProvider:
    """Thin adapter; no caller outside this module knows Omkar's response shape."""

    async def search(
        self, *, query: str, domain: str, checkin: date, checkout: date, adults: int, fallback_to_city: bool,
    ) -> tuple[list[dict], str]:
        if not settings.OMKAR_API_KEY:
            logger.error("OmkarProvider requested but OMKAR_API_KEY is not configured.")
            raise ProviderConfigurationError("La comparación de competidores no está configurada.")

        headers = {"API-Key": settings.OMKAR_API_KEY}
        async with httpx.AsyncClient(timeout=25) as client:
            autocomplete = await self._get(
                client, "/autocomplete", headers, {"query": query, "num_results": 1, "domain": domain},
            )
            results = autocomplete.get("results", []) if isinstance(autocomplete, dict) else []
            level = "neighborhood"
            if not results and fallback_to_city:
                parts = [part.strip() for part in query.split(",") if part.strip()]
                if len(parts) < 3:
                    logger.warning("Omkar: Location query has fewer than 3 parts for city fallback: %s", query)
                    raise ProviderUnavailableError("No encontramos una ubicación para comparar.")
                city_query = ", ".join(parts[-2:])
                autocomplete = await self._get(
                    client, "/autocomplete", headers, {"query": city_query, "num_results": 1, "domain": domain},
                )
                results = autocomplete.get("results", []) if isinstance(autocomplete, dict) else []
                level = "city"
            if not results or not isinstance(results[0], dict):
                logger.warning("Omkar: No location autocomplete results found for query: %s", query)
                raise ProviderUnavailableError("No encontramos una ubicación para comparar.")

            place = results[0]
            full_name = place.get("full_name")
            place_id = place.get("google_place_id")
            if not isinstance(full_name, str) or not isinstance(place_id, str):
                logger.warning("Omkar: Invalid place details: full_name=%s, place_id=%s", full_name, place_id)
                raise ProviderUnavailableError("La ubicación recibida no es válida.")
            search = await self._get(
                client,
                "/search",
                headers,
                {
                    "query": full_name, "place_id": place_id, "domain": domain, "page": 1,
                    "checkin": checkin.isoformat(), "checkout": checkout.isoformat(), "adults": adults,
                },
            )
        return (search.get("results", []) if isinstance(search, dict) and isinstance(search.get("results"), list) else [], level)

    async def _get(self, client: httpx.AsyncClient, path: str, headers: dict[str, str], params: dict[str, Any]) -> dict:
        try:
            response = await client.get(f"{BASE_URL}{path}", headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
        except httpx.TimeoutException as exc:
            logger.exception("Omkar provider request timed out on %s (query=%s)", path, params.get("query"))
            raise ProviderTimeoutError("La consulta a Airbnb tardó demasiado tiempo.") from exc
        except httpx.HTTPStatusError as exc:
            logger.exception(
                "Omkar provider returned HTTP status %s on %s (query=%s): %s",
                exc.response.status_code, path, params.get("query"), exc.response.text[:200]
            )
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.exception("Omkar provider connection/parsing error on %s (query=%s)", path, params.get("query"))
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        return data if isinstance(data, dict) else {}
