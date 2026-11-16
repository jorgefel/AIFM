from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.context import build_context
from app.chatbot.registry import REGISTRY
from app.chatbot.routing import get_fallback_question_id, match_question
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, verify_property_access
from app.core.rate_limit import RateLimiter
from app.models.property import Property
from app.models.user import User

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class QuestionItem(BaseModel):
    id: str
    label: str
    category: str


class ChatbotAskRequest(BaseModel):
    question_id: str
    property_id: uuid.UUID
    year: int | None = Field(default=None, ge=2000, le=2100)
    month: int | None = Field(default=None, ge=1, le=12)


class ChatbotMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    property_id: uuid.UUID


async def get_owned_property(
    db: AsyncSession,
    user: User,
    property_id: uuid.UUID,
) -> Property:
    """Valida multi-tenancy: la propiedad debe existir y pertenecer al usuario (404 si no)."""
    return await verify_property_access(property_id, user, db)


@router.get(
    "/questions",
    response_model=list[QuestionItem],
    dependencies=[Depends(RateLimiter(times=60, minutes=1))],
)
async def list_questions(
    current_user: User = Depends(get_current_user),
):
    """Retorna el catálogo disponible de preguntas del chatbot."""
    return [
        QuestionItem(id=q.id, label=q.label, category=q.category)
        for q in REGISTRY.values()
    ]


@router.post(
    "/ask",
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def ask_question(
    payload: ChatbotAskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Capa 1 directa: ejecuta el handler correspondiente al question_id."""
    q = REGISTRY.get(payload.question_id)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pregunta no encontrada en el catálogo",
        )

    prop = await get_owned_property(db, current_user, payload.property_id)
    result = await q.handler(db, prop, payload.year, payload.month)
    return {
        "question_id": q.id,
        "label": q.label,
        "currency": prop.currency,
        **result,
    }


@router.post(
    "/message",
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def send_message(
    payload: ChatbotMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Enrutador de dos capas:
    - Si coincide con el catálogo -> Capa 1 (cálculo directo).
    - Si no coincide -> Capa 2 (contexto para Ollama + fallback_question_id).
    """
    prop = await get_owned_property(db, current_user, payload.property_id)
    q, params = match_question(payload.text)
    fallback_id = get_fallback_question_id(payload.text)

    if q is not None:
        result = await q.handler(db, prop, params.get("year"), params.get("month"))
        return {
            "layer": 1,
            "question_id": q.id,
            "label": q.label,
            "currency": prop.currency,
            **result,
        }

    # Capa 2
    if settings.CHATBOT_AI_REQUIRES_PRO and current_user.tier != "pro":
        return {
            "layer": 2,
            "pro_required": True,
            "message": "El agente IA requiere el plan Pro. Puedes consultar las opciones de capa 1.",
            "fallback_question_id": fallback_id,
        }

    context = await build_context(db, prop)
    return {
        "layer": 2,
        "context": context,
        "fallback_question_id": fallback_id,
    }
