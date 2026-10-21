from datetime import date

import pytest
from helpers import pkg, plan, project

from kickoff.schedule import CycleError, build_schedule, role_queues, slip_report

D = date


def dates(sched, code):
    s = sched.slots[code]
    return s.start, s.end


def test_same_role_runs_back_to_back():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 29))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 10, 2))


def test_focus_and_half_up_rounding():
    pr = project(roles=[{"id": "dev", "name": "Dev", "focus": 0.8}])
    s = build_schedule(pr, plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=1)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 30))  # 2 / 0.8 = 2.5 -> 3 days
    assert dates(s, "1.1.2") == (D(2026, 10, 1), D(2026, 10, 1))  # 1.25 -> 1 day


def test_done_fraction_shortens_duration():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=4, done=0.5)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 29))


def test_cross_role_dependency():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=2), pkg("1.1.2", role="qa", deps=["1.1.1"])]))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 9, 30))


def test_holiday_is_skipped():
    pr = project(calendar={"weekend": ["sat", "sun"], "holidays": ["2026-09-29"]})
    s = build_schedule(pr, plan([pkg("1.1.1", effort=2)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 30))


def test_order_after_moves_within_role():
    p = plan([pkg("1.1.1"), pkg("1.1.2"), pkg("1.1.3")], order_after={"1.1.3": "1.1.1"})
    assert role_queues(p)["dev"] == ["1.1.1", "1.1.3", "1.1.2"]
    s = build_schedule(project(), p)
    assert dates(s, "1.1.3") == (D(2026, 9, 29), D(2026, 9, 29))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 9, 30))


def test_dependency_cycle_is_reported():
    p = plan([pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2", role="qa", deps=["1.1.1"])])
    with pytest.raises(CycleError) as exc:
        build_schedule(project(), p)
    assert exc.value.cycle == ["1.1.1", "1.1.2", "1.1.1"]


def test_queue_order_cycle_is_reported():
    # 1.1.2 follows 1.1.1 in the dev queue, but 1.1.1 waits for 1.1.2
    p = plan([pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2")])
    with pytest.raises(CycleError):
        build_schedule(project(), p)


def test_other_modes_and_effort_rate():
    p = plan(
        [
            pkg("1.1.1", effort=2),
            pkg("1.1.2", effort=3),
            pkg("1.1.3", role="lead", schedule={"fixed": ["2026-09-24", "2026-09-25"]}),
            pkg("1.1.4", role="lead", effort=0, schedule={"span": ["1.1.1", "1.1.2"]}, effort_rate=0.2),
            pkg("1.1.5", role="lead", schedule={"period": {"after": "1.1.2", "months": 12}}),
            pkg("1.1.6", role="lead", schedule={"tail": {"of": "1.1.5", "days": 5}}),
        ]
    )
    s = build_schedule(project(), p)
    assert dates(s, "1.1.3") == (D(2026, 9, 24), D(2026, 9, 25))
    assert dates(s, "1.1.4") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.slots["1.1.4"].effort == 0.2
    assert dates(s, "1.1.5") == (D(2026, 10, 5), D(2027, 10, 4))
    assert dates(s, "1.1.6") == (D(2027, 9, 28), D(2027, 10, 4))


def test_rollup_and_gate():
    p = plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)], gates=[{"id": "G1", "name": "Done", "at": "1"}])
    s = build_schedule(project(), p)
    assert dates(s, "1") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.slots["1"].workdays == 5
    assert s.slots["1"].effort == 5
    assert dates(s, "1.1") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.gate_dates(p) == {"G1": D(2026, 10, 2)}


def test_slip_report_lists_cut_candidates():
    from kickoff.model import Features

    features = Features.from_dict(
        {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "features": [
            {"id": "F1.1", "name": "Export", "release": "MVP", "prio": "P2", "wbs": ["1.1.2"]}]}]}
    )
    p = plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)], gates=[{"id": "G1", "name": "MVP", "at": "1"}],
             cut_order=["F1.1"])
    pr = project(hard_dates={"G1": "2026-09-30"})
    lines = slip_report(pr, p, features, build_schedule(pr, p))
    assert lines[0] == "G1 slips: planned 2026-10-02, hard date 2026-09-30 (2 working days late)"
    assert lines[1] == "  cut candidate F1.1 Export: frees up to 3 person-days in 1.1.2"


def test_baseline_ignores_done():
    p = plan([pkg("1.1.1", effort=4, done=0.5), pkg("1.1.2", effort=3)])
    s = build_schedule(project(), p, baseline=True)
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 10, 1))
    assert dates(s, "1.1.2") == (D(2026, 10, 2), D(2026, 10, 6))
