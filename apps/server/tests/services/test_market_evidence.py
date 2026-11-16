import json
import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.property import Property
from app.models.market_snapshot import MarketSnapshot
from app.schemas.competitors import CompetitorSnapshot, CompetitorListing, CompetitorAggregates
from app.services.market_evidence import (
    AMENITY_CANONICAL_MAP,
    calculate_market_position,
    get_market_evidence,
    match_equivalent_amenities,
    normalize_amenity_name,
    normalize_comparable,
    record_market_snapshot,
)


def test_missing_data_handling():
    """Tolerancia a datos faltantes: campos None en comparable o propiedad no deben lanzar excepciones."""
    prop = {"max_guests": 2, "nightly_rate": None, "amenities": []}
    comp_missing = {
        "id": "123",
        "title": None,
        "nightly_rate": None,
        "person_capacity": None,
        "bedrooms": None,
        "beds": None,
        "bathrooms": None,
        "rating": None,
        "amenities": None,
    }
    normalized = normalize_comparable(comp_missing, prop)
    assert normalized["nightly_rate"] is None
    assert normalized["normalized_nightly_rate"] is None
    assert normalized["rating_comparison"] is None
    assert normalized["matched_amenities"] == []

    # Posición con datos nulos
    pos = calculate_market_position(None, 100.0)
    assert pos == "indeterminado"
    pos2 = calculate_market_position(100.0, None)
    assert pos2 == "indeterminado"


def test_equivalent_amenities():
    """Prueba normalización y matching de amenidades equivalentes (español/inglés, tildes, sinónimos)."""
    prop_amenities = ["Alberca", "Wi-Fi", "Aire Acondicionado", "Cochera"]
    comp_amenities = ["pool", "wifi", "air conditioning", "parking", "gym"]

    matched = match_equivalent_amenities(prop_amenities, comp_amenities)
    # Deben coincidir pool, wifi, ac, parking
    assert "pool" in matched
    assert "wifi" in matched
    assert "ac" in matched
    assert "parking" in matched
    # gym NO debe estar porque la propiedad no lo tiene
    assert "gym" not in matched

    # Amenidades vacías en propiedad -> no se compara
    assert match_equivalent_amenities([], comp_amenities) == []


def test_comparables_differing_capacity():
    """Prueba normalización cuando el comparable tiene distinta capacidad que la propiedad."""
    prop = {"max_guests": 2, "nightly_rate": 100.0}
    comp_larger = {"id": "comp-1", "nightly_rate": 200.0, "person_capacity": 4}

    normalized = normalize_comparable(comp_larger, prop)
    assert normalized["capacity"] == 4
    assert normalized["capacity_ratio"] == 2.0
    # 200 / 4 huéspedes = 50 por huésped; para 2 huéspedes = 100
    assert normalized["normalized_nightly_rate"] == 100.0


def test_market_position_calculation():
    """Prueba clasificación de posición frente a mediana y percentiles."""
    # En la mediana
    assert calculate_market_position(150.0, 150.0) == "en la mediana"
    # Por encima de la mediana
    assert calculate_market_position(180.0, 150.0, p25=120.0, p75=200.0) == "por encima de la mediana"
    # Por encima de p75 (rango alto)
    assert calculate_market_position(220.0, 150.0, p25=120.0, p75=200.0) == "por encima de la mediana (rango alto)"
    # Por debajo de la mediana
    assert calculate_market_position(130.0, 150.0, p25=120.0, p75=200.0) == "por debajo de la mediana"
    # Por debajo de p25 (rango bajo)
    assert calculate_market_position(100.0, 150.0, p25=120.0, p75=200.0) == "por debajo de la mediana (rango bajo)"


@pytest.mark.asyncio
async def test_redis_hit_and_max_one_get():
    """Verifica lectura exitosa de Redis y que se realice exactamente UN solo GET por mensaje."""
    prop_id = uuid.uuid4()
    mock_db = AsyncMock()

    sample_cached = {
        "fetched_at": "2026-11-16T12:00:00Z",
        "currency": "USD",
        "aggregates": {
            "listing_count": 8,
            "median_nightly_rate": 150.0,
            "p25_nightly_rate": 120.0,
            "p75_nightly_rate": 180.0,
        },
        "listings": [
            {"id": "1", "nightly_rate": 120.0},
            {"id": "2", "nightly_rate": 180.0},
        ],
    }

    prop = MagicMock(spec=Property)
    prop.id = prop_id
    prop.nightly_rate = 140.0
    prop.currency = "USD"

    with patch("app.services.market_evidence.redis_client.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = json.dumps(sample_cached)

        evidence = await get_market_evidence(prop_id, mock_db, prop)

        # Inviolable: máximo un GET hacia Redis
        assert mock_get.call_count == 1
        assert evidence["fecha_consulta"] == "2026-11-16"
        assert evidence["n_comparables"] == 8
        assert evidence["mediana_precio"] == 150.0
        assert evidence["rango"] == {"min": 120.0, "max": 180.0}
        assert evidence["posicion"] == "por debajo de la mediana"


@pytest.mark.asyncio
async def test_redis_failure_or_expired_fallback_to_postgres():
    """Prueba que si Redis falla o la clave expiró, degrada a Postgres sin romper el chat."""
    prop_id = uuid.uuid4()
    mock_db = AsyncMock()

    # Simular snapshot previo en Postgres
    past_snap = MagicMock(spec=MarketSnapshot)
    past_snap.snapshot_date = date(2026, 11, 10)
    past_snap.captured_at = datetime(2026, 11, 10, 15, 30, tzinfo=timezone.utc)

    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = past_snap
    mock_db.execute.return_value = mock_result

    # 1. Clave expirada (retorna None)
    with patch("app.services.market_evidence.redis_client.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None

        evidence = await get_market_evidence(prop_id, mock_db)
        assert mock_get.call_count == 1
        assert evidence["estado"] == "sin_comparacion_vigente"
        assert evidence["ultima_consulta"] == "2026-11-10"

    # 2. Redis caído (lanza excepción)
    with patch("app.services.market_evidence.redis_client.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = ConnectionError("Redis down")

        evidence = await get_market_evidence(prop_id, mock_db)
        assert mock_get.call_count == 1
        assert evidence["estado"] == "sin_comparacion_vigente"
        assert evidence["ultima_consulta"] == "2026-11-10"


@pytest.mark.asyncio
async def test_record_market_snapshot_idempotent():
    """Prueba upsert idempotente de snapshot en base de datos."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    prop = MagicMock(spec=Property)
    prop.id = uuid.uuid4()
    prop.nightly_rate = 120.0
    prop.currency = "MXN"

    now = datetime(2026, 11, 16, 10, 0, tzinfo=timezone.utc)
    snapshot = CompetitorSnapshot(
        fetched_at=now,
        expires_at=now,
        checkin=date(2026, 11, 23),
        checkout=date(2026, 11, 24),
        resolved_level="neighborhood",
        currency="MXN",
        listings=[
            CompetitorListing(id="1", nightly_rate=100.0),
            CompetitorListing(id="2", nightly_rate=140.0),
        ],
        aggregates=CompetitorAggregates(
            listing_count=2,
            median_nightly_rate=120.0,
            average_nightly_rate=120.0,
            p25_nightly_rate=110.0,
            p75_nightly_rate=130.0,
        ),
    )

    # Caso 1: Nuevo snapshot (no existe previo hoy)
    mock_result_none = MagicMock()
    mock_result_none.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_result_none

    snap1 = await record_market_snapshot(mock_db, prop, snapshot)
    assert mock_db.add.called
    assert mock_db.commit.called
    assert snap1.comparables_count == 2
    assert snap1.median_price == 120.0
    assert snap1.position == "en la mediana"

    # Caso 2: Snapshot existente hoy -> actualiza sin duplicar
    existing_snap = MarketSnapshot(
        property_id=prop.id,
        captured_at=now,
        snapshot_date=date(2026, 11, 16),
        comparables_count=1,
        median_price=90.0,
        currency="MXN",
    )
    mock_result_exist = MagicMock()
    mock_result_exist.scalars.return_value.first.return_value = existing_snap
    mock_db.execute.return_value = mock_result_exist

    snap2 = await record_market_snapshot(mock_db, prop, snapshot)
    assert snap2.comparables_count == 2
    assert snap2.median_price == 120.0
