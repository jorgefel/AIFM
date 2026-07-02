from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_limiter import FastAPILimiter

from app.core.config import settings
from app.core.redis import redis_client
from app.api.v1.api import api_router
from app.services.storage import UPLOAD_DIR
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await FastAPILimiter.init(redis_client)
    yield
    await redis_client.close()

app = FastAPI(
    title="AIFM API",
    description="Airbnb Intelligent Finance & Management — Backend API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Endpoint de salud — verifica que la API está corriendo."""
    return {
        "status": "ok",
        "service": "aifm-api",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }

app.include_router(api_router, prefix="/api/v1")
