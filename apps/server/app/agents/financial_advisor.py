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


SYSTEM_PROMPT = """You are a financial advisor for Airbnb property managers.
You analyze monthly financial data and provide actionable insights.

Your role is ADVISORY ONLY — you never modify financial records.

When analyzing data, focus on:
1. Revenue trends and anomalies
2. Expense optimization opportunities
3. Occupancy rate analysis and suggestions
4. Platform fee comparisons
5. Discrepancy alerts (if any are found by the deterministic engine)

Respond in the same language as the user's property data (Spanish if names/descriptions are in Spanish).
Keep your analysis concise but insightful. Use bullet points for clarity.
Include specific numbers from the data to support your insights."""


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

    user_message = f"""Analyze the following monthly financial data for property "{property_name}":

**Monthly Summary ({summary['year']}-{summary['month']:02d}):**
- Gross Income: {currency} {summary['gross_income']:,.2f}
- Platform Fees: {currency} {summary['total_fees']:,.2f}
- Net Income: {currency} {summary['net_income']:,.2f}
- Total Expenses: {currency} {summary['total_expenses']:,.2f}
- Net Profit: {currency} {summary['net_profit']:,.2f}
- Occupancy Rate: {summary['occupancy_rate'] * 100:.1f}%
- Reservations: {summary['reservation_count']}
- Expenses Count: {summary['expense_count']}

**Discrepancies Found:** {len(discrepancies)}
{json.dumps(discrepancies, indent=2) if discrepancies else "None"}

Provide:
1. A brief financial health assessment
2. Key insights and trends
3. Actionable recommendations
4. Any alerts or warnings"""

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

    # Extract alerts from discrepancies (deterministic, not AI-generated)
    alerts = []
    if discrepancies:
        for d in discrepancies:
            alerts.append(
                f"Discrepancy in reservation {d['guest_name']}: "
                f"expected net {currency} {d['expected_net']:,.2f}, "
                f"actual {currency} {d['actual_net']:,.2f} "
                f"(diff: {currency} {d['diff']:,.2f})"
            )

    if summary["occupancy_rate"] < 0.3:
        alerts.append(
            f"Low occupancy rate: {summary['occupancy_rate'] * 100:.1f}%. "
            "Consider adjusting pricing strategy."
        )

    if summary["net_profit"] < 0:
        alerts.append(
            f"Negative net profit: {currency} {summary['net_profit']:,.2f}. "
            "Expenses exceed net income this month."
        )

    return {
        "summary": response_content,
        "alerts": alerts,
        "data_summary": summary,
    }
