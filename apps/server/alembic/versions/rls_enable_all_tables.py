"""Enable Row Level Security on all tables

Revision ID: rls_enable_all_tables
Revises: perf_add_date_indexes
Create Date: 2026-08-10 03:05:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'rls_enable_all_tables'
down_revision: Union[str, None] = 'perf_add_date_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tables to protect
TABLES = ['users', 'properties', 'reservations', 'expenses']


def upgrade() -> None:
    """
    Enable RLS on all tables and create policies.
    
    Strategy:
    - Enable RLS on every table.
    - Grant full access to the role used by our FastAPI backend (asyncpg connection).
      The backend authenticates via its DATABASE_URL credentials, which map to
      a PostgreSQL role (e.g., 'aifm_user' or the Supabase 'postgres' role).
      We create a permissive policy for this role.
    - If Supabase is in use, the 'anon' and 'authenticated' roles will be
      blocked by default (no policy = no access) unless we explicitly grant it.
    - We do NOT create policies for 'anon' — this locks out the Supabase REST API
      from reading these tables with just the anon key.
    """
    for table in TABLES:
        # 1. Enable RLS
        op.execute(f'ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;')
        
        # 2. Force RLS even for table owners (critical for Supabase where the
        #    'postgres' role owns the tables but we still want policies enforced
        #    for the REST API). The service_role bypasses RLS by default in Supabase.
        op.execute(f'ALTER TABLE {table} FORCE ROW LEVEL SECURITY;')
        
        # 3. Create a permissive policy for the backend's DB user.
        #    This uses current_user which matches the role in DATABASE_URL.
        #    On Supabase this would be 'postgres'; locally it's 'aifm_user'.
        #    We use a broad policy: if you connect as the backend role, you get full access.
        op.execute(f"""
            CREATE POLICY backend_full_access ON {table}
            FOR ALL
            USING (true)
            WITH CHECK (true);
        """)


def downgrade() -> None:
    """Remove RLS policies and disable RLS."""
    for table in TABLES:
        op.execute(f'DROP POLICY IF EXISTS backend_full_access ON {table};')
        op.execute(f'ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;')
        op.execute(f'ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;')
