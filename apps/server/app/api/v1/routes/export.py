import uuid
import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/csv")
async def export_csv(
    property_id: uuid.UUID,
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exporta todas las transacciones (reservas y gastos) de una propiedad en formato CSV.
    """
    if start and end and end < start:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end must not be before start")

    # Verificar propiedad
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.owner_id == current_user.id,
            Property.is_active == True
        )
    )
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Obtener Reservas
    reservations_query = select(Reservation).where(
        Reservation.property_id == property_id,
        Reservation.status != "cancelled"
    )
    if start:
        reservations_query = reservations_query.where(Reservation.check_in >= start)
    if end:
        reservations_query = reservations_query.where(Reservation.check_in <= end)
    res_result = await db.execute(reservations_query.order_by(Reservation.check_in.desc()))
    reservations = res_result.scalars().all()

    # Obtener Gastos
    expenses_query = select(Expense).where(
        Expense.property_id == property_id,
        Expense.is_deleted.is_(False)
    )
    if start:
        expenses_query = expenses_query.where(Expense.date >= start)
    if end:
        expenses_query = expenses_query.where(Expense.date <= end)
    exp_result = await db.execute(expenses_query.order_by(Expense.date.desc()))
    expenses = exp_result.scalars().all()

    # Generar CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Escribir cabeceras
    writer.writerow(["Propiedad", prop.name])
    writer.writerow(["Período", f"{start.isoformat() if start else 'Todo'} a {end.isoformat() if end else 'Hoy'}"])
    writer.writerow([])
    writer.writerow(["Fecha", "Tipo", "Concepto/Huésped", "Monto", "Moneda", "Categoría/Plataforma"])

    # Agregar Reservas
    for r in reservations:
        writer.writerow([
            r.check_in.strftime("%Y-%m-%d"),
            "Ingreso",
            r.guest_name,
            f"{r.net_amount:.2f}",
            r.currency,
            r.platform
        ])

    # Agregar Gastos
    for e in expenses:
        writer.writerow([
            e.date.strftime("%Y-%m-%d"),
            "Gasto",
            e.description,
            f"-{e.amount:.2f}",
            e.currency,
            e.category
        ])

    # Ir al inicio del buffer
    output.seek(0)

    filename = f"export_{prop.name.replace(' ', '_')}.csv"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers
    )
