"""Stripe checkout, billing status and verified webhook endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.subscription import BillingEvent, Subscription
from app.models.user import User
from app.schemas.billing import BillingStatus, CheckoutSessionResponse, PortalSessionResponse, SubscriptionRead
from app.services.billing import subscription_price_id, tier_for_subscription_status, unix_timestamp_to_datetime

try:  # Lets local development start before the optional payment package is installed.
    import stripe
except ImportError:  # pragma: no cover - exercised by deployment configuration
    stripe = None


router = APIRouter(prefix="/billing", tags=["billing"])


def _require_stripe(*, webhook: bool = False) -> None:
    configured = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_PRO_PRICE_ID)
    if webhook:
        configured = configured and bool(settings.STRIPE_WEBHOOK_SECRET)
    if stripe is None or not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured yet.",
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY


def _frontend_url() -> str:
    return settings.CORS_ORIGINS[0].rstrip("/")


def _subscription_read(record: Subscription) -> SubscriptionRead:
    return SubscriptionRead(
        id=str(record.id), provider=record.provider, status=record.status,
        price_id=record.price_id, current_period_end=record.current_period_end,
        cancel_at_period_end=record.cancel_at_period_end, created_at=record.created_at,
    )


async def _latest_subscription(user_id: Any, db: AsyncSession) -> Subscription | None:
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(Subscription.updated_at.desc())
        .limit(1)
    )
    return result.scalars().first()


@router.get("/status", response_model=BillingStatus)
async def get_billing_status(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    subscription = await _latest_subscription(current_user.id, db)
    return BillingStatus(tier=current_user.tier, subscription=_subscription_read(subscription) if subscription else None)


@router.get("/history", response_model=list[SubscriptionRead])
async def get_billing_history(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.created_at.desc())
    )
    return [_subscription_read(record) for record in result.scalars().all()]


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _require_stripe()
    current = await _latest_subscription(current_user.id, db)
    if current and current.status == "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Your Pro subscription is already active.")

    frontend_url = _frontend_url()
    params: dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": settings.STRIPE_PRO_PRICE_ID, "quantity": 1}],
        "success_url": f"{frontend_url}/plans?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{frontend_url}/plans?checkout=cancelled",
        "client_reference_id": str(current_user.id),
        "metadata": {"user_id": str(current_user.id), "tier": "pro"},
        "subscription_data": {"metadata": {"user_id": str(current_user.id), "tier": "pro"}},
    }
    if current and current.customer_id:
        params["customer"] = current.customer_id
    else:
        params["customer_email"] = current_user.email

    try:
        session = stripe.checkout.Session.create(**params)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not start checkout.") from exc
    return CheckoutSessionResponse(url=session.url)


@router.post("/portal-session", response_model=PortalSessionResponse)
async def create_portal_session(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _require_stripe()
    current = await _latest_subscription(current_user.id, db)
    if not current or not current.customer_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No billing customer was found.")
    return_url = settings.STRIPE_BILLING_PORTAL_RETURN_URL or f"{_frontend_url()}/plans"
    try:
        session = stripe.billing_portal.Session.create(customer=current.customer_id, return_url=return_url)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not open the billing portal.") from exc
    return PortalSessionResponse(url=session.url)


async def _find_user_for_subscription(data: dict[str, Any], db: AsyncSession) -> User | None:
    metadata = data.get("metadata") or {}
    user_id = metadata.get("user_id")
    if user_id:
        try:
            result = await db.execute(select(User).where(User.id == UUID(str(user_id))))
            user = result.scalars().first()
            if user:
                return user
        except ValueError:
            pass
    subscription_id = data.get("id")
    customer_id = data.get("customer")
    clauses = []
    if subscription_id:
        clauses.append(Subscription.provider_subscription_id == subscription_id)
    if customer_id:
        clauses.append(Subscription.customer_id == customer_id)
    if not clauses:
        return None
    from sqlalchemy import or_
    result = await db.execute(select(Subscription).where(or_(*clauses)).limit(1))
    record = result.scalars().first()
    if record is None:
        return None
    user_result = await db.execute(select(User).where(User.id == record.user_id))
    return user_result.scalars().first()


async def _upsert_subscription(data: dict[str, Any], user: User, db: AsyncSession, checkout_session_id: str | None = None) -> Subscription:
    subscription_id = data.get("id")
    result = await db.execute(select(Subscription).where(Subscription.provider_subscription_id == subscription_id))
    record = result.scalars().first()
    if record is None:
        record = Subscription(user_id=user.id, provider_subscription_id=subscription_id)
        db.add(record)
    record.customer_id = data.get("customer")
    record.checkout_session_id = checkout_session_id or record.checkout_session_id
    record.status = data.get("status", "inactive")
    record.price_id = subscription_price_id(data) or record.price_id
    record.current_period_end = unix_timestamp_to_datetime(data.get("current_period_end"))
    record.cancel_at_period_end = bool(data.get("cancel_at_period_end", False))
    user.tier = tier_for_subscription_status(record.status)
    return record


async def _handle_stripe_event(event: dict[str, Any], db: AsyncSession) -> User | None:
    event_type = event["type"]
    data = event["data"]["object"]
    if event_type in {"customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"}:
        user = await _find_user_for_subscription(data, db)
        if user:
            await _upsert_subscription(data, user, db)
        return user
    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"} and data.get("mode") == "subscription":
        metadata = data.get("metadata") or {}
        user_id = metadata.get("user_id") or data.get("client_reference_id")
        if not user_id or not data.get("subscription"):
            return None
        try:
            parsed_user_id = UUID(str(user_id))
        except ValueError:
            return None
        result = await db.execute(select(User).where(User.id == parsed_user_id))
        user = result.scalars().first()
        if user is None:
            return None
        subscription = stripe.Subscription.retrieve(data["subscription"])
        await _upsert_subscription(dict(subscription), user, db, checkout_session_id=data.get("id"))
        return user
    return None


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Verify Stripe's signed raw body before recording or changing entitlement."""
    _require_stripe(webhook=True)
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature.")
    try:
        event = stripe.Webhook.construct_event(await request.body(), signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe webhook.") from exc

    # Stripe objects are mapping-like but may contain nested SDK objects. Store a
    # plain JSON-compatible payload so the audit record can always be persisted.
    event_data = event.to_dict_recursive() if hasattr(event, "to_dict_recursive") else dict(event)
    provider_event_id = event_data.get("id")
    if not provider_event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook has no event id.")
    event_record = BillingEvent(
        provider_event_id=provider_event_id,
        event_type=event_data["type"],
        payload=event_data,
        processed_at=datetime.now(timezone.utc),
    )
    db.add(event_record)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return {"received": True, "duplicate": True}

    user = await _handle_stripe_event(event_data, db)
    if user:
        event_record.user_id = user.id
    await db.commit()
    return {"received": True}
