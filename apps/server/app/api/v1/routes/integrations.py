"""Pro-only Beds24 connection and booking synchronization endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_tier, verify_property_access
from app.core.redis import redis_client
from app.models.integration import Beds24PropertyLink, ChannelConnection, SyncLog, OtaConnection
from app.models.user import User
from app.models.property import Property
from app.schemas.integration import (
    Beds24ConnectionCreate, Beds24ConnectionRead, Beds24PropertyLinkCreate, 
    BookingSyncResult, SyncLogRead, OtaConnectionCreate, OtaConnectionRead
)
from app.services.beds24 import Beds24Client
from app.services.beds24_sync import sync_beds24_bookings

router = APIRouter(prefix="/integrations", tags=["Integrations"])
SYNC_LOCK_TTL_SECONDS = 10 * 60


async def _owned_connection(connection_id: uuid.UUID, current_user: User, db: AsyncSession) -> ChannelConnection:
    result = await db.execute(
        select(ChannelConnection).options(selectinload(ChannelConnection.property_links)).where(
            ChannelConnection.id == connection_id, ChannelConnection.user_id == current_user.id,
            ChannelConnection.channel_name == "beds24", ChannelConnection.is_active.is_(True),
        )
    )
    connection = result.scalars().first()
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beds24 connection not found.")
    return connection


async def _acquire_sync_lock(connection_id: uuid.UUID) -> str:
    key, token = f"beds24:bookings-sync:{connection_id}", str(uuid.uuid4())
    if not await redis_client.set(key, token, nx=True, ex=SYNC_LOCK_TTL_SECONDS):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A booking sync is already running for this connection.")
    return token


async def _release_sync_lock(connection_id: uuid.UUID, token: str) -> None:
    key = f"beds24:bookings-sync:{connection_id}"
    if await redis_client.get(key) == token:
        await redis_client.delete(key)


@router.get("/beds24/properties")
async def check_beds24_connection(current_user: User = Depends(require_tier("pro"))):
    """Read remote properties to help the owner choose a mapping."""
    try:
        return {"status": "success", "properties": await Beds24Client.get_properties()}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not read Beds24 properties.") from exc


@router.get("/beds24/connections", response_model=list[Beds24ConnectionRead])
async def list_beds24_connections(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    result = await db.execute(
        select(ChannelConnection).options(selectinload(ChannelConnection.property_links)).where(
            ChannelConnection.user_id == current_user.id, ChannelConnection.channel_name == "beds24"
        ).order_by(ChannelConnection.created_at.desc())
    )
    return result.scalars().unique().all()


@router.post("/beds24/connections", response_model=Beds24ConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_beds24_connection(payload: Beds24ConnectionCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    existing = await db.execute(select(ChannelConnection).where(
        ChannelConnection.user_id == current_user.id, ChannelConnection.channel_name == "beds24",
        ChannelConnection.channel_account_id == payload.channel_account_id,
    ))
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This Beds24 account is already connected.")
    connection = ChannelConnection(user_id=current_user.id, channel_name="beds24", channel_account_id=payload.channel_account_id)
    db.add(connection)
    await db.commit()
    await db.refresh(connection)
    return connection


@router.put("/beds24/connections/{connection_id}/property-links", response_model=Beds24ConnectionRead)
async def link_beds24_property(connection_id: uuid.UUID, payload: Beds24PropertyLinkCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    connection = await _owned_connection(connection_id, current_user, db)
    await verify_property_access(payload.property_id, current_user, db)
    try:
        remote_properties = await Beds24Client.get_properties()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not verify the Beds24 property.") from exc
    if str(payload.beds24_property_id) not in {str(item.get("id")) for item in remote_properties}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The Beds24 property is not available to this connection.")
    existing = await db.execute(select(Beds24PropertyLink).where(
        Beds24PropertyLink.channel_connection_id == connection.id,
        (Beds24PropertyLink.property_id == payload.property_id) | (Beds24PropertyLink.beds24_property_id == payload.beds24_property_id),
    ))
    link = existing.scalars().first()
    if link:
        link.property_id, link.beds24_property_id = payload.property_id, payload.beds24_property_id
    else:
        db.add(Beds24PropertyLink(channel_connection_id=connection.id, property_id=payload.property_id, beds24_property_id=payload.beds24_property_id))
    await db.commit()
    return await _owned_connection(connection_id, current_user, db)


@router.get("/beds24/connections/{connection_id}/sync-history", response_model=list[SyncLogRead])
async def get_beds24_sync_history(connection_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    connection = await _owned_connection(connection_id, current_user, db)
    result = await db.execute(select(SyncLog).where(
        SyncLog.channel_connection_id == connection.id, SyncLog.sync_type == "bookings"
    ).order_by(SyncLog.created_at.desc()).limit(20))
    return result.scalars().all()


@router.post("/beds24/connections/{connection_id}/sync-bookings", response_model=BookingSyncResult)
async def sync_bookings_now(connection_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    connection = await _owned_connection(connection_id, current_user, db)
    token = await _acquire_sync_lock(connection.id)
    log = SyncLog(channel_connection_id=connection.id, sync_type="bookings", status="pending", started_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    try:
        result = await sync_beds24_bookings(connection, db)
        log.status, log.records_processed, log.completed_at = "success", int(result["records_processed"]), datetime.now(timezone.utc)
        await db.commit()
        return BookingSyncResult(status="success", **result)
    except Exception as exc:
        await db.rollback()
        log.status, log.error_message, log.completed_at = "error", str(exc)[:2000], datetime.now(timezone.utc)
        db.add(log)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Beds24 booking sync failed.") from exc
    finally:
        await _release_sync_lock(connection.id, token)

@router.get("/ota-connections", response_model=list[OtaConnectionRead])
async def list_ota_connections(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    result = await db.execute(
        select(OtaConnection).join(OtaConnection.property).where(
            Property.owner_id == current_user.id
        ).order_by(OtaConnection.created_at.desc())
    )
    return result.scalars().unique().all()


@router.post("/ota-connections", response_model=OtaConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_ota_connection(payload: OtaConnectionCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    await verify_property_access(payload.property_id, current_user, db)
    
    # Check beds24 property link
    link_result = await db.execute(select(Beds24PropertyLink).where(Beds24PropertyLink.id == payload.beds24_property_link_id, Beds24PropertyLink.property_id == payload.property_id))
    link = link_result.scalars().first()
    if not link:
        raise HTTPException(status_code=400, detail="Beds24 Property Link not found or invalid.")

    existing = await db.execute(select(OtaConnection).where(
        OtaConnection.property_id == payload.property_id,
        OtaConnection.ota_name == payload.ota_name,
    ))
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This OTA is already connected to this property.")
    
    # Simulate connection to OTA via Beds24. We just record it in our DB for the guided flow.
    connection = OtaConnection(
        property_id=payload.property_id, 
        beds24_property_link_id=payload.beds24_property_link_id, 
        ota_name=payload.ota_name,
        ota_listing_id=payload.ota_listing_id,
        status="connected" if payload.ota_name == "airbnb" else "waiting_action" # booking requires extranet action
    )
    db.add(connection)
    
    log = SyncLog(channel_connection_id=link.channel_connection_id, sync_type="ota_connect", status="success", started_at=datetime.now(timezone.utc), completed_at=datetime.now(timezone.utc))
    db.add(log)
    
    await db.commit()
    await db.refresh(connection)
    return connection
