from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginPayload(BaseModel):
    email: str
    password: str

class RegisterPayload(BaseModel):
    email: str
    password: str
    full_name: str


class DemoSessionResponse(BaseModel):
    expires_at: datetime


class OAuthCallbackResponse(BaseModel):
    """Successful OAuth completion before the browser is redirected to the web app."""

    message: str
    provider: Literal["google", "apple"]
    redirect_url: HttpUrl
