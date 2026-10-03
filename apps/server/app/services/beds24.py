# ─────────────────────────────────────────────────────────────
# app/services/beds24.py — Cliente para Beds24 API V2
# ─────────────────────────────────────────────────────────────
import httpx
import logging
import asyncio
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
        
        headers = {"token": refresh_token}
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
    def _update_quota_metrics(cls, headers: httpx.Headers):
        """Lee los headers de cuota de Beds24 y los registra."""
        # Beds24 devuelve X-RateLimit-Remaining u otros headers, dependiendo de su API.
        # Simulamos la extracción de métricas
        remaining = headers.get("x-ratelimit-remaining")
        if remaining:
            logger.info(f"Cuota Beds24 restante: {remaining}")
            # Idealmente se guardaría en Redis o DataDog
