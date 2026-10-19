"""kickoff tickets plan | push [--dry] [--adopt] | pull | link <key> <number>"""

from __future__ import annotations

from ..model import load_features, load_plan, load_project, load_tickets, resolve_root
from ..schedule import actuals_of, build_schedule
from ..tickets import link, make_tracker, plan_issues, pull, push


def register(sub) -> None:
    p = sub.add_parser("tickets", help="plan, push and pull tracker issues")
    s = p.add_subparsers(dest="tickets_command", metavar="<action>", required=True)
    s.add_parser("plan", help="print the issues the plan would create")
    ps = s.add_parser("push", help="create and update issues in the tracker")
    ps.add_argument("--dry", action="store_true")
    ps.add_argument("--adopt", action="store_true",
                    help="replace title and body of issues mapped with `tickets link` or found without sync state")
    s.add_parser("pull", help="pull issue progress into actuals and show moved gates")
    lk = s.add_parser("link", help="map a WBS code or epic id to an existing issue number")
    lk.add_argument("key")
    lk.add_argument("number", type=int)
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    cmd = args.tickets_command
    if cmd == "plan":
        project, plan, features = load_project(root), load_plan(root), load_features(root)
        sched = build_schedule(project, plan, actuals_of(load_tickets(root)))
        for spec in plan_issues(project, plan, features, sched):
            parent = f"  parent {spec.parent_key}" if spec.parent_key else ""
            blocked = f"  blocked by {', '.join(spec.blocked_by)}" if spec.blocked_by else ""
            print(f"{spec.type:<6} {spec.title}{parent}{blocked}")
        return 0
    if cmd == "link":
        link(root, args.key, args.number)
        print(f"{args.key} -> #{args.number}")
        return 0
    project = load_project(root)
    tracker = make_tracker(project, load_tickets(root), dry=getattr(args, "dry", False))
    if cmd == "pull":
        for line in pull(root, tracker) or ["no changes"]:
            print(line)
        return 0
    report = push(root, tracker, dry=args.dry, adopt=args.adopt)
    for name in ("created", "updated", "drift", "links", "warnings"):
        for item in getattr(report, name):
            print(f"{name:<8} {item}")
    print(f"{len(report.created)} created, {len(report.updated)} updated, {len(report.unchanged)} unchanged, "
          f"{len(report.drift)} drift, {len(report.mutations)} mutations" + (" (dry run)" if args.dry else ""))
    return 1 if report.drift else 0
