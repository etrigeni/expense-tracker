"""Add savings table

Revision ID: 5c9c1e7f2b1a
Revises: 7b21f1b8a2d4
Create Date: 2026-01-03 18:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5c9c1e7f2b1a'
down_revision = '7b21f1b8a2d4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'savings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('month', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'month', name='uq_user_month_savings'),
    )
    op.create_index('ix_savings_user_month', 'savings', ['user_id', 'month'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_savings_user_month', table_name='savings')
    op.drop_table('savings')
