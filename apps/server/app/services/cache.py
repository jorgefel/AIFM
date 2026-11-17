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


def _summary_key(
    property_id: uuid.UUID | str | None,
    year: int,
    month: int,
    owner_id: uuid.UUID | str | None = None,
) -> str:
    """Build a Redis key for a monthly summary cache entry (per-property or consolidated)."""
    if property_id is None or str(property_id) == "all":
        return f"summary:all:{owner_id}:{year}:{month}"
    return f"summary:{property_id}:{year}:{month}"


def _summary_pattern(property_id: uuid.UUID | str | None, owner_id: uuid.UUID | str | None = None) -> str:
    """Build a Redis glob pattern matching cached summaries."""
    if property_id is None or str(property_id) == "all":
        return f"summary:all:{owner_id}:*"
    return f"summary:{property_id}:*"


async def get_cached_summary(
    property_id: uuid.UUID | str | None,
    year: int,
    month: int,
    owner_id: uuid.UUID | str | None = None,
) -> dict | None:
    """Return cached summary dict, or None if miss."""
    key = _summary_key(property_id, year, month, owner_id)
    raw = await redis_client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def set_cached_summary(
    property_id: uuid.UUID | str | None,
    year: int,
    month: int,
    data: dict,
    owner_id: uuid.UUID | str | None = None,
) -> None:
    """Store summary dict in Redis with TTL."""
    key = _summary_key(property_id, year, month, owner_id)
    await redis_client.setex(key, SUMMARY_CACHE_TTL, json.dumps(data))


async def invalidate_summary_cache(
    property_id: uuid.UUID | str | None = None,
    owner_id: uuid.UUID | str | None = None,
) -> int:
    """
    Delete cached summaries for a given property and/or the owner's consolidated summary.
    Called after creating/updating/deleting reservations or expenses.
    """
    keys = []
    if property_id is not None and str(property_id) != "all":
        async for key in redis_client.scan_iter(match=f"summary:{property_id}:*", count=100):
            keys.append(key)
    if owner_id is not None:
        async for key in redis_client.scan_iter(match=f"summary:all:{owner_id}:*", count=100):
            keys.append(key)

    if keys:
        unique_keys = list(set(keys))
        return await redis_client.delete(*unique_keys)
    return 0
