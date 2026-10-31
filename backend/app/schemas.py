from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from datetime import date as DateType  # a field named `date` shadows the type inside schema classes
from decimal import Decimal
import uuid


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
    is_recurring: bool = False
    recurring_until: Optional[DateType] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurring_until: Optional[DateType] = None


class ExpenseResponse(ExpenseBase):
    id: uuid.UUID
    user_id: uuid.UUID
    # For a recurring expense listed by month, `date` is that month's occurrence and
    # `start_date` the first one; otherwise they are equal.
    start_date: Optional[DateType] = None
    # Recurring expenses in a month listing: whether it is ticked as paid for that month
    paid: Optional[bool] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RecurringPaymentUpdate(BaseModel):
    month: DateType
    paid: bool


class ExpenseStats(BaseModel):
    total: Decimal
    by_category: dict[str, Decimal]
    count: int


# Category Schemas
class CategoryBase(BaseModel):
    name: str
    icon: str
    color: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    is_custom: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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


# Login Schema
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
