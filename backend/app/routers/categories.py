from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import uuid
from app.database import get_db
from app.models import User, Category
from app.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])

# Shared categories offered to every user. The app groups them for the picker; Bills,
# Activities and Savings stay so older expenses keep their category, but are not offered.
DEFAULT_CATEGORIES = [
    {"name": "Rent", "icon": "home", "color": "oat"},
    {"name": "Electricity", "icon": "zap", "color": "oat"},
    {"name": "Water", "icon": "droplets", "color": "sage"},
    {"name": "Internet", "icon": "wifi", "color": "mauve"},
    {"name": "Mobile", "icon": "smartphone", "color": "blush"},
    {"name": "Supermarket", "icon": "basket", "color": "oat"},
    {"name": "Food & coffee", "icon": "coffee", "color": "blush"},
    {"name": "Transport", "icon": "tram", "color": "sage"},
    {"name": "Fuel", "icon": "fuel", "color": "oat"},
    {"name": "Car", "icon": "car", "color": "sage"},
    {"name": "Health", "icon": "heart", "color": "mauve"},
    {"name": "Gym", "icon": "dumbbell", "color": "sage"},
    {"name": "Beauty", "icon": "brush", "color": "blush"},
    {"name": "Entertainment", "icon": "sparkles", "color": "mauve"},
    {"name": "Subscriptions", "icon": "card", "color": "mauve"},
    {"name": "Shopping", "icon": "bag", "color": "blush"},
    {"name": "Gifts", "icon": "gift", "color": "blush"},
    {"name": "Travel", "icon": "plane", "color": "sage"},
    {"name": "Education", "icon": "cap", "color": "oat"},
    {"name": "Other", "icon": "shapes", "color": "oat"},
    {"name": "Bills", "icon": "receipt", "color": "oat"},
    {"name": "Activities", "icon": "ticket", "color": "blush"},
    {"name": "Savings", "icon": "piggy", "color": "sage"},
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
