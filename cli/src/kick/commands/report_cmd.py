"""kick status | estimate | check"""

from __future__ import annotations

import json

from ..estimate import estimate_lines, kick_total, product_total
from ..files import resolve_root
from ..kickfile import find_kick, load_kick
from ..projectfile import load_project
from ..report import check_root, kick_status_lines, status_lines


def register(sub) -> None:
    p = sub.add_parser("status", help="the kicks, the roadmap and the API in a few lines; one kick in detail")
    p.add_argument("slug", nargs="?")
    p.set_defaults(func=run_status)

    p = sub.add_parser("estimate", help="range totals of a kick, or of the whole product from the roadmap")
    p.add_argument("slug", nargs="?")
    p.add_argument("--remaining", action="store_true", help="leave out what is done")
    p.add_argument("--json", action="store_true", help="print JSON")
    p.set_defaults(func=run_estimate)

    p = sub.add_parser("check", help="check the kick files and tables; exit 1 on errors")
    p.add_argument("slug", nargs="?")
    p.set_defaults(func=run_check)


def run_status(args) -> int:
    root = resolve_root(args.root)
    project = load_project(root)
    lines = (kick_status_lines(root, load_kick(find_kick(root, args.slug))) if args.slug
             else status_lines(root, project))
    print("\n".join(lines))
    return 0


def run_estimate(args) -> int:
    root = resolve_root(args.root)
    project = load_project(root)
    if args.slug:
        kick = load_kick(find_kick(root, args.slug))
        total, budget = kick_total(kick, args.remaining), kick.budget_days
        label = f"Estimate: {kick.slug} ({kick.kind} kick)"
    else:
        total, budget = product_total(root, args.remaining), project.budget_days
        label = "Estimate: the product, from the roadmap"
    label += ", remaining" if args.remaining else ""
    if args.json:
        print(json.dumps(total.as_dict(project.overhead, budget), ensure_ascii=False, indent=2))
    else:
        print("\n".join(estimate_lines(label, total, project.overhead, budget)))
    return 0


def run_check(args) -> int:
    root = resolve_root(args.root)
    found = check_root(root, args.slug)
    for line in found.errors:
        print("error:", line)
    for line in found.warnings:
        print("warn:", line)
    print(f"check: {len(found.errors)} errors, {len(found.warnings)} warnings")
    return 1 if found.errors else 0
