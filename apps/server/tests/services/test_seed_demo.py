"""Pruebas unitarias para el script de sembrado de datos demo (seed_demo.py)."""

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.models.property import Property
from app.models.user import User
from scripts.seed_demo import (
    _get_season_multiplier,
    _month_year_sub,
    seed_demo_data,
)


def test_month_year_sub():
    # 1 mes atrás de marzo 2026 -> febrero 2026
    assert _month_year_sub(2026, 3, 1) == (2026, 2)
    # 3 meses atrás de febrero 2026 -> noviembre 2025
    assert _month_year_sub(2026, 2, 3) == (2025, 11)
    # 24 meses atrás de noviembre 2026 -> noviembre 2024
    assert _month_year_sub(2026, 11, 24) == (2024, 11)


def test_season_multiplier():
    # Temporada alta
    assert _get_season_multiplier(12) == 1.45
    assert _get_season_multiplier(1) == 1.45
    assert _get_season_multiplier(7) == 1.35
    # Temporada baja
    assert _get_season_multiplier(2) == 0.85
    assert _get_season_multiplier(5) == 0.85
    # Temporada media
    assert _get_season_multiplier(11) == 1.10


@pytest.mark.asyncio
async def test_seed_demo_idempotent_skip():
    """Si la propiedad ya tiene 24 o más reservas, no duplica y retorna status skipped."""
    mock_db = AsyncMock()
    mock_user = User(id=uuid.uuid4(), email="demo-analitica@nomora.app", full_name="Demo", tier="pro")
    mock_prop = Property(id=uuid.uuid4(), name="Apartamento Vista Mar - Bocagrande", owner_id=mock_user.id)

    # user result
    user_res = MagicMock()
    user_res.scalar_one_or_none.return_value = mock_user

    # prop result
    prop_res = MagicMock()
    prop_res.scalar_one_or_none.return_value = mock_prop

    mock_db.execute.side_effect = [user_res, prop_res]
    mock_db.scalar.return_value = 45  # Ya tiene 45 reservas

    res = await seed_demo_data(mock_db)

    assert res["status"] == "skipped"
    assert res["reservations_count"] == 45
    assert mock_db.commit.call_count == 0


@pytest.mark.asyncio
async def test_seed_demo_generates_24_months():
    """Genera 24 meses de reservas y gastos si la propiedad es nueva."""
    mock_db = AsyncMock()
    mock_user = User(id=uuid.uuid4(), email="demo-analitica@nomora.app", full_name="Demo", tier="pro")
    mock_prop = Property(id=uuid.uuid4(), name="Apartamento Vista Mar - Bocagrande", owner_id=mock_user.id)

    user_res = MagicMock()
    user_res.scalar_one_or_none.return_value = mock_user

    prop_res = MagicMock()
    prop_res.scalar_one_or_none.return_value = mock_prop

    mock_db.execute.side_effect = [user_res, prop_res]
    mock_db.scalar.return_value = 0  # 0 reservas

    mock_db.add_all = MagicMock()

    res = await seed_demo_data(mock_db, ref_year=2026, ref_month=11)

    assert res["status"] == "seeded"
    assert res["reservations_count"] > 24
    assert res["expenses_count"] > 24
    assert mock_db.commit.call_count == 1
    assert mock_db.add_all.call_count == 2  # Una para reservas, una para gastos
