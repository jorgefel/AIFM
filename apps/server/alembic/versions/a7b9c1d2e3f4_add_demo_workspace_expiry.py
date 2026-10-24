"""Add expiry for short-lived demo workspaces.

Revision ID: a7b9c1d2e3f4
Revises: f6a7b8c9d0e1
Create Date: 2026-10-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b9c1d2e3f4"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("demo_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_demo_expires_at", "users", ["demo_expires_at"])


def downgrade() -> None:
    op.drop_index("ix_users_demo_expires_at", table_name="users")
    op.drop_column("users", "demo_expires_at")
