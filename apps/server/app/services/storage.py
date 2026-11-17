import logging
import os
import uuid
import aiofiles
import httpx
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]
ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def upload_property_photo(file: UploadFile, owner_id: uuid.UUID) -> str:
    """
    Validates and uploads a property photo to Supabase Storage (free tier).
    Never stores permanently on Render disk. Falls back to local disk in dev/test
    only if Supabase credentials are missing.
    """
    if file.content_type not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no permitido. Solo se aceptan imágenes JPG, PNG y WebP.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen es demasiado pesada. El tamaño máximo es 5MB.",
        )

    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    ext = ext_map.get(file.content_type, ".jpg")
    file_id = uuid.uuid4().hex
    storage_path = f"{owner_id}/{file_id}{ext}"

    supabase_url = settings.SUPABASE_URL.rstrip("/")
    supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    bucket = settings.SUPABASE_STORAGE_BUCKET or "property-photos"

    if supabase_url and supabase_key:
        target_url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": file.content_type or "image/jpeg",
            "x-upsert": "true",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(target_url, content=content, headers=headers)
                if res.status_code not in (200, 201):
                    logger.exception(
                        "Supabase Storage error: status=%s response=%s",
                        res.status_code,
                        res.text,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="No fue posible guardar la foto en el almacenamiento remoto.",
                    )
                return f"{supabase_url}/storage/v1/object/public/{bucket}/{storage_path}"
        except httpx.HTTPError as exc:
            logger.exception("HTTP error connecting to Supabase storage: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No fue posible conectar con el servicio de almacenamiento.",
            )

    # Local fallback for dev/tests without Supabase credentials
    logger.warning("Supabase Storage unconfigured; falling back to local storage.")
    dev_dir = os.path.join(UPLOAD_DIR, "properties", str(owner_id))
    os.makedirs(dev_dir, exist_ok=True)
    dev_path = os.path.join(dev_dir, f"{file_id}{ext}")
    async with aiofiles.open(dev_path, "wb") as out_file:
        await out_file.write(content)
    return f"/uploads/properties/{owner_id}/{file_id}{ext}"

async def save_receipt(file: UploadFile) -> str:
    """
    Validates and saves a receipt file.
    Returns the relative URL to access the file.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and PDF are allowed."
        )
    
    # Check file size by reading chunks
    size = 0
    await file.seek(0)
    
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB."
            )
            
    await file.seek(0)
    
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    if not file_ext:
        if file.content_type == "image/jpeg": file_ext = ".jpg"
        elif file.content_type == "image/png": file_ext = ".png"
        elif file.content_type == "application/pdf": file_ext = ".pdf"
        
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await file.read(1024 * 1024):  # async read chunk
            await out_file.write(content)  # async write chunk
            
    return f"/uploads/{unique_filename}"
