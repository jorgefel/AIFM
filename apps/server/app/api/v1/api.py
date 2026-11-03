from fastapi import APIRouter
from app.api.v1.routes import (
    auth, users, properties, reservations, expenses, analysis, jobs, search, export, dashboard, billing, integrations, predictions, competitors
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(properties.router)
api_router.include_router(competitors.router)
api_router.include_router(reservations.router)
api_router.include_router(expenses.router)
api_router.include_router(analysis.router)
api_router.include_router(predictions.router)
api_router.include_router(jobs.router)
api_router.include_router(search.router)
api_router.include_router(export.router)
api_router.include_router(dashboard.router)
api_router.include_router(billing.router)
api_router.include_router(integrations.router)
