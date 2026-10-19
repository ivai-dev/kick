"""kickoff schedule [--json PATH]"""

from __future__ import annotations

import json
from pathlib import Path

from ..model import load_features, load_plan, load_project, load_tickets, resolve_root
from ..schedule import actuals_of, build_schedule, schedule_json, slip_report
from ..validate import check_plan


def register(sub) -> None:
    p = sub.add_parser("schedule", help="compute the role-based schedule and gate dates")
    p.add_argument("--json", type=Path, default=None, help="also write {code: [start, end, workdays, effort, name, role]}")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    errors = [f for f in check_plan(project, plan) if f.level == "error"]
    if errors:
        for f in errors:
            print(f)
        return 1
    sched = build_schedule(project, plan, actuals_of(load_tickets(root)))
    dates = sched.gate_dates(plan)
    for g in plan.gates:
        d = dates.get(g["id"])
        hard = project.hard_dates.get(g["id"])
        suffix = f"  (hard date {hard.isoformat()})" if hard else ""
        print(f"{g['id']:<5} {d.isoformat() if d else '—':<11} {g['name']}{suffix}")
    if args.json:
        args.json.write_text(json.dumps(schedule_json(project, plan, sched), ensure_ascii=False, indent=0),
                             encoding="utf-8")
        print(f"{len(sched.slots)} codes -> {args.json}")
    slips = slip_report(project, plan, features, sched)
    for line in slips:
        print(line)
    return 3 if slips else 0
