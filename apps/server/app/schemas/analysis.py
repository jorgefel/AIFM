from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid


class MonthlySummary(BaseModel):
    year: int
    month: int
    gross_income: float
    total_fees: float
    net_income: float
    total_expenses: float
    net_profit: float
    occupancy_rate: float
    reservation_count: int
    expense_count: int


class DashboardData(BaseModel):
    summary: MonthlySummary
    chart_data: list[MonthlySummary]
    recent_activity: list[dict]



class AIInsightRequest(BaseModel):
    property_id: uuid.UUID
    year: int
    month: int


class JobStatus(BaseModel):
    job_id: str
    status: str  # pending | processing | completed | failed
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
