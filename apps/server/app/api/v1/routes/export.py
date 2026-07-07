import uuid
import csv
import io
from fastapi import APIRouter, Depends, HTTPException
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
async def export_csv(property_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Exporta todas las transacciones (reservas y gastos) de una propiedad en formato CSV.
    """
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
    res_result = await db.execute(
        select(Reservation).where(
            Reservation.property_id == property_id,
            Reservation.status != "cancelled"
        ).order_by(Reservation.check_in.desc())
    )
    reservations = res_result.scalars().all()

    # Obtener Gastos
    exp_result = await db.execute(
        select(Expense).where(
            Expense.property_id == property_id,
            Expense.is_deleted == False
        ).order_by(Expense.date.desc())
    )
    expenses = exp_result.scalars().all()

    # Generar CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Escribir cabeceras
    writer.writerow(["Fecha", "Tipo", "Concepto/Huesped", "Monto", "Moneda", "Categoria/Plataforma"])

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
