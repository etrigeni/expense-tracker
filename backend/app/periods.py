"""Pay periods: budgeting follows the salary, not the calendar month.

Salary arrives on the last working day (Monday to Friday) of each month. A period runs
from one payday to the day before the next, and is named after the month that follows
the payday: paid Friday 30 Oct 2026, the "November 2026" period is 30 Oct to 29 Nov.
Public holidays are not taken into account.

A period is identified by its label month, as the first day of that month (2026-11-01).
"""

import calendar
from datetime import date, timedelta


def shift_month(value: date, delta: int) -> date:
    """First day of the month `delta` months away from `value`'s month."""
    index = value.year * 12 + value.month - 1 + delta
    return date(index // 12, index % 12 + 1, 1)


def last_working_day(year: int, month: int) -> date:
    day = date(year, month, calendar.monthrange(year, month)[1])
    while day.weekday() >= 5:  # Saturday or Sunday
        day -= timedelta(days=1)
    return day


def payday_before(label_month: date) -> date:
    """The payday that starts the period named `label_month`: last working day of the month before."""
    previous = shift_month(label_month, -1)
    return last_working_day(previous.year, previous.month)


def period_bounds(label_month: date) -> tuple[date, date]:
    """First and last day of the period named after `label_month` (any day in that month)."""
    label_month = label_month.replace(day=1)
    return payday_before(label_month), payday_before(shift_month(label_month, 1)) - timedelta(days=1)


def period_for(day: date) -> date:
    """Label month (first day) of the period that contains `day`."""
    label = shift_month(day, 1)
    return label if day >= payday_before(label) else shift_month(label, -1)
