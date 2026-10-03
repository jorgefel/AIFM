import uuid
from datetime import date, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, require_tier, verify_property_access
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense
from app.engine.golden_rule import aggregate_monthly_summaries, calculate_daily_chart_data, calculate_expense_breakdown, calculate_monthly_summary, detect_discrepancies
from app.engine.deterministic_analyzer import generate_deterministic_analysis
from app.schemas.analysis import MonthlySummary, AIInsightRequest, DashboardData, FinanceOverview, OperationalAlert, PortfolioDashboard
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


async def _get_portfolio_data(current_user: User, db: AsyncSession) -> tuple[list[Property], list[dict], list[dict]]:
    """Fetch a user's active portfolio and financial records in three bounded queries."""
    property_result = await db.execute(
        select(Property).where(Property.owner_id == current_user.id, Property.is_active.is_(True))
    )
    properties = list(property_result.scalars().all())
    property_ids = [property.id for property in properties]
    if not property_ids:
        return properties, [], []
    reservation_result = await db.execute(select(Reservation).where(Reservation.property_id.in_(property_ids)))
    expense_result = await db.execute(select(Expense).where(Expense.property_id.in_(property_ids)))
    reservations = [{
        "id": str(item.id), "property_id": item.property_id, "total_amount": float(item.total_amount),
        "platform_fee": float(item.platform_fee), "net_amount": float(item.net_amount), "status": item.status,
        "check_in": item.check_in, "check_out": item.check_out, "guest_name": item.guest_name, "currency": item.currency,
        "platform": item.platform,
    } for item in reservation_result.scalars().all()]
    expenses = [{
        "id": str(item.id), "property_id": item.property_id, "amount": float(item.amount), "is_deleted": item.is_deleted,
        "date": item.date, "category": item.category, "currency": item.currency,
    } for item in expense_result.scalars().all()]
    return properties, reservations, expenses


def _shift_month(year: int, month: int, amount: int) -> tuple[int, int]:
    month += amount
    while month <= 0:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1
    return year, month


def _portfolio_summary(properties: list[Property], reservations: list[dict], expenses: list[dict], year: int, month: int) -> tuple[dict, list[dict]]:
    per_property = []
    for property_obj in properties:
        property_reservations = [item for item in reservations if item["property_id"] == property_obj.id]
        property_expenses = [item for item in expenses if item["property_id"] == property_obj.id]
        summary = calculate_monthly_summary(property_reservations, property_expenses, year, month)
        per_property.append({"property_id": property_obj.id, "property_name": property_obj.name, "currency": property_obj.currency, "summary": summary})
    return aggregate_monthly_summaries([item["summary"] for item in per_property], year, month), per_property


def _build_operational_alerts(properties: list[Property], reservations: list[dict], expenses: list[dict], today: date) -> list[dict]:
    """Generate actionable deterministic alerts without writing data or calling AI."""
    alerts: list[dict] = []
    for property_obj in properties:
        property_reservations = [item for item in reservations if item["property_id"] == property_obj.id]
        property_expenses = [item for item in expenses if item["property_id"] == property_obj.id]
        summary = calculate_monthly_summary(property_reservations, property_expenses, today.year, today.month)
        shared = {"property_id": property_obj.id, "property_name": property_obj.name}
        if summary["net_profit"] < 0:
            alerts.append({**shared, "id": f"loss-{property_obj.id}-{today:%Y-%m}", "type": "profit", "severity": "high", "title": f"Pérdida neta: {property_obj.name}", "message": f"Los gastos superan los ingresos netos por {property_obj.currency} {abs(summary['net_profit']):,.2f} este mes.", "action_url": "/expenses"})
        if summary["occupancy_rate"] < 0.30:
            alerts.append({**shared, "id": f"occupancy-{property_obj.id}-{today:%Y-%m}", "type": "occupancy", "severity": "medium", "title": f"Baja ocupación: {property_obj.name}", "message": f"La ocupación del mes es {(summary['occupancy_rate'] * 100):.0f}%. Revisa calendario y precios.", "action_url": f"/calendar?property_id={property_obj.id}"})
        for reservation in property_reservations:
            if reservation["status"] in ("confirmed", "pending") and today <= reservation["check_in"] <= today + timedelta(days=2):
                pending = reservation["status"] == "pending"
                alerts.append({**shared, "id": f"checkin-{reservation['id']}", "type": "checkin", "severity": "medium" if pending else "info", "title": f"Entrada {'pendiente' if pending else 'confirmada'}: {property_obj.name}", "message": f"{reservation['guest_name']} llega el {reservation['check_in'].isoformat()}.", "action_url": f"/calendar?property_id={property_obj.id}"})
    priority = {"high": 0, "medium": 1, "info": 2}
    return sorted(alerts, key=lambda item: (priority[item["severity"]], item["title"]))[:20]
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


@router.get("/finance-overview", response_model=FinanceOverview)
async def get_finance_overview(
    property_id: uuid.UUID,
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Monthly profit and expense composition for the finance workspace."""
    await verify_property_access(property_id, current_user, db)
    reservations, expenses, _ = await _get_property_data(property_id, db)
    return {
        "summary": calculate_monthly_summary(reservations, expenses, year, month),
        "expense_breakdown": calculate_expense_breakdown(expenses, year, month),
    }


@router.get("/alerts", response_model=list[OperationalAlert])
async def get_operational_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    properties, reservations, expenses = await _get_portfolio_data(current_user, db)
    return _build_operational_alerts(properties, reservations, expenses, date.today())


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    property_id: uuid.UUID,
    year: int,
    month: int,
    range_: Literal["1m", "3m", "6m", "1y"] = Query(default="6m", alias="range"),
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
    months_by_range = {"1m": 1, "3m": 3, "6m": 6, "1y": 12}
    chart_data = []
    for i in range(months_by_range[range_] - 1, -1, -1):
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

    if range_ == "1m":
        chart_data = calculate_daily_chart_data(reservations, expenses, year, month)
            
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


@router.get("/portfolio-dashboard", response_model=PortfolioDashboard)
async def get_portfolio_dashboard(
    year: int,
    month: int,
    range_: Literal["1m", "3m", "6m", "1y"] = Query(default="6m", alias="range"),
    currency: str | None = Query(default=None, pattern=r"^[A-Z]{3}$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consolidated owner dashboard: totals are calculated per property then combined."""
    properties, reservations, expenses = await _get_portfolio_data(current_user, db)
    # Nomora never silently adds different currencies. FX conversion belongs to a
    # future exchange-rate service, so this view is consolidated per currency.
    selected_currency = currency or (properties[0].currency if properties else None)
    if selected_currency:
        properties = [property_obj for property_obj in properties if property_obj.currency == selected_currency]
    property_ids = {property_obj.id for property_obj in properties}
    reservations = [item for item in reservations if item["property_id"] in property_ids]
    expenses = [item for item in expenses if item["property_id"] in property_ids]
    summary, property_summaries = _portfolio_summary(properties, reservations, expenses, year, month)
    if range_ == "1m":
        chart_data = calculate_daily_chart_data(reservations, expenses, year, month)
    else:
        periods = {"3m": 3, "6m": 6, "1y": 12}[range_]
        chart_data = []
        for offset in range(-(periods - 1), 1):
            chart_year, chart_month = _shift_month(year, month, offset)
            chart_summary, _ = _portfolio_summary(properties, reservations, expenses, chart_year, chart_month)
            chart_data.append(chart_summary)

    property_names = {property.id: property.name for property in properties}
    activity = []
    for reservation in reservations:
        if reservation["status"] == "cancelled":
            continue
        activity.append({
            "id": f"res-{reservation['id']}", "type": "reservation",
            "title": f"Reserva: {reservation['guest_name']}", "date": reservation["check_in"].isoformat(),
            "amount": reservation["net_amount"], "platform": reservation["platform"],
            "property_name": property_names.get(reservation["property_id"], "Propiedad"),
        })
    for expense in expenses:
        if expense["is_deleted"]:
            continue
        activity.append({
            "id": f"exp-{expense['id']}", "type": "expense",
            "title": f"Gasto: {expense['category']}", "date": expense["date"].isoformat(),
            "amount": expense["amount"], "property_name": property_names.get(expense["property_id"], "Propiedad"),
        })
    activity.sort(key=lambda item: item["date"], reverse=True)
    return {"summary": summary, "chart_data": chart_data, "recent_activity": activity[:5], "property_summaries": property_summaries}



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
    current_user: User = Depends(require_tier("pro")),
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
