from datetime import date

from kick.calendar import WorkCalendar, edate_minus1

CAL = WorkCalendar((5, 6), [date(2027, 1, 1)])


def test_workday_skips_weekend():
    assert CAL.workday(date(2026, 10, 2), 1) == date(2026, 10, 5)


def test_workday_skips_holiday():
    assert CAL.workday(date(2026, 12, 31), 1) == date(2027, 1, 4)


def test_workday_backwards_and_zero():
    assert CAL.workday(date(2026, 10, 5), -1) == date(2026, 10, 2)
    assert CAL.workday(date(2026, 10, 3), 0) == date(2026, 10, 3)


def test_networkdays():
    assert CAL.networkdays(date(2026, 9, 28), date(2026, 10, 9)) == 10
    assert CAL.networkdays(date(2026, 10, 9), date(2026, 9, 28)) == 0


def test_edate_minus1():
    assert edate_minus1(date(2027, 6, 3), 12) == date(2028, 6, 2)
    assert edate_minus1(date(2027, 1, 31), 1) == date(2027, 2, 27)
