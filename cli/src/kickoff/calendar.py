"""Working-day arithmetic with the same semantics as Excel WORKDAY, NETWORKDAYS and EDATE."""

from __future__ import annotations

import calendar as _calendar
from collections.abc import Iterable
from datetime import date, timedelta


class WorkCalendar:
    def __init__(self, weekend: Iterable[int] = (5, 6), holidays: Iterable[date] = ()):
        self.weekend = frozenset(weekend)
        self.holidays = frozenset(holidays)

    def is_workday(self, d: date) -> bool:
        return d.weekday() not in self.weekend and d not in self.holidays

    def workday(self, d: date, n: int) -> date:
        """The date n working days after d (before d when n < 0); d itself when n == 0."""
        cur, step, left = d, (1 if n > 0 else -1), abs(n)
        while left:
            cur += timedelta(days=step)
            if self.is_workday(cur):
                left -= 1
        return cur

    def networkdays(self, a: date, b: date) -> int:
        count, cur = 0, a
        while cur <= b:
            count += self.is_workday(cur)
            cur += timedelta(days=1)
        return count


def edate_minus1(d: date, months: int) -> date:
    """EDATE(d, months) - 1: the last day of a period of `months` months that starts on d."""
    m0 = d.month - 1 + months
    y, m = d.year + m0 // 12, m0 % 12 + 1
    return date(y, m, min(d.day, _calendar.monthrange(y, m)[1])) - timedelta(days=1)
