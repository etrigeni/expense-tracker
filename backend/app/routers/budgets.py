from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from app.database import get_db
from app.models import User, Category, CategoryBudget
from app.schemas import CategoryBudgetUpsert, CategoryBudgetResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])


def normalize_month(value: date) -> date:
    return value.replace(day=1)


@router.get("/", response_model=list[CategoryBudgetResponse])
async def get_budgets(
    month: date | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get category budgets for a specific month (defaults to current month)."""
    target_month = normalize_month(month or date.today())
    result = await db.execute(
        select(CategoryBudget).where(
            and_(
                CategoryBudget.user_id == current_user.id,
                CategoryBudget.month == target_month,
            )
        )
    )
    return result.scalars().all()


@router.put("/", response_model=CategoryBudgetResponse)
async def upsert_budget(
    budget_data: CategoryBudgetUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a category budget for a month."""
    target_month = normalize_month(budget_data.month)

    result = await db.execute(select(Category).where(Category.id == budget_data.category_id))
    category = result.scalar_one_or_none()
    if category is None or (category.user_id not in (None, current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    result = await db.execute(
        select(CategoryBudget).where(
            and_(
                CategoryBudget.user_id == current_user.id,
                CategoryBudget.category_id == budget_data.category_id,
                CategoryBudget.month == target_month,
            )
        )
    )
    budget = result.scalar_one_or_none()

    if budget is None:
        budget = CategoryBudget(
            user_id=current_user.id,
            category_id=budget_data.category_id,
            month=target_month,
            amount=budget_data.amount,
        )
        db.add(budget)
    else:
        budget.amount = budget_data.amount

    await db.commit()
    await db.refresh(budget)

    return budget
