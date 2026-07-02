import pytest
from datetime import date
from decimal import Decimal
from app.engine.golden_rule import (
    calculate_net_amount,
    calculate_occupancy_rate,
    calculate_monthly_summary,
    detect_discrepancies,
)

def test_calculate_net_amount():
    assert calculate_net_amount(100.0, 10.0) == Decimal("90.00")
    assert calculate_net_amount("100.50", "10.25") == Decimal("90.25")
    assert calculate_net_amount(100, 0) == Decimal("100.00")

def test_calculate_occupancy_rate():
    reservations = [
        {"status": "confirmed", "check_in": date(2023, 10, 1), "check_out": date(2023, 10, 5)},
        {"status": "completed", "check_in": date(2023, 10, 10), "check_out": date(2023, 10, 15)},
        {"status": "cancelled", "check_in": date(2023, 10, 20), "check_out": date(2023, 10, 25)},
    ]
    # Oct 1 to 4 (4 days), Oct 10 to 14 (5 days) = 9 days total
    # October has 31 days. 9 / 31 = 0.2903
    rate = calculate_occupancy_rate(reservations, 2023, 10)
    assert rate == 0.2903

def test_calculate_monthly_summary():
    reservations = [
        {"status": "confirmed", "check_in": date(2023, 10, 1), "check_out": date(2023, 10, 5), "total_amount": 500, "platform_fee": 50, "net_amount": 450},
        {"status": "completed", "check_in": date(2023, 10, 10), "check_out": date(2023, 10, 15), "total_amount": 600, "platform_fee": 60, "net_amount": 540},
    ]
    expenses = [
        {"amount": 100, "is_deleted": False, "date": date(2023, 10, 2)},
        {"amount": 50, "is_deleted": True, "date": date(2023, 10, 3)},
    ]
    
    summary = calculate_monthly_summary(reservations, expenses, 2023, 10)
    
    assert summary["gross_income"] == 1100.0
    assert summary["total_fees"] == 110.0
    assert summary["net_income"] == 990.0
    assert summary["total_expenses"] == 100.0
    assert summary["net_profit"] == 890.0
    assert summary["reservation_count"] == 2
    assert summary["expense_count"] == 1

def test_detect_discrepancies():
    reservations = [
        {"id": "1", "guest_name": "A", "status": "confirmed", "total_amount": 100, "platform_fee": 10, "net_amount": 90}, # OK
        {"id": "2", "guest_name": "B", "status": "confirmed", "total_amount": 100, "platform_fee": 10, "net_amount": 80}, # Discrepancy
        {"id": "3", "guest_name": "C", "status": "cancelled", "total_amount": 100, "platform_fee": 10, "net_amount": 80}, # Ignored
    ]
    
    discrepancies = detect_discrepancies(reservations)
    
    assert len(discrepancies) == 1
    assert discrepancies[0]["reservation_id"] == "2"
    assert discrepancies[0]["expected_net"] == 90.0
    assert discrepancies[0]["actual_net"] == 80.0
    assert discrepancies[0]["diff"] == 10.0
