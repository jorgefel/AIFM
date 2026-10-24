"""Merge the demo workspace and chat migration branches.

Revision ID: c8d0e1f2a3b4
Revises: a7b9c1d2e3f4, b41746437a05
Create Date: 2026-10-23 00:00:00.000000
"""

from typing import Sequence, Union


revision: str = "c8d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = ("a7b9c1d2e3f4", "b41746437a05")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
