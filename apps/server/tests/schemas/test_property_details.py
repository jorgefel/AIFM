import pytest
from pydantic import ValidationError

from app.schemas.property import PropertyCreate, PropertyUpdate


def test_property_create_accepts_a_complete_profile():
    property_in = PropertyCreate(
        name="Casa del Sol",
        address="Cartagena, Colombia",
        currency="COP",
        property_type="house",
        max_guests=6,
        bedrooms=3,
        bathrooms=2,
        nightly_rate=450000,
        amenities=["wifi", "pool"],
        published_platforms=["airbnb", "booking"],
    )

    assert property_in.max_guests == 6
    assert property_in.published_platforms == ["airbnb", "booking"]


def test_property_create_requires_a_published_platform():
    with pytest.raises(ValidationError):
        PropertyCreate(name="Casa", address="Bogotá", published_platforms=[])


def test_property_update_rejects_zero_guests():
    with pytest.raises(ValidationError):
        PropertyUpdate(max_guests=0)
