# ─────────────────────────────────────────────────────────────
# app/schemas/dashboard.py — Esquemas para Dashboard Layout
# ─────────────────────────────────────────────────────────────
from typing import Any, List
from pydantic import BaseModel


class DashboardLayoutUpdate(BaseModel):
    """
    Payload esperado para el PUT /dashboard/layout.
    layout_data es el arreglo generado por la librería del frontend.
    """
    layout_data: List[dict[str, Any]]


class DashboardLayoutRead(BaseModel):
    """
    Respuesta para GET y PUT /dashboard/layout.
    """
    layout_data: List[dict[str, Any]]

    class Config:
        from_attributes = True
