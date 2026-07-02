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

    # ── Base de datos PostgreSQL ─────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://aifm_user:aifm_pass@localhost:5432/aifm_db"
    )
    DB_ECHO: bool = False       # Logging de SQL queries (True solo en dev)
    DB_POOL_SIZE: int = 5       # Conexiones en el pool de asyncpg

    # ── Redis ────────────────────────────────────────────────
    REDIS_URL: str = "redis://:aifm_redis_pass@localhost:6379/0"

    # ── CORS (orígenes permitidos) ───────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]


settings = Settings()
