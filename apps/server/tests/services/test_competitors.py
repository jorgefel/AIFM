from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services.competitors.service import build_competitor_snapshot, country_domain, get_competitors
from app.services.competitors.omkar import OmkarProvider


class FakeOmkarProvider(OmkarProvider):
    def __init__(self):
        self.calls: list[tuple[str, dict]] = []

    async def _get(self, client, path, headers, params):
        self.calls.append((path, params))
        if path == "/autocomplete" and len([call for call in self.calls if call[0] == path]) == 1:
            return {"results": []}
        if path == "/autocomplete":
            return {"results": [{"full_name": "Cartagena, Colombia", "google_place_id": "place"}]}
        return {"results": [{"id": "listing"}]}


def test_country_domain_uses_colombian_domain_and_default():
    assert country_domain("Colombia") == "airbnb.com.co"
    assert country_domain("México") == "airbnb.com"
    assert country_domain("Panamá") == "airbnb.com"
    assert country_domain("Unknown") == "airbnb.com"


def test_snapshot_calculates_nightly_prices_and_statistics():
    snapshot = build_competitor_snapshot(
        [{"id": "a", "name": "Casa A", "price": {"amount": "300", "currency": "COP"}, "rating": 4.8, "reviews_count": 10, "images": ["https://images.example/casa-a.jpg"]},
         {"id": "b", "name": "Casa B", "price": {"amount": 500, "currency": "COP"}, "rating": 4.6, "reviews_count": 20},
         {"name": "invalida"}],
        stay_nights=2,
        currency="COP",
        resolved_level="neighborhood",
    )

    assert snapshot.aggregates.listing_count == 2
    assert snapshot.aggregates.median_nightly_rate == 200
    assert snapshot.aggregates.average_nightly_rate == 200
    assert snapshot.aggregates.p25_nightly_rate == 175
    assert snapshot.aggregates.p75_nightly_rate == 225
    assert snapshot.resolved_level == "neighborhood"
    assert snapshot.listings[0].image_url == "https://images.example/casa-a.jpg"


@pytest.mark.asyncio
async def test_omkar_falls_back_to_city_only_when_enabled(monkeypatch):
    monkeypatch.setattr("app.services.competitors.omkar.settings.OMKAR_API_KEY", "test-key")
    provider = FakeOmkarProvider()

    listings, level = await provider.search(
        query="Getsemaní, Cartagena, Colombia", domain="airbnb.com.co",
        checkin=date(2026, 11, 9), checkout=date(2026, 11, 10),
        adults=2, fallback_to_city=True,
    )

    assert listings == [{"id": "listing"}]
    assert level == "city"
    assert provider.calls[1][1]["query"] == "Cartagena, Colombia"
    assert provider.calls[-1][1]["adults"] == 2


@pytest.mark.asyncio
async def test_force_refresh_ignores_a_cached_snapshot(monkeypatch):
    cached = build_competitor_snapshot([], stay_nights=1, currency="COP", resolved_level="neighborhood")

    class Cache:
        async def get(self, key): return cached.model_dump_json()
        async def set(self, *args, **kwargs): return True
        async def setex(self, *args, **kwargs): return True
        async def delete(self, *args, **kwargs): return 1

    class Provider:
        async def search(self, **kwargs): return ([{"id": "fresh"}], "neighborhood")

    monkeypatch.setattr("app.services.competitors.service.redis_client", Cache())
    property_ = SimpleNamespace(id=uuid4(), country="Colombia", city="Cartagena", neighborhood="Getsemaní", currency="COP", max_guests=2)

    snapshot = await get_competitors(property_, force=True, provider=Provider())

    assert snapshot.aggregates.listing_count == 1
