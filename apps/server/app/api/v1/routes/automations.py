from datetime import date, datetime, timedelta, timezone
import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.models.automation import AuditLog, AutomationAction
from app.models.expense import Expense
from app.models.property import Property
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.automation import AutomationActionCreate, AutomationActionRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/automations", tags=["automations"])


async def scan_operational_rules(db: AsyncSession, current_user: User) -> List[AutomationAction]:
    """
    Evaluates 3 deterministic, honest operational rules:
    1. Check-in reminder (arrivals in the next 24-48 hours).
    2. Low occupancy alert (projected occupancy < 30% in next 30 days).
    3. Recurring expense reminder (utilities/maintenance missing this month).
    All actions require explicit user confirmation before being marked executed.
    """
    today = date.today()
    created_actions: List[AutomationAction] = []

    # 1. Check-in reminders (next 48 hours)
    inbound_res = await db.execute(
        select(Reservation, Property.name)
        .join(Property, Reservation.property_id == Property.id)
        .where(
            Property.owner_id == current_user.id,
            Property.is_active.is_(True),
            Reservation.status.in_(["confirmed", "pending"]),
            Reservation.check_in >= today,
            Reservation.check_in <= today + timedelta(days=2),
        )
    )
    for res, prop_name in inbound_res.all():
        # Check if already generated for this reservation
        existing = await db.execute(
            select(AutomationAction).where(
                AutomationAction.user_id == current_user.id,
                AutomationAction.action_type == "checkin_reminder",
                AutomationAction.payload["reservation_id"].as_string() == str(res.id),
                AutomationAction.status.in_(["pending_approval", "executed"]),
            )
        )
        if not existing.scalars().first():
            action = AutomationAction(
                user_id=current_user.id,
                property_id=res.property_id,
                action_type="checkin_reminder",
                payload={
                    "title": f"Llegada próxima: {res.guest_name}",
                    "description": f"Check-in programado para el {res.check_in.strftime('%d/%m/%Y')} en {prop_name}.",
                    "reservation_id": str(res.id),
                    "guest_name": res.guest_name,
                    "check_in": str(res.check_in),
                    "property_name": prop_name,
                    "suggested_action": "Enviar instrucciones de llegada y verificar preparación de la propiedad.",
                },
                status="pending_approval",
            )
            db.add(action)
            created_actions.append(action)

    # 2. Low occupancy alert (next 30 days < 30%)
    props_res = await db.execute(
        select(Property).where(
            Property.owner_id == current_user.id,
            Property.is_active.is_(True),
        )
    )
    properties = props_res.scalars().all()
    window_end = today + timedelta(days=30)

    for prop in properties:
        res_overlap = await db.execute(
            select(Reservation.check_in, Reservation.check_out).where(
                Reservation.property_id == prop.id,
                Reservation.status.in_(["confirmed", "completed"]),
                Reservation.check_in < window_end,
                Reservation.check_out > today,
            )
        )
        booked_nights = 0
        for cin, cout in res_overlap.all():
            start = max(cin, today)
            end = min(cout, window_end)
            booked_nights += max(0, (end - start).days)

        occupancy_rate = booked_nights / 30.0
        if occupancy_rate < 0.30:
            pct = int(round(occupancy_rate * 100))
            # Check if alert generated recently (last 7 days)
            recent = await db.execute(
                select(AutomationAction).where(
                    AutomationAction.user_id == current_user.id,
                    AutomationAction.property_id == prop.id,
                    AutomationAction.action_type == "low_occupancy_alert",
                    AutomationAction.created_at >= datetime.now(timezone.utc) - timedelta(days=7),
                )
            )
            if not recent.scalars().first():
                action = AutomationAction(
                    user_id=current_user.id,
                    property_id=prop.id,
                    action_type="low_occupancy_alert",
                    payload={
                        "title": f"Baja ocupación en {prop.name}",
                        "description": f"Ocupación proyectada del {pct}% ({booked_nights} de 30 noches reservadas).",
                        "property_name": prop.name,
                        "occupancy_pct": pct,
                        "suggested_action": "Revisar precios frente al mercado o activar canales de distribución adicionales.",
                    },
                    status="pending_approval",
                )
                db.add(action)
                created_actions.append(action)

    # 3. Recurring expense reminder (missing utilities/maintenance this month)
    first_of_month = today.replace(day=1)
    month_expenses = await db.execute(
        select(Expense)
        .join(Property, Expense.property_id == Property.id)
        .where(
            Property.owner_id == current_user.id,
            Expense.date >= first_of_month,
        )
    )
    has_month_expenses = len(month_expenses.scalars().all()) > 0

    if not has_month_expenses and len(properties) > 0:
        recent_alert = await db.execute(
            select(AutomationAction).where(
                AutomationAction.user_id == current_user.id,
                AutomationAction.action_type == "recurring_expense_reminder",
                AutomationAction.created_at >= datetime.now(timezone.utc) - timedelta(days=14),
            )
        )
        if not recent_alert.scalars().first():
            action = AutomationAction(
                user_id=current_user.id,
                property_id=properties[0].id,
                action_type="recurring_expense_reminder",
                payload={
                    "title": "Gastos mensuales pendientes",
                    "description": "No se han registrado gastos operativos (servicios públicos o mantenimiento) durante este mes.",
                    "suggested_action": "Registrar comprobantes de servicios del mes para mantener el balance financiero exacto.",
                },
                status="pending_approval",
            )
            db.add(action)
            created_actions.append(action)

    if created_actions:
        await db.commit()
        for act in created_actions:
            await db.refresh(act)
            db.add(
                AuditLog(
                    user_id=current_user.id,
                    action="automation_generated",
                    details={
                        "automation_id": str(act.id),
                        "action_type": act.action_type,
                    },
                )
            )
        await db.commit()

    return created_actions


@router.get("", response_model=List[AutomationActionRead], include_in_schema=False)
@router.get("/", response_model=List[AutomationActionRead])
async def list_automations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Scan rules automatically if no actions exist
    existing = await db.execute(
        select(AutomationAction).where(AutomationAction.user_id == current_user.id)
    )
    if not existing.scalars().first():
        await scan_operational_rules(db, current_user)

    result = await db.execute(
        select(AutomationAction)
        .where(AutomationAction.user_id == current_user.id)
        .order_by(AutomationAction.created_at.desc())
    )
    return result.scalars().all()


@router.post("/scan", response_model=List[AutomationActionRead])
async def scan_automations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await scan_operational_rules(db, current_user)
    result = await db.execute(
        select(AutomationAction)
        .where(AutomationAction.user_id == current_user.id)
        .order_by(AutomationAction.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=AutomationActionRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=AutomationActionRead, status_code=status.HTTP_201_CREATED)
async def create_automation(
    payload: AutomationActionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.property_id:
        await verify_property_access(payload.property_id, current_user, db)

    action = AutomationAction(
        user_id=current_user.id,
        property_id=payload.property_id,
        action_type=payload.action_type,
        payload=payload.payload,
        status=payload.status if payload.status in ("draft", "pending_approval") else "draft",
    )

    db.add(action)
    await db.commit()
    await db.refresh(action)

    # Audit log
    db.add(
        AuditLog(
            user_id=current_user.id,
            action="automation_created",
            details={
                "automation_id": str(action.id),
                "status": action.status,
                "type": action.action_type,
            },
        )
    )
    await db.commit()

    return action


@router.put("/{action_id}/approve", response_model=AutomationActionRead)
async def approve_and_execute_automation(
    action_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = await db.get(AutomationAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Acción no encontrada")

    if action.status not in ("draft", "pending_approval"):
        raise HTTPException(
            status_code=400,
            detail=f"No se puede aprobar una acción en estado {action.status}",
        )

    # Transition to executed with confirmation
    action.status = "executed"
    action.executed_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="automation_approved",
            details={
                "automation_id": str(action.id),
                "action_type": action.action_type,
                "payload": action.payload,
            },
        )
    )

    await db.commit()
    await db.refresh(action)
    return action


@router.delete("/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_automation(
    action_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    action = await db.get(AutomationAction, action_id)
    if not action or action.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Acción no encontrada")

    if action.status == "executed":
        raise HTTPException(
            status_code=400,
            detail="No se puede cancelar una acción ya ejecutada",
        )

    action.status = "cancelled"

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="automation_cancelled",
            details={"automation_id": str(action.id), "action_type": action.action_type},
        )
    )

    await db.commit()
    return None
