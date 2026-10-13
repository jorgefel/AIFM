import logging
from fastapi import HTTPException, Request, status
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


class RateLimiter:
    """Resilient rate limiter using Redis INCR and EXPIRE.

    Fails open (allowing the request and logging a warning) if Redis is unavailable,
    preventing rate limiter glitches from crashing authentication endpoints with 500 errors.
    """

    def __init__(self, times: int = 10, minutes: int = 1, seconds: int = 0):
        self.times = times
        self.window_seconds = minutes * 60 + seconds

    async def __call__(self, request: Request) -> None:
        try:
            client_ip = (
                request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                or (request.client.host if request.client else "unknown")
            )
            key = f"rate_limit:{request.url.path}:{client_ip}"
            current = await redis_client.incr(key)
            if current == 1:
                await redis_client.expire(key, self.window_seconds)

            if current > self.times:
                ttl = await redis_client.ttl(key)
                headers = {"Retry-After": str(max(1, ttl))} if ttl > 0 else {}
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too Many Requests",
                    headers=headers,
                )
        except HTTPException:
            raise
        except Exception as exc:
            # Fails open so temporary Redis hiccups never block users
            logger.warning(f"Rate limiting check skipped due to error: {exc}")
