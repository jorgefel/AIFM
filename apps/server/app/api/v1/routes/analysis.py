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
from app.schemas.analysis import MonthlySummary, AIInsightRequest, DashboardData
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
from app.services.cache import get_cached_summary, set_cached_summary


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
    Cached in Redis for 60s to avoid redundant computation.
    """
    await verify_property_access(property_id, current_user, db)

    # ── Redis cache check ──
    cached = await get_cached_summary(property_id, year, month)
    if cached is not None:
        return cached

    # ── Cache miss: compute and store ──
    reservations, expenses, _ = await _get_property_data(property_id, db)
    summary = calculate_monthly_summary(reservations, expenses, year, month)

    await set_cached_summary(property_id, year, month, summary)
    return summary


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    property_id: uuid.UUID,
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint consolidado para el frontend.
    Devuelve todo lo necesario para el dashboard en una sola petición.
    """
    await verify_property_access(property_id, current_user, db)
    
    # Obtenemos los datos raw para hacer todos los cálculos en memoria
    reservations, expenses, _ = await _get_property_data(property_id, db)
    
    # 1. Resumen actual
    summary = calculate_monthly_summary(reservations, expenses, year, month)
    
    # 2. Gráfico (6 meses)
    chart_data = []
    for i in range(5, -1, -1):
        # Lógica para restar meses
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        
        # Intentar cache primero (usamos get_cached_summary que definimos antes)
        cached_m = await get_cached_summary(property_id, y, m)
        if cached_m is not None:
            chart_data.append(cached_m)
        else:
            calc_m = calculate_monthly_summary(reservations, expenses, y, m)
            await set_cached_summary(property_id, y, m, calc_m)
            chart_data.append(calc_m)
            
    # 3. Actividad reciente (top 5 más recientes)
    from datetime import date
    activity = []
    
    for r in reservations:
        activity.append({
            "id": f"res-{r['id']}",
            "type": "reservation",
            "title": f"Reserva: {r.get('guest_name', 'Huésped')}",
            "date": r["check_in"].isoformat() if isinstance(r["check_in"], date) else r["check_in"],
            "amount": r["net_amount"],
            "platform": r.get("platform", "airbnb")
        })
        
    for e in expenses:
        if e.get("is_deleted", False):
            continue
        activity.append({
            "id": f"exp-{e['id']}",
            "type": "expense",
            "title": f"Gasto: {e.get('category', 'Otro')}",
            "date": e["date"].isoformat() if isinstance(e["date"], date) else e["date"],
            "amount": e["amount"]
        })
        
    # Ordenar por fecha descendente
    activity.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "summary": summary,
        "chart_data": chart_data,
        "recent_activity": activity[:5]
    }



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
