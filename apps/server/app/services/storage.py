import os
import aiofiles
from fastapi import UploadFile, HTTPException, status
import uuid

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
