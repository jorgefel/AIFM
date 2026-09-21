"""OAuth 2.0 helpers for Google and Sign in with Apple."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
from typing import Any, Literal
from urllib.parse import urlencode

import httpx
import jwt
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token

from app.core.config import settings


GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
APPLE_AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"

OAuthProvider = Literal["google", "apple"]


class OAuthError(Exception):
    """Raised when an OAuth response cannot be safely accepted."""


@dataclass(frozen=True)
class OAuthIdentity:
    provider: OAuthProvider
    provider_id: str
    email: str | None
    full_name: str


def callback_url(provider: OAuthProvider) -> str:
    return f"{settings.OAUTH_REDIRECT_BASE_URL.rstrip('/')}/{provider}/callback"


def create_signed_state(provider: OAuthProvider) -> tuple[str, str]:
    """Create a signed, expiring OAuth state and return it with its nonce."""
    nonce = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    state = jwt.encode(
        {
            "sub": nonce,
            "provider": provider,
            "iat": now,
            "exp": now + timedelta(minutes=10),
            "type": "oauth_state",
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return state, nonce


def verify_signed_state(state: str, provider: OAuthProvider) -> str:
    """Return the nonce only when state is correctly signed and provider-bound."""
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError as error:
        raise OAuthError("The OAuth state token could not be verified.") from error

    nonce = payload.get("sub")
    if (
        payload.get("type") != "oauth_state"
        or payload.get("provider") != provider
        or not isinstance(nonce, str)
    ):
        raise OAuthError("The OAuth state token is invalid.")
    return nonce


def authorization_url(provider: OAuthProvider, state: str) -> str:
    if provider == "google":
        _require_settings("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
        query = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": callback_url("google"),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTHORIZE_URL}?{urlencode(query)}"

    _require_settings("APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY")
    query = {
        "client_id": settings.APPLE_CLIENT_ID,
        "redirect_uri": callback_url("apple"),
        "response_type": "code",
        "response_mode": "form_post",
        "scope": "name email",
        "state": state,
    }
    return f"{APPLE_AUTHORIZE_URL}?{urlencode(query)}"


async def identity_from_code(provider: OAuthProvider, code: str) -> OAuthIdentity:
    if not code:
        raise OAuthError("The OAuth provider did not return an authorization code.")

    if provider == "google":
        return await _google_identity_from_code(code)
    return await _apple_identity_from_code(code)


def _require_settings(*names: str) -> None:
    missing = [name for name in names if not getattr(settings, name).strip()]
    if missing:
        raise OAuthError(f"OAuth provider is not configured: {', '.join(missing)}")


async def _google_identity_from_code(code: str) -> OAuthIdentity:
    _require_settings("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
    token = await _exchange_code(
        GOOGLE_TOKEN_URL,
        {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": callback_url("google"),
            "grant_type": "authorization_code",
        },
    )
    claims = await _verify_google_id_token(token.get("id_token"))
    return _identity_from_claims("google", claims)


async def _apple_identity_from_code(code: str) -> OAuthIdentity:
    _require_settings("APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY")
    token = await _exchange_code(
        APPLE_TOKEN_URL,
        {
            "code": code,
            "client_id": settings.APPLE_CLIENT_ID,
            "client_secret": _apple_client_secret(),
            "redirect_uri": callback_url("apple"),
            "grant_type": "authorization_code",
        },
    )
    claims = await _verify_apple_id_token(
        token.get("id_token"),
        jwks_url=APPLE_JWKS_URL,
        audience=settings.APPLE_CLIENT_ID,
        issuer="https://appleid.apple.com",
    )
    return _identity_from_claims("apple", claims)


async def _exchange_code(url: str, data: dict[str, str]) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, data=data)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise OAuthError("Could not exchange the OAuth authorization code.") from error

    if not isinstance(payload, dict) or not payload.get("id_token"):
        raise OAuthError("The OAuth provider returned an incomplete token response.")
    return payload


async def _verify_google_id_token(id_token: Any) -> dict[str, Any]:
    """Verify Google signature, audience, expiration, and issuer with google-auth."""
    if not isinstance(id_token, str):
        raise OAuthError("Google did not return an identity token.")

    try:
        claims = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            id_token,
            GoogleRequest(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as error:
        raise OAuthError("The Google identity token could not be verified.") from error

    if claims.get("iss") not in {"https://accounts.google.com", "accounts.google.com"}:
        raise OAuthError("The Google identity token has an invalid issuer.")
    return claims


async def _verify_apple_id_token(
    id_token: Any,
    *,
    jwks_url: str,
    audience: str,
    issuer: str | list[str],
) -> dict[str, Any]:
    if not isinstance(id_token, str):
        raise OAuthError("The OAuth provider did not return an identity token.")

    try:
        header = jwt.get_unverified_header(id_token)
        key_id = header["kid"]
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            keys = response.json()["keys"]
        jwk = next(key for key in keys if key["kid"] == key_id)
        public_key = jwt.PyJWK.from_dict(jwk).key
        return jwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            options={"require": ["exp", "iat", "sub"]},
        )
    except (KeyError, StopIteration, httpx.HTTPError, jwt.PyJWTError, ValueError) as error:
        raise OAuthError("The OAuth identity token could not be verified.") from error


def _identity_from_claims(provider: OAuthProvider, claims: dict[str, Any]) -> OAuthIdentity:
    provider_id = claims.get("sub")
    email = claims.get("email")
    email_verified = claims.get("email_verified", False)
    is_verified = email_verified is True or email_verified == "true"

    if not isinstance(provider_id, str):
        raise OAuthError("The OAuth provider did not return a subject identifier.")
    if provider == "google" and (not isinstance(email, str) or not is_verified):
        raise OAuthError("Google did not return a verified email address.")
    if provider == "apple" and isinstance(email, str) and not is_verified:
        raise OAuthError("Apple did not return a verified email address.")

    full_name = claims.get("name")
    if not isinstance(full_name, str) or not full_name.strip():
        if not isinstance(email, str):
            full_name = "Usuario de Apple"
        else:
            full_name = email.split("@", maxsplit=1)[0]

    return OAuthIdentity(
        provider=provider,
        provider_id=provider_id,
        email=email.lower() if isinstance(email, str) else None,
        full_name=full_name[:150],
    )


def _apple_client_secret() -> str:
    private_key = settings.APPLE_PRIVATE_KEY.replace("\\n", "\n")
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "iss": settings.APPLE_TEAM_ID,
            "iat": now,
            "exp": now + timedelta(days=180),
            "aud": "https://appleid.apple.com",
            "sub": settings.APPLE_CLIENT_ID,
        },
        private_key,
        algorithm="ES256",
        headers={"kid": settings.APPLE_KEY_ID},
    )
