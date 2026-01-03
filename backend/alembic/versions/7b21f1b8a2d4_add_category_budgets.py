"""Add category budgets by month

Revision ID: 7b21f1b8a2d4
Revises: 3a1f4d2c9c5b
Create Date: 2026-01-03 17:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import date
import uuid


# revision identifiers, used by Alembic.
revision = '7b21f1b8a2d4'
down_revision = '3a1f4d2c9c5b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'category_budgets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('month', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'category_id', 'month', name='uq_user_category_month_budget'),
    )
    op.create_index('ix_category_budgets_user_month', 'category_budgets', ['user_id', 'month'], unique=False)

    bind = op.get_bind()
    current_month = date.today().replace(day=1)
    result = bind.execute(
        sa.text(
            "SELECT id, user_id, budget_monthly FROM categories "
            "WHERE user_id IS NOT NULL AND budget_monthly IS NOT NULL"
        )
    )
    for row in result:
        bind.execute(
            sa.text(
                "INSERT INTO category_budgets "
                "(id, user_id, category_id, month, amount, created_at) "
                "VALUES (:id, :user_id, :category_id, :month, :amount, CURRENT_TIMESTAMP)"
            ),
            {
                "id": str(uuid.uuid4()),
                "user_id": row.user_id,
                "category_id": row.id,
                "month": current_month,
                "amount": row.budget_monthly,
            },
        )


def downgrade() -> None:
    op.drop_index('ix_category_budgets_user_month', table_name='category_budgets')
    op.drop_table('category_budgets')
