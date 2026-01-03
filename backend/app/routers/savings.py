from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from app.database import get_db
from app.models import User, Savings
from app.schemas import SavingsUpsert, SavingsResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/savings", tags=["savings"])


def normalize_month(value: date) -> date:
    return value.replace(day=1)


@router.get("/", response_model=SavingsResponse | None)
async def get_savings(
    month: date | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get savings entry for a specific month (defaults to current month)."""
    target_month = normalize_month(month or date.today())
    result = await db.execute(
        select(Savings).where(
            and_(
                Savings.user_id == current_user.id,
                Savings.month == target_month,
            )
        )
    )
    return result.scalar_one_or_none()


@router.put("/", response_model=SavingsResponse)
async def upsert_savings(
    savings_data: SavingsUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update savings for a month."""
    target_month = normalize_month(savings_data.month)
    result = await db.execute(
        select(Savings).where(
            and_(
                Savings.user_id == current_user.id,
                Savings.month == target_month,
            )
        )
    )
    savings = result.scalar_one_or_none()

    if savings is None:
        savings = Savings(
            user_id=current_user.id,
            month=target_month,
            amount=savings_data.amount,
        )
        db.add(savings)
    else:
        savings.amount = savings_data.amount

    await db.commit()
    await db.refresh(savings)

    return savings
