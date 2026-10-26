"""Remove wishlist and category budgets

Revision ID: c7f1a9e3b2d5
Revises: b4e8c2d17a90
Create Date: 2026-10-26 22:30:00.000000

Drops their data. Downgrade recreates the empty tables and column.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7f1a9e3b2d5'
down_revision = 'b4e8c2d17a90'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index('ix_category_budgets_user_month', table_name='category_budgets')
    op.drop_table('category_budgets')
    op.drop_table('wishlist')
    with op.batch_alter_table('categories') as batch_op:
        batch_op.drop_column('budget_monthly')


def downgrade() -> None:
    with op.batch_alter_table('categories') as batch_op:
        batch_op.add_column(sa.Column('budget_monthly', sa.Numeric(precision=10, scale=2), nullable=True))
    op.create_table(
        'wishlist',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('item_name', sa.String(), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
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
