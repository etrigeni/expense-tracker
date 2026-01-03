from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import uuid
from app.database import get_db
from app.models import User, Category
from app.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])

# Default categories
DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "????", "color": "text-orange-500"},
    {"name": "Transport", "icon": "????", "color": "text-blue-500"},
    {"name": "Shopping", "icon": "???????", "color": "text-pink-500"},
    {"name": "Bills", "icon": "????", "color": "text-yellow-500"},
    {"name": "Entertainment", "icon": "????", "color": "text-purple-500"},
    {"name": "Health", "icon": "??????", "color": "text-red-500"},
    {"name": "Education", "icon": "????", "color": "text-green-500"},
    {"name": "Savings", "icon": "????", "color": "text-emerald-600"},
    {"name": "Travel", "icon": "????", "color": "text-sky-500"},
    {"name": "Gym", "icon": "????", "color": "text-indigo-500"},
    {"name": "Activities", "icon": "????", "color": "text-green-500"},
    {"name": "Car", "icon": "????", "color": "text-blue-500"},
    {"name": "Supermarket", "icon": "??????", "color": "text-amber-500"},
    {"name": "Other", "icon": "???", "color": "text-gray-500"},
]


@router.get("/", response_model=list[CategoryResponse])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all categories (default + user custom)"""
    # Get custom categories for the user
    result = await db.execute(
        select(Category).where(Category.user_id == current_user.id)
    )
    custom_categories = result.scalars().all()

    # Get default categories (user_id is None)
    result = await db.execute(select(Category).where(Category.user_id.is_(None)))
    default_categories = result.scalars().all()

    # Ensure default categories exist (create missing ones)
    existing_default_names = {category.name for category in default_categories}
    missing_defaults = [
        cat_data for cat_data in DEFAULT_CATEGORIES
        if cat_data["name"] not in existing_default_names
    ]

    if missing_defaults:
        for cat_data in missing_defaults:
            default_cat = Category(
                name=cat_data["name"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                budget_monthly=None,
                is_custom=False,
                user_id=None,
            )
            db.add(default_cat)

        await db.commit()

        result = await db.execute(select(Category).where(Category.user_id.is_(None)))
        default_categories = result.scalars().all()

    # Combine and return, preferring user custom categories over defaults with the same name
    custom_names = {category.name for category in custom_categories}
    merged_defaults = [category for category in default_categories if category.name not in custom_names]
    all_categories = list(merged_defaults) + list(custom_categories)
    return all_categories


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom category"""
    # Check if category name already exists for this user
    result = await db.execute(
        select(Category).where(
            and_(
                Category.user_id == current_user.id,
                Category.name == category_data.name,
            )
        )
    )
    existing_category = result.scalar_one_or_none()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )

    # Create new custom category
    new_category = Category(
        user_id=current_user.id,
        name=category_data.name,
        icon=category_data.icon,
        color=category_data.color,
        budget_monthly=category_data.budget_monthly,
        is_custom=True,
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return new_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a category (custom categories only)"""
    result = await db.execute(
        select(Category).where(
            and_(
                Category.id == category_id,
                Category.user_id == current_user.id,
                Category.is_custom == True,
            )
        )
    )
    category = result.scalar_one_or_none()

    if category is None:
        result = await db.execute(
            select(Category).where(
                and_(
                    Category.id == category_id,
                    Category.user_id.is_(None),
                    Category.is_custom == False,
                )
            )
        )
        default_category = result.scalar_one_or_none()

        if default_category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        result = await db.execute(
            select(Category).where(
                and_(
                    Category.user_id == current_user.id,
                    Category.name == default_category.name,
                )
            )
        )
        category = result.scalar_one_or_none()

        if category is None:
            category = Category(
                user_id=current_user.id,
                name=category_data.name if "name" in category_data.model_fields_set else default_category.name,
                icon=category_data.icon if "icon" in category_data.model_fields_set else default_category.icon,
                color=category_data.color if "color" in category_data.model_fields_set else default_category.color,
                budget_monthly=category_data.budget_monthly
                if "budget_monthly" in category_data.model_fields_set
                else default_category.budget_monthly,
                is_custom=True,
            )
            db.add(category)

    # Update fields
    if "name" in category_data.model_fields_set:
        category.name = category_data.name
    if "icon" in category_data.model_fields_set:
        category.icon = category_data.icon
    if "color" in category_data.model_fields_set:
        category.color = category_data.color
    if "budget_monthly" in category_data.model_fields_set:
        category.budget_monthly = category_data.budget_monthly

    await db.commit()
    await db.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom category"""
    result = await db.execute(
        select(Category).where(
            and_(
                Category.id == category_id,
                Category.user_id == current_user.id,
                Category.is_custom == True,
            )
        )
    )
    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom category not found",
        )

    await db.delete(category)
    await db.commit()

    return {"message": "Category deleted successfully"}
