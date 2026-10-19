"""kickoff validate"""

from __future__ import annotations

from ..model import resolve_root
from ..validate import validate_root


def register(sub) -> None:
    p = sub.add_parser("validate", help="check .kickoff/ files for schema and consistency errors")
    p.set_defaults(func=run)


def run(args) -> int:
    findings = validate_root(resolve_root(args.root))
    for f in findings:
        print(f)
    errors = sum(f.level == "error" for f in findings)
    warnings = len(findings) - errors
    print(f"{errors} errors, {warnings} warnings")
    return 1 if errors else 0
