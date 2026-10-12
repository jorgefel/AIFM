from pydantic import BaseModel, Field
import uuid

class MonthForecast(BaseModel):
    month: str = Field(description="Año y mes proyectado en formato YYYY-MM")
    projected_gross_income: float = Field(ge=0, description="Ingreso bruto estimado")
    gross_income_min: float = Field(ge=0, description="Límite inferior estimado para ingreso bruto")
    gross_income_max: float = Field(ge=0, description="Límite superior estimado para ingreso bruto")
    projected_net_profit: float = Field(description="Beneficio neto estimado")
    net_profit_min: float = Field(description="Límite inferior estimado para beneficio neto")
    net_profit_max: float = Field(description="Límite superior estimado para beneficio neto")
    confidence_level: float = Field(default=0.80, description="Nivel de confianza del intervalo")
    model_used: str = Field(description="Modelo matemático empleado (holt_winters | holt_linear | moving_average)")
    is_forecast: bool = Field(default=True, description="Indica explícitamente que es una estimación")

class PropertyForecastResponse(BaseModel):
    property_id: uuid.UUID
    property_name: str
    currency: str
    historical_months_count: int
    forecasts: list[MonthForecast]
    disclaimer: str = "Estimaciones preventivas basadas en series temporales históricas. No modifican registros contables reales."
