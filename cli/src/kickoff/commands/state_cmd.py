"""kickoff init | status | can | phase | gate"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

from ..clarity import clarity_lines, load_clarity
from ..errors import KickoffError
from ..estimate import spread_text
from ..model import KICKOFF_DIR, load_state, resolve_root, write_yaml
from ..state import PHASES, approve, blockers, init_project, next_step, reopen, set_phase, status_lines


def register(sub) -> None:
    p = sub.add_parser("init", help="create .kickoff/ and the docs folders")
    p.add_argument("--name", required=True)
    p.add_argument("--nested", action="store_true",
                   help="allow a separate project inside a folder of another kickoff project (a product sold apart)")
    p.set_defaults(func=run_init)
    p = sub.add_parser("status", help="phases, gates, stale items and the next step")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=run_status)
    p = sub.add_parser("can", help="exit 0 if a phase may start, 1 with reasons if not")
    p.add_argument("phase")
    p.add_argument("--baseline", action="store_true")
    p.set_defaults(func=run_can)
    p = sub.add_parser("phase", help="mark a phase started or done")
    p.add_argument("action", choices=["start", "done"])
    p.add_argument("phase")
    p.set_defaults(func=run_phase)
    p = sub.add_parser("gate", help="approve or reopen a gate")
    p.add_argument("action", choices=["approve", "reopen"])
    p.add_argument("gate")
    p.add_argument("--by", default="")
    p.add_argument("--evidence", default="")
    p.add_argument("--date", type=date.fromisoformat, default=None)
    p.add_argument("--reason", default="")
    p.set_defaults(func=run_gate)


def _save(root: Path, state: dict) -> None:
    write_yaml(root / KICKOFF_DIR / "state.yaml", state)


def run_init(args) -> int:
    root = (args.root or Path.cwd()).resolve()
    for path in init_project(root, args.name, date.today(), args.nested):
        print("wrote", path.relative_to(root))
    print("next: fill .kickoff/project.yaml (kickoff:init skill), then kickoff validate")
    return 0


def run_status(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    try:
        clarity = load_clarity(root)
    except KickoffError as exc:  # `kickoff validate` reports it; status still shows the phases
        print(f"clarity.yaml: {exc}", file=sys.stderr)
        clarity = None
    if args.json:
        out = {**state, "next": next_step(state)}
        if clarity:
            out["clarity"] = clarity
        print(json.dumps(out, default=str, ensure_ascii=False, indent=2))
    else:
        print("\n".join(status_lines(state) + (clarity_lines(clarity, spread_text(root)) if clarity else [])))
    return 0


def run_can(args) -> int:
    reasons = blockers(load_state(resolve_root(args.root)), args.phase, baseline=args.baseline)
    for r in reasons:
        print("blocked:", r)
    if not reasons:
        print(f"ok: {args.phase} may start")
    return 1 if reasons else 0


def run_phase(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    # The same rule as `kickoff can`, for start and done: a phase recorded past an open gate would make the
    # skipped phase look like a legacy pass (state.LEGACY).
    reasons = blockers(state, args.phase) if args.phase in PHASES else []
    if reasons:
        raise KickoffError(f"cannot {'start' if args.action == 'start' else 'finish'} {args.phase}: "
                           + "; ".join(reasons))
    set_phase(state, args.phase, "in_progress" if args.action == "start" else "done")
    _save(root, state)
    print(f"{args.phase}: {state['phases'][args.phase]}")
    return 0


def run_gate(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    if args.action == "approve":
        approve(state, args.gate, args.by, args.evidence, args.date or date.today())
        print(f"{args.gate} approved")
    else:
        stale = reopen(state, args.gate, args.reason or "no reason given")
        print(f"{args.gate} reopened; stale: {', '.join(stale) or 'none'}")
    _save(root, state)
    return 0
