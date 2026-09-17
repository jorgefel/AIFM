import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, settings
from app.core.redis import redis_client
from app.core.dependencies import verify_refresh_token
from app.core.oauth import (
    OAuthError,
    OAuthIdentity,
    OAuthProvider,
    authorization_url,
    create_signed_state,
    identity_from_code,
    verify_signed_state,
)
from app.models.user import User
from app.schemas.auth import LoginPayload, RegisterPayload

router = APIRouter(prefix="/auth", tags=["auth"])
OAUTH_STATE_COOKIE = "oauth_state"
OAUTH_STATE_MAX_AGE_SECONDS = 600

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None):
    is_secure = settings.APP_ENV == "production"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_secure,
            samesite="none",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
    response.set_cookie(
        key="session_hint",
        value="1",
        httponly=False,
        secure=is_secure,
        samesite="none",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )


def _frontend_callback_url() -> str:
    if not settings.CORS_ORIGINS:
        raise HTTPException(status_code=500, detail="No frontend origin is configured.")
    return f"{settings.CORS_ORIGINS[0].rstrip('/')}/auth/callback"


async def _oauth_state_response(provider: OAuthProvider) -> RedirectResponse:
    state, nonce = create_signed_state(provider)
    try:
        provider_url = authorization_url(provider, state)
    except OAuthError as error:
        raise HTTPException(status_code=503, detail="OAuth provider is not configured.") from error

    try:
        await redis_client.setex(f"oauth_state:{nonce}", OAUTH_STATE_MAX_AGE_SECONDS, state)
    except Exception as error:
        raise HTTPException(status_code=503, detail="OAuth state storage is unavailable.") from error

    response = RedirectResponse(provider_url, status_code=302)
    response.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=settings.APP_ENV == "production",
        # Apple posts its callback from appleid.apple.com; SameSite=Lax would
        # omit the state cookie on that cross-site POST.
        samesite="none",
        max_age=OAUTH_STATE_MAX_AGE_SECONDS,
        path="/api/v1/auth",
    )
    return response


async def _get_or_create_oauth_user(identity: OAuthIdentity, db: AsyncSession) -> User:
    provider_column = User.google_id if identity.provider == "google" else User.apple_id
    result = await db.execute(select(User).where(provider_column == identity.provider_id))
    user = result.scalars().first()

    if user is None and identity.email:
        result = await db.execute(select(User).where(User.email == identity.email))
        user = result.scalars().first()

    if user is None:
        if not identity.email:
            raise HTTPException(
                status_code=400,
                detail="Apple did not return an email address for a new account.",
            )
        # OAuth accounts authenticate only through their verified provider identity.
        user = User(
            email=identity.email,
            full_name=identity.full_name,
            hashed_password=None,
            auth_provider=identity.provider,
        )
        db.add(user)

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if identity.provider == "google":
        user.google_id = identity.provider_id
    else:
        user.apple_id = identity.provider_id

    await db.commit()
    await db.refresh(user)
    return user


async def _complete_oauth_callback(
    provider: OAuthProvider,
    code: str | None,
    state: str | None,
    request: Request,
    db: AsyncSession,
) -> RedirectResponse:
    cookie_state = request.cookies.get(OAUTH_STATE_COOKIE)
    if not state or not cookie_state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    try:
        nonce = verify_signed_state(state, provider)
        stored_state = await redis_client.get(f"oauth_state:{nonce}")
        if stored_state:
            await redis_client.delete(f"oauth_state:{nonce}")
    except OAuthError as error:
        raise HTTPException(status_code=400, detail="Invalid OAuth state.") from error
    except Exception as error:
        raise HTTPException(status_code=503, detail="OAuth state storage is unavailable.") from error

    if not stored_state or not hmac.compare_digest(state, stored_state):
        raise HTTPException(status_code=400, detail="Expired or already used OAuth state.")

    try:
        identity = await identity_from_code(provider, code or "")
    except OAuthError as error:
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(error)}") from error

    user = await _get_or_create_oauth_user(identity, db)
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    response = RedirectResponse(_frontend_callback_url(), status_code=303)
    _set_auth_cookies(response, access_token, refresh_token)
    response.delete_cookie(OAUTH_STATE_COOKIE, path="/api/v1/auth")
    return response


@router.get("/google", response_class=RedirectResponse, status_code=302)
async def google_login() -> RedirectResponse:
    """Start Google OAuth 2.0 authorization."""
    return await _oauth_state_response("google")


@router.get(
    "/google/callback",
    response_class=RedirectResponse,
    status_code=303,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Verify Google's callback, set Nomora session cookies, and redirect to the web app."""
    return await _complete_oauth_callback("google", code, state, request, db)


@router.get("/apple", response_class=RedirectResponse, status_code=302)
async def apple_login() -> RedirectResponse:
    """Start Sign in with Apple authorization."""
    return await _oauth_state_response("apple")


@router.api_route(
    "/apple/callback",
    methods=["GET", "POST"],
    response_class=RedirectResponse,
    status_code=303,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def apple_callback(request: Request, db: AsyncSession = Depends(get_db)) -> RedirectResponse:
    """Handle Apple's GET callback and its standard form_post callback."""
    if request.method == "POST":
        params = await request.form()
    else:
        params = request.query_params
    code = params.get("code")
    state = params.get("state")

    return await _complete_oauth_callback(
        "apple",
        code if isinstance(code, str) else None,
        state if isinstance(state, str) else None,
        request,
        db,
    )


@router.post("/register", status_code=201)
async def register(payload: RegisterPayload, response: Response, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-login after registration
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    _set_auth_cookies(response, access_token, refresh_token)
    return {"message": "Registration successful"}

@router.post("/login", dependencies=[Depends(RateLimiter(times=5, minutes=1))])
async def login(payload: LoginPayload, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    _set_auth_cookies(response, access_token, refresh_token)
    return {"message": "Login successful"}

@router.post("/refresh")
async def refresh_token(response: Response, user_id: str = Depends(verify_refresh_token)):
    access_token = create_access_token(subject=user_id)
    
    _set_auth_cookies(response, access_token)
    
    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        # Add to blacklist for the duration of the refresh token
        expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        await redis_client.setex(f"blacklist:{refresh_token}", expires_in, "true")
        
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.delete_cookie("session_hint")
    
    return {"message": "Logout successful"}
