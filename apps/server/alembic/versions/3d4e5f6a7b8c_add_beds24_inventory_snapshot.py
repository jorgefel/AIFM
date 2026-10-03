"""Persist Beds24 daily inventory snapshots for the local calendar.

Revision ID: 3d4e5f6a7b8c
Revises: 2c3d4e5f6a7b
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "3d4e5f6a7b8c"
down_revision: Union[str, None] = "2c3d4e5f6a7b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("channel_connections", sa.Column("last_inventory_sync_at", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "channel_inventory_days",
        sa.Column("channel_connection_id", sa.UUID(), nullable=False), sa.Column("property_id", sa.UUID(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False), sa.Column("available_units", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("price", sa.Numeric(10, 2), nullable=True), sa.Column("source", sa.String(length=30), nullable=False, server_default="beds24"),
        sa.Column("id", sa.UUID(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["channel_connection_id"], ["channel_connections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("channel_connection_id", "property_id", "date", name="uq_channel_inventory_day"),
    )
    op.create_index("ix_channel_inventory_days_connection_date", "channel_inventory_days", ["channel_connection_id", "date"])
    op.create_index("ix_channel_inventory_days_property_date", "channel_inventory_days", ["property_id", "date"])

def downgrade() -> None:
    op.drop_index("ix_channel_inventory_days_property_date", table_name="channel_inventory_days")
    op.drop_index("ix_channel_inventory_days_connection_date", table_name="channel_inventory_days")
    op.drop_table("channel_inventory_days")
    op.drop_column("channel_connections", "last_inventory_sync_at")
