"""Add wishlist image url

Revision ID: 9d2c0a1f7c8e
Revises: 625e5fe514b3
Create Date: 2026-01-03 15:12:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d2c0a1f7c8e'
down_revision = '625e5fe514b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('wishlist', sa.Column('image_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('wishlist', 'image_url')
