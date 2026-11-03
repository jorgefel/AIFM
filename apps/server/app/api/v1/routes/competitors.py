import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.core.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.competitors import CompetitorSnapshot
from app.services.competitors.omkar import ProviderUnavailableError
from app.services.competitors.service import get_competitors

router = APIRouter(prefix="/properties/{property_id}/competitors", tags=["competitors"])


@router.get("", response_model=CompetitorSnapshot, dependencies=[Depends(RateLimiter(times=5, minutes=1))])
async def read_competitors(
    property_id: uuid.UUID, fallback_to_city: bool = True, force: bool = False, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    property_ = await verify_property_access(property_id, current_user, db)
    try:
        return await get_competitors(property_, fallback_to_city=fallback_to_city, force=force)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ProviderUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
