"""Add trips

Revision ID: e5c3f7a9d2b4
Revises: d2a6e4b8c1f3
Create Date: 2026-10-31 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5c3f7a9d2b4'
down_revision = 'd2a6e4b8c1f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'trips',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trips_user_id', 'trips', ['user_id'])
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.add_column(sa.Column('trip_id', sa.UUID(), nullable=True))
        batch_op.create_foreign_key('fk_expenses_trip_id', 'trips', ['trip_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index('ix_expenses_trip_id', ['trip_id'])


def downgrade() -> None:
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_index('ix_expenses_trip_id')
        batch_op.drop_constraint('fk_expenses_trip_id', type_='foreignkey')
        batch_op.drop_column('trip_id')
    op.drop_index('ix_trips_user_id', table_name='trips')
    op.drop_table('trips')
