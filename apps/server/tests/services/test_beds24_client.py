import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.beds24 import Beds24Client

@pytest.mark.asyncio
async def test_create_property_extracts_id():
    with patch.object(Beds24Client, "get_access_token", new_callable=AsyncMock) as mock_token, \
         patch("httpx.AsyncClient.post") as mock_post:
        mock_token.return_value = "fake-token"
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {}
        mock_resp.json.return_value = {"success": True, "data": [{"id": 98765, "name": "Apartamento 1"}]}
        mock_post.return_value = mock_resp

        result = await Beds24Client.create_property("Apartamento 1", "USD")
        assert result["id"] == 98765
        assert result["name"] == "Apartamento 1"

@pytest.mark.asyncio
async def test_get_airbnb_users_returns_list():
    with patch.object(Beds24Client, "get_access_token", new_callable=AsyncMock) as mock_token, \
         patch("httpx.AsyncClient.get") as mock_get:
        mock_token.return_value = "fake-token"
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.headers = {}
        mock_resp.json.return_value = {"data": [{"id": "user123", "name": "Host"}]}
        mock_get.return_value = mock_resp

        users = await Beds24Client.get_airbnb_users()
        assert len(users) == 1
        assert users[0]["id"] == "user123"
