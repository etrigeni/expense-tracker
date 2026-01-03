from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import uuid


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)


class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None


class RefreshToken(BaseModel):
    refresh_token: str


# Expense Schemas
class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    category: str
    date: date
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ExpenseStats(BaseModel):
    total: Decimal
    by_category: dict[str, Decimal]
    count: int


# Category Schemas
class CategoryBase(BaseModel):
    name: str
    icon: str
    color: str
    budget_monthly: Optional[Decimal] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    budget_monthly: Optional[Decimal] = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    is_custom: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Wishlist Schemas
class WishlistBase(BaseModel):
    item_name: str
    price: Decimal = Field(..., gt=0, decimal_places=2)
    url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class WishlistCreate(WishlistBase):
    pass


class WishlistUpdate(BaseModel):
    item_name: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class WishlistResponse(WishlistBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WishlistTotal(BaseModel):
    total: Decimal
    count: int


class WishlistPurchase(BaseModel):
    purchase_date: Optional[date] = None
    category: Optional[str] = "Shopping"


# Income Schemas
class IncomeBase(BaseModel):
    source: str
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    date: date
    is_recurring: bool = False
    frequency: Optional[str] = None
    notes: Optional[str] = None


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    source: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    date: Optional[date] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None


class IncomeResponse(IncomeBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IncomeTotal(BaseModel):
    total: Decimal
    count: int


# Dashboard Schemas
class CategorySummary(BaseModel):
    category: str
    total: Decimal
    percentage: float


class MonthlyCategorySpend(BaseModel):
    month: date
    category: str
    total: Decimal


class MonthlyAmount(BaseModel):
    month: date
    total: Decimal


class DashboardOverview(BaseModel):
    total_expenses_month: Decimal
    income_total_month: Decimal
    net_balance_month: Decimal
    expenses_mom_percentage: Optional[float] = None
    income_mom_percentage: Optional[float] = None
    expenses_by_category: list[CategorySummary]
    monthly_category_spend: list[MonthlyCategorySpend]
    monthly_income: list[MonthlyAmount]
    monthly_savings: list[MonthlyAmount]
    recent_transactions: list[ExpenseResponse]
    wishlist_total: Decimal
    wishlist_count: int


class CategoryBudgetUpsert(BaseModel):
    category_id: uuid.UUID
    month: date
    amount: Optional[Decimal] = None


class CategoryBudgetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    month: date
    amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SavingsUpsert(BaseModel):
    month: date
    amount: Optional[Decimal] = None


class SavingsResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    month: date
    amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Password Reset Schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=72)


# Login Schema
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
