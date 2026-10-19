"""Role-based schedule: one person per role, packages in queue order, dependencies across roles.

duration = max(1, ROUND(effort * (1 - done) / focus, 0))
start    = WORKDAY(MAX(plan_start - 1, previous package of the role, every dependency), 1, holidays)
end      = WORKDAY(start, duration - 1, holidays)

With baseline=True (done = 0, no actuals) it is the oracle of the estimate workbook's formulas.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta

from .calendar import WorkCalendar, edate_minus1
from .errors import KickoffError
from .model import Features, Plan, Project, code_key, to_date


class CycleError(KickoffError):
    def __init__(self, cycle: list[str]):
        super().__init__(" -> ".join(cycle))
        self.cycle = cycle


@dataclass(frozen=True)
class Slot:
    start: date
    end: date
    workdays: int
    effort: float


@dataclass
class Schedule:
    slots: dict[str, Slot]

    def gate_dates(self, plan: Plan) -> dict[str, date]:
        return {g["id"]: self.slots[g["at"]].end for g in plan.gates if g["at"] in self.slots}


def round_half_up(x: float) -> int:
    return math.floor(x + 0.5 + 1e-9)


def calendar_for(project: Project) -> WorkCalendar:
    return WorkCalendar(project.weekend, project.holidays)


def role_queues(plan: Plan) -> dict[str, list[str]]:
    queues: dict[str, list[str]] = {}
    by = plan.by_code()
    for p in plan.packages:
        if p.mode == "seq":
            queues.setdefault(p.role, []).append(p.code)
    for code, after in plan.order_after.items():
        queue = queues[by[code].role]
        queue.remove(code)
        queue.insert(queue.index(after) + 1, code)
    return queues


def actuals_of(tickets: dict) -> dict:
    return dict(tickets.get("actuals") or {})


def build_schedule(project: Project, plan: Plan, actuals: dict | None = None, baseline: bool = False) -> Schedule:
    """baseline=True: the plan as estimated; ignores `done` fractions and actuals."""
    cal = calendar_for(project)
    by = plan.by_code()
    actuals = {} if baseline else (actuals or {})
    prev: dict[str, str | None] = {}
    for queue in role_queues(plan).values():
        for i, code in enumerate(queue):
            prev[code] = queue[i - 1] if i else None
    start: dict[str, date] = {}
    end: dict[str, date] = {}
    for p in plan.packages:
        if p.mode == "fixed":
            start[p.code], end[p.code] = p.schedule[1], p.schedule[2]
    state: dict[str, str] = {}
    stack: list[str] = []

    def solve(code: str) -> date:
        p = by[code]
        if p.mode == "fixed" or state.get(code) == "done":
            return end[code]
        if state.get(code) == "visiting":
            raise CycleError(stack[stack.index(code):] + [code])
        state[code] = "visiting"
        stack.append(code)
        base = [plan.start - timedelta(days=1)]
        if prev.get(code):
            base.append(solve(prev[code]))
        base += [solve(dep) for dep in p.deps]
        act = actuals.get(code) or {}
        done = 0.0 if baseline else p.done
        duration = max(1, round_half_up(p.effort * (1 - done) / project.roles[p.role].focus))
        s = to_date(act["started"]) if act.get("started") else cal.workday(max(base), 1)
        e = to_date(act["done"]) if act.get("done") else cal.workday(s, duration - 1)
        start[code], end[code] = min(s, e), e
        state[code] = "done"
        stack.pop()
        return e

    for p in plan.packages:
        if p.mode == "seq":
            solve(p.code)
    for p in plan.packages:
        if p.mode == "span":
            start[p.code], end[p.code] = start[p.schedule[1]], end[p.schedule[2]]
        elif p.mode == "period":
            start[p.code] = cal.workday(end[p.schedule[1]], 1)
            end[p.code] = edate_minus1(start[p.code], p.schedule[2])
    for p in plan.packages:
        if p.mode == "tail":
            end[p.code] = end[p.schedule[1]]
            start[p.code] = cal.workday(end[p.code], -(p.schedule[2] - 1))

    leaves: dict[str, Slot] = {}
    for p in plan.packages:
        wd = cal.networkdays(start[p.code], end[p.code])
        if p.effort_rate is not None:
            effort = math.floor(wd / 5 * p.effort_rate * 10 + 0.5 + 1e-9) / 10
        else:
            effort = p.effort
        leaves[p.code] = Slot(start[p.code], end[p.code], wd, effort)
    slots = dict(leaves)
    for node in [*plan.phases, *plan.groups]:
        members = [s for c, s in leaves.items() if c.startswith(node["code"] + ".")]
        if members:
            s, e = min(m.start for m in members), max(m.end for m in members)
            slots[node["code"]] = Slot(s, e, cal.networkdays(s, e), round(sum(m.effort for m in members), 2))
    return Schedule(dict(sorted(slots.items(), key=lambda kv: code_key(kv[0]))))


def _num(x: float) -> float | int:
    x = round(x, 2)
    return int(x) if float(x).is_integer() else x


def schedule_json(project: Project, plan: Plan, sched: Schedule) -> dict[str, list]:
    """{code: [start, end, workdays, effort, name, role]} in the workbook language; groups have role ''."""
    names = {n["code"]: n["name"] for n in [*plan.phases, *plan.groups]}
    by = plan.by_code()
    out = {}
    for code, s in sched.slots.items():
        p = by.get(code)
        name = p.name if p else names.get(code, "")
        role = project.roles[p.role].name if p else ""
        out[code] = [s.start.isoformat(), s.end.isoformat(), s.workdays, _num(s.effort), name, role]
    return out


def slip_report(project: Project, plan: Plan, features: Features | None, sched: Schedule) -> list[str]:
    cal = calendar_for(project)
    by = plan.by_code()
    fb = features.by_id() if features else {}
    got = sched.gate_dates(plan)
    lines: list[str] = []
    for gid, hard in project.hard_dates.items():
        planned = got.get(gid)
        if not planned or planned <= hard:
            continue
        late = cal.networkdays(hard + timedelta(days=1), planned)
        lines.append(f"{gid} slips: planned {planned.isoformat()}, hard date {hard.isoformat()} ({late} working days late)")
        for fid in plan.cut_order:
            f = fb.get(fid)
            if not f:
                continue
            freed = sum(by[c].effort for c in f.wbs if c in by)
            lines.append(f"  cut candidate {fid} {f.name}: frees up to {freed:g} person-days in {', '.join(f.wbs)}")
    return lines
