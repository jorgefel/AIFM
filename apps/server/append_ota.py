import sys

content = """
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
"""
with open('app/api/v1/routes/integrations.py', 'a', encoding='utf-8') as f:
    f.write(content)
print('Done!')
