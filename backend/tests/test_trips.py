from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas import TripCreate


def test_trip_can_be_a_single_day():
    trip = TripCreate(name="Day in Nafplio", start_date=date(2026, 12, 5), end_date=date(2026, 12, 5))
    assert trip.start_date == trip.end_date


def test_trip_cannot_end_before_it_starts():
    with pytest.raises(ValidationError):
        TripCreate(name="Rome", start_date=date(2026, 12, 16), end_date=date(2026, 12, 12))


def test_trip_needs_a_name():
    with pytest.raises(ValidationError):
        TripCreate(name="", start_date=date(2026, 12, 12), end_date=date(2026, 12, 16))
