import json
from datetime import date
from pathlib import Path

import pytest

from kickoff.model import load_plan, load_project
from kickoff.schedule import build_schedule
from kickoff.validate import validate_root

ROOT = Path(__file__).resolve().parents[2] / "examples" / "ai-minute"
EXPECTED = json.loads((ROOT / "expected" / "schedule.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def sched():
    project, plan = load_project(ROOT), load_plan(ROOT)
    return plan, build_schedule(project, plan)


def test_example_validates():
    errors = [str(f) for f in validate_root(ROOT) if f.level == "error"]
    assert errors == []


def test_every_code_matches_expected_schedule(sched):
    _, s = sched
    assert len(EXPECTED) == 205
    for code, (start, end, workdays, effort, *_rest) in EXPECTED.items():
        slot = s.slots[code]
        assert (slot.start.isoformat(), slot.end.isoformat(), slot.workdays) == (start, end, workdays), code
        assert slot.effort == pytest.approx(effort), code


def test_gate_dates(sched):
    plan, s = sched
    g = s.gate_dates(plan)
    assert g["G1"] == date(2026, 10, 14)
    assert g["G5"] == date(2026, 11, 26)
    assert g["G8"] == date(2027, 3, 16)
    assert g["G10"] == date(2027, 6, 2)
    assert g["G11"] == date(2028, 6, 2)


def test_effort_totals(sched):
    plan, s = sched
    leaves = [p.code for p in plan.packages]
    mvp = sum(s.slots[c].effort for c in leaves if c.split(".")[0] in {"1", "2", "3"})
    assert mvp == pytest.approx(84.75)
    assert sum(s.slots[c].effort for c in leaves) == pytest.approx(336.75)
