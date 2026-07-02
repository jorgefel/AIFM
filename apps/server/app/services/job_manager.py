# ─────────────────────────────────────────────────────────────
# app/services/job_manager.py — Job queue con Redis
#
# Persiste el estado de tareas asíncronas (IA) en Redis
# con TTL de 24 horas. Los clientes hacen polling vía
# GET /api/v1/jobs/{job_id}.
# ─────────────────────────────────────────────────────────────
import json
import uuid
from datetime import datetime, timezone

from app.core.redis import redis_client

_JOB_KEY_PREFIX = "job:"
_JOB_TTL = 86400  # 24 hours


async def create_job(user_id: str) -> str:
    """
    Crea un nuevo job con estado 'pending' en Redis.

    Returns:
        job_id (str)
    """
    job_id = str(uuid.uuid4())
    job_data = {
        "job_id": job_id,
        "user_id": user_id,
        "status": "pending",
        "result": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await redis_client.setex(
        f"{_JOB_KEY_PREFIX}{job_id}",
        _JOB_TTL,
        json.dumps(job_data),
    )
    return job_id


async def update_job(
    job_id: str,
    status: str,
    result: dict | None = None,
    error: str | None = None,
) -> None:
    """
    Actualiza el estado de un job existente.

    Args:
        job_id: ID del job
        status: 'processing', 'completed', o 'failed'
        result: resultado del job (cuando status='completed')
        error: mensaje de error (cuando status='failed')
    """
    key = f"{_JOB_KEY_PREFIX}{job_id}"
    raw = await redis_client.get(key)
    if raw is None:
        return

    job_data = json.loads(raw)
    job_data["status"] = status
    job_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    if result is not None:
        job_data["result"] = result
    if error is not None:
        job_data["error"] = error

    ttl = await redis_client.ttl(key)
    if ttl > 0:
        await redis_client.setex(key, ttl, json.dumps(job_data))
    else:
        await redis_client.setex(key, _JOB_TTL, json.dumps(job_data))


async def get_job(job_id: str) -> dict | None:
    """
    Obtiene el estado actual de un job.

    Returns:
        dict con job_id, status, result, error, timestamps
        None si el job no existe o expiró
    """
    raw = await redis_client.get(f"{_JOB_KEY_PREFIX}{job_id}")
    if raw is None:
        return None
    return json.loads(raw)
