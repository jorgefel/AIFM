import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, verify_property_access
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense
from app.engine.golden_rule import calculate_monthly_summary, detect_discrepancies
from app.engine.deterministic_analyzer import generate_deterministic_analysis
from app.schemas.analysis import MonthlySummary, AIInsightRequest
from app.services.job_manager import create_job, update_job
from app.agents.rate_limiter import check_user_ai_limit, check_global_ai_limit, increment_ai_usage

router = APIRouter(prefix="/analysis", tags=["analysis"])

async def _get_property_data(property_id: uuid.UUID, db: AsyncSession) -> tuple[list[dict], list[dict], Property]:
    """Fetch reservations and expenses for a property and return as dicts."""
    prop_result = await db.execute(select(Property).where(Property.id == property_id))
    prop = prop_result.scalars().first()

    res_result = await db.execute(
        select(Reservation).where(Reservation.property_id == property_id)
    )
    reservations = [
        {
            "id": str(r.id),
            "total_amount": float(r.total_amount),
            "platform_fee": float(r.platform_fee),
            "net_amount": float(r.net_amount),
            "status": r.status,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "guest_name": r.guest_name,
            "currency": r.currency,
        }
        for r in res_result.scalars().all()
    ]

    exp_result = await db.execute(
        select(Expense).where(Expense.property_id == property_id)
    )
    expenses = [
        {
            "id": str(e.id),
            "amount": float(e.amount),
            "is_deleted": e.is_deleted,
            "date": e.date,
            "category": e.category,
            "currency": e.currency,
        }
        for e in exp_result.scalars().all()
    ]

    return reservations, expenses, prop


@router.get("/summary", response_model=MonthlySummary)
async def get_financial_summary(
    property_id: uuid.UUID,
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Resumen financiero mensual (Motor Determinístico, sin IA).
    """
    await verify_property_access(property_id, current_user, db)
    reservations, expenses, _ = await _get_property_data(property_id, db)
    summary = calculate_monthly_summary(reservations, expenses, year, month)
    return summary


async def _run_ai_analysis_task(
    job_id: str,
    property_id: uuid.UUID,
    year: int,
    month: int,
    user_id: str,
):
    """Background task that runs the AI analysis."""
    from app.core.database import AsyncSessionLocal
    from app.agents.financial_advisor import run_financial_analysis

    await update_job(job_id, status="processing")

    try:
        async with AsyncSessionLocal() as db:
            reservations, expenses, prop = await _get_property_data(property_id, db)

        summary = calculate_monthly_summary(reservations, expenses, year, month)
        discrepancies = detect_discrepancies(reservations)

        result = await run_financial_analysis({
            "monthly_summary": summary,
            "discrepancies": discrepancies,
            "property_name": prop.name,
            "currency": prop.currency,
        })

        await increment_ai_usage(user_id)
        await update_job(job_id, status="completed", result=result)

    except Exception as e:
        await update_job(job_id, status="failed", error=str(e))


@router.post("/ai-insights")
async def request_ai_insights(
    request: AIInsightRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Encola una tarea de análisis IA. Retorna un job_id para polling.
    """
    if not settings.ENABLE_AI_AGENTS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI agents are disabled. Set ENABLE_AI_AGENTS=True in .env to enable.",
        )

    await verify_property_access(request.property_id, current_user, db)
    await check_user_ai_limit(str(current_user.id))
    await check_global_ai_limit()

    job_id = await create_job(str(current_user.id))

    background_tasks.add_task(
        _run_ai_analysis_task,
        job_id,
        request.property_id,
        request.year,
        request.month,
        str(current_user.id),
    )

    return {"job_id": job_id, "status": "pending"}


@router.post("/deterministic-insights")
async def request_deterministic_insights(
    request: AIInsightRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna un análisis determinístico (síncrono) sin usar IA.
    """
    prop = await verify_property_access(request.property_id, current_user, db)
    
    reservations, expenses, _ = await _get_property_data(request.property_id, db)

    summary = calculate_monthly_summary(reservations, expenses, request.year, request.month)
    discrepancies = detect_discrepancies(reservations)

    result = generate_deterministic_analysis({
        "monthly_summary": summary,
        "discrepancies": discrepancies,
        "property_name": prop.name,
        "currency": prop.currency,
    })

    return result
