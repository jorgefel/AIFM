from datetime import date
from typing import Protocol


class ProviderError(Exception):
    """Base error for competitor providers."""
    pass


class ProviderUnavailableError(ProviderError):
    """Raised when the scraping provider fails (5xx, network error)."""
    pass


class ProviderConfigurationError(ProviderError):
    """Raised when the competitor service credentials are missing or invalid (401/403)."""
    pass


class ProviderTimeoutError(ProviderError):
    """Raised when the competitor scraping provider exceeds the allotted time."""
    pass


class ProviderQueryError(ProviderError):
    """Raised when the upstream provider rejects the query parameters (HTTP 400)."""
    pass


class ProviderRateLimitError(ProviderError):
    """Raised when the provider's rate limit or quota is exhausted (HTTP 429)."""
    pass


class CompetitorProvider(Protocol):
    async def search(
        self,
        *,
        query: str,
        domain: str,
        checkin: date,
        checkout: date,
        adults: int,
        fallback_to_city: bool,
        city_query: str | None = None,
    ) -> tuple[list[dict], str]:
        """Return public listings and the geographical level resolved by provider."""
