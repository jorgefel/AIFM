# ─────────────────────────────────────────────────────────────
# tests/conftest.py — Configuración de tests con BD transaccional
# Cada test corre en una transacción que se revierte al finalizar.
# ─────────────────────────────────────────────────────────────
import asyncio
import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.database import Base

# Importar todos los modelos para que Base.metadata los registre
import app.models  # noqa: F401


@pytest.fixture(scope="session")
def event_loop():
    """Crea un event loop compartido para todos los tests async."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Motor async exclusivo para pruebas de integración.

    Las pruebas crean y destruyen las tablas registradas por SQLAlchemy; por esa
    razón nunca deben usar la base de datos de desarrollo por defecto.
    """
    test_database_url = os.getenv("TEST_DATABASE_URL")
    if not test_database_url:
        pytest.skip(
            "TEST_DATABASE_URL is required for database integration tests. "
            "Use a disposable PostgreSQL database such as nomora_test."
        )

    engine = create_async_engine(
        test_database_url,
        echo=False,
        pool_pre_ping=True,
        poolclass=NullPool,
    )

    # Crear todas las tablas al inicio de la sesión de tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Limpiar tablas al finalizar todos los tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Provee una sesión transaccional por test.
    Cada test opera dentro de un SAVEPOINT que se revierte al terminar,
    evitando contaminación entre tests.
    """
    async with test_engine.connect() as conn:
        # Iniciar una transacción exterior
        trans = await conn.begin()

        # Crear sesión vinculada a esta conexión
        session_factory = async_sessionmaker(
            bind=conn,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async with session_factory() as session:
            # Usar un SAVEPOINT anidado para cada test
            nested = await conn.begin_nested()
            yield session

        # Revertir la transacción completa (deshace todo lo del test)
        await trans.rollback()
