"""kick companions | doctor | setup"""

from __future__ import annotations

import difflib
import json
import sys

from .. import __version__
from ..companions import ANSWERS, BY_ID, STEPS, known_marketplaces, mark, states
from ..ecc import doctor, settings_change, write_change
from ..files import find_root, resolve_root


def register(sub) -> None:
    p = sub.add_parser("companions", help="optional tools kick can use; --step lists what a step should offer")
    p.add_argument("--step", choices=STEPS, help="only what this step calls for and is neither installed nor "
                                                 "declined for good")
    p.add_argument("--json", action="store_true", help="print JSON")
    p.set_defaults(func=run_companions)
    actions = p.add_subparsers(dest="companions_action", metavar="<action>")
    m = actions.add_parser("mark", help="remember the person's answer for a companion")
    m.add_argument("id", choices=sorted(BY_ID))
    m.add_argument("answer", choices=ANSWERS)
    m.set_defaults(func=run_mark)

    p = sub.add_parser("doctor", help="check the kick CLI, ECC (required) and the companions")
    p.set_defaults(func=run_doctor)

    p = sub.add_parser("setup", help="exempt docs/kick/ from ECC's GateGuard in the project's .claude/settings.json")
    p.add_argument("--dry", action="store_true", help="print the change as a diff, write nothing")
    p.set_defaults(func=run_setup)


def run_companions(args) -> int:
    project = find_root(resolve_root(args.root))
    rows = states(project, args.step)
    if args.step:
        rows = [s for s in rows if s.to_offer()]
    known = known_marketplaces()
    if args.json:
        print(json.dumps([{"id": s.companion.id, "steps": list(s.companion.steps), "when": s.companion.when,
                           "purpose": s.companion.purpose, "account": s.companion.account,
                           "installed": s.installed, "answer": s.answer, "note": s.companion.note,
                           "install": s.companion.install_commands(known)} for s in rows],
                         ensure_ascii=False, indent=2))
        return 0
    if args.step and not rows:
        print(f"nothing to offer for {args.step}")
        return 0
    for s in rows:
        c = s.companion
        state = "installed" if s.installed else f"not installed ({s.answer or 'not asked'})"
        print(f"{c.id}: {state}; {'needs an account' if c.account else 'no account needed'}")
        print(f"  helps {', '.join(c.steps)} when {c.when}: {c.purpose}")
        if c.note:
            print(f"  note: {c.note}")
        if not s.installed:
            print("  install: " + " && ".join(c.install_commands(known)))
    return 0


def run_mark(args) -> int:
    mark(args.id, args.answer)
    print(f"remembered: {args.id} {args.answer}")
    return 0


def run_doctor(args) -> int:
    project = find_root(resolve_root(args.root))
    print(f"ok: kick CLI {__version__}")
    checks = doctor(project)
    for check in checks:
        print(check)
    rows = states(project)
    have = [s.companion.id for s in rows if s.installed]
    print(f"companions: {len(have)} of {len(rows)} installed" + (f" ({', '.join(have)})" if have else "")
          + "; the others are offered at the step that needs them")
    failed = any(c.level == "fail" for c in checks)
    print("doctor failed" if failed else "doctor passed")
    return 1 if failed else 0


def run_setup(args) -> int:
    root = resolve_root(args.root)
    change = settings_change(root)
    if change is None:
        print("setup up to date")
    elif args.dry:
        sys.stdout.writelines(difflib.unified_diff(change.old.splitlines(keepends=True),
                                                   change.new.splitlines(keepends=True),
                                                   fromfile=str(change.path), tofile=str(change.path)))
    else:
        write_change(change)
        print("wrote", change.path)
    return 0
