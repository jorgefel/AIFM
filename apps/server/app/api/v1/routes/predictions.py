import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense
from app.schemas.forecast import PropertyForecastResponse
from app.services.forecast import generate_property_forecast
from app.services.predictive_recommendations import generate_predictive_recommendations

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/forecast", response_model=PropertyForecastResponse)
async def get_forecast(
    property_id: uuid.UUID,
    months: int = Query(default=3, ge=1, le=12, description="Número de meses a pronosticar (1 a 12)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pronostica ingresos brutos y beneficio neto para los próximos meses
    utilizando suavizado exponencial Holt-Winters / Holt lineal.
    Las cifras se entregan como estimaciones preventivas sin alterar registros reales.
    """
    await verify_property_access(property_id, current_user, db)

    prop_result = await db.execute(select(Property).where(Property.id == property_id))
    property_obj = prop_result.scalars().first()
    if not property_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

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
        }
        for e in exp_result.scalars().all()
    ]

    forecasts, historical_count, meta = generate_property_forecast(
        property_id=str(property_id),
        reservations=reservations,
        expenses=expenses,
        steps=months,
        return_metadata=True,
    )

    from app.services.market_evidence import get_market_evidence

    market_data = await get_market_evidence(property_id, db, property_obj)

    recs = generate_predictive_recommendations(
        property_id=str(property_id),
        reservations=reservations,
        expenses=expenses,
        forecasts=forecasts,
        historical_count=historical_count,
        market_data=market_data,
        own_nightly_rate=float(property_obj.nightly_rate) if property_obj.nightly_rate is not None else None,
    )

    # Persistir en memoria determinista (D6)
    try:
        from app.services.advice_memory import record_advice_batch
        await record_advice_batch(db, property_obj, recs)
    except Exception:
        pass

    return PropertyForecastResponse(
        kind="financial_forecast",
        period="month",
        property_id=property_id,
        property_name=property_obj.name,
        currency=property_obj.currency,
        historical_months_count=historical_count,
        months_of_history=meta["months_of_history"],
        confidence_level=meta["confidence_level"],
        model=meta["model"],
        central=meta["central"],
        min=meta["min"],
        max=meta["max"],
        backtest_mape=meta["backtest_mape"],
        as_of=date.today(),
        forecasts=forecasts,
        recommendations=recs,
    )
