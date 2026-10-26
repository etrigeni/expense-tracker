"""Monthly recurring expenses.

A recurring expense is stored once: `date` is the first occurrence and `recurring_until`
(optional) is the last day it still applies. It counts once in every month in between,
on the same day of the month (clamped to the month's length).
"""

import calendar
from collections.abc import Iterable, Iterator
from datetime import date
from typing import Protocol


class ExpenseLike(Protocol):
    date: date
    is_recurring: bool
    recurring_until: date | None


def month_start(value: date) -> date:
    return value.replace(day=1)


def month_end(value: date) -> date:
    return value.replace(day=calendar.monthrange(value.year, value.month)[1])


def occurs_in_month(expense: ExpenseLike, month: date) -> bool:
    start, end = month_start(month), month_end(month)
    if not expense.is_recurring:
        return start <= expense.date <= end
    if expense.date > end:
        return False
    return expense.recurring_until is None or expense.recurring_until >= start


def occurrence_date(expense: ExpenseLike, month: date) -> date:
    """The date the expense falls on in `month`. Assumes `occurs_in_month` is true."""
    if not expense.is_recurring or month_start(expense.date) == month_start(month):
        return expense.date
    last_day = calendar.monthrange(month.year, month.month)[1]
    return month.replace(day=min(expense.date.day, last_day))


def occurrences_in_month(
    expenses: Iterable[ExpenseLike], month: date
) -> Iterator[tuple[ExpenseLike, date]]:
    """Yield (expense, date it falls on) for every expense that counts in `month`."""
    for expense in expenses:
        if occurs_in_month(expense, month):
            yield expense, occurrence_date(expense, month)
