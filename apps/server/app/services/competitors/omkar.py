from datetime import date
from typing import Any

import httpx

from app.core.config import settings

BASE_URL = "https://airbnb-scraper-api.omkar.cloud/airbnb/rooms"


class ProviderUnavailableError(Exception):
    pass


class OmkarProvider:
    """Thin adapter; no caller outside this module knows Omkar's response shape."""

    async def search(
        self, *, query: str, domain: str, checkin: date, checkout: date, adults: int, fallback_to_city: bool,
    ) -> tuple[list[dict], str]:
        if not settings.OMKAR_API_KEY:
            raise ProviderUnavailableError("La comparación de competidores no está configurada.")

        headers = {"API-Key": settings.OMKAR_API_KEY}
        async with httpx.AsyncClient(timeout=20) as client:
            autocomplete = await self._get(
                client, "/autocomplete", headers, {"query": query, "num_results": 1, "domain": domain},
            )
            results = autocomplete.get("results", []) if isinstance(autocomplete, dict) else []
            level = "neighborhood"
            if not results and fallback_to_city:
                parts = [part.strip() for part in query.split(",") if part.strip()]
                if len(parts) < 3:
                    raise ProviderUnavailableError("No encontramos una ubicación para comparar.")
                city_query = ", ".join(parts[-2:])
                autocomplete = await self._get(
                    client, "/autocomplete", headers, {"query": city_query, "num_results": 1, "domain": domain},
                )
                results = autocomplete.get("results", []) if isinstance(autocomplete, dict) else []
                level = "city"
            if not results or not isinstance(results[0], dict):
                raise ProviderUnavailableError("No encontramos una ubicación para comparar.")

            place = results[0]
            full_name = place.get("full_name")
            place_id = place.get("google_place_id")
            if not isinstance(full_name, str) or not isinstance(place_id, str):
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
        except (httpx.HTTPError, ValueError) as exc:
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        return data if isinstance(data, dict) else {}
