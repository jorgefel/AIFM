from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── App ──────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Base de datos PostgreSQL ─────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://nomora_user:nomora_pass@localhost:5432/nomora_db"
    )
    DB_ECHO: bool = False       # Logging de SQL queries (True solo en dev)
    DB_POOL_SIZE: int = 5       # Conexiones en el pool de asyncpg

    # ── Redis ────────────────────────────────────────────────
    REDIS_URL: str = "redis://:nomora_redis_pass@localhost:6379/0"

    # ── CORS (orígenes permitidos) ───────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    CORS_ORIGIN_REGEX: str = ""  # e.g. r"https://.*\.vercel\.app"

    # ── IA / Agentes ─────────────────────────────────────────
    ENABLE_AI_AGENTS: bool = False
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_USER_DAILY_LIMIT: int = 50
    AI_GLOBAL_DAILY_LIMIT: int = 500

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
