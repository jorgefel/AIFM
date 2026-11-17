"""Pruebas unitarias para ApifyProvider y resolución de proveedores."""

from datetime import date
from unittest.mock import AsyncMock, patch
import pytest

from app.services.competitors.apify import ApifyProvider
from app.services.competitors.provider import (
    ProviderConfigurationError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.services.competitors.service import get_default_provider


def test_get_default_provider_picks_apify_when_token_present(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.APIFY_TOKEN", "apify_token_123")
    monkeypatch.setattr("app.core.config.settings.OMKAR_API_KEY", "")
    provider = get_default_provider()
    assert isinstance(provider, ApifyProvider)


def test_get_default_provider_falls_back_to_omkar(monkeypatch):
    from app.services.competitors.omkar import OmkarProvider

    monkeypatch.setattr("app.core.config.settings.APIFY_TOKEN", "")
    monkeypatch.setattr("app.core.config.settings.APIFY_API_KEY", "")
    monkeypatch.setattr("app.core.config.settings.OMKAR_API_KEY", "omkar_key_123")
    provider = get_default_provider()
    assert isinstance(provider, OmkarProvider)


def test_get_default_provider_raises_when_no_credentials(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.APIFY_TOKEN", "")
    monkeypatch.setattr("app.core.config.settings.APIFY_API_KEY", "")
    monkeypatch.setattr("app.core.config.settings.OMKAR_API_KEY", "")
    with pytest.raises(ProviderConfigurationError):
        get_default_provider()


@pytest.mark.asyncio
async def test_apify_provider_search_success():
    from unittest.mock import MagicMock

    provider = ApifyProvider(token="test_token")
    mock_data = [
        {
            "id": "1001",
            "name": "Vista al Mar Cartagena",
            "pricing": {"rate": 250000, "currency": "COP"},
            "rating": 4.9,
            "reviewsCount": 15,
            "bedrooms": 2,
            "bathrooms": 2,
            "beds": 3,
            "isSuperhost": True,
            "images": ["https://images.example/1001.jpg"],
        }
    ]

    mock_run_resp = MagicMock()
    mock_run_resp.status_code = 201
    mock_run_resp.json.return_value = {"data": {"defaultDatasetId": "ds_123"}}
    mock_run_resp.raise_for_status.return_value = None

    mock_ds_resp = MagicMock()
    mock_ds_resp.status_code = 200
    mock_ds_resp.json.return_value = mock_data
    mock_ds_resp.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_post.return_value = mock_run_resp
        mock_get.return_value = mock_ds_resp
        listings, level = await provider.search(
            query="Bocagrande, Cartagena, Colombia",
            domain="airbnb.com.co",
            checkin=date(2026, 12, 1),
            checkout=date(2026, 12, 2),
            adults=2,
            fallback_to_city=True,
        )

    assert len(listings) == 1
    assert listings[0]["id"] == "1001"
    assert listings[0]["name"] == "Vista al Mar Cartagena"
    assert listings[0]["price"]["amount"] == 250000
    assert listings[0]["is_superhost"] is True
    assert level == "neighborhood"


@pytest.mark.asyncio
async def test_apify_provider_extracts_capacity_from_subdescription():
    from unittest.mock import MagicMock

    provider = ApifyProvider(token="test_token")
    mock_data = [
        {
            "id": "2002",
            "name": "Apartamento Bocagrande",
            "pricing": {"price": 320000},
            "subDescription": {
                "items": ["4 huéspedes", "2 habitaciones", "3 camas", "1.5 baños"]
            },
        },
        {
            "id": "2003",
            "name": "Habitación privada en Manga",
            "roomType": "Private room in home",
            "subDescription": {
                "items": ["1 queen bed", "Private attached bathroom"]
            },
        },
    ]

    mock_run_resp = MagicMock()
    mock_run_resp.status_code = 201
    mock_run_resp.json.return_value = {"data": {"defaultDatasetId": "ds_456"}}
    mock_run_resp.raise_for_status.return_value = None

    mock_ds_resp = MagicMock()
    mock_ds_resp.status_code = 200
    mock_ds_resp.json.return_value = mock_data
    mock_ds_resp.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_post.return_value = mock_run_resp
        mock_get.return_value = mock_ds_resp
        listings, _ = await provider.search(
            query="Cartagena, Colombia",
            domain="airbnb.com.co",
            checkin=date(2026, 12, 1),
            checkout=date(2026, 12, 2),
            adults=2,
            fallback_to_city=False,
            currency="COP",
        )

        # Verificar que el payload mandó "currency": "COP"
        called_payload = mock_post.call_args[1]["json"]
        assert called_payload["currency"] == "COP"

    assert len(listings) == 2
    assert listings[0]["bedrooms"] == 2
    assert listings[0]["beds"] == 3
    assert listings[0]["bathrooms"] == 1.5
    assert listings[0]["price"]["currency"] == "COP"

    # Habitación privada: 1 dormitorio, 1 cama, 1 baño
    assert listings[1]["bedrooms"] == 1
    assert listings[1]["beds"] == 1
    assert listings[1]["bathrooms"] == 1.0

