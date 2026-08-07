# ─────────────────────────────────────────────────────────────
# app/agents/financial_advisor.py — Agente IA LangGraph
#
# Genera alertas y análisis financieros. NUNCA sobreescribe
# datos financieros. El motor determinístico (golden_rule.py)
# siempre tiene la última palabra.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import json
from typing import TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings


SYSTEM_PROMPT = """Eres un asesor financiero para administradores de propiedades en Airbnb.
Analizas datos financieros mensuales y proporcionas información útil y procesable.

Tu rol es ÚNICAMENTE ASESOR - nunca modificas registros financieros.

Al analizar los datos, enfócate en:
1. Tendencias de ingresos y anomalías
2. Oportunidades de optimización de gastos
3. Análisis de la tasa de ocupación y sugerencias
4. Comparaciones de tarifas de la plataforma
5. Alertas de discrepancias (si el motor determinístico encuentra alguna)

Responde en el mismo idioma que los datos de la propiedad del usuario (Español si los nombres/descripciones están en español).
Mantén tu análisis conciso pero profundo. Usa viñetas para mayor claridad.
Incluye números específicos de los datos para respaldar tus conclusiones."""


class AnalysisInput(TypedDict):
    monthly_summary: dict
    discrepancies: list[dict]
    property_name: str
    currency: str


async def run_financial_analysis(input_data: AnalysisInput) -> dict:
    """
    Ejecuta el agente de análisis financiero.

    Args:
        input_data: Resumen mensual del motor determinístico + discrepancias

    Returns:
        dict con 'insights' (str) y 'alerts' (list[str])
    """
    summary = input_data["monthly_summary"]
    discrepancies = input_data["discrepancies"]
    property_name = input_data["property_name"]
    currency = input_data["currency"]

    user_message = f"""Analiza los siguientes datos financieros mensuales para la propiedad "{property_name}":

**Resumen Mensual ({summary['year']}-{summary['month']:02d}):**
- Ingresos Brutos: {currency} {summary['gross_income']:,.2f}
- Tarifas de Plataforma: {currency} {summary['total_fees']:,.2f}
- Ingresos Netos: {currency} {summary['net_income']:,.2f}
- Gastos Totales: {currency} {summary['total_expenses']:,.2f}
- Beneficio Neto: {currency} {summary['net_profit']:,.2f}
- Tasa de Ocupación: {summary['occupancy_rate'] * 100:.1f}%
- Reservas: {summary['reservation_count']}
- Cantidad de Gastos: {summary['expense_count']}

**Discrepancias Encontradas:** {len(discrepancies)}
{json.dumps(discrepancies, indent=2) if discrepancies else "Ninguna"}

Proporciona:
1. Una breve evaluación de la salud financiera
2. Conclusiones clave y tendencias
3. Recomendaciones prácticas (accionables)
4. Cualquier alerta o advertencia"""

    if not settings.OPENAI_API_KEY:
        response_content = (
            "**Mock AI Analysis (Modo Simulado)**\n\n"
            "El Agente de IA está activo pero no se ha configurado una clave de OpenAI. Esta es una simulación basada en tus datos:\n\n"
            "**Análisis de Salud Financiera:**\n"
            f"El ingreso neto es de {currency} {summary['net_income']:,.2f} con una ganancia neta de {currency} {summary['net_profit']:,.2f}. "
            f"La ocupación se encuentra al {summary['occupancy_rate'] * 100:.1f}%.\n\n"
            "**Recomendaciones:**\n"
            "- Verifica los gastos fijos para maximizar la rentabilidad.\n"
            "- Si la ocupación es menor al 50%, considera estrategias de precios dinámicos."
        )
    else:
        llm = ChatOpenAI(
            model=settings.AI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.3,
            max_tokens=1500,
        )
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]
        response = await llm.ainvoke(messages)
        response_content = response.content

    # Extraer alertas de las discrepancias (determinístico, no generado por IA)
    alerts = []
    if discrepancies:
        for d in discrepancies:
            alerts.append(
                f"Discrepancia en la reserva {d['guest_name']}: "
                f"neto esperado {currency} {d['expected_net']:,.2f}, "
                f"actual {currency} {d['actual_net']:,.2f} "
                f"(diferencia: {currency} {d['diff']:,.2f})"
            )

    if summary["occupancy_rate"] < 0.3:
        alerts.append(
            f"Baja tasa de ocupación: {summary['occupancy_rate'] * 100:.1f}%. "
            "Considera ajustar la estrategia de precios."
        )

    if summary["net_profit"] < 0:
        alerts.append(
            f"Beneficio neto negativo: {currency} {summary['net_profit']:,.2f}. "
            "Los gastos superan a los ingresos netos este mes."
        )

    return {
        "summary": response_content,
        "alerts": alerts,
        "data_summary": summary,
    }
