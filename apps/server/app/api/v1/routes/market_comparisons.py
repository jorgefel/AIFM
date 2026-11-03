import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_tier, verify_property_access
from app.models.user import User
from app.schemas.market_comparison import MarketComparison
from app.services.job_manager import create_job
from app.services.market_comparison import create_or_get_refresh_job, get_snapshot, run_refresh

router = APIRouter(prefix="/properties/{property_id}/market-comparisons", tags=["market-comparisons"])


@router.get("/latest", response_model=MarketComparison)
async def latest_market_comparison(
    property_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro")),
):
    await verify_property_access(property_id, current_user, db)
    snapshot = await get_snapshot(str(property_id))
    if snapshot:
        return snapshot
    requested_job_id = await create_job(str(current_user.id))
    job_id = await create_or_get_refresh_job(str(property_id), str(current_user.id), requested_job_id)
    if job_id == requested_job_id:
        background_tasks.add_task(run_refresh, str(property_id), str(current_user.id), job_id)
    return MarketComparison(status="PENDING", job_id=job_id)


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def refresh_market_comparison(
    property_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro")),
):
    await verify_property_access(property_id, current_user, db)
    requested_job_id = await create_job(str(current_user.id))
    job_id = await create_or_get_refresh_job(str(property_id), str(current_user.id), requested_job_id)
    if job_id == requested_job_id:
        background_tasks.add_task(run_refresh, str(property_id), str(current_user.id), job_id)
    return {"job_id": job_id, "status": "pending"}
