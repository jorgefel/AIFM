from datetime import date
from typing import Literal, Optional, List, Union
import uuid
from pydantic import BaseModel, Field


class RecommendationEvidence(BaseModel):
    label: str
    value: Union[str, float, int]


class PredictiveRecommendation(BaseModel):
    id: str
    title: str
    action: str
    reason: str
    evidence: List[RecommendationEvidence]
    severity: Literal["info", "warning", "critical"]
    evidence_source: Literal["own_history", "market", "both"]
    as_of: str


class MonthForecast(BaseModel):
    month: str = Field(description="Año y mes proyectado en formato YYYY-MM")
    projected_gross_income: float = Field(ge=0, description="Ingreso bruto estimado")
    gross_income_min: float = Field(ge=0, description="Límite inferior estimado para ingreso bruto")
    gross_income_max: float = Field(ge=0, description="Límite superior estimado para ingreso bruto")
    projected_net_profit: float = Field(description="Beneficio neto estimado")
    net_profit_min: float = Field(description="Límite inferior estimado para beneficio neto")
    net_profit_max: float = Field(description="Límite superior estimado para beneficio neto")
    confidence_level: Literal["limited", "medium", "high"] = Field(
        default="medium",
        description="Nivel de confianza cualitativo (limited | medium | high)"
    )
    confidence_score: float = Field(
        default=0.80,
        description="Nivel de confianza numérico del intervalo estadístico"
    )
    model_used: str = Field(description="Modelo matemático empleado (moving_average | holt | holt_winters)")
    is_forecast: bool = Field(default=True, description="Indica explícitamente que es una estimación")
    projected_reservations: Optional[int] = Field(
        default=None, description="Número de reservas proyectadas para el mes"
    )
    booked_reservations: Optional[int] = Field(
        default=None, description="Reservas ya confirmadas en libros para el mes"
    )


class PropertyForecastResponse(BaseModel):
    kind: Literal["financial_forecast"] = "financial_forecast"
    period: str = Field(default="month", description="Periodicidad del pronóstico")
    property_id: uuid.UUID
    property_name: str
    currency: str
    historical_months_count: int
    confidence_level: Literal["limited", "medium", "high"] = Field(
        default="limited",
        description="Nivel de confianza global (limited | medium | high)"
    )
    model: Literal["moving_average", "holt", "holt_winters"] = Field(
        default="moving_average",
        description="Modelo estadístico aplicado principal"
    )
    months_of_history: int = Field(default=0, description="Cantidad de meses históricos evaluados")
    central: Optional[float] = Field(default=None, description="Valor proyectado central del próximo mes")
    min: Optional[float] = Field(default=None, description="Límite inferior proyectado del próximo mes")
    max: Optional[float] = Field(default=None, description="Límite superior proyectado del próximo mes")
    backtest_mape: Optional[float] = Field(default=None, description="Error porcentual absoluto medio histórico en backtest")
    as_of: date = Field(default_factory=date.today, description="Fecha de corte del cálculo")
    forecasts: List[MonthForecast]
    recommendations: List[PredictiveRecommendation] = Field(
        default_factory=list,
        description="Recomendaciones determinísticas basadas en la evidencia histórica y proyectada"
    )
    disclaimer: str = (
        "Pronóstico estadístico preventivo basado en series temporales históricas. "
        "No modifica registros contables reales."
    )
