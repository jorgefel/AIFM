from datetime import date
from typing import Protocol


class ProviderUnavailableError(Exception):
    """Raised when the scraping provider fails to return valid competitor data."""
    pass


class ProviderConfigurationError(Exception):
    """Raised when the competitor service credentials are missing or invalid."""
    pass


class ProviderTimeoutError(Exception):
    """Raised when the competitor scraping provider exceeds the allotted time."""
    pass


class CompetitorProvider(Protocol):
    async def search(
        self, *, query: str, domain: str, checkin: date, checkout: date, adults: int, fallback_to_city: bool,
    ) -> tuple[list[dict], str]:
        """Return public listings and the geographical level resolved by provider."""
