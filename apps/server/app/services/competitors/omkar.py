from datetime import date
import json
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.core.redis import redis_client
from app.services.competitors.provider import (
    ProviderConfigurationError,
    ProviderQueryError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

BASE_URL = "https://airbnb-scraper-api.omkar.cloud/airbnb/rooms"
PLACE_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60  # Cache resolved Google Place ID for 7 days


class OmkarProvider:
    """Thin adapter; no caller outside this module knows Omkar's response shape."""

    async def _resolve_place(
        self, client: httpx.AsyncClient, query: str, domain: str, headers: dict[str, str]
    ) -> tuple[str, str] | None:
        """
        Resolves full_name and google_place_id via Redis cache or /autocomplete.
        Never calls autocomplete if place_id was already resolved and cached.
        """
        cache_key = f"omkar:place:{query.strip().lower()}:{domain}"
        try:
            cached_raw = await redis_client.get(cache_key)
            if cached_raw:
                cached = json.loads(cached_raw)
                if isinstance(cached, dict) and "full_name" in cached and "place_id" in cached:
                    return cached["full_name"], cached["place_id"]
        except Exception:
            pass

        try:
            autocomplete = await self._get(
                client, "/autocomplete", headers, {"query": query, "num_results": 1, "domain": domain}
            )
        except Exception:
            return None

        results = autocomplete.get("results", []) if isinstance(autocomplete, dict) else []
        if not results or not isinstance(results[0], dict):
            return None

        place = results[0]
        full_name = place.get("full_name")
        place_id = place.get("google_place_id")
        if not isinstance(full_name, str) or not isinstance(place_id, str):
            return None

        try:
            await redis_client.setex(
                cache_key,
                PLACE_CACHE_TTL_SECONDS,
                json.dumps({"full_name": full_name, "place_id": place_id}),
            )
        except Exception:
            pass

        return full_name, place_id

    async def search(
        self,
        *,
        query: str,
        domain: str,
        checkin: date,
        checkout: date,
        adults: int,
        fallback_to_city: bool,
        city_query: str | None = None,
    ) -> tuple[list[dict], str]:
        if not settings.OMKAR_API_KEY:
            logger.error("OmkarProvider requested but OMKAR_API_KEY is not configured.")
            raise ProviderConfigurationError("La comparación de competidores no está configurada.")

        headers = {"API-Key": settings.OMKAR_API_KEY}

        # Derive city_query fallback if omitted
        if not city_query:
            parts = [part.strip() for part in query.split(",") if part.strip()]
            city_query = ", ".join(parts[-2:]) if len(parts) >= 2 else query

        async with httpx.AsyncClient(timeout=25) as client:
            level = "neighborhood"
            search_data = None
            neighborhood_query_error: Exception | None = None

            # 1. Attempt at neighborhood level
            place = await self._resolve_place(client, query, domain, headers)
            if place is not None:
                full_name, place_id = place
                try:
                    search_data = await self._get(
                        client,
                        "/search",
                        headers,
                        {
                            "query": full_name,
                            "place_id": place_id,
                            "domain": domain,
                            "page": 1,
                            "checkin": checkin.isoformat(),
                            "checkout": checkout.isoformat(),
                            "adults": adults,
                        },
                    )
                except (ProviderQueryError, ProviderUnavailableError) as exc:
                    neighborhood_query_error = exc
                    logger.warning(
                        "Omkar: Neighborhood level /search failed for query=%s (full_name=%s, place_id=%s). Error: %s",
                        query, full_name, place_id, exc,
                    )
                    search_data = None

            results = (
                search_data.get("results", [])
                if isinstance(search_data, dict) and isinstance(search_data.get("results"), list)
                else []
            )

            # 2. Fallback to city level if neighborhood produced 400 or 0 results
            if (not results) and fallback_to_city and city_query and city_query.strip().lower() != query.strip().lower():
                logger.info(
                    "Omkar: Neighborhood level gave 0 results or 400. Falling back to city level search for %s (city_query=%s)",
                    query, city_query,
                )
                city_place = await self._resolve_place(client, city_query, domain, headers)
                if city_place is not None:
                    c_full_name, c_place_id = city_place
                    try:
                        city_search = await self._get(
                            client,
                            "/search",
                            headers,
                            {
                                "query": c_full_name,
                                "place_id": c_place_id,
                                "domain": domain,
                                "page": 1,
                                "checkin": checkin.isoformat(),
                                "checkout": checkout.isoformat(),
                                "adults": adults,
                            },
                        )
                        city_results = (
                            city_search.get("results", [])
                            if isinstance(city_search, dict) and isinstance(city_search.get("results"), list)
                            else []
                        )
                        if city_results:
                            return city_results, "city"
                    except (ProviderQueryError, ProviderUnavailableError) as exc:
                        logger.exception(
                            "Omkar: City level fallback also failed for city_query=%s (full_name=%s, place_id=%s): %s",
                            city_query, c_full_name, c_place_id, exc,
                        )
                        raise

            # If neighborhood threw an error and city fallback was either disabled or yielded nothing, re-raise the error
            if not results and neighborhood_query_error is not None:
                raise neighborhood_query_error

            if not results and place is None and not fallback_to_city:
                raise ProviderUnavailableError("No encontramos una ubicación para comparar.")

            return results, level

    async def _get(
        self, client: httpx.AsyncClient, path: str, headers: dict[str, str], params: dict[str, Any]
    ) -> dict:
        safe_params = {k: v for k, v in params.items() if "key" not in k.lower()}
        try:
            response = await client.get(f"{BASE_URL}{path}", headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
        except httpx.TimeoutException as exc:
            logger.exception("Omkar provider request timed out on %s (params=%s)", path, safe_params)
            raise ProviderTimeoutError("La consulta a Airbnb tardó demasiado tiempo.") from exc
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code
            text_preview = exc.response.text[:300]
            if status == 400:
                logger.exception(
                    "Omkar provider HTTP 400 Bad Request on %s (params=%s): %s",
                    path, safe_params, text_preview,
                )
                if "airbnb rejected the request" in text_preview.lower():
                    raise ProviderUnavailableError(
                        "El proveedor no pudo conectar con Airbnb en este momento."
                    ) from exc
                raise ProviderQueryError(
                    f"Consulta rechazada por el proveedor (400 Bad Request): {text_preview}"
                ) from exc
            elif status in (401, 403):
                logger.exception("Omkar provider authentication/configuration error (HTTP %s)", status)
                raise ProviderConfigurationError("La clave del proveedor de competidores no es válida o expiró.") from exc
            elif status == 429:
                logger.exception("Omkar provider rate limit exceeded (HTTP 429)")
                raise ProviderRateLimitError("Límite de solicitudes al proveedor de competidores alcanzado.") from exc
            else:
                logger.exception(
                    "Omkar provider HTTP %s on %s (params=%s): %s", status, path, safe_params, text_preview
                )
                raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        except (httpx.HTTPError, ValueError) as exc:
            logger.exception("Omkar provider connection/parsing error on %s (params=%s)", path, safe_params)
            raise ProviderUnavailableError("No fue posible consultar Airbnb en este momento.") from exc
        return data if isinstance(data, dict) else {}
