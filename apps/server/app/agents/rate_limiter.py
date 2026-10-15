# ─────────────────────────────────────────────────────────────
# app/agents/rate_limiter.py — Límites duros de costo para IA
#
# Controla el uso de llamadas a LLMs por usuario y globalmente
# usando Redis con TTL de 24 horas.
# ─────────────────────────────────────────────────────────────
import logging
from fastapi import HTTPException, status
from app.core.redis import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Keys in Redis
_USER_KEY_PREFIX = "ai_limit:user:"
_GLOBAL_KEY = "ai_limit:global"
_TTL_SECONDS = 86400  # 24 hours


async def check_user_ai_limit(user_id: str) -> None:
    """
    Verifica que el usuario no haya excedido su límite diario de llamadas IA.
    Raises HTTPException 429 si se excede.
    """
    try:
        key = f"{_USER_KEY_PREFIX}{user_id}"
        current = await redis_client.get(key)

        if current is not None and int(current) >= settings.AI_USER_DAILY_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Límite diario de IA alcanzado ({settings.AI_USER_DAILY_LIMIT} llamadas/día). Intenta de nuevo mañana.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"No se pudo consultar el límite de usuario en Redis: {exc}")


async def check_global_ai_limit() -> None:
    """
    Verifica el límite global del sistema para prevenir facturaciones excesivas.
    Raises HTTPException 429 si se excede.
    """
    try:
        current = await redis_client.get(_GLOBAL_KEY)

        if current is not None and int(current) >= settings.AI_GLOBAL_DAILY_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Límite de IA de todo el sistema alcanzado. Por favor, intenta de nuevo más tarde.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"No se pudo consultar el límite global en Redis: {exc}")


async def increment_ai_usage(user_id: str) -> None:
    """
    Incrementa los contadores de uso IA para el usuario y el sistema global.
    Los contadores expiran automáticamente después de 24 horas.
    """
    try:
        user_key = f"{_USER_KEY_PREFIX}{user_id}"

        pipe = redis_client.pipeline()
        pipe.incr(user_key)
        pipe.expire(user_key, _TTL_SECONDS)
        pipe.incr(_GLOBAL_KEY)
        pipe.expire(_GLOBAL_KEY, _TTL_SECONDS)
        await pipe.execute()
    except Exception as exc:
        logger.warning(f"No se pudo registrar uso de IA en Redis: {exc}")
