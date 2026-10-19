"""kickoff workbook [--out PATH] [--verify]"""

from __future__ import annotations

import re
from pathlib import Path

from .. import lo_verify
from ..model import load_plan, load_project, resolve_root
from ..schedule import build_schedule
from ..validate import report_plan_errors
from ..workbook import build_workbook


def register(sub) -> None:
    p = sub.add_parser("workbook", help="write the estimate workbook: WBS, effort and schedule as formulas")
    p.add_argument("--out", type=Path, default=None)
    p.add_argument("--verify", action="store_true", help="recalculate with LibreOffice (Docker) and compare")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan = load_project(root), load_plan(root)
    if report_plan_errors(project, plan):
        return 1
    slug = re.sub(r"[^a-z0-9]+", "-", project.name.lower()).strip("-")
    out = args.out or root / project.docs_root / "06-planning" / f"{slug}-estimate.xlsx"
    layout = build_workbook(project, plan, out)
    print(f"wrote {out}")
    if not args.verify:
        return 0
    if not lo_verify.docker_available():
        print("verify: Docker is not available; LibreOffice recalculation skipped.")
        return 0
    sched = build_schedule(project, plan, baseline=True)
    problems = lo_verify.verify(lo_verify.recalc(out), layout, sched, plan)
    for p in problems:
        print("verify:", p)
    print("verify: OK, zero error cells and every row matches the baseline schedule" if not problems
          else f"verify: {len(problems)} problems")
    return 1 if problems else 0
