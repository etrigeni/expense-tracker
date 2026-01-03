from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import Optional
from datetime import date
from decimal import Decimal
import uuid
from app.database import get_db
from app.models import User, Income
from app.schemas import IncomeCreate, IncomeUpdate, IncomeResponse, IncomeTotal
from app.dependencies import get_current_user

router = APIRouter(prefix="/incomes", tags=["incomes"])


@router.get("/", response_model=list[IncomeResponse])
async def get_incomes(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_recurring: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all user income records with optional filters"""
    query = select(Income).where(Income.user_id == current_user.id)

    if date_from:
        query = query.where(Income.date >= date_from)
    if date_to:
        query = query.where(Income.date <= date_to)
    if is_recurring is not None:
        query = query.where(Income.is_recurring == is_recurring)

    query = query.order_by(Income.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
async def create_income(
    income_data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new income record"""
    new_income = Income(
        user_id=current_user.id,
        source=income_data.source,
        amount=income_data.amount,
        date=income_data.date,
        is_recurring=income_data.is_recurring,
        frequency=income_data.frequency,
        notes=income_data.notes,
    )

    db.add(new_income)
    await db.commit()
    await db.refresh(new_income)

    return new_income


@router.get("/total", response_model=IncomeTotal)
async def get_income_total(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get total income for the current month (including recurring)"""
    today = date.today()
    month_start = today.replace(day=1)

    result = await db.execute(
        select(func.sum(Income.amount), func.count(Income.id)).where(
            and_(
                Income.user_id == current_user.id,
                or_(
                    and_(Income.date >= month_start, Income.date <= today),
                    and_(Income.is_recurring == True, Income.date <= today),
                ),
            )
        )
    )
    total, count = result.one()

    return {
        "total": total if total is not None else Decimal("0.00"),
        "count": count if count is not None else 0,
    }


@router.get("/{income_id}", response_model=IncomeResponse)
async def get_income(
    income_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single income record"""
    result = await db.execute(
        select(Income).where(
            and_(Income.id == income_id, Income.user_id == current_user.id)
        )
    )
    income = result.scalar_one_or_none()

    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )

    return income


@router.put("/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: uuid.UUID,
    income_data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an income record"""
    result = await db.execute(
        select(Income).where(
            and_(Income.id == income_id, Income.user_id == current_user.id)
        )
    )
    income = result.scalar_one_or_none()

    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )

    if income_data.source is not None:
        income.source = income_data.source
    if income_data.amount is not None:
        income.amount = income_data.amount
    if income_data.date is not None:
        income.date = income_data.date
    if income_data.is_recurring is not None:
        income.is_recurring = income_data.is_recurring
    if income_data.frequency is not None:
        income.frequency = income_data.frequency
    if income_data.notes is not None:
        income.notes = income_data.notes

    await db.commit()
    await db.refresh(income)

    return income


@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
async def delete_income(
    income_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an income record"""
    result = await db.execute(
        select(Income).where(
            and_(Income.id == income_id, Income.user_id == current_user.id)
        )
    )
    income = result.scalar_one_or_none()

    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )

    await db.delete(income)
    await db.commit()

    return {"message": "Income record deleted successfully"}
