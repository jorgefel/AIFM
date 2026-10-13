# ─────────────────────────────────────────────────────────────
# app/core/database.py — Conexión async a PostgreSQL
# Motor: SQLAlchemy 2.x + asyncpg
# ─────────────────────────────────────────────────────────────
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Motor Async ──────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=2,
    pool_pre_ping=True,
)

# ── Session Factory ──────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base Declarativa ─────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class para todos los modelos SQLAlchemy del proyecto."""
    pass


# ── Dependency para inyección en FastAPI ─────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Genera una sesión async por request y la cierra al terminar."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
