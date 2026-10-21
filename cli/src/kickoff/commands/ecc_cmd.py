"""kickoff ecc root | doctor | setup | run"""

from __future__ import annotations

import difflib
import sys
from pathlib import Path

from ..ecc import doctor, find_install, router_change, run_script, settings_change, write_change
from ..errors import KickoffError
from ..model import ModelError, load_project, resolve_root


def register(sub) -> None:
    p = sub.add_parser("ecc", help="locate and check the ECC plugin, set a project up for it, run ECC scripts")
    actions = p.add_subparsers(dest="ecc_action", metavar="<action>", required=True)

    a = actions.add_parser("root", help="print the folder of the installed ECC plugin")
    a.set_defaults(func=run_root)

    a = actions.add_parser("doctor", help="check ECC: installed, version, the components kickoff uses, project setup")
    a.set_defaults(func=run_doctor)

    a = actions.add_parser("setup", help="exempt kickoff documents from GateGuard in .claude/settings.json")
    a.add_argument("--router", action="store_true", help="also add the kickoff route to the ecc-router table")
    a.add_argument("--dry", action="store_true", help="print the changes as a diff, write nothing")
    a.set_defaults(func=run_setup)

    a = actions.add_parser("run", help="run an ECC script from the ECC folder, in the current folder")
    a.add_argument("script", help="script name, e.g. github-coordination")
    a.add_argument("args", nargs="*", help="arguments passed to the script (put them after --)")
    a.set_defaults(func=run_run)


def _project(args) -> Path | None:
    try:
        return resolve_root(args.root)
    except ModelError:
        return None


def run_root(args) -> int:
    print(find_install(_project(args)).root)
    return 0


def run_doctor(args) -> int:
    project = _project(args)
    docs_root = load_project(project).docs_root if project else None
    checks = doctor(project, docs_root)
    for check in checks:
        print(check)
    failed = any(c.level == "fail" for c in checks)
    print("ecc doctor failed" if failed else "ecc doctor passed")
    return 1 if failed else 0


def run_setup(args) -> int:
    root = resolve_root(args.root)
    changes = [settings_change(root, load_project(root).docs_root)]
    if args.router:
        changes.append(router_change())
    changes = [c for c in changes if c]
    for change in changes:
        if args.dry:
            sys.stdout.writelines(difflib.unified_diff(
                change.old.splitlines(keepends=True), change.new.splitlines(keepends=True),
                fromfile=str(change.path), tofile=str(change.path)))
        else:
            write_change(change)
            print("wrote", change.path)
    if not changes:
        print("ecc setup up to date")
    return 0


def run_run(args) -> int:
    project = _project(args)
    if project is None and args.root:
        raise KickoffError(f"no .kickoff/ folder at {args.root}")
    return run_script(args.script, args.args, Path.cwd(), project)
