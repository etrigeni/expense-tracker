from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from decimal import Decimal
from datetime import date
from app.database import get_db
from app.models import User, Expense, Income, Savings
from app.schemas import DashboardOverview, CategorySummary, MonthlyCategorySpend, MonthlyAmount
from app.dependencies import get_current_user
from app.utils import calculate_percentage
from app.periods import period_bounds, period_for, shift_month
from app.recurring import occurrences_in_period

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

TREND_PERIODS = 6
ZERO = Decimal("0.00")


def calculate_mom(current: Decimal, previous: Decimal) -> float | None:
    if previous == 0:
        return None
    return float(((current - previous) / previous) * Decimal("100"))


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Summary of the current pay period, with the previous one and a trend of the last six."""
    current = period_for(date.today())
    labels = [shift_month(current, offset) for offset in range(-(TREND_PERIODS - 1), 1)]
    bounds = {label: period_bounds(label) for label in labels}
    window_start, window_end = bounds[labels[0]][0], bounds[current][1]

    # Every expense that can count in the trend window: one-offs dated inside it, plus
    # recurring expenses that started before its end and had not stopped before its start.
    result = await db.execute(
        select(Expense).where(
            and_(
                Expense.user_id == current_user.id,
                Expense.date <= window_end,
                or_(
                    Expense.date >= window_start,
                    and_(
                        Expense.is_recurring.is_(True),
                        or_(Expense.recurring_until.is_(None), Expense.recurring_until >= window_start),
                    ),
                ),
            )
        )
    )
    window_expenses = result.scalars().all()

    def expenses_in(label: date) -> list[Expense]:
        return [expense for expense, _ in occurrences_in_period(window_expenses, *bounds[label])]

    # Income: entries dated in the period, plus recurring income in every period from its start
    result = await db.execute(
        select(Income).where(
            and_(
                Income.user_id == current_user.id,
                Income.date <= window_end,
                or_(Income.date >= window_start, Income.is_recurring.is_(True)),
            )
        )
    )
    window_incomes = result.scalars().all()

    def income_in(label: date) -> Decimal:
        start, end = bounds[label]
        return sum(
            (
                income.amount
                for income in window_incomes
                if (start <= income.date <= end) or (income.is_recurring and income.date <= end)
            ),
            ZERO,
        )

    current_expenses = expenses_in(current)
    total_expenses = sum((expense.amount for expense in current_expenses), ZERO)
    previous = labels[-2]
    total_expenses_previous = sum((expense.amount for expense in expenses_in(previous)), ZERO)
    income_total = income_in(current)

    category_totals: dict[str, Decimal] = {}
    for expense in current_expenses:
        category_totals[expense.category] = category_totals.get(expense.category, ZERO) + expense.amount
    expenses_by_category = sorted(
        (
            CategorySummary(category=category, total=total, percentage=calculate_percentage(total, total_expenses))
            for category, total in category_totals.items()
        ),
        key=lambda item: item.total,
        reverse=True,
    )

    monthly_category_spend = []
    for label in labels:
        totals: dict[str, Decimal] = {}
        for expense in expenses_in(label):
            totals[expense.category] = totals.get(expense.category, ZERO) + expense.amount
        monthly_category_spend.extend(
            MonthlyCategorySpend(month=label, category=category, total=total)
            for category, total in sorted(totals.items())
        )

    monthly_income = [MonthlyAmount(month=label, total=income_in(label)) for label in labels]

    # Savings are stored per period label
    result = await db.execute(
        select(Savings).where(
            and_(Savings.user_id == current_user.id, Savings.month >= labels[0], Savings.month <= current)
        )
    )
    monthly_savings = [
        MonthlyAmount(month=saving.month.replace(day=1), total=saving.amount)
        for saving in result.scalars().all()
        if saving.amount is not None
    ]

    result = await db.execute(
        select(Expense).where(Expense.user_id == current_user.id).order_by(Expense.date.desc()).limit(10)
    )
    recent_transactions = result.scalars().all()

    period_start, period_end = bounds[current]
    return DashboardOverview(
        period_month=current,
        period_start=period_start,
        period_end=period_end,
        total_expenses_month=total_expenses,
        income_total_month=income_total,
        net_balance_month=income_total - total_expenses,
        expenses_mom_percentage=calculate_mom(total_expenses, total_expenses_previous),
        income_mom_percentage=calculate_mom(income_total, income_in(previous)),
        expenses_by_category=expenses_by_category,
        monthly_category_spend=monthly_category_spend,
        monthly_income=monthly_income,
        monthly_savings=monthly_savings,
        recent_transactions=recent_transactions,
    )
