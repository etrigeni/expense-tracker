from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, extract
from decimal import Decimal
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models import User, Expense, Wishlist, Income, Savings
from app.schemas import DashboardOverview, CategorySummary, ExpenseResponse, MonthlyCategorySpend, MonthlyAmount
from app.dependencies import get_current_user
from app.utils import calculate_percentage

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def shift_month(date_value: date, delta: int) -> date:
    """Shift date by delta months, normalized to the first day of the month."""
    year = date_value.year + (date_value.month - 1 + delta) // 12
    month = (date_value.month - 1 + delta) % 12 + 1
    return date(year, month, 1)


def calculate_mom(current: Decimal, previous: Decimal) -> float | None:
    if previous == 0:
        return None
    return float(((current - previous) / previous) * Decimal("100"))


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard summary"""
    today = date.today()
    current_month = today.month
    current_year = today.year
    current_month_start = today.replace(day=1)
    trend_start = shift_month(current_month_start, -5)
    previous_month_start = shift_month(current_month_start, -1)
    previous_month_end = current_month_start - timedelta(days=1)

    # Get expenses for current month
    result = await db.execute(
        select(Expense).where(
            and_(
                Expense.user_id == current_user.id,
                extract("year", Expense.date) == current_year,
                extract("month", Expense.date) == current_month,
            )
        )
    )
    monthly_expenses = result.scalars().all()

    # Calculate total expenses for the month
    total_expenses_month = sum(
        expense.amount for expense in monthly_expenses
    ) if monthly_expenses else Decimal("0.00")

    # Calculate total expenses for previous month
    result = await db.execute(
        select(func.sum(Expense.amount)).where(
            and_(
                Expense.user_id == current_user.id,
                Expense.date >= previous_month_start,
                Expense.date <= previous_month_end,
            )
        )
    )
    total_expenses_previous = result.scalar_one() or Decimal("0.00")

    # Calculate expenses by category
    category_totals = {}
    for expense in monthly_expenses:
        if expense.category in category_totals:
            category_totals[expense.category] += expense.amount
        else:
            category_totals[expense.category] = expense.amount

    # Create category summary with percentages
    expenses_by_category = []
    for category, total in category_totals.items():
        percentage = calculate_percentage(total, total_expenses_month)
        expenses_by_category.append(
            CategorySummary(category=category, total=total, percentage=percentage)
        )

    # Sort by total descending
    expenses_by_category.sort(key=lambda x: x.total, reverse=True)

    # Get recent transactions (last 10)
    result = await db.execute(
        select(Expense)
        .where(Expense.user_id == current_user.id)
        .order_by(Expense.date.desc())
        .limit(10)
    )
    recent_transactions = result.scalars().all()

    # Get income total for the month (including recurring)
    month_start = current_month_start
    result = await db.execute(
        select(func.sum(Income.amount)).where(
            and_(
                Income.user_id == current_user.id,
                or_(
                    and_(Income.date >= month_start, Income.date <= today),
                    and_(Income.is_recurring == True, Income.date <= today),
                ),
            )
        )
    )
    income_total_month = result.scalar_one() or Decimal("0.00")

    # Get income total for previous month (including recurring)
    result = await db.execute(
        select(func.sum(Income.amount)).where(
            and_(
                Income.user_id == current_user.id,
                or_(
                    and_(Income.date >= previous_month_start, Income.date <= previous_month_end),
                    and_(Income.is_recurring == True, Income.date <= previous_month_end),
                ),
            )
        )
    )
    income_total_previous = result.scalar_one() or Decimal("0.00")

    # Get wishlist total
    result = await db.execute(
        select(func.sum(Wishlist.price), func.count(Wishlist.id)).where(
            Wishlist.user_id == current_user.id
        )
    )
    wishlist_total, wishlist_count = result.one()

    # Monthly category spend (last 6 months including current)
    result = await db.execute(
        select(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .where(
            and_(
                Expense.user_id == current_user.id,
                Expense.date >= trend_start,
            )
        )
        .group_by("year", "month", Expense.category)
        .order_by("year", "month")
    )
    monthly_category_spend = [
        MonthlyCategorySpend(
            month=date(int(row.year), int(row.month), 1),
            category=row.category,
            total=row.total,
        )
        for row in result
    ]

    # Monthly income totals (last 6 months)
    result = await db.execute(
        select(
            extract("year", Income.date).label("year"),
            extract("month", Income.date).label("month"),
            func.sum(Income.amount).label("total"),
        )
        .where(
            and_(
                Income.user_id == current_user.id,
                Income.date >= trend_start,
            )
        )
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_income = [
        MonthlyAmount(
            month=date(int(row.year), int(row.month), 1),
            total=row.total,
        )
        for row in result
    ]

    # Monthly savings totals (last 6 months)
    result = await db.execute(
        select(
            extract("year", Savings.month).label("year"),
            extract("month", Savings.month).label("month"),
            func.sum(Savings.amount).label("total"),
        )
        .where(
            and_(
                Savings.user_id == current_user.id,
                Savings.month >= trend_start,
            )
        )
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_savings = [
        MonthlyAmount(
            month=date(int(row.year), int(row.month), 1),
            total=row.total,
        )
        for row in result
        if row.total is not None
    ]

    return DashboardOverview(
        total_expenses_month=total_expenses_month,
        income_total_month=income_total_month,
        net_balance_month=income_total_month - total_expenses_month,
        expenses_mom_percentage=calculate_mom(total_expenses_month, total_expenses_previous),
        income_mom_percentage=calculate_mom(income_total_month, income_total_previous),
        expenses_by_category=expenses_by_category,
        monthly_category_spend=monthly_category_spend,
        monthly_income=monthly_income,
        monthly_savings=monthly_savings,
        recent_transactions=recent_transactions,
        wishlist_total=wishlist_total if wishlist_total is not None else Decimal("0.00"),
        wishlist_count=wishlist_count if wishlist_count is not None else 0,
    )
