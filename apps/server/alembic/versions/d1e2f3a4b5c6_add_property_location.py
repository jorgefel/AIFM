"""Add country, city and neighborhood to properties.

Revision ID: d1e2f3a4b5c6
Revises: c8d0e1f2a3b4
Create Date: 2026-11-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c8d0e1f2a3b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("properties", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("properties", sa.Column("neighborhood", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "neighborhood")
    op.drop_column("properties", "city")
    op.drop_column("properties", "country")
