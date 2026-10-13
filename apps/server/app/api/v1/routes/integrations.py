"""Pro-only Beds24 connection and booking synchronization endpoints."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_tier, verify_property_access
from app.core.redis import redis_client
from app.models.integration import Beds24PropertyLink, ChannelConnection, ChannelInventoryDay, SyncLog, OtaConnection
from app.models.user import User
from app.models.property import Property
from app.schemas.integration import (
    Beds24ChannelStatusResponse, Beds24ConnectionCreate, Beds24ConnectionRead,
    Beds24PropertyLinkCreate, Beds24SetupRequest, Beds24SetupResponse,
    BookingSyncResult, CalendarSnapshotRead, InventorySyncResult,
    OtaConnectionCreate, OtaConnectionRead, SyncLogRead,
)
from app.services.beds24 import Beds24Client
from app.services.beds24_sync import sync_beds24_bookings, sync_beds24_inventory

router = APIRouter(prefix="/integrations", tags=["Integrations"])
SYNC_LOCK_TTL_SECONDS = 10 * 60
INVENTORY_SYNC_COOLDOWN_SECONDS = 6 * 60 * 60
INVENTORY_STALE_AFTER = timedelta(hours=12)


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


async def _acquire_inventory_sync_slot(connection_id: uuid.UUID) -> str:
    """Protect Beds24's account-level credit budget from repeated UI requests."""
    key, token = f"beds24:inventory-sync:{connection_id}", str(uuid.uuid4())
    if not await redis_client.set(key, token, nx=True, ex=INVENTORY_SYNC_COOLDOWN_SECONDS):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Inventory is synced at most once every 6 hours. The calendar uses the stored snapshot.",
            headers={"Retry-After": str(INVENTORY_SYNC_COOLDOWN_SECONDS)},
        )
    return token


async def _release_inventory_slot_on_failure(connection_id: uuid.UUID, token: str) -> None:
    key = f"beds24:inventory-sync:{connection_id}"
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
        SyncLog.channel_connection_id == connection.id, SyncLog.sync_type.in_(("bookings", "inventory"))
    ).order_by(SyncLog.created_at.desc()).limit(20))
    return result.scalars().all()


@router.post("/beds24/connections/{connection_id}/sync-inventory", response_model=InventorySyncResult)
async def sync_inventory_now(connection_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    """Explicit, rate-limited read from Beds24; no OTA or inventory writes occur."""
    connection = await _owned_connection(connection_id, current_user, db)
    token = await _acquire_inventory_sync_slot(connection.id)
    log = SyncLog(channel_connection_id=connection.id, sync_type="inventory", status="pending", started_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    try:
        result = await sync_beds24_inventory(connection, db)
        log.status, log.records_processed, log.completed_at = "success", result["records_processed"], datetime.now(timezone.utc)
        await db.commit()
        return InventorySyncResult(status="success", **result)
    except Exception as exc:
        await db.rollback()
        log.status, log.error_message, log.completed_at = "error", str(exc)[:2000], datetime.now(timezone.utc)
        db.add(log)
        await db.commit()
        await _release_inventory_slot_on_failure(connection.id, token)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Beds24 inventory sync failed.") from exc


@router.get("/calendar", response_model=CalendarSnapshotRead)
async def get_calendar_snapshot(
    start: date, end: date, property_id: uuid.UUID | None = None,
    channel: str = "all", db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Serve the calendar strictly from Nomora's database, never from Beds24."""
    if end <= start or (end - start).days > 93:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select a range between 1 and 93 days")
    if channel not in {"all", "beds24", "manual"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="channel must be all, beds24 or manual")
    properties_query = select(Property).where(Property.owner_id == current_user.id, Property.is_active.is_(True))
    if property_id:
        properties_query = properties_query.where(Property.id == property_id)
    properties = (await db.execute(properties_query)).scalars().all()
    property_ids = [item.id for item in properties]
    if not property_ids:
        return {"days": [], "generated_at": datetime.now(timezone.utc)}
    inventory = (await db.execute(select(ChannelInventoryDay, ChannelConnection.last_inventory_sync_at).join(ChannelConnection).where(
        ChannelInventoryDay.property_id.in_(property_ids), ChannelInventoryDay.date >= start, ChannelInventoryDay.date < end,
        ChannelConnection.user_id == current_user.id, ChannelConnection.is_active.is_(True),
    ))).all()
    inventory_by_key = {(item.property_id, item.date): (item, synced_at) for item, synced_at in inventory}
    now = datetime.now(timezone.utc)
    days = []
    cursor = start
    while cursor < end:
        for property_obj in properties:
            row, synced_at = inventory_by_key.get((property_obj.id, cursor), (None, None))
            is_stale = row is not None and (synced_at is None or now - synced_at > INVENTORY_STALE_AFTER)
            source = "synced" if row else "manual"
            if channel != "all" and channel != ("beds24" if row else "manual"):
                continue
            available = row.available_units if row else None
            days.append({
                "property_id": property_obj.id, "date": cursor, "available_units": available,
                "price": float(row.price) if row and row.price is not None else (float(property_obj.nightly_rate) if property_obj.nightly_rate is not None else None),
                "availability": "unavailable" if available == 0 else ("available" if available is not None else "unknown"),
                "source": source, "channel": "beds24" if row else None, "synced_at": synced_at, "is_stale": is_stale,
            })
        cursor += timedelta(days=1)
    return {"days": days, "generated_at": now}


@router.post("/beds24/connections/{connection_id}/sync-bookings", response_model=BookingSyncResult)
async def sync_bookings_now(connection_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_tier("pro"))):
    connection = await _owned_connection(connection_id, current_user, db)
    token = await _acquire_sync_lock(connection.id)
    log = SyncLog(channel_connection_id=connection.id, sync_type="bookings", status="pending", started_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    try:
        result = await sync_beds24_bookings(connection, db)
        log.status, log.records_processed, log.completed_at = "success", result["records_processed"], datetime.now(timezone.utc)
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


@router.post("/beds24/setup-channel", response_model=Beds24SetupResponse)
async def setup_beds24_channel(
    payload: Beds24SetupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro")),
):
    await verify_property_access(payload.property_id, current_user, db)
    prop = await db.get(Property, payload.property_id)
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    # Find or create master channel connection for the user
    conn_result = await db.execute(
        select(ChannelConnection).where(
            ChannelConnection.user_id == current_user.id,
            ChannelConnection.channel_name == "beds24",
            ChannelConnection.is_active.is_(True),
        )
    )
    connection = conn_result.scalars().first()
    if not connection:
        connection = ChannelConnection(
            user_id=current_user.id,
            channel_name="beds24",
            channel_account_id="master_nomora",
        )
        db.add(connection)
        await db.flush()

    # Check if property link already exists
    link_result = await db.execute(
        select(Beds24PropertyLink).where(
            Beds24PropertyLink.channel_connection_id == connection.id,
            Beds24PropertyLink.property_id == payload.property_id,
        )
    )
    link = link_result.scalars().first()

    if not link:
        try:
            remote_data = await Beds24Client.create_property(
                name=prop.name,
                currency=prop.currency,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error creando propiedad en Beds24: {str(exc)}",
            ) from exc

        beds24_property_id = str(remote_data.get("id", ""))
        if not beds24_property_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Beds24 no devolvió un identificador de propiedad.",
            )

        link = Beds24PropertyLink(
            channel_connection_id=connection.id,
            property_id=prop.id,
            beds24_property_id=beds24_property_id,
        )
        db.add(link)
        await db.flush()

    # Ensure OtaConnection exists for Airbnb
    ota_result = await db.execute(
        select(OtaConnection).where(
            OtaConnection.property_id == prop.id,
            OtaConnection.ota_name == "airbnb",
        )
    )
    ota = ota_result.scalars().first()
    if not ota:
        ota = OtaConnection(
            property_id=prop.id,
            beds24_property_link_id=link.id,
            ota_name="airbnb",
            status="pending",
        )
        db.add(ota)

    await db.commit()
    await db.refresh(link)

    dashboard_url = f"https://beds24.com/control3.php?pagetype=channelmgr&propId={link.beds24_property_id}"
    return Beds24SetupResponse(
        beds24_property_id=link.beds24_property_id,
        property_id=prop.id,
        channel_connection_id=connection.id,
        beds24_property_link_id=link.id,
        dashboard_url=dashboard_url,
        status="ready_for_oauth",
    )


@router.get("/beds24/channel-status/{property_id}", response_model=Beds24ChannelStatusResponse)
async def check_beds24_channel_status(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro")),
):
    await verify_property_access(property_id, current_user, db)
    link_result = await db.execute(
        select(Beds24PropertyLink).where(Beds24PropertyLink.property_id == property_id)
    )
    link = link_result.scalars().first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La propiedad aún no está vinculada con Beds24.",
        )

    airbnb_users = await Beds24Client.get_airbnb_users()
    is_connected = len(airbnb_users) > 0

    ota_result = await db.execute(
        select(OtaConnection).where(
            OtaConnection.property_id == property_id,
            OtaConnection.ota_name == "airbnb",
        )
    )
    ota = ota_result.scalars().first()
    if ota and is_connected and ota.status != "connected":
        ota.status = "connected"
        await db.commit()

    has_connection = is_connected or (ota is not None and ota.status == "connected")
    return Beds24ChannelStatusResponse(
        property_id=property_id,
        beds24_property_id=link.beds24_property_id,
        airbnb_connected=has_connection,
        status="connected" if has_connection else "pending",
    )


@router.post("/beds24/confirm-channel/{property_id}")
async def confirm_beds24_channel(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tier("pro")),
):
    await verify_property_access(property_id, current_user, db)
    ota_result = await db.execute(
        select(OtaConnection).where(
            OtaConnection.property_id == property_id,
            OtaConnection.ota_name == "airbnb",
        )
    )
    ota = ota_result.scalars().first()
    if ota:
        ota.status = "connected"
        await db.commit()
    return {"status": "connected"}

