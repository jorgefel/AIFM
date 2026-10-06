import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_tier, verify_property_access
from app.models.user import User
from app.models.automation import AutomationAction, AuditLog
from app.schemas.automation import AutomationActionRead, AutomationActionCreate

router = APIRouter(prefix="/automations", tags=["automations"])

@router.get("/", response_model=list[AutomationActionRead])
async def list_automations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    result = await db.execute(
        select(AutomationAction).where(AutomationAction.user_id == current_user.id).order_by(AutomationAction.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=AutomationActionRead)
async def create_automation(
    payload: AutomationActionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    if payload.property_id:
        await verify_property_access(payload.property_id, current_user, db)
        
    action = AutomationAction(
        user_id=current_user.id,
        property_id=payload.property_id,
        action_type=payload.action_type,
        payload=payload.payload,
        status=payload.status if payload.status in ("draft", "pending_approval") else "draft"
    )
    
    db.add(action)
    await db.commit()
    await db.refresh(action)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="automation_created",
        details={"automation_id": str(action.id), "status": action.status, "type": action.action_type}
    ))
    await db.commit()
    
    return action

@router.put("/{action_id}/approve", response_model=AutomationActionRead)
async def approve_and_execute_automation(
    action_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    action = await db.get(AutomationAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
        
    if action.status not in ("draft", "pending_approval"):
        raise HTTPException(status_code=400, detail=f"No se puede aprobar una acción en estado {action.status}")
        
    # Aquí iría la lógica real de ejecución según action.action_type
    # Ej: if action.action_type == 'adjust_price': beds24_client.adjust_price(...)
    
    action.status = "executed"
    action.executed_at = datetime.now(timezone.utc)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="automation_approved",
        details={"automation_id": str(action.id)}
    ))
    
    await db.commit()
    await db.refresh(action)
    return action

@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_automation(
    action_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    action = await db.get(AutomationAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Acción no encontrada")
        
    if action.status == "executed":
        raise HTTPException(status_code=400, detail="No se puede cancelar una acción ya ejecutada")
        
    action.status = "cancelled"
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="automation_cancelled",
        details={"automation_id": str(action.id)}
    ))
    
    await db.commit()
    return None
