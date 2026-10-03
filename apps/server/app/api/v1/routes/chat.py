import uuid
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_tier, verify_property_access
from app.models.user import User
from app.models.chat import AIChatSession, AIChatMessage
from app.schemas.chat import AIChatRequest, AIChatSessionRead, AIChatMessageRead, AIChatMessageCreate
from app.agents.copilot import run_copilot
from app.agents.rate_limiter import check_user_ai_limit, check_global_ai_limit, increment_ai_usage

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/sessions", response_model=list[AIChatSessionRead])
async def list_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    result = await db.execute(
        select(AIChatSession).where(AIChatSession.user_id == current_user.id).order_by(AIChatSession.updated_at.desc())
    )
    return result.scalars().all()

@router.get("/sessions/{session_id}", response_model=AIChatSessionRead)
async def get_chat_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    session = await db.get(AIChatSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
        
    messages_result = await db.execute(
        select(AIChatMessage).where(AIChatMessage.session_id == session_id).order_by(AIChatMessage.created_at.asc())
    )
    session_dict = session.__dict__.copy()
    session_dict["messages"] = messages_result.scalars().all()
    return session_dict

@router.post("/", response_model=AIChatMessageRead)
async def send_chat_message(
    payload: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro"))
):
    await check_global_ai_limit(db)
    await check_user_ai_limit(current_user.id, db)
    
    if payload.property_id:
        await verify_property_access(payload.property_id, current_user, db)
        
    session = None
    if payload.session_id:
        session = await db.get(AIChatSession, payload.session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    if not session:
        session = AIChatSession(user_id=current_user.id, property_id=payload.property_id)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
    # Guardar mensaje del usuario
    user_msg = AIChatMessage(
        session_id=session.id, 
        role="user", 
        content=payload.message
    )
    db.add(user_msg)
    session.message_count += 1
    await db.commit()
    
    # Obtener historial reciente
    history_result = await db.execute(
        select(AIChatMessage).where(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc())
    )
    history = [{"role": msg.role, "content": msg.content} for msg in history_result.scalars().all()]
    
    # Ejecutar copiloto
    try:
        response_data = await run_copilot(
            message=payload.message,
            chat_history=history,
            db=db,
            user_id=current_user.id,
            property_id=payload.property_id,
            period=payload.period
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Error en el Asistente IA") from exc
        
    # Guardar respuesta del asistente
    assistant_msg = AIChatMessage(
        session_id=session.id,
        role="assistant",
        content=response_data["content"],
        metadata_json=response_data["metadata_json"]
    )
    db.add(assistant_msg)
    session.message_count += 1
    
    await increment_ai_usage(current_user.id, db)
    await db.commit()
    await db.refresh(assistant_msg)
    
    return assistant_msg
