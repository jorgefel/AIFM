from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="AIFM API",
    description="Airbnb Intelligent Finance & Management — Backend API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Endpoint de salud — verifica que la API está corriendo."""
    return {
        "status": "ok",
        "service": "aifm-api",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }


# ── Aquí se registrarán los routers cuando estén listos ──────
# from app.api.v1.routes import reservations, expenses, reports
# app.include_router(reservations.router, prefix="/api/v1")
# app.include_router(expenses.router, prefix="/api/v1")
# app.include_router(reports.router, prefix="/api/v1")
