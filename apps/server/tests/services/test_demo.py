from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import EmailStr, TypeAdapter

from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.models import Expense, Property, Reservation, User
from app.services.demo import DEMO_DURATION, create_demo_workspace


class FakeSession:
    def __init__(self):
        self.objects = []

    def add(self, obj):
        self.objects.append(obj)

    def add_all(self, objects):
        self.objects.extend(objects)

    async def flush(self):
        for obj in self.objects:
            if getattr(obj, "id", None) is None:
                obj.id = uuid4()


@pytest.mark.asyncio
async def test_demo_workspaces_are_isolated_and_expire_after_two_hours():
    session = FakeSession()
    now = datetime(2026, 10, 23, 12, tzinfo=timezone.utc)

    first = await create_demo_workspace(session, now=now)
    second = await create_demo_workspace(session, now=now)

    assert first.id != second.id
    assert first.tier == second.tier == "pro"
    assert first.demo_expires_at == second.demo_expires_at == now + DEMO_DURATION
    assert TypeAdapter(EmailStr).validate_python(first.email) == first.email

    properties = [obj for obj in session.objects if isinstance(obj, Property)]
    reservations = [obj for obj in session.objects if isinstance(obj, Reservation)]
    expenses = [obj for obj in session.objects if isinstance(obj, Expense)]

    assert {property.owner_id for property in properties} == {first.id, second.id}
    assert len(reservations) == 4
    assert len(expenses) == 2


@pytest.mark.asyncio
async def test_expired_demo_user_cannot_access_their_workspace():
    user = type(
        "DemoUser",
        (),
        {
            "id": uuid4(),
            "is_active": True,
            "demo_expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
        },
    )()

    class Result:
        def scalars(self):
            return self

        def first(self):
            return user

    class Session:
        async def execute(self, _statement):
            return Result()

    request = type(
        "Request",
        (),
        {"headers": {}, "cookies": {"access_token": create_access_token(str(user.id))}},
    )()

    with pytest.raises(HTTPException, match="Could not validate credentials") as error:
        await get_current_user(request, Session())

    assert error.value.status_code == 401
