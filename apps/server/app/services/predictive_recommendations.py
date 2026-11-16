from datetime import date
from typing import List, Dict, Any, Optional

from app.engine.golden_rule import calculate_monthly_summary
from app.services.forecast import generate_property_forecast


def generate_predictive_recommendations(
    property_id: str,
    reservations: List[Dict[str, Any]],
    expenses: List[Dict[str, Any]],
    forecasts: Optional[List[Any]] = None,
    historical_count: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Genera recomendaciones financieras determinísticas basadas estrictamente

    en el histórico propio de la propiedad y sus proyecciones estadísticas (Regla 8 y 10).
    Sin porcentajes inventados ni métricas ficticias.
    """
    today = date.today()
    today_str = today.isoformat()

    # Si no se pasó pronóstico previo, lo calculamos
    if forecasts is None or historical_count is None:
        forecasts, hist_count, _ = generate_property_forecast(
            property_id=property_id,
            reservations=reservations,
            expenses=expenses,
            steps=3,
            return_metadata=True,
        )
        historical_count = hist_count

    # 1. Caso de información insuficiente (< 2 meses o sin reservas)
    confirmed_reservations = [
        r for r in reservations if r.get("status") not in ("cancelled",)
    ]
    if historical_count < 2 or not confirmed_reservations:
        return [
            {
                "id": "rec-insufficient-history",
                "title": "Información histórica insuficiente",
                "action": "Registra tus reservas y gastos recientes o sincroniza tus canales para habilitar proyecciones.",
                "reason": "El sistema cuenta con menos de 2 meses de registros financieros para esta propiedad, por lo que no es posible inferir tendencias confiables.",
                "evidence": [
                    {"label": "Meses registrados", "value": historical_count},
                    {"label": "Reservas registradas", "value": len(confirmed_reservations)},
                ],
                "severity": "info",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        ]

    recommendations: List[Dict[str, Any]] = []

    # 2. Calcular promedio reciente de ingresos de la propiedad (últimos 3 meses históricos)
    # Extraer fechas históricas
    dates = []
    for r in confirmed_reservations:
        if r.get("check_in"):
            d = r["check_in"] if isinstance(r["check_in"], date) else date.fromisoformat(str(r["check_in"]))
            dates.append(d)
    for e in expenses:
        if not e.get("is_deleted", False) and e.get("date"):
            d = e["date"] if isinstance(e["date"], date) else date.fromisoformat(str(e["date"]))
            dates.append(d)

    gross_history = []
    if dates:
        earliest = min(dates)
        cur_y, cur_m = earliest.year, earliest.month
        end_y, end_m = today.year, today.month
        while (cur_y < end_y) or (cur_y == end_y and cur_m <= end_m):
            summary = calculate_monthly_summary(reservations, expenses, cur_y, cur_m)
            gross_history.append(float(summary["gross_income"]))
            cur_m += 1
            if cur_m > 12:
                cur_m = 1
                cur_y += 1

    recent_history = gross_history[-3:] if len(gross_history) >= 3 else gross_history
    avg_recent = (sum(recent_history) / len(recent_history)) if recent_history else 0.0

    next_month = forecasts[0]
    proj_gross = float(next_month.projected_gross_income)
    proj_net = float(next_month.projected_net_profit)

    # 3. Recomendación de Tendencia de Ingresos
    if avg_recent > 0 and proj_gross > avg_recent * 1.05:
        recommendations.append(
            {
                "id": "rec-trend-positive",
                "title": "Demanda e ingresos en tendencia positiva",
                "action": "Mantén la estrategia tarifaria actual o evalúa un incremento selectivo en fechas de alta demanda.",
                "reason": "El ingreso proyectado para el próximo mes supera el promedio de tus meses recientes.",
                "evidence": [
                    {"label": "Promedio reciente", "value": round(avg_recent, 2)},
                    {"label": "Proyección próximo mes", "value": round(proj_gross, 2)},
                ],
                "severity": "info",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )
    elif avg_recent > 0 and proj_gross < avg_recent * 0.95:
        recommendations.append(
            {
                "id": "rec-trend-negative",
                "title": "Alerta de desaceleración de ingresos",
                "action": "Activa promociones de reserva anticipada o ajusta la tarifa base para incentivar la ocupación.",
                "reason": "La proyección del próximo mes se encuentra por debajo del promedio de tus últimos meses.",
                "evidence": [
                    {"label": "Promedio reciente", "value": round(avg_recent, 2)},
                    {"label": "Proyección próximo mes", "value": round(proj_gross, 2)},
                ],
                "severity": "warning",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )
    else:
        recommendations.append(
            {
                "id": "rec-trend-stable",
                "title": "Ingresos proyectados estables",
                "action": "Continúa monitoreando el calendario para detectar ventanas de oportunidad.",
                "reason": "La proyección del próximo mes se mantiene alineada con el promedio histórico reciente.",
                "evidence": [
                    {"label": "Promedio reciente", "value": round(avg_recent, 2)},
                    {"label": "Proyección próximo mes", "value": round(proj_gross, 2)},
                ],
                "severity": "info",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )

    # 4. Recomendación de Margen Neto y Salud Operativa
    if proj_net < 0:
        recommendations.append(
            {
                "id": "rec-margin-negative",
                "title": "Riesgo de margen neto negativo",
                "action": "Audita y recorta gastos operativos no esenciales antes del inicio del próximo mes.",
                "reason": "Los costos y gastos fijos proyectados superan el ingreso estimado, generando una proyección de pérdida neta.",
                "evidence": [
                    {"label": "Ingreso proyectado", "value": round(proj_gross, 2)},
                    {"label": "Beneficio neto proyectado", "value": round(proj_net, 2)},
                ],
                "severity": "critical",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )
    elif proj_gross > 0 and (proj_net / proj_gross) < 0.20:
        recommendations.append(
            {
                "id": "rec-margin-low",
                "title": "Margen neto comprimido",
                "action": "Revisa las comisiones de plataformas y los gastos de limpieza o mantenimiento para proteger la rentabilidad.",
                "reason": "El beneficio neto representa menos del 20% del ingreso bruto proyectado.",
                "evidence": [
                    {"label": "Ingreso proyectado", "value": round(proj_gross, 2)},
                    {"label": "Beneficio neto proyectado", "value": round(proj_net, 2)},
                ],
                "severity": "warning",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )
    elif proj_gross > 0:
        margin_pct = round((proj_net / proj_gross) * 100.0, 1)
        recommendations.append(
            {
                "id": "rec-margin-healthy",
                "title": f"Margen neto proyectado: {margin_pct}%",
                "action": "Continúa optimizando gastos fijos y variables para sostener la rentabilidad operativa.",
                "reason": "La relación entre ingresos proyectados y costos operativos refleja un margen saludable.",
                "evidence": [
                    {"label": "Ingreso proyectado", "value": round(proj_gross, 2)},
                    {"label": "Beneficio neto proyectado", "value": round(proj_net, 2)},
                ],
                "severity": "info",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )

    # 5. Recomendación de Diversificación de Canales
    platforms = {
        r.get("platform") for r in confirmed_reservations if r.get("platform")
    }
    if len(platforms) == 1 and len(confirmed_reservations) >= 3:
        single_plat = list(platforms)[0]
        recommendations.append(
            {
                "id": "rec-single-channel",
                "title": "Concentración en un solo canal",
                "action": "Conecta canales adicionales vía Beds24 para diversificar tus fuentes de reserva.",
                "reason": f"Todas las reservas registradas provienen exclusivamente de {single_plat}.",
                "evidence": [
                    {"label": "Canal exclusivo", "value": single_plat},
                    {"label": "Total reservas", "value": len(confirmed_reservations)},
                ],
                "severity": "info",
                "evidence_source": "own_history",
                "as_of": today_str,
            }
        )

    return recommendations
