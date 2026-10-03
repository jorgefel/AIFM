"""Add full property profile fields.

Revision ID: 0a1b2c3d4e5f
Revises: f6a7b8c9d0e1
Create Date: 2026-10-02 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0a1b2c3d4e5f"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("property_type", sa.String(length=30), nullable=False, server_default="apartment"))
    op.add_column("properties", sa.Column("max_guests", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("properties", sa.Column("bedrooms", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("properties", sa.Column("bathrooms", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("properties", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("properties", sa.Column("nightly_rate", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column("properties", sa.Column("amenities", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.add_column("properties", sa.Column("published_platforms", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.add_column("properties", sa.Column("photo_urls", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))


def downgrade() -> None:
    op.drop_column("properties", "photo_urls")
    op.drop_column("properties", "published_platforms")
    op.drop_column("properties", "amenities")
    op.drop_column("properties", "nightly_rate")
    op.drop_column("properties", "description")
    op.drop_column("properties", "bathrooms")
    op.drop_column("properties", "bedrooms")
    op.drop_column("properties", "max_guests")
    op.drop_column("properties", "property_type")
