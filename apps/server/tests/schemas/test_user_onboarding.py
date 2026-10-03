from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.api.v1.routes.users import _missing_onboarding_fields
from app.schemas.user import OnboardingProgressUpdate


def test_onboarding_progress_accepts_a_partial_draft():
    payload = OnboardingProgressUpdate(full_name="Ana", complete=False)

    assert payload.full_name == "Ana"
    assert payload.previous_platforms is None


def test_onboarding_progress_rejects_an_underage_host():
    with pytest.raises(ValidationError):
        OnboardingProgressUpdate(age=17)


def test_missing_onboarding_fields_only_reports_unset_values():
    user = SimpleNamespace(
        full_name="Ana",
        age=32,
        rental_experience_years=2,
        average_monthly_reservations=4,
        previous_platforms=[],
    )

    assert _missing_onboarding_fields(user) == ["previous_platforms"]
