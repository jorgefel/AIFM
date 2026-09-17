"""Add tier column to users

Revision ID: d4a7f1e2b8c3
Revises: c82d9a3b5f12
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4a7f1e2b8c3"
down_revision: Union[str, None] = "c82d9a3b5f12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("tier", sa.String(length=20), nullable=False, server_default="free"),
    )


def downgrade() -> None:
    op.drop_column("users", "tier")
