"""kickoff estimate [--json PATH]"""

from __future__ import annotations

import json
from pathlib import Path

from ..estimate import estimate, estimate_md
from ..model import load_features, load_plan, load_project, resolve_root
from ..validate import report_plan_errors


def register(sub) -> None:
    p = sub.add_parser("estimate", help="effort totals as a range (min, likely, max) by release and role")
    p.add_argument("--json", type=Path, default=None, help="also write the totals as JSON")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    if report_plan_errors(project, plan):
        return 1
    est = estimate(project, plan, features)
    print(estimate_md(project, est), end="")
    if args.json:
        args.json.write_text(json.dumps(est, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        print(f"-> {args.json}")
    return 0
