"""Add incomes table and category budgets

Revision ID: 3a1f4d2c9c5b
Revises: 9d2c0a1f7c8e
Create Date: 2026-01-03 16:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a1f4d2c9c5b'
down_revision = '9d2c0a1f7c8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('categories', sa.Column('budget_monthly', sa.Numeric(precision=10, scale=2), nullable=True))
    op.create_table(
        'incomes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('is_recurring', sa.Boolean(), nullable=True),
        sa.Column('frequency', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('incomes')
    op.drop_column('categories', 'budget_monthly')
