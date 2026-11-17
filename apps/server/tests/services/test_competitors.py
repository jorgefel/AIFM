from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services.competitors.service import build_competitor_snapshot, country_domain, get_competitors
from app.services.competitors.omkar import OmkarProvider
from app.services.competitors.provider import ProviderQueryError, ProviderUnavailableError


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

    class MockRedis:
        async def get(self, *args): return None
        async def setex(self, *args, **kwargs): return True

    monkeypatch.setattr("app.services.competitors.omkar.redis_client", MockRedis())
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
async def test_omkar_search_400_at_neighborhood_falls_back_to_city(monkeypatch):
    monkeypatch.setattr("app.services.competitors.omkar.settings.OMKAR_API_KEY", "test-key")

    class MockRedis:
        async def get(self, *args): return None
        async def setex(self, *args, **kwargs): return True

    monkeypatch.setattr("app.services.competitors.omkar.redis_client", MockRedis())

    class FallbackOn400Provider(OmkarProvider):
        def __init__(self):
            self.calls = []

        async def _get(self, client, path, headers, params):
            self.calls.append((path, params))
            if path == "/autocomplete":
                q = params.get("query", "")
                if "Getsemaní" in q:
                    return {"results": [{"full_name": "Getsemaní, Cartagena, Colombia", "google_place_id": "pid_neigh"}]}
                return {"results": [{"full_name": "Cartagena, Colombia", "google_place_id": "pid_city"}]}
            if path == "/search":
                if params.get("place_id") == "pid_neigh":
                    raise ProviderQueryError("airbnb rejected the request: 400 Bad Request")
                return {"results": [{"id": "city_listing_1", "price": {"amount": 250}}]}
            return {}

    provider = FallbackOn400Provider()
    listings, level = await provider.search(
        query="Getsemaní, Cartagena, Colombia",
        domain="airbnb.com.co",
        checkin=date(2026, 11, 9),
        checkout=date(2026, 11, 10),
        adults=2,
        fallback_to_city=True,
        city_query="Cartagena, Colombia",
    )

    assert len(listings) == 1
    assert listings[0]["id"] == "city_listing_1"
    assert level == "city"


@pytest.mark.asyncio
async def test_omkar_search_400_at_both_levels_raises_query_error(monkeypatch):
    monkeypatch.setattr("app.services.competitors.omkar.settings.OMKAR_API_KEY", "test-key")

    class MockRedis:
        async def get(self, *args): return None
        async def setex(self, *args, **kwargs): return True

    monkeypatch.setattr("app.services.competitors.omkar.redis_client", MockRedis())

    class Both400Provider(OmkarProvider):
        async def _get(self, client, path, headers, params):
            if path == "/autocomplete":
                return {"results": [{"full_name": "Some Place", "google_place_id": "pid"}]}
            if path == "/search":
                raise ProviderQueryError("airbnb rejected the request: 400 Bad Request")
            return {}

    provider = Both400Provider()
    with pytest.raises(ProviderQueryError):
        await provider.search(
            query="Getsemaní, Cartagena, Colombia",
            domain="airbnb.com.co",
            checkin=date(2026, 11, 9),
            checkout=date(2026, 11, 10),
            adults=2,
            fallback_to_city=True,
            city_query="Cartagena, Colombia",
        )


@pytest.mark.asyncio
async def test_omkar_search_reuses_cached_place_id(monkeypatch):
    monkeypatch.setattr("app.services.competitors.omkar.settings.OMKAR_API_KEY", "test-key")

    class CachedRedis:
        async def get(self, key):
            import json
            return json.dumps({"full_name": "Cached Cartagena", "place_id": "cached_pid_123"})
        async def setex(self, *args, **kwargs): return True

    monkeypatch.setattr("app.services.competitors.omkar.redis_client", CachedRedis())

    class SpyProvider(OmkarProvider):
        def __init__(self):
            self.calls = []
        async def _get(self, client, path, headers, params):
            self.calls.append((path, params))
            return {"results": [{"id": "cached_listing"}]}

    provider = SpyProvider()
    listings, level = await provider.search(
        query="Cartagena, Colombia",
        domain="airbnb.com.co",
        checkin=date(2026, 11, 9),
        checkout=date(2026, 11, 10),
        adults=2,
        fallback_to_city=False,
    )

    assert len(listings) == 1
    assert listings[0]["id"] == "cached_listing"
    # /autocomplete was NOT called because place_id was cached!
    assert all(c[0] != "/autocomplete" for c in provider.calls)
    assert any(c[0] == "/search" and c[1]["place_id"] == "cached_pid_123" for c in provider.calls)


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


@pytest.mark.asyncio
async def test_omkar_400_with_airbnb_rejection_raises_provider_unavailable():
    import httpx

    provider = OmkarProvider()
    req = httpx.Request("GET", "https://airbnb-scraper-api.omkar.cloud/airbnb/rooms/search")
    resp = httpx.Response(400, request=req, text='{"message": "airbnb rejected the request: 400 Bad Request - Airbnb"}')

    class MockClient:
        async def get(self, *args, **kwargs):
            return resp

    with pytest.raises(ProviderUnavailableError) as exc_info:
        await provider._get(MockClient(), "/search", {}, {})

    assert "Airbnb" in str(exc_info.value)

