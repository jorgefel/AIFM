from __future__ import annotations
import uuid
import json
from datetime import date, datetime
from typing import Annotated

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.property import Property
from app.models.user import User
from app.api.v1.routes.analysis import _get_property_data, _get_portfolio_data, _build_operational_alerts, _portfolio_summary
from app.engine.golden_rule import calculate_monthly_summary

# Estas variables globales temporales permiten que las herramientas accedan al contexto
# (db, user) ya que LangChain tools tienen firmas estrictas, en producción se usaría
# inyección de contexto por session, pero dado que usamos instancias cortas, pasaremos
# esto mediante Runnables o un wrapper manual si es necesario.
# Mejor aún, para un motor directo, podemos inyectar el contexto completo antes de llamar,
# o usar el nuevo API de LangGraph/LangChain context.
# Para evitar complejidad global, el LLM "herramienta" será un Agent o simplemente pasamos el contexto al prompt principal y ya.
# Dado que es "Asistente IA Pro", veamos si podemos inyectar un gran contexto inicial en vez de múltiples llamadas a tool.
# Pero el objetivo dice "Herramientas de solo lectura". Vamos a definir un wrapper.

class CopilotContext:
    def __init__(self, db: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID | None = None, period: str = "current_month"):
        self.db = db
        self.user_id = user_id
        self.property_id = property_id
        self.period = period



SYSTEM_PROMPT = """Eres el Asistente IA Pro de Nomora (Copiloto Analítico), diseñado para administradores de propiedades.
Tu objetivo es responder de manera clara, basada SIEMPRE en los datos estructurados provistos por el motor determinístico de Nomora.
- Nunca inventes ingresos, gastos o tasas de ocupación. Si los datos faltan, dilo.
- Las respuestas deben ser analíticas y concisas.
- Sugiere acciones (ej: reducir gastos, revisar precios si la ocupación es baja).
- No realizas modificaciones en el sistema, eres de SOLO LECTURA.
- Explica qué periodo estás analizando.
"""

async def run_copilot(
    message: str, 
    chat_history: list[dict], 
    db: AsyncSession, 
    user_id: uuid.UUID, 
    property_id: uuid.UUID | None = None,
    period: str = "current_month"
) -> dict:
    today = date.today()
    if period == "last_month":
        year = today.year if today.month > 1 else today.year - 1
        month = today.month - 1 if today.month > 1 else 12
    else:
        year = today.year
        month = today.month

    # Construir el contexto en base de datos PostgreSQL de Nomora
    context_data = ""
    if property_id:
        reservations, expenses, property_obj = await _get_property_data(property_id, db)
        summary = calculate_monthly_summary(reservations, expenses, year, month)
        context_data += f"Propiedad: {property_obj.name} (Moneda: {property_obj.currency})\n"
        context_data += f"Periodo analizado: {year}-{month:02d}\n"
        context_data += f"Métricas Mensuales: Ingresos brutos: {summary['gross_income']}, Ingresos netos: {summary['net_income']}, Gastos: {summary['total_expenses']}, Beneficio neto: {summary['net_profit']}, Ocupación: {summary['occupancy_rate']*100}%\n"
        alerts = _build_operational_alerts([property_obj], reservations, expenses, today)
        if alerts:
            context_data += "Alertas Operativas (HOY):\n" + json.dumps(alerts, default=str)
    else:
        user = await db.get(User, user_id)
        properties, reservations, expenses = await _get_portfolio_data(user, db)
        summary, _ = _portfolio_summary(properties, reservations, expenses, year, month)
        context_data += f"Portafolio Completo ({len(properties)} propiedades vinculadas)\n"
        context_data += f"Periodo analizado: {year}-{month:02d}\n"
        context_data += f"Métricas Consolidadas: Ingresos netos: {summary['net_income']}, Gastos: {summary['total_expenses']}, Beneficio neto: {summary['net_profit']}, Ocupación promedio: {summary['occupancy_rate']*100}%\n"
        alerts = _build_operational_alerts(properties, reservations, expenses, today)
        if alerts:
            context_data += "Alertas Operativas del Portafolio:\n" + json.dumps(alerts, default=str)

    system_content = f"{SYSTEM_PROMPT}\n\n[CONTEXTO ACTUAL DE BASE DE DATOS NOMORA]\n{context_data}\n\nFin del contexto. Usa el contexto provisto para responder a la solicitud del usuario."

    if not settings.OPENAI_API_KEY:
        # Mock response si no hay llave
        return {
            "content": f"**[Modo Simulado]**\nHe analizado el periodo {year}-{month:02d}. El beneficio neto es {summary['net_profit']}. Te sugiero revisar las alertas operativas. *(Configura OPENAI_API_KEY para habilitar el asistente real)*",
            "metadata_json": {"source": "PostgreSQL (Deterministic)", "period": f"{year}-{month:02d}", "mock": True}
        }
    
    llm = ChatOpenAI(
        model=settings.AI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None,
        temperature=0.2,
        max_tokens=1000
    )
    
    messages = [SystemMessage(content=system_content)]
    for m in chat_history[-5:]: # last 5 to save tokens
        if m["role"] == "user":
            messages.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            messages.append(AIMessage(content=m["content"]))
            
    messages.append(HumanMessage(content=message))
    
    response = await llm.ainvoke(messages)
    
    return {
        "content": response.content,
        "metadata_json": {
            "source": "PostgreSQL (Deterministic) -> OpenAI",
            "period": f"{year}-{month:02d}",
            "tokens_used": response.response_metadata.get("token_usage", {})
        }
    }
