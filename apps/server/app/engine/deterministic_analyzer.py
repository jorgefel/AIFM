# ─────────────────────────────────────────────────────────────
# app/engine/deterministic_analyzer.py — Motor Analítico Determinístico
#
# Genera insights, alertas y un score de salud financiera 
# basándose en heurísticas y reglas estrictas, sin costo de IA.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from decimal import Decimal
from typing import TypedDict


class AnalysisInput(TypedDict):
    monthly_summary: dict
    discrepancies: list[dict]
    property_name: str
    currency: str


def calculate_health_score(summary: dict) -> int:
    """
    Calcula un score de salud financiera (0-100).
    Basado en ocupación (40%), margen neto (40%), y ratio de gastos (20%).
    """
    score = 0
    
    # 1. Ocupación (hasta 40 puntos)
    # Ideal: > 70%
    occ = summary["occupancy_rate"]
    if occ >= 0.7:
        score += 40
    else:
        score += int((occ / 0.7) * 40)
        
    # 2. Margen Neto (hasta 40 puntos)
    # Ideal: > 40% del gross_income
    gross = summary["gross_income"]
    net_profit = summary["net_profit"]
    
    if gross > 0:
        margin = net_profit / gross
        if margin >= 0.4:
            score += 40
        elif margin > 0:
            score += int((margin / 0.4) * 40)
            
    # 3. Ratio de Gastos sobre Ingresos (hasta 20 puntos)
    # Ideal: < 30% del gross_income
    expenses = summary["total_expenses"]
    if gross > 0:
        exp_ratio = expenses / gross
        if exp_ratio <= 0.3:
            score += 20
        elif exp_ratio < 1.0:
            # Penalidad lineal entre 30% y 100% de exp_ratio
            score += int(20 * (1.0 - ((exp_ratio - 0.3) / 0.7)))
    else:
        # Si no hay ingresos pero no hay gastos, 20 puntos. Si hay gastos, 0.
        if expenses == 0:
            score += 20
            
    return max(0, min(100, score))


def generate_alerts(summary: dict, discrepancies: list[dict], currency: str) -> list[dict]:
    """Genera alertas basadas en reglas."""
    alerts = []
    
    # Discrepancias son de alta severidad
    for d in discrepancies:
        alerts.append({
            "severity": "high",
            "message": f"Discrepancia en reserva de {d['guest_name']}: diferencia de {currency} {d['diff']:,.2f} detectada entre esperado y real."
        })
        
    # Rentabilidad negativa
    if summary["net_profit"] < 0:
        alerts.append({
            "severity": "high",
            "message": f"Pérdida mensual detectada. Los gastos superan los ingresos por {currency} {abs(summary['net_profit']):,.2f}."
        })
        
    # Baja ocupación
    if summary["occupancy_rate"] > 0 and summary["occupancy_rate"] < 0.3:
        alerts.append({
            "severity": "medium",
            "message": f"Baja ocupación ({summary['occupancy_rate']*100:.1f}%). Revisa tu estrategia de precios."
        })
        
    return alerts


def generate_insights(summary: dict, currency: str) -> str:
    """Genera un resumen en texto de la situación actual."""
    gross = summary["gross_income"]
    profit = summary["net_profit"]
    occ = summary["occupancy_rate"] * 100
    
    if gross == 0:
        return "No se registraron ingresos en este período. Registra reservas para ver un análisis detallado."
        
    if profit > 0:
        if occ >= 70:
            return f"Excelente mes. Has logrado una alta ocupación ({occ:.1f}%) con una ganancia neta positiva de {currency} {profit:,.2f}. Mantén la estrategia actual."
        elif occ >= 40:
            return f"Mes estable. La ganancia neta es de {currency} {profit:,.2f} con ocupación moderada ({occ:.1f}%). Hay espacio para maximizar ingresos ajustando precios."
        else:
            return f"Rentable pero con baja ocupación ({occ:.1f}%). Estás ganando {currency} {profit:,.2f}, lo cual indica márgenes altos. Podrías bajar ligeramente precios para aumentar ocupación y ganancias totales."
    else:
        return f"Mes con desafíos. Aunque tienes {occ:.1f}% de ocupación, los gastos superan los ingresos. Revisa detenidamente la estructura de costos operativos."


def generate_recommendations(summary: dict) -> list[str]:
    """Recomendaciones basadas en heurísticas."""
    recs = []
    gross = summary["gross_income"]
    
    if gross == 0:
        recs.append("Asegúrate de registrar todas tus reservas del mes.")
        recs.append("Verifica si tus calendarios en plataformas están sincronizados.")
        return recs
        
    expenses = summary["total_expenses"]
    exp_ratio = expenses / gross
    
    if exp_ratio > 0.4:
        recs.append("Tus gastos operativos superan el 40% de los ingresos. Revisa contratos de limpieza o mantenimiento.")
        
    if summary["occupancy_rate"] < 0.5:
        recs.append("Considera aplicar descuentos por estancias largas (semanales/mensuales) para asegurar días ocupados.")
        
    if summary["total_fees"] / gross > 0.18:
        recs.append("Las comisiones de plataforma son altas. Incentiva reservaciones directas de huéspedes recurrentes.")
        
    if not recs:
        recs.append("Tus métricas están dentro de los rangos ideales. ¡Sigue así!")
        
    return recs


def generate_deterministic_analysis(input_data: AnalysisInput) -> dict:
    """
    Ejecuta el análisis determinístico completo.
    """
    summary = input_data["monthly_summary"]
    discrepancies = input_data["discrepancies"]
    currency = input_data["currency"]
    
    score = calculate_health_score(summary)
    alerts = generate_alerts(summary, discrepancies, currency)
    insights = generate_insights(summary, currency)
    recs = generate_recommendations(summary)
    
    return {
        "summary": insights,
        "health_score": score,
        "alerts": alerts,
        "recommendations": recs,
        "data_summary": summary,
        "type": "deterministic"
    }
