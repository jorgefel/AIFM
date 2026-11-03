from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # â”€â”€ Base de datos PostgreSQL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    DATABASE_URL: str = (
        "postgresql+asyncpg://nomora_user:nomora_pass@localhost:5432/nomora_db"
    )
    DIRECT_DATABASE_URL: str = ""  # Direct connection (bypasses pooler for migrations)
    DB_ECHO: bool = False       # Logging de SQL queries (True solo en dev)
    DB_POOL_SIZE: int = 5       # Conexiones en el pool de asyncpg

    # â”€â”€ Redis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    REDIS_URL: str = "redis://:nomora_redis_pass@localhost:6379/0"

    # â”€â”€ CORS (orÃ­genes permitidos) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    CORS_ORIGIN_REGEX: str = ""  # e.g. r"https://.*\.vercel\.app"
    FRONTEND_URL: str = ""

    # â”€â”€ OAuth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Public API base URL, including /api/v1/auth. It is registered with
    # Google and Apple as the base for their callback URLs.
    OAUTH_REDIRECT_BASE_URL: str = "http://localhost:8000/api/v1/auth"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    APPLE_CLIENT_ID: str = ""
    APPLE_TEAM_ID: str = ""
    APPLE_KEY_ID: str = ""
    APPLE_PRIVATE_KEY: str = ""

    # â”€â”€ FacturaciÃ³n (Stripe) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Las claves se leen exclusivamente del entorno. Nunca se exponen al
    # navegador: el checkout se crea en el servidor y Stripe aloja el pago.
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    STRIPE_BILLING_PORTAL_RETURN_URL: str = ""

    # â”€â”€ IA / Agentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ENABLE_AI_AGENTS: bool = False
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_USER_DAILY_LIMIT: int = 50
    AI_GLOBAL_DAILY_LIMIT: int = 500

    # ── Competitors ─────────────────────────────────────────
    OMKAR_API_KEY: str = ""

    # ── Beds24 ───────────────────────────────────────────────
    BEDS24_REFRESH_TOKEN: str = ""

    @model_validator(mode="after")
    def reject_default_secret_in_production(self) -> "Settings":
        """Prevent an application instance from starting with an unsafe JWT key."""
        if (
            self.APP_ENV.strip().lower() == "production"
            and self.SECRET_KEY == "change-me-in-production"
        ):
            raise ValueError(
                "SECRET_KEY must be overridden when APP_ENV is production"
            )
        return self


settings = Settings()
