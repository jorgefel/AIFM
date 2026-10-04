# ─────────────────────────────────────────────────────────────
# app/api/v1/routes/dashboard.py — Endpoints para Layout
# ─────────────────────────────────────────────────────────────
import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dashboard import DashboardLayout
from app.schemas.dashboard import DashboardLayoutRead, DashboardLayoutUpdate

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Layout default si el usuario nunca ha guardado uno (basado en la UI actual)
DEFAULT_LAYOUT = [
    {"i": "income_summary", "x": 0, "y": 0, "w": 1, "h": 1, "minW": 1, "minH": 1},
    {"i": "net_profit", "x": 1, "y": 0, "w": 1, "h": 1, "minW": 1, "minH": 1},
    {"i": "expenses_summary", "x": 2, "y": 0, "w": 1, "h": 1, "minW": 1, "minH": 1},
    {"i": "occupancy_rate", "x": 3, "y": 0, "w": 1, "h": 1, "minW": 1, "minH": 1},
    {"i": "performance_chart", "x": 0, "y": 1, "w": 2, "h": 2, "minW": 2, "minH": 2},
    {"i": "recent_activity", "x": 2, "y": 1, "w": 2, "h": 2, "minW": 2, "minH": 2},
]

@router.get("/", response_model=DashboardLayoutRead)
async def get_dashboard_layout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(DashboardLayout).where(DashboardLayout.user_id == current_user.id))
    layout = result.scalars().first()
    if not layout:
        # Devolvemos el default layout si el usuario no tiene uno guardado
        import datetime
        return DashboardLayoutRead(
            id=uuid.uuid4(),
            user_id=current_user.id,
            layout_data=DEFAULT_LAYOUT,
            created_at=datetime.datetime.now(datetime.timezone.utc),
            updated_at=datetime.datetime.now(datetime.timezone.utc)
        )
    return layout

@router.put("/", response_model=DashboardLayoutRead)
async def update_dashboard_layout(
    payload: DashboardLayoutUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(DashboardLayout).where(DashboardLayout.user_id == current_user.id))
    layout = result.scalars().first()
    
    if not layout:
        layout = DashboardLayout(user_id=current_user.id, layout_data=payload.layout_data)
        db.add(layout)
    else:
        layout.layout_data = payload.layout_data
        
    await db.commit()
    await db.refresh(layout)
    return layout
