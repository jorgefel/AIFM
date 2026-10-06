from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SubscriptionRead(BaseModel):
    id: str
    provider: str
    status: str
    price_id: str | None
    current_period_end: datetime | None
    cancel_at_period_end: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BillingStatus(BaseModel):
    tier: str
    subscription: SubscriptionRead | None


class CheckoutSessionResponse(BaseModel):
    url: str


class PortalSessionResponse(BaseModel):
    url: str
