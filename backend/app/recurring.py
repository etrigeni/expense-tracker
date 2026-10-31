"""Monthly recurring expenses.

A recurring expense is stored once: `date` is the first occurrence and `recurring_until`
(optional) is the last day it still applies. It falls once per calendar month in between,
on the same day of the month (clamped to the month's length). A pay period counts every
occurrence whose date is inside it.
"""

import calendar
from collections.abc import Iterable, Iterator
from datetime import date
from typing import Protocol

from app.periods import shift_month


class ExpenseLike(Protocol):
    date: date
    is_recurring: bool
    recurring_until: date | None


def occurrence_in_month(expense: ExpenseLike, month: date) -> date:
    """The date a recurring expense falls on in the calendar month of `month`."""
    last_day = calendar.monthrange(month.year, month.month)[1]
    return month.replace(day=min(expense.date.day, last_day))


def occurrences_between(expense: ExpenseLike, start: date, end: date) -> Iterator[date]:
    """Dates the expense falls on between `start` and `end`, both included."""
    if not expense.is_recurring:
        if start <= expense.date <= end:
            yield expense.date
        return

    month = start.replace(day=1)
    while month <= end:
        on = occurrence_in_month(expense, month)
        applies = expense.date <= on and (expense.recurring_until is None or on <= expense.recurring_until)
        if applies and start <= on <= end:
            yield on
        month = shift_month(month, 1)


def occurrences_in_period(
    expenses: Iterable[ExpenseLike], start: date, end: date
) -> Iterator[tuple[ExpenseLike, date]]:
    """Yield (expense, date it falls on) for every occurrence between `start` and `end`."""
    for expense in expenses:
        for on in occurrences_between(expense, start, end):
            yield expense, on
