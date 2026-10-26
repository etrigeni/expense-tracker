from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
from datetime import date
from decimal import Decimal
import uuid
from app.database import get_db
from app.models import User, Expense, RecurringPayment
from app.schemas import ExpenseCreate, ExpenseResponse, ExpenseStats, ExpenseUpdate, RecurringPaymentUpdate
from app.dependencies import get_current_user
from app.recurring import month_end, month_start, occurrences_in_month

router = APIRouter(prefix="/expenses", tags=["expenses"])


def as_occurrence(expense: Expense, on: date, paid_ids: set[uuid.UUID]) -> ExpenseResponse:
    response = ExpenseResponse.model_validate(expense)
    update = {"date": on, "start_date": expense.date}
    if expense.is_recurring:
        update["paid"] = expense.id in paid_ids
    return response.model_copy(update=update)


@router.get("/", response_model=list[ExpenseResponse])
async def get_expenses(
    month: Optional[date] = Query(None, description="Any day in the month; returns that month with recurring expenses included"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user expenses. With `month`, returns every expense that counts in that month, recurring ones included."""
    query = select(Expense).where(Expense.user_id == current_user.id)
    if category:
        query = query.where(Expense.category == category)

    if month:
        start, end = month_start(month), month_end(month)
        query = query.where(
            or_(
                and_(Expense.date >= start, Expense.date <= end),
                and_(
                    Expense.is_recurring.is_(True),
                    Expense.date <= end,
                    or_(Expense.recurring_until.is_(None), Expense.recurring_until >= start),
                ),
            )
        )
        result = await db.execute(query)
        expenses = result.scalars().all()
        paid = await db.execute(
            select(RecurringPayment.expense_id).where(
                and_(
                    RecurringPayment.month == start,
                    RecurringPayment.expense_id.in_([expense.id for expense in expenses if expense.is_recurring]),
                )
            )
        )
        paid_ids = set(paid.scalars().all())
        occurrences = [as_occurrence(expense, on, paid_ids) for expense, on in occurrences_in_month(expenses, start)]
        return sorted(occurrences, key=lambda item: item.date, reverse=True)

    if date_from:
        query = query.where(Expense.date >= date_from)
    if date_to:
        query = query.where(Expense.date <= date_to)

    query = query.order_by(Expense.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/recurring", response_model=list[ExpenseResponse])
async def get_recurring_expenses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recurring expenses that still apply this month or later."""
    start = month_start(date.today())
    result = await db.execute(
        select(Expense)
        .where(
            and_(
                Expense.user_id == current_user.id,
                Expense.is_recurring.is_(True),
                or_(Expense.recurring_until.is_(None), Expense.recurring_until >= start),
            )
        )
        .order_by(Expense.amount.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new expense"""
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense_data.amount,
        category=expense_data.category,
        date=expense_data.date,
        description=expense_data.description,
        is_recurring=expense_data.is_recurring,
        recurring_until=expense_data.recurring_until if expense_data.is_recurring else None,
    )

    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    return new_expense


@router.get("/stats", response_model=ExpenseStats)
async def get_expense_stats(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get expense statistics"""
    query = select(Expense).where(Expense.user_id == current_user.id)

    # Apply filters
    if date_from:
        query = query.where(Expense.date >= date_from)
    if date_to:
        query = query.where(Expense.date <= date_to)

    result = await db.execute(query)
    expenses = result.scalars().all()

    # Calculate total
    total = sum(expense.amount for expense in expenses)

    # Calculate by category
    by_category = {}
    for expense in expenses:
        if expense.category in by_category:
            by_category[expense.category] += expense.amount
        else:
            by_category[expense.category] = expense.amount

    return {
        "total": total,
        "by_category": by_category,
        "count": len(expenses),
    }


@router.put("/{expense_id}/paid", status_code=status.HTTP_200_OK)
async def set_recurring_paid(
    expense_id: uuid.UUID,
    payment: RecurringPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tick or untick a recurring expense as paid for one month."""
    result = await db.execute(
        select(Expense).where(and_(Expense.id == expense_id, Expense.user_id == current_user.id))
    )
    expense = result.scalar_one_or_none()
    if expense is None or not expense.is_recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring expense not found")

    month = month_start(payment.month)
    result = await db.execute(
        select(RecurringPayment).where(
            and_(RecurringPayment.expense_id == expense.id, RecurringPayment.month == month)
        )
    )
    existing = result.scalar_one_or_none()
    if payment.paid and existing is None:
        db.add(RecurringPayment(expense_id=expense.id, month=month))
    elif not payment.paid and existing is not None:
        await db.delete(existing)
    await db.commit()

    return {"expense_id": expense.id, "month": month, "paid": payment.paid}


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single expense"""
    result = await db.execute(
        select(Expense).where(
            and_(Expense.id == expense_id, Expense.user_id == current_user.id)
        )
    )
    expense = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: uuid.UUID,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an expense. Only the fields sent are changed, so `recurring_until` can be cleared with null."""
    result = await db.execute(
        select(Expense).where(
            and_(Expense.id == expense_id, Expense.user_id == current_user.id)
        )
    )
    expense = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    for field, value in expense_data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    if not expense.is_recurring:
        expense.recurring_until = None

    await db.commit()
    await db.refresh(expense)

    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an expense"""
    result = await db.execute(
        select(Expense).where(
            and_(Expense.id == expense_id, Expense.user_id == current_user.id)
        )
    )
    expense = result.scalar_one_or_none()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    await db.delete(expense)
    await db.commit()

    return {"message": "Expense deleted successfully"}
