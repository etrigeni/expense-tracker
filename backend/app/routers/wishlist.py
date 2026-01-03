from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from decimal import Decimal
import uuid
from datetime import date
from app.database import get_db
from app.models import User, Wishlist, Expense
from app.schemas import (
    WishlistCreate,
    WishlistUpdate,
    WishlistResponse,
    WishlistTotal,
    WishlistPurchase,
)
from app.dependencies import get_current_user
from app.utils import get_current_date, fetch_open_graph_image

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("/", response_model=list[WishlistResponse])
async def get_wishlist_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all wishlist items"""
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
    )
    wishlist_items = result.scalars().all()

    return wishlist_items


@router.post("/", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
async def create_wishlist_item(
    item_data: WishlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new wishlist item"""
    image_url = item_data.image_url
    if image_url is None and item_data.url:
        image_url = await fetch_open_graph_image(item_data.url)

    new_item = Wishlist(
        user_id=current_user.id,
        item_name=item_data.item_name,
        price=item_data.price,
        url=item_data.url,
        image_url=image_url,
        notes=item_data.notes,
    )

    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)

    return new_item


@router.get("/total", response_model=WishlistTotal)
async def get_wishlist_total(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get total wishlist value"""
    result = await db.execute(
        select(func.sum(Wishlist.price), func.count(Wishlist.id)).where(
            Wishlist.user_id == current_user.id
        )
    )
    total, count = result.one()

    return {
        "total": total if total is not None else Decimal("0.00"),
        "count": count if count is not None else 0,
    }


@router.get("/{item_id}", response_model=WishlistResponse)
async def get_wishlist_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single wishlist item"""
    result = await db.execute(
        select(Wishlist).where(
            and_(Wishlist.id == item_id, Wishlist.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    return item


@router.put("/{item_id}", response_model=WishlistResponse)
async def update_wishlist_item(
    item_id: uuid.UUID,
    item_data: WishlistUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a wishlist item"""
    result = await db.execute(
        select(Wishlist).where(
            and_(Wishlist.id == item_id, Wishlist.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    # Update fields
    if item_data.item_name is not None:
        item.item_name = item_data.item_name
    if item_data.price is not None:
        item.price = item_data.price
    if item_data.url is not None:
        item.url = item_data.url
    if item_data.image_url is not None:
        item.image_url = item_data.image_url
    elif item_data.url is not None:
        item.image_url = await fetch_open_graph_image(item_data.url)
    if item_data.notes is not None:
        item.notes = item_data.notes

    await db.commit()
    await db.refresh(item)

    return item


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_wishlist_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a wishlist item"""
    result = await db.execute(
        select(Wishlist).where(
            and_(Wishlist.id == item_id, Wishlist.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    await db.delete(item)
    await db.commit()

    return {"message": "Wishlist item deleted successfully"}


@router.post("/{item_id}/purchase", status_code=status.HTTP_200_OK)
async def mark_as_purchased(
    item_id: uuid.UUID,
    purchase_data: WishlistPurchase,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark wishlist item as purchased (creates expense and deletes item)"""
    result = await db.execute(
        select(Wishlist).where(
            and_(Wishlist.id == item_id, Wishlist.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    # Create expense from wishlist item
    purchase_date = purchase_data.purchase_date or get_current_date()
    category = purchase_data.category or "Shopping"

    new_expense = Expense(
        user_id=current_user.id,
        amount=item.price,
        category=category,
        date=purchase_date,
        description=f"Purchased: {item.item_name}" + (f" - {item.notes}" if item.notes else ""),
    )

    db.add(new_expense)

    # Delete wishlist item
    await db.delete(item)

    await db.commit()
    await db.refresh(new_expense)

    return {
        "expense_id": new_expense.id,
        "message": "Item marked as purchased and added to expenses",
    }
