"""kickoff docs [--check]"""

from __future__ import annotations

from ..docs import write_docs
from ..model import load_plan, load_project, resolve_root
from ..validate import report_plan_errors


def register(sub) -> None:
    p = sub.add_parser("docs", help="generate feature-map.md, wbs.md, risk-register.md and plan.md tables")
    p.add_argument("--check", action="store_true", help="fail if regeneration would change any file")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    if report_plan_errors(load_project(root), load_plan(root)):
        return 1
    changed = write_docs(root, check=args.check)
    for path in changed:
        print(("would change " if args.check else "wrote ") + str(path.relative_to(root)))
    if args.check and changed:
        return 1
    if not changed:
        print("documents up to date")
    return 0
