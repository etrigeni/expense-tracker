from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, extract
from decimal import Decimal
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models import User, Expense, Income, Savings
from app.schemas import DashboardOverview, CategorySummary, ExpenseResponse, MonthlyCategorySpend, MonthlyAmount
from app.dependencies import get_current_user
from app.utils import calculate_percentage
from app import recurring

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
    current_month_start = today.replace(day=1)
    trend_start = shift_month(current_month_start, -5)
    previous_month_start = shift_month(current_month_start, -1)
    previous_month_end = current_month_start - timedelta(days=1)

    # Every expense that can count in the trend window: one-offs dated inside it, plus
    # recurring expenses that started before its end and had not stopped before its start.
    result = await db.execute(
        select(Expense).where(
            and_(
                Expense.user_id == current_user.id,
                or_(
                    Expense.date >= trend_start,
                    and_(
                        Expense.is_recurring.is_(True),
                        or_(Expense.recurring_until.is_(None), Expense.recurring_until >= trend_start),
                    ),
                ),
                Expense.date <= recurring.month_end(today),
            )
        )
    )
    window_expenses = result.scalars().all()

    def expenses_in(month: date) -> list[Expense]:
        return [expense for expense, _ in recurring.occurrences_in_month(window_expenses, month)]

    monthly_expenses = expenses_in(current_month_start)
    total_expenses_month = sum((expense.amount for expense in monthly_expenses), Decimal("0.00"))
    total_expenses_previous = sum((expense.amount for expense in expenses_in(previous_month_start)), Decimal("0.00"))

    category_totals: dict[str, Decimal] = {}
    for expense in monthly_expenses:
        category_totals[expense.category] = category_totals.get(expense.category, Decimal("0.00")) + expense.amount

    expenses_by_category = [
        CategorySummary(category=category, total=total, percentage=calculate_percentage(total, total_expenses_month))
        for category, total in category_totals.items()
    ]
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

    # Monthly category spend (last 6 months including current), recurring expenses in every month they apply
    monthly_category_spend = []
    for offset in range(-5, 1):
        month = shift_month(current_month_start, offset)
        totals: dict[str, Decimal] = {}
        for expense in expenses_in(month):
            totals[expense.category] = totals.get(expense.category, Decimal("0.00")) + expense.amount
        monthly_category_spend.extend(
            MonthlyCategorySpend(month=month, category=category, total=total) for category, total in sorted(totals.items())
        )

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
    )
