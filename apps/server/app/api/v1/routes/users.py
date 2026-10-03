from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import OnboardingProgressUpdate, UserProfileUpdate, UserRead

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza los datos de perfil que no afectan autenticación ni permisos."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user


def _missing_onboarding_fields(user: User) -> list[str]:
    required_fields = {
        "full_name": user.full_name,
        "age": user.age,
        "rental_experience_years": user.rental_experience_years,
        "average_monthly_reservations": user.average_monthly_reservations,
        "previous_platforms": user.previous_platforms,
    }
    return [field for field, value in required_fields.items() if value is None or value == []]


@router.patch("/me/onboarding", response_model=UserRead)
async def update_onboarding(
    payload: OnboardingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Guarda el progreso del cuestionario; solo lo marca completo cuando es válido."""
    values = payload.model_dump(exclude_unset=True, exclude={"complete"})
    for field, value in values.items():
        setattr(current_user, field, value)

    if payload.complete:
        missing_fields = _missing_onboarding_fields(current_user)
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "message": "Completa los campos requeridos antes de finalizar.",
                    "missing_fields": missing_fields,
                },
            )
        current_user.onboarding_completed = True
        current_user.onboarding_completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(current_user)
    return current_user
