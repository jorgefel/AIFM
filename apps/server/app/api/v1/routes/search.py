from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search_all(q: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Realiza una búsqueda global en Propiedades, Reservas y Gastos asociados al usuario.
    """
    if not q or len(q) < 2:
        return {"properties": [], "reservations": [], "expenses": []}

    search_term = f"%{q}%"

    # Buscar Propiedades
    prop_result = await db.execute(
        select(Property).where(
            Property.owner_id == current_user.id,
            Property.is_active == True,
            or_(
                Property.name.ilike(search_term),
                Property.address.ilike(search_term)
            )
        )
    )
    properties = prop_result.scalars().all()

    # Buscar Reservas (solo de las propiedades del usuario)
    res_result = await db.execute(
        select(Reservation).join(Property).where(
            Property.owner_id == current_user.id,
            Reservation.status != "cancelled",
            or_(
                Reservation.guest_name.ilike(search_term),
                Reservation.notes.ilike(search_term)
            )
        )
    )
    reservations = res_result.scalars().all()

    # Buscar Gastos
    exp_result = await db.execute(
        select(Expense).join(Property).where(
            Property.owner_id == current_user.id,
            Expense.is_deleted == False,
            or_(
                Expense.description.ilike(search_term),
                Expense.category.ilike(search_term)
            )
        )
    )
    expenses = exp_result.scalars().all()

    return {
        "properties": [
            {"id": str(p.id), "name": p.name, "type": "property", "subtitle": p.address}
            for p in properties
        ],
        "reservations": [
            {"id": str(r.id), "name": r.guest_name, "type": "reservation", "subtitle": f"{r.check_in} a {r.check_out}", "property_id": str(r.property_id)}
            for r in reservations
        ],
        "expenses": [
            {"id": str(e.id), "name": e.description, "type": "expense", "subtitle": f"${e.amount} - {e.category}", "property_id": str(e.property_id)}
            for e in expenses
        ]
    }
