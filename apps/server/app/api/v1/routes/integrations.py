# ─────────────────────────────────────────────────────────────
# app/api/v1/routes/integrations.py — Endpoints para Integraciones
# ─────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.database import get_db
from app.core.dependencies import require_tier, get_current_user
from app.models.user import User
from app.services.beds24 import Beds24Client

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("/beds24/properties", dependencies=[Depends(require_tier("pro"))])
async def check_beds24_connection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Endpoint para probar la conexión con Beds24.
    Requiere que el usuario tenga tier Pro.
    """
    try:
        properties = await Beds24Client.get_properties()
        return {"status": "success", "properties": properties}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error conectando con Beds24: {str(e)}"
        )
