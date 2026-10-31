from datetime import date

from app.periods import last_working_day, period_bounds, period_for


def test_last_working_day_skips_weekends():
    assert last_working_day(2026, 10) == date(2026, 10, 30)  # Sat 31 -> Fri 30
    assert last_working_day(2026, 5) == date(2026, 5, 29)  # Sun 31 -> Fri 29
    assert last_working_day(2026, 11) == date(2026, 11, 30)  # Monday


def test_period_is_named_after_the_month_following_payday():
    assert period_bounds(date(2026, 11, 1)) == (date(2026, 10, 30), date(2026, 11, 29))


def test_period_bounds_cross_the_year():
    assert period_bounds(date(2027, 1, 1)) == (date(2026, 12, 31), date(2027, 1, 28))


def test_period_for_switches_on_payday():
    assert period_for(date(2026, 10, 29)) == date(2026, 10, 1)
    assert period_for(date(2026, 10, 30)) == date(2026, 11, 1)  # payday starts November
    assert period_for(date(2026, 11, 29)) == date(2026, 11, 1)
    assert period_for(date(2026, 11, 30)) == date(2026, 12, 1)


def test_consecutive_periods_leave_no_gaps():
    for month in range(1, 13):
        _, end = period_bounds(date(2026, month, 1))
        next_month = date(2027, 1, 1) if month == 12 else date(2026, month + 1, 1)
        next_start, _ = period_bounds(next_month)
        assert (next_start - end).days == 1
