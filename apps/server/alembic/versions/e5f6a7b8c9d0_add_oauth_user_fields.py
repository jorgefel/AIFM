"""Add OAuth identities to users.

Revision ID: e5f6a7b8c9d0
Revises: d4a7f1e2b8c3
Create Date: 2026-09-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4a7f1e2b8c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("google_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("apple_id", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column("auth_provider", sa.String(length=20), nullable=False, server_default="email"),
    )
    op.create_unique_constraint("uq_users_google_id", "users", ["google_id"])
    op.create_unique_constraint("uq_users_apple_id", "users", ["apple_id"])


def downgrade() -> None:
    op.drop_constraint("uq_users_apple_id", "users", type_="unique")
    op.drop_constraint("uq_users_google_id", "users", type_="unique")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "apple_id")
    op.drop_column("users", "google_id")
    op.execute("UPDATE users SET hashed_password = '!' WHERE hashed_password IS NULL")
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=False)
