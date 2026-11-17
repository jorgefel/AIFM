import io
import uuid
import pytest
from fastapi import HTTPException
from fastapi.datastructures import UploadFile
from app.services.storage import upload_property_photo, ALLOWED_PHOTO_MIME_TYPES


@pytest.mark.asyncio
async def test_upload_property_photo_valid():
    owner_id = uuid.uuid4()
    dummy_bytes = b"\xff\xd8\xff\xe0" + b"0" * 1024  # Valid fake jpeg bytes
    file = UploadFile(
        filename="test.jpg",
        file=io.BytesIO(dummy_bytes),
        headers={"content-type": "image/jpeg"},
    )
    url = await upload_property_photo(file, owner_id)
    assert url is not None
    assert str(owner_id) in url
    assert url.endswith(".jpg")


@pytest.mark.asyncio
async def test_upload_property_photo_invalid_type():
    owner_id = uuid.uuid4()
    file = UploadFile(
        filename="test.txt",
        file=io.BytesIO(b"not an image"),
        headers={"content-type": "text/plain"},
    )
    with pytest.raises(HTTPException) as exc_info:
        await upload_property_photo(file, owner_id)
    assert exc_info.value.status_code == 400
    assert "Formato no permitido" in exc_info.value.detail


@pytest.mark.asyncio
async def test_upload_property_photo_too_large():
    owner_id = uuid.uuid4()
    too_large = b"0" * (5 * 1024 * 1024 + 10)
    file = UploadFile(
        filename="large.png",
        file=io.BytesIO(too_large),
        headers={"content-type": "image/png"},
    )
    with pytest.raises(HTTPException) as exc_info:
        await upload_property_photo(file, owner_id)
    assert exc_info.value.status_code == 400
    assert "demasiado pesada" in exc_info.value.detail
