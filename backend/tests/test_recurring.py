from datetime import date
from types import SimpleNamespace

from app.recurring import occurrence_date, occurrences_in_month, occurs_in_month


def expense(start: date, recurring: bool = True, until: date | None = None):
    return SimpleNamespace(date=start, is_recurring=recurring, recurring_until=until)


def test_one_off_counts_only_in_its_own_month():
    coffee = expense(date(2026, 3, 14), recurring=False)
    assert occurs_in_month(coffee, date(2026, 3, 1))
    assert not occurs_in_month(coffee, date(2026, 4, 1))


def test_recurring_counts_from_start_month_onwards_but_not_before():
    rent = expense(date(2026, 3, 1))
    assert not occurs_in_month(rent, date(2026, 2, 1))
    assert occurs_in_month(rent, date(2026, 3, 1))
    assert occurs_in_month(rent, date(2027, 1, 1))


def test_stopped_recurring_still_counts_in_its_last_month_only():
    gym = expense(date(2026, 1, 10), until=date(2026, 5, 31))
    assert occurs_in_month(gym, date(2026, 5, 1))
    assert not occurs_in_month(gym, date(2026, 6, 1))


def test_occurrence_keeps_day_of_month_and_clamps_short_months():
    subscription = expense(date(2026, 1, 31))
    assert occurrence_date(subscription, date(2026, 1, 1)) == date(2026, 1, 31)
    assert occurrence_date(subscription, date(2026, 2, 1)) == date(2026, 2, 28)
    assert occurrence_date(subscription, date(2026, 4, 1)) == date(2026, 4, 30)


def test_occurrences_in_month_mixes_one_offs_and_recurring():
    rent = expense(date(2026, 1, 1))
    old_coffee = expense(date(2026, 1, 5), recurring=False)
    new_coffee = expense(date(2026, 3, 5), recurring=False)
    ended = expense(date(2026, 1, 15), until=date(2026, 2, 28))

    march = list(
        occurrences_in_month([rent, old_coffee, new_coffee, ended], date(2026, 3, 1))
    )

    assert march == [(rent, date(2026, 3, 1)), (new_coffee, date(2026, 3, 5))]
