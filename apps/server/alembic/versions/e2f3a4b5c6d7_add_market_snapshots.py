"""Add market_snapshots table for competitor evidence history

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-11-16 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "market_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("comparables_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("median_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("price_min", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("price_max", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("own_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("position", sa.String(length=50), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="MXN"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("property_id", "snapshot_date", name="uq_market_snapshots_property_date"),
    )
    op.create_index("ix_market_snapshots_id", "market_snapshots", ["id"], unique=False)
    op.create_index("ix_market_snapshots_property_id", "market_snapshots", ["property_id"], unique=False)

    # RLS matching project conventions
    op.execute("ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE market_snapshots FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY backend_full_access ON market_snapshots
        FOR ALL
        USING (true)
        WITH CHECK (true);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS backend_full_access ON market_snapshots;")
    op.execute("ALTER TABLE market_snapshots NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE market_snapshots DISABLE ROW LEVEL SECURITY;")
    op.drop_index("ix_market_snapshots_property_id", table_name="market_snapshots")
    op.drop_index("ix_market_snapshots_id", table_name="market_snapshots")
    op.drop_table("market_snapshots")
