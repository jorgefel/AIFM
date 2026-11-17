"""Pruebas unitarias para el Centro de Automatizaciones (/api/v1/automations)."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
from fastapi import HTTPException

from app.api.v1.routes.automations import (
    approve_and_execute_automation,
    cancel_automation,
    list_automations,
)
from app.models.automation import AutomationAction
from app.models.user import User


@pytest.mark.asyncio
async def test_approve_automation_executes_and_logs():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")
    action_id = uuid.uuid4()

    action = AutomationAction(
        id=action_id,
        user_id=user_id,
        action_type="checkin_reminder",
        payload={"title": "Check-in mañana", "guest_name": "Ana"},
        status="pending_approval",
    )

    mock_db.get.return_value = action

    approved = await approve_and_execute_automation(
        action_id=action_id,
        db=mock_db,
        current_user=user,
    )

    assert approved.status == "executed"
    assert approved.executed_at is not None
    assert mock_db.commit.called
    assert mock_db.add.called


@pytest.mark.asyncio
async def test_approve_automation_unowned_raises_404():
    mock_db = AsyncMock()
    user = User(id=uuid.uuid4(), email="owner@example.com")
    other_user_id = uuid.uuid4()
    action_id = uuid.uuid4()

    action = AutomationAction(
        id=action_id,
        user_id=other_user_id,  # belongs to someone else
        action_type="checkin_reminder",
        status="pending_approval",
    )
    mock_db.get.return_value = action

    with pytest.raises(HTTPException) as exc:
        await approve_and_execute_automation(action_id, db=mock_db, current_user=user)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_cancel_automation_marks_cancelled():
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(id=user_id, email="owner@example.com")
    action_id = uuid.uuid4()

    action = AutomationAction(
        id=action_id,
        user_id=user_id,
        action_type="low_occupancy_alert",
        status="pending_approval",
    )
    mock_db.get.return_value = action

    await cancel_automation(action_id, db=mock_db, current_user=user)
    assert action.status == "cancelled"
    assert mock_db.commit.called
