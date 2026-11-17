import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.core.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.competitors import CompetitorSnapshot
from app.services.competitors.provider import (
    ProviderConfigurationError,
    ProviderQueryError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.services.competitors.service import get_competitors

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/properties/{property_id}/competitors", tags=["competitors"])


@router.get("", response_model=CompetitorSnapshot, dependencies=[Depends(RateLimiter(times=5, minutes=1))])
async def read_competitors(
    property_id: uuid.UUID,
    fallback_to_city: bool = True,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    property_ = await verify_property_access(property_id, current_user, db)
    try:
        return await get_competitors(property_, fallback_to_city=fallback_to_city, force=force, db=db)
    except ValueError as exc:
        logger.warning("Validation error on competitors for property %s: %s", property_id, exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except ProviderConfigurationError as exc:
        logger.exception("Competitor provider not configured for property %s: %s", property_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La comparación de competidores no está configurada en el servidor.",
        ) from exc
    except ProviderQueryError as exc:
        logger.exception("Competitor search query rejected (HTTP 400) for property %s: %s", property_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No fue posible obtener competidores para la ubicación especificada.",
        ) from exc
    except ProviderRateLimitError as exc:
        logger.exception("Competitor provider rate limited for property %s: %s", property_id, exc)
        detail_msg = str(exc) if "crédito" in str(exc).lower() else "Se ha alcanzado el límite de consultas de competidores. Intenta más tarde."
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail_msg,
        ) from exc
    except ProviderTimeoutError as exc:
        logger.exception("Competitor provider timed out for property %s: %s", property_id, exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="La consulta a Airbnb tardó más tiempo del esperado. Por favor intenta de nuevo.",
        ) from exc
    except ProviderUnavailableError as exc:
        logger.exception("Competitor provider unavailable for property %s: %s", property_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar Airbnb en este momento.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error fetching competitors for property %s: %s", property_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar Airbnb en este momento.",
        ) from exc
