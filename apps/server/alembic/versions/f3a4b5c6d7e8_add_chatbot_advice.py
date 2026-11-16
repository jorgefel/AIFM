"""Add chatbot_advice table for deterministic recommendation memory

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-11-16 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f3a4b5c6d7e8"
down_revision: Union[str, None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chatbot_advice",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("rec_key", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("evidence_json", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("metrics_json", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("as_of", sa.Date(), nullable=False),
        sa.Column("as_of_month", sa.String(length=7), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("property_id", "rec_key", "as_of_month", name="uq_chatbot_advice_property_rec_month"),
    )
    op.create_index("ix_chatbot_advice_id", "chatbot_advice", ["id"], unique=False)
    op.create_index("ix_chatbot_advice_property_id", "chatbot_advice", ["property_id"], unique=False)
    op.create_index("ix_chatbot_advice_rec_key", "chatbot_advice", ["rec_key"], unique=False)
    op.create_index("ix_chatbot_advice_as_of_month", "chatbot_advice", ["as_of_month"], unique=False)

    # RLS matching project conventions
    op.execute("ALTER TABLE chatbot_advice ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE chatbot_advice FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY backend_full_access ON chatbot_advice
        FOR ALL
        USING (true)
        WITH CHECK (true);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS backend_full_access ON chatbot_advice;")
    op.execute("ALTER TABLE chatbot_advice NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE chatbot_advice DISABLE ROW LEVEL SECURITY;")
    op.drop_index("ix_chatbot_advice_as_of_month", table_name="chatbot_advice")
    op.drop_index("ix_chatbot_advice_rec_key", table_name="chatbot_advice")
    op.drop_index("ix_chatbot_advice_property_id", table_name="chatbot_advice")
    op.drop_index("ix_chatbot_advice_id", table_name="chatbot_advice")
    op.drop_table("chatbot_advice")
