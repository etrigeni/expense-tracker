from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.models import User
from app.periods import period_bounds, period_for

router = APIRouter(prefix="/periods", tags=["periods"])


class PayPeriod(BaseModel):
    month: date  # label month, first day
    start: date
    end: date


def describe(label: date) -> PayPeriod:
    start, end = period_bounds(label)
    return PayPeriod(month=label.replace(day=1), start=start, end=end)


@router.get("/current", response_model=PayPeriod)
async def current_period(current_user: User = Depends(get_current_user)):
    """The pay period that contains today."""
    return describe(period_for(date.today()))


@router.get("/{month}", response_model=PayPeriod)
async def get_period(month: date, current_user: User = Depends(get_current_user)):
    """The pay period named after `month` (any day in that month)."""
    return describe(month)
