"""Add Beds24 connections, mappings and idempotent booking sync fields.

Revision ID: 2c3d4e5f6a7b
Revises: 1b2c3d4e5f6a
Create Date: 2026-10-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2c3d4e5f6a7b"
down_revision: Union[str, None] = "1b2c3d4e5f6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "channel_connections",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("channel_name", sa.String(length=50), nullable=False),
        sa.Column("channel_account_id", sa.String(length=255), nullable=False),
        sa.Column("credentials", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("bookings_cursor", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_bookings_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_channel_connections_id"), "channel_connections", ["id"])
    op.create_index(op.f("ix_channel_connections_user_id"), "channel_connections", ["user_id"])
    op.create_index(op.f("ix_channel_connections_channel_name"), "channel_connections", ["channel_name"])
    op.create_table(
        "beds24_property_links",
        sa.Column("channel_connection_id", sa.UUID(), nullable=False),
        sa.Column("property_id", sa.UUID(), nullable=False),
        sa.Column("beds24_property_id", sa.String(length=100), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["channel_connection_id"], ["channel_connections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("channel_connection_id", "beds24_property_id", name="uq_beds24_link_remote_property"),
        sa.UniqueConstraint("channel_connection_id", "property_id", name="uq_beds24_link_nomora_property"),
    )
    op.create_index(op.f("ix_beds24_property_links_id"), "beds24_property_links", ["id"])
    op.create_index(op.f("ix_beds24_property_links_channel_connection_id"), "beds24_property_links", ["channel_connection_id"])
    op.create_index(op.f("ix_beds24_property_links_property_id"), "beds24_property_links", ["property_id"])
    op.create_index(op.f("ix_beds24_property_links_beds24_property_id"), "beds24_property_links", ["beds24_property_id"])
    op.create_table(
        "sync_logs",
        sa.Column("channel_connection_id", sa.UUID(), nullable=False),
        sa.Column("sync_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["channel_connection_id"], ["channel_connections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sync_logs_id"), "sync_logs", ["id"])
    op.create_index(op.f("ix_sync_logs_channel_connection_id"), "sync_logs", ["channel_connection_id"])
    op.add_column("reservations", sa.Column("beds24_booking_id", sa.String(length=100), nullable=True))
    op.add_column("reservations", sa.Column("sync_source", sa.String(length=30), nullable=True))
    op.add_column("reservations", sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_reservations_beds24_booking_id"), "reservations", ["beds24_booking_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_reservations_beds24_booking_id"), table_name="reservations")
    op.drop_column("reservations", "synced_at")
    op.drop_column("reservations", "sync_source")
    op.drop_column("reservations", "beds24_booking_id")
    op.drop_index(op.f("ix_sync_logs_channel_connection_id"), table_name="sync_logs")
    op.drop_index(op.f("ix_sync_logs_id"), table_name="sync_logs")
    op.drop_table("sync_logs")
    op.drop_index(op.f("ix_beds24_property_links_beds24_property_id"), table_name="beds24_property_links")
    op.drop_index(op.f("ix_beds24_property_links_property_id"), table_name="beds24_property_links")
    op.drop_index(op.f("ix_beds24_property_links_channel_connection_id"), table_name="beds24_property_links")
    op.drop_index(op.f("ix_beds24_property_links_id"), table_name="beds24_property_links")
    op.drop_table("beds24_property_links")
    op.drop_index(op.f("ix_channel_connections_channel_name"), table_name="channel_connections")
    op.drop_index(op.f("ix_channel_connections_user_id"), table_name="channel_connections")
    op.drop_index(op.f("ix_channel_connections_id"), table_name="channel_connections")
    op.drop_table("channel_connections")
