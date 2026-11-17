"""Pruebas unitarias para el endpoint de búsqueda (/api/v1/search)."""

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest

from app.api.v1.routes.search import _normalize_text, search_all
from app.models.property import Property
from app.models.user import User


def test_normalize_text():
    assert _normalize_text("  Bogotá ") == "bogota"
    assert _normalize_text("MEDELLÍN") == "medellin"
    assert _normalize_text("Cancún") == "cancun"
    assert _normalize_text("año") == "ano"


@pytest.mark.asyncio
async def test_search_all_empty_or_short_query():
    mock_db = AsyncMock()
    user = User(id=uuid.uuid4(), email="test@example.com")

    res = await search_all(q=" ", db=mock_db, current_user=user)
    assert res == {"properties": [], "reservations": [], "expenses": []}

    res_short = await search_all(q="a", db=mock_db, current_user=user)
    assert res_short == {"properties": [], "reservations": [], "expenses": []}


@pytest.mark.asyncio
async def test_search_all_executes_queries_with_user_filter():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")

    prop = Property(
        id=uuid.uuid4(),
        owner_id=user_id,
        name="Apartamento Bogotá Centro",
        address="Cra 7 # 12-34",
        city="Bogotá",
        is_active=True,
    )

    # Mock execute results
    mock_scalars_prop = MagicMock()
    mock_scalars_prop.all.return_value = [prop]

    mock_scalars_empty = MagicMock()
    mock_scalars_empty.all.return_value = []

    res_prop = MagicMock()
    res_prop.scalars.return_value = mock_scalars_prop

    res_empty = MagicMock()
    res_empty.scalars.return_value = mock_scalars_empty

    mock_db.execute.side_effect = [res_prop, res_empty, res_empty]

    result = await search_all(q="bogota", db=mock_db, current_user=user)

    assert len(result["properties"]) == 1
    assert result["properties"][0]["name"] == "Apartamento Bogotá Centro"
    assert result["properties"][0]["id"] == str(prop.id)
    assert mock_db.execute.call_count == 3
