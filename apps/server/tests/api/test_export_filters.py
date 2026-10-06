from datetime import date

import pytest
from fastapi import HTTPException

from app.api.v1.routes.export import export_csv


@pytest.mark.asyncio
async def test_csv_export_rejects_an_inverted_date_range():
    with pytest.raises(HTTPException) as error:
        await export_csv(
            property_id="00000000-0000-0000-0000-000000000000",
            start=date(2026, 10, 31),
            end=date(2026, 10, 1),
            db=None,
            current_user=None,
        )

    assert error.value.status_code == 422
