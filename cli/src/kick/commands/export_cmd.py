"""kickoff export [--out DIR] [--format csv,json,md] [--lang LANG]"""

from __future__ import annotations

from pathlib import Path

from ..errors import KickError
from ..export import FORMATS, export
from ..model import load_features, load_plan, load_project, resolve_root
from ..validate import report_plan_errors


def register(sub) -> None:
    p = sub.add_parser("export", help="write the WBS as CSV, JSON and Markdown for a tracker or another tool to import")
    p.add_argument("--out", type=Path, default=None,
                   help="output folder (default: <docs_root>/06-planning/export)")
    p.add_argument("--format", default=",".join(FORMATS), help="comma-separated: csv, json, md (default: all)")
    p.add_argument("--lang", default=None, help="translate names from the plan's i18n (default: the plan language)")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    formats = [f.strip() for f in args.format.split(",") if f.strip()]
    unknown = [f for f in formats if f not in FORMATS]
    if unknown or not formats:
        raise KickError(f"unknown format {', '.join(unknown) or '(none)'}; formats: {', '.join(FORMATS)}")
    if report_plan_errors(project, plan):
        return 1
    out = args.out or project.docs_dir(root) / "06-planning" / "export"
    for path in export(project, plan, features, out, formats, args.lang):
        shown = path.relative_to(root).as_posix() if path.resolve().is_relative_to(root) else path
        print("wrote", shown)
    print(f"{len(plan.packages)} packages exported")
    return 0
