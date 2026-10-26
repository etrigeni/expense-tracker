"""Add monthly recurring expenses and their paid checklist

Revision ID: b4e8c2d17a90
Revises: 5c9c1e7f2b1a
Create Date: 2026-10-26 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b4e8c2d17a90'
down_revision = '5c9c1e7f2b1a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('is_recurring', sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column('expenses', sa.Column('recurring_until', sa.Date(), nullable=True))
    op.create_table(
        'recurring_payments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('expense_id', sa.UUID(), nullable=False),
        sa.Column('month', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('expense_id', 'month', name='uq_recurring_payment_month'),
    )


def downgrade() -> None:
    op.drop_table('recurring_payments')
    op.drop_column('expenses', 'recurring_until')
    op.drop_column('expenses', 'is_recurring')
