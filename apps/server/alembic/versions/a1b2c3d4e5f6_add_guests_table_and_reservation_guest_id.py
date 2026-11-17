"""Add guests table and reservation guest_id

Revision ID: a1b2c3d4e5f6
Revises: f3a4b5c6d7e8
Create Date: 2026-11-16 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f3a4b5c6d7e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("document_or_keyword", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_guests_id", "guests", ["id"], unique=False)
    op.create_index("ix_guests_owner_id", "guests", ["owner_id"], unique=False)
    op.create_index(
        "uq_guests_owner_document_or_keyword",
        "guests",
        ["owner_id", "document_or_keyword"],
        unique=True,
        postgresql_where=sa.text("document_or_keyword IS NOT NULL"),
    )

    # RLS policies
    op.execute("ALTER TABLE guests ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE guests FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY backend_full_access ON guests
        FOR ALL
        USING (true)
        WITH CHECK (true);
    """)

    # Alter reservations table to add guest_id
    op.add_column(
        "reservations",
        sa.Column("guest_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_reservations_guest_id_guests",
        "reservations",
        "guests",
        ["guest_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_reservations_guest_id", "reservations", ["guest_id"], unique=False)


def downgrade() -> None:
    op.drop_constraint("fk_reservations_guest_id_guests", "reservations", type_="foreignkey")
    op.drop_index("ix_reservations_guest_id", table_name="reservations")
    op.drop_column("reservations", "guest_id")

    op.execute("DROP POLICY IF EXISTS backend_full_access ON guests;")
    op.drop_index("uq_guests_owner_document_or_keyword", table_name="guests")
    op.drop_index("ix_guests_owner_id", table_name="guests")
    op.drop_index("ix_guests_id", table_name="guests")
    op.drop_table("guests")
