"""Add profile and onboarding fields to users.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-10-02 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("rental_experience_years", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("average_monthly_reservations", sa.Integer(), nullable=True))
    op.add_column(
        "users",
        sa.Column("previous_platforms", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    op.add_column(
        "users",
        sa.Column("preferences", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("users", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed_at")
    op.drop_column("users", "onboarding_completed")
    op.drop_column("users", "preferences")
    op.drop_column("users", "previous_platforms")
    op.drop_column("users", "average_monthly_reservations")
    op.drop_column("users", "rental_experience_years")
    op.drop_column("users", "age")
    op.drop_column("users", "phone")
