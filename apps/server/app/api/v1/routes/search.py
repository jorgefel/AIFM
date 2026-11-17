import unicodedata
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.expense import Expense

router = APIRouter(prefix="/search", tags=["search"])


def _normalize_text(text: str) -> str:
    """Normaliza texto a minúsculas y remueve marcas de acentuación."""
    text = text.lower().strip()
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def _sql_unaccent(col):
    """Mapea caracteres acentuados comunes en SQL usando translate estándar."""
    return func.translate(
        func.lower(col),
        "áéíóúüñàèìòùÁÉÍÓÚÜÑ",
        "aeiouunaeiouaeiouun",
    )


@router.get("", include_in_schema=False)
@router.get("/")
async def search_all(
    q: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Realiza una búsqueda global insensible a mayúsculas y acentos en
    Propiedades, Reservas y Gastos asociados exclusivamente al usuario autenticado.
    """
    cleaned_q = q.strip()
    if not cleaned_q or len(cleaned_q) < 2:
        return {"properties": [], "reservations": [], "expenses": []}

    tokens = [_normalize_text(tok) for tok in cleaned_q.split() if tok.strip()]
    if not tokens:
        return {"properties": [], "reservations": [], "expenses": []}

    # 1. Buscar Propiedades (todos los tokens deben coincidir en nombre o dirección)
    prop_conditions = []
    for tok in tokens:
        pattern = f"%{tok}%"
        prop_conditions.append(
            or_(
                _sql_unaccent(Property.name).like(pattern),
                _sql_unaccent(Property.address).like(pattern),
                _sql_unaccent(Property.city).like(pattern),
                _sql_unaccent(Property.neighborhood).like(pattern),
            )
        )

    prop_stmt = select(Property).where(
        Property.owner_id == current_user.id,
        Property.is_active == True,
        and_(*prop_conditions),
    )
    prop_result = await db.execute(prop_stmt)
    properties = prop_result.scalars().all()

    # 2. Buscar Reservas (solo de las propiedades activas del usuario)
    res_conditions = []
    for tok in tokens:
        pattern = f"%{tok}%"
        res_conditions.append(
            or_(
                _sql_unaccent(Reservation.guest_name).like(pattern),
                _sql_unaccent(Reservation.notes).like(pattern),
            )
        )

    res_stmt = (
        select(Reservation)
        .join(Property, Reservation.property_id == Property.id)
        .where(
            Property.owner_id == current_user.id,
            Property.is_active == True,
            Reservation.status != "cancelled",
            and_(*res_conditions),
        )
    )
    res_result = await db.execute(res_stmt)
    reservations = res_result.scalars().all()

    # 3. Buscar Gastos (solo de propiedades activas del usuario)
    exp_conditions = []
    for tok in tokens:
        pattern = f"%{tok}%"
        exp_conditions.append(
            or_(
                _sql_unaccent(Expense.description).like(pattern),
                _sql_unaccent(Expense.category).like(pattern),
            )
        )

    exp_stmt = (
        select(Expense)
        .join(Property, Expense.property_id == Property.id)
        .where(
            Property.owner_id == current_user.id,
            Property.is_active == True,
            Expense.is_deleted == False,
            and_(*exp_conditions),
        )
    )
    exp_result = await db.execute(exp_stmt)
    expenses = exp_result.scalars().all()

    return {
        "properties": [
            {
                "id": str(p.id),
                "name": p.name,
                "type": "property",
                "subtitle": f"{p.city or ''} - {p.address}".strip(" -"),
            }
            for p in properties
        ],
        "reservations": [
            {
                "id": str(r.id),
                "name": r.guest_name,
                "type": "reservation",
                "subtitle": f"{r.check_in} a {r.check_out}",
                "property_id": str(r.property_id),
            }
            for r in reservations
        ],
        "expenses": [
            {
                "id": str(e.id),
                "name": e.description,
                "type": "expense",
                "subtitle": f"${e.amount} - {e.category}",
                "property_id": str(e.property_id),
            }
            for e in expenses
        ],
    }
