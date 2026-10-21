"""kickoff design doctor | setup"""

from __future__ import annotations

import difflib
import sys

from ..design import config_change, doctor, gitignore_change
from ..ecc import write_change
from ..model import ModelError, resolve_root


def register(sub) -> None:
    p = sub.add_parser("design", help="check the design skills kickoff requires, set a project up for impeccable")
    actions = p.add_subparsers(dest="design_action", metavar="<action>", required=True)

    a = actions.add_parser("doctor", help="check frontend-design and impeccable, impeccable telemetry, optional skills")
    a.set_defaults(func=run_doctor)

    a = actions.add_parser("setup", help="turn impeccable telemetry off for the project and git-ignore its scratch files")
    a.add_argument("--dry", action="store_true", help="print the changes as a diff, write nothing")
    a.set_defaults(func=run_setup)


def run_doctor(args) -> int:
    try:
        project = resolve_root(args.root)
    except ModelError:
        project = None
    checks = doctor(project)
    for check in checks:
        print(check)
    failed = any(c.level == "fail" for c in checks)
    print("design doctor failed" if failed else "design doctor passed")
    return 1 if failed else 0


def run_setup(args) -> int:
    root = resolve_root(args.root)
    changes = [c for c in (config_change(root), gitignore_change(root)) if c]
    for change in changes:
        if args.dry:
            sys.stdout.writelines(difflib.unified_diff(
                change.old.splitlines(keepends=True), change.new.splitlines(keepends=True),
                fromfile=str(change.path), tofile=str(change.path)))
        else:
            write_change(change)
            print("wrote", change.path)
    if not changes:
        print("design setup up to date")
    return 0
