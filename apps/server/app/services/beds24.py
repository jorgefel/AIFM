# ─────────────────────────────────────────────────────────────
# app/services/beds24.py — Cliente para Beds24 API V2
# ─────────────────────────────────────────────────────────────
import asyncio
from datetime import date, datetime, timezone
import logging
from typing import Any

import httpx
from app.core.config import settings
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

class Beds24Client:
    BASE_URL = "https://api.beds24.com/v2"

    @classmethod
    async def get_access_token(cls) -> str:
        token = await redis_client.get("beds24_access_token")
        if token:
            return token
        
        acquired = await redis_client.set("beds24_token_renewal_lock", "1", nx=True, ex=15)
        if not acquired:
            await asyncio.sleep(2)
            token = await redis_client.get("beds24_access_token")
            if token:
                return token
            raise Exception("No se pudo adquirir el lock de renovación de Beds24 ni obtener el token")
            
        try:
            token, expires_in = await cls._renew_token_from_api()
            ttl = max(60, expires_in - 300) 
            await redis_client.setex("beds24_access_token", ttl, token)
            return token
        finally:
            await redis_client.delete("beds24_token_renewal_lock")

    @classmethod
    async def _renew_token_from_api(cls) -> tuple[str, int]:
        refresh_token = settings.BEDS24_REFRESH_TOKEN
        if not refresh_token:
            raise ValueError("BEDS24_REFRESH_TOKEN no configurado en el servidor")
        
        headers = {"refreshToken": refresh_token, "accept": "application/json"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{cls.BASE_URL}/authentication/token", headers=headers)
            if resp.status_code != 200:
                logger.error(f"Error renovando token Beds24: {resp.text}")
                resp.raise_for_status()
            data = resp.json()
            return data["token"], data.get("expiresIn", 3600)

    @classmethod
    async def get_properties(cls) -> list[dict]:
        """Obtiene las propiedades registradas en Beds24 (ejemplo)."""
        token = await cls.get_access_token()
        headers = {"token": token}
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{cls.BASE_URL}/properties", headers=headers)
            resp.raise_for_status()
            # Actualizar métricas de cuota desde los headers de la respuesta
            cls._update_quota_metrics(resp.headers)
            return resp.json().get("data", [])

    @classmethod
    async def get_bookings(cls, modified_since: datetime | None = None) -> list[dict[str, Any]]:
        """Fetch all changed bookings with pagination and bounded retry/backoff.

        Beds24 API V2 paginates GET /bookings. The cursor is intentionally a
        timestamp a few seconds before the prior successful run, making an
        overlap safe because Nomora upserts by the immutable Beds24 booking ID.
        """
        token = await cls.get_access_token()
        params: dict[str, str] = {}
        if modified_since:
            params["modifiedSince"] = modified_since.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        url = f"{cls.BASE_URL}/bookings"
        bookings: list[dict[str, Any]] = []
        pages = 0
        async with httpx.AsyncClient(timeout=30.0) as client:
            while url:
                pages += 1
                if pages > 100:
                    raise RuntimeError("Beds24 returned more than 100 booking pages; sync was stopped safely.")
                response = await cls._get_with_retry(client, url, headers={"token": token, "accept": "application/json"}, params=params)
                params = {}
                payload = response.json()
                bookings.extend(payload.get("data", []))
                url = payload.get("nextPageLink")
                cls._update_quota_metrics(response.headers)
        return bookings

    @classmethod
    async def get_room_calendar(cls, start: date, end: date) -> list[dict[str, Any]]:
        """Read raw daily room values only; this client never writes inventory."""
        token = await cls.get_access_token()
        response_data: list[dict[str, Any]] = []
        params = {
            "from": start.isoformat(), "to": end.isoformat(),
            "includePrices": "true", "includeNumAvail": "true", "includeOverrides": "true",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await cls._get_with_retry(
                client, f"{cls.BASE_URL}/inventory/rooms/calendar",
                headers={"token": token, "accept": "application/json"}, params=params,
            )
            payload = response.json()
            response_data.extend(payload.get("data", payload if isinstance(payload, list) else []))
            cls._update_quota_metrics(response.headers)
        return response_data

    @classmethod
    async def _get_with_retry(cls, client: httpx.AsyncClient, url: str, *, headers: dict[str, str], params: dict[str, str]) -> httpx.Response:
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code < 400:
                    return response
                if response.status_code not in {408, 429, 500, 502, 503, 504}:
                    response.raise_for_status()
                retry_after = response.headers.get("retry-after")
                delay = float(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
                last_error = httpx.HTTPStatusError("Beds24 transient response", request=response.request, response=response)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
                delay = 2 ** attempt
            if attempt < 2:
                await asyncio.sleep(delay)
        assert last_error is not None
        raise last_error

    @classmethod
    def _update_quota_metrics(cls, headers: httpx.Headers):
        """Lee los headers de cuota de Beds24 y los registra."""
        # Beds24 devuelve X-RateLimit-Remaining u otros headers, dependiendo de su API.
        # Simulamos la extracción de métricas
        remaining = headers.get("x-five-min-limit-remaining") or headers.get("x-ratelimit-remaining")
        if remaining:
            logger.info(f"Cuota Beds24 restante: {remaining}")
            # Idealmente se guardaría en Redis o DataDog
