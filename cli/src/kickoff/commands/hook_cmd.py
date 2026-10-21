"""kickoff hook session-start | pre-write | post-write  (called by the plugin's hooks.json)"""

from __future__ import annotations

import json
import sys

from ..hook import HANDLERS


def register(sub) -> None:
    p = sub.add_parser("hook", help="Claude Code hook handlers; read the hook JSON on stdin")
    p.add_argument("event", choices=sorted(HANDLERS))
    p.set_defaults(func=run)


def run(args) -> int:
    # Never exit 2 by accident: only a handler's decision blocks a write. A kickoff bug exits 1 (shown, not blocking).
    try:
        raw = sys.stdin.buffer.read().decode("utf-8") if not sys.stdin.isatty() else ""
        payload = json.loads(raw) if raw.strip() else {}
        code, message = HANDLERS[args.event](payload)
    except Exception as exc:  # noqa: BLE001
        print(f"kickoff hook {args.event}: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    if message:
        print(message, file=sys.stdout if code == 0 else sys.stderr)
    return code
