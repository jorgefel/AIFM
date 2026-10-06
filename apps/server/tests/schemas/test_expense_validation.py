from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.expense import ExpenseCreate


def test_expense_rejects_non_positive_amount():
    with pytest.raises(ValidationError):
        ExpenseCreate(property_id=uuid4(), description="Limpieza", amount=0, category="cleaning", date=date.today())


def test_expense_accepts_supported_category():
    expense = ExpenseCreate(property_id=uuid4(), description="Seguro", amount=45, category="insurance", date=date.today(), currency="USD")

    assert expense.category == "insurance"
