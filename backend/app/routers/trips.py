import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Expense, Trip, User
from app.schemas import TripCreate, TripResponse

router = APIRouter(prefix="/trips", tags=["trips"])


async def get_owned_trip(trip_id: uuid.UUID, user: User, db: AsyncSession) -> Trip:
    result = await db.execute(select(Trip).where(and_(Trip.id == trip_id, Trip.user_id == user.id)))
    trip = result.scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


async def with_totals(trips: list[Trip], db: AsyncSession) -> list[TripResponse]:
    if not trips:
        return []
    result = await db.execute(
        select(Expense.trip_id, func.sum(Expense.amount), func.count(Expense.id))
        .where(Expense.trip_id.in_([trip.id for trip in trips]))
        .group_by(Expense.trip_id)
    )
    totals = {trip_id: (total, count) for trip_id, total, count in result.all()}
    return [
        TripResponse.model_validate(trip).model_copy(
            update={
                "total": totals.get(trip.id, (Decimal("0.00"), 0))[0],
                "expense_count": totals.get(trip.id, (Decimal("0.00"), 0))[1],
            }
        )
        for trip in trips
    ]


@router.get("/", response_model=list[TripResponse])
async def list_trips(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """All trips, newest first, with what was spent on each."""
    result = await db.execute(
        select(Trip).where(Trip.user_id == current_user.id).order_by(Trip.start_date.desc())
    )
    return await with_totals(list(result.scalars().all()), db)


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trip = Trip(user_id=current_user.id, **trip_data.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return (await with_totals([trip], db))[0]


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trip = await get_owned_trip(trip_id, current_user, db)
    return (await with_totals([trip], db))[0]


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: uuid.UUID,
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trip = await get_owned_trip(trip_id, current_user, db)
    for field, value in trip_data.model_dump().items():
        setattr(trip, field, value)
    await db.commit()
    await db.refresh(trip)
    return (await with_totals([trip], db))[0]


@router.delete("/{trip_id}", status_code=status.HTTP_200_OK)
async def delete_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a trip. Its expenses are kept, just no longer linked to it."""
    trip = await get_owned_trip(trip_id, current_user, db)
    await db.execute(Expense.__table__.update().where(Expense.trip_id == trip.id).values(trip_id=None))
    await db.delete(trip)
    await db.commit()
    return {"message": "Trip deleted"}
