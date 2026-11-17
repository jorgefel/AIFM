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

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_data
    mock_resp.raise_for_status.return_value = None

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
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
