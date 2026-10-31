from datetime import date
from types import SimpleNamespace

from app.recurring import occurrences_between, occurrences_in_period

NOVEMBER = (date(2026, 10, 30), date(2026, 11, 29))  # pay period "November 2026"


def expense(start: date, recurring: bool = True, until: date | None = None):
    return SimpleNamespace(date=start, is_recurring=recurring, recurring_until=until)


def test_one_off_counts_only_inside_the_period():
    assert list(occurrences_between(expense(date(2026, 10, 31), recurring=False), *NOVEMBER)) == [
        date(2026, 10, 31)
    ]
    assert list(occurrences_between(expense(date(2026, 10, 29), recurring=False), *NOVEMBER)) == []


def test_recurring_bill_falls_on_its_calendar_day_inside_the_period():
    rent = expense(date(2026, 1, 1))
    assert list(occurrences_between(rent, *NOVEMBER)) == [date(2026, 11, 1)]


def test_bill_on_the_31st_lands_on_the_period_start_side():
    phone = expense(date(2026, 1, 31))
    # Oct 31 is in the period; November has no 31st, so its occurrence is Nov 30 (next period)
    assert list(occurrences_between(phone, *NOVEMBER)) == [date(2026, 10, 31)]


def test_recurring_does_not_count_before_it_starts():
    gym = expense(date(2026, 11, 5))
    assert list(occurrences_between(gym, date(2026, 9, 30), date(2026, 10, 29))) == []
    assert list(occurrences_between(gym, *NOVEMBER)) == [date(2026, 11, 5)]


def test_stopped_recurring_ends_with_its_last_period():
    netflix = expense(date(2026, 6, 15), until=date(2026, 10, 29))
    assert list(occurrences_between(netflix, date(2026, 9, 30), date(2026, 10, 29))) == [
        date(2026, 10, 15)
    ]
    assert list(occurrences_between(netflix, *NOVEMBER)) == []


def test_occurrences_in_period_mixes_one_offs_and_recurring():
    rent = expense(date(2026, 1, 1))
    coffee = expense(date(2026, 11, 3), recurring=False)
    old_coffee = expense(date(2026, 10, 3), recurring=False)

    found = list(occurrences_in_period([rent, coffee, old_coffee], *NOVEMBER))

    assert found == [(rent, date(2026, 11, 1)), (coffee, date(2026, 11, 3))]
