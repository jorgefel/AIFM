from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.job_manager import get_job
from app.schemas.analysis import JobStatus

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    """
    Devuelve el estado actual de un job asíncrono.

    Posibles estados: pending, processing, completed, failed.
    Cuando status='completed', el campo 'result' contiene los insights.
    Cuando status='failed', el campo 'error' contiene el mensaje.
    """
    job = await get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    if job["user_id"] != str(current_user.id):
        raise HTTPException(status_code=404, detail="Job not found or expired")
    return job
