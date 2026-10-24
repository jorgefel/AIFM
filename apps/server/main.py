import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.redis import redis_client
from app.api.v1.api import api_router
from app.services.storage import UPLOAD_DIR
from app.services.demo import run_demo_cleanup_forever
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_task = asyncio.create_task(run_demo_cleanup_forever())
    try:
        yield
    finally:
        cleanup_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task
        try:
            await redis_client.close()
        except Exception:
            pass

app = FastAPI(
    title="Nomora API",
    description="Nomora — Backend API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

cors_kwargs: dict = dict(
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if settings.CORS_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Endpoint de salud — verifica que la API está corriendo."""
    return {
        "status": "ok",
        "service": "nomora-api",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }

app.include_router(api_router, prefix="/api/v1")
