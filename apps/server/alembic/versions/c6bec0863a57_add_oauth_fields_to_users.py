"""add_oauth_fields_to_users

Revision ID: c6bec0863a57
Revises: e5f6a7b8c9d0
Create Date: 2026-09-25 20:50:35.614984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6bec0863a57'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('apple_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('auth_provider', sa.String(length=20), server_default='email', nullable=False))
    
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
    op.create_unique_constraint('uq_users_apple_id', 'users', ['apple_id'])
    
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
               
    op.drop_constraint('uq_users_apple_id', 'users', type_='unique')
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'apple_id')
    op.drop_column('users', 'google_id')
