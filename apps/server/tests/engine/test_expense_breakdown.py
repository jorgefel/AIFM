from datetime import date

from app.engine.golden_rule import calculate_expense_breakdown


def test_expense_breakdown_groups_only_the_requested_month():
    expenses = [
        {"date": date(2026, 10, 2), "category": "cleaning", "amount": "40.20", "is_deleted": False},
        {"date": date(2026, 10, 7), "category": "cleaning", "amount": 10, "is_deleted": False},
        {"date": date(2026, 10, 9), "category": "utilities", "amount": 25, "is_deleted": True},
        {"date": date(2026, 9, 30), "category": "maintenance", "amount": 99, "is_deleted": False},
    ]

    assert calculate_expense_breakdown(expenses, 2026, 10) == [
        {"category": "cleaning", "amount": 50.2},
    ]
