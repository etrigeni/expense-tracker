"""Rename the Food category to Food & coffee

Revision ID: d2a6e4b8c1f3
Revises: c7f1a9e3b2d5
Create Date: 2026-10-31 15:00:00.000000

Expenses store the category by name, so they are renamed too.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'd2a6e4b8c1f3'
down_revision = 'c7f1a9e3b2d5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE categories SET name = 'Food & coffee' WHERE name = 'Food' AND user_id IS NULL")
    op.execute("UPDATE expenses SET category = 'Food & coffee' WHERE category = 'Food'")


def downgrade() -> None:
    op.execute("UPDATE expenses SET category = 'Food' WHERE category = 'Food & coffee'")
    op.execute("UPDATE categories SET name = 'Food' WHERE name = 'Food & coffee' AND user_id IS NULL")
