# ─────────────────────────────────────────────────────────────
# app/services/cache.py — Redis Cache Utilities
#
# Provides helpers for caching endpoint responses in Redis
# and invalidating them when underlying data changes.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

import json
import uuid
from typing import Any

from app.core.redis import redis_client

# Default TTL for summary cache (seconds)
SUMMARY_CACHE_TTL = 60


def _summary_key(property_id: uuid.UUID, year: int, month: int) -> str:
    """Build a Redis key for a monthly summary cache entry."""
    return f"summary:{property_id}:{year}:{month}"


def _summary_pattern(property_id: uuid.UUID) -> str:
    """Build a Redis glob pattern matching all cached summaries for a property."""
    return f"summary:{property_id}:*"


async def get_cached_summary(
    property_id: uuid.UUID, year: int, month: int
) -> dict | None:
    """Return cached summary dict, or None if miss."""
    key = _summary_key(property_id, year, month)
    raw = await redis_client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def set_cached_summary(
    property_id: uuid.UUID, year: int, month: int, data: dict
) -> None:
    """Store summary dict in Redis with TTL."""
    key = _summary_key(property_id, year, month)
    await redis_client.setex(key, SUMMARY_CACHE_TTL, json.dumps(data))


async def invalidate_summary_cache(property_id: uuid.UUID) -> int:
    """
    Delete all cached summaries for a given property.
    Called after creating/updating/deleting reservations or expenses.

    Returns the number of keys deleted.
    """
    pattern = _summary_pattern(property_id)
    keys = []
    async for key in redis_client.scan_iter(match=pattern, count=100):
        keys.append(key)
    if keys:
        return await redis_client.delete(*keys)
    return 0
