from app.services.market_comparison import build_snapshot, normalize_listing


def test_normalize_listing_uses_public_reviews_not_reservations():
    listing = normalize_listing(
        {
            "id": "42",
            "title": "Casa vecina",
            "url": "https://www.airbnb.com/rooms/42",
            "price": {"amount": 125},
            "rating": {"guestSatisfaction": 4.8, "reviewsCount": 37},
            "personCapacity": 4,
        },
        "COP",
    )

    assert listing is not None
    assert listing.public_review_count == 37
    assert listing.nightly_rate == 125
    assert "reservation" not in listing.model_dump()


def test_snapshot_discards_malformed_listings_and_calculates_median():
    snapshot = build_snapshot(
        [
            {"id": "one", "price": 100, "rating": {"reviewsCount": 2}},
            {"id": "two", "price": 200, "rating": {"reviewsCount": 8}},
            {"title": "missing id", "price": 300},
        ],
        "USD",
    )

    assert snapshot.status == "READY"
    assert snapshot.aggregates is not None
    assert snapshot.aggregates.listing_count == 2
    assert snapshot.aggregates.median_nightly_rate == 150
    assert snapshot.aggregates.median_public_review_count == 5
