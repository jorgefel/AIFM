from datetime import date

import pytest

from app.services.competitors.service import build_competitor_snapshot, country_domain
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
        [{"id": "a", "name": "Casa A", "price": {"amount": "300", "currency": "COP"}, "rating": 4.8, "reviews_count": 10},
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
