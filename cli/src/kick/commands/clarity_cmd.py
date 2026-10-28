"""kickoff clarity [show | init | set AREA ...]"""

from __future__ import annotations

from datetime import date

from ..clarity import clarity_lines, clarity_path, default_clarity, load_clarity, set_area
from ..errors import KickError
from ..estimate import spread_text
from ..model import resolve_root, write_yaml


def register(sub) -> None:
    p = sub.add_parser("clarity", help="how settled each area of the project is (open, assumed, decided, validated)")
    p.add_argument("action", nargs="?", choices=["show", "init", "set"], default="show")
    p.add_argument("area", nargs="?", help="for `set`: an area id (problem, users, scope, solution, architecture, "
                                           "design, estimate, or one of your own)")
    p.add_argument("--status", default=None)
    p.add_argument("--confidence", default=None)
    p.add_argument("--note", default=None)
    p.add_argument("--ref", action="append", default=[], help="an ID that backs the status (Q3, D2, A4, V1, ADR-002)")
    p.add_argument("--date", type=date.fromisoformat, default=None)
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    day = args.date or date.today()
    if args.action == "init":
        if clarity_path(root).exists():
            raise KickError(f"{clarity_path(root)} already exists")
        write_yaml(clarity_path(root), default_clarity(day))
        print("wrote", clarity_path(root).relative_to(root))
        return 0
    data = load_clarity(root)
    if args.action == "set":
        if data is None:
            raise KickError("no .kickoff/clarity.yaml: run kickoff clarity init first")
        if not args.area:
            raise KickError("kickoff clarity set needs an area id")
        set_area(data, args.area, args.status, args.confidence, args.note, args.ref, day)
        write_yaml(clarity_path(root), data)
        print(f"{args.area}: updated")
        return 0
    if data is None:
        print("clarity: not started (kickoff clarity init)")
        return 0
    print("\n".join(clarity_lines(data, spread_text(root))))
    return 0
