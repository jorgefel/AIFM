import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_rejects_default_secret_key():
    with pytest.raises(ValidationError, match="SECRET_KEY must be overridden"):
        Settings(APP_ENV="production", SECRET_KEY="change-me-in-production")


def test_production_accepts_overridden_secret_key():
    settings = Settings(APP_ENV="production", SECRET_KEY="a-safe-production-secret")

    assert settings.SECRET_KEY == "a-safe-production-secret"
