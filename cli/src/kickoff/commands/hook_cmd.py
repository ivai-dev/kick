"""kickoff hook session-start | pre-write | post-write  (called by the plugin's hooks.json)"""

from __future__ import annotations

import json
import sys

from ..hook import HANDLERS


def register(sub) -> None:
    p = sub.add_parser("hook", help="Claude Code hook handlers; read the hook JSON on stdin")
    p.add_argument("event", choices=sorted(HANDLERS))
    p.set_defaults(func=run)


def _decision(event: str, reason: str) -> dict:
    if event == "pre-write":
        return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                       "permissionDecisionReason": reason}}
    return {"decision": "block", "reason": reason}


def run(args) -> int:
    # A block is a JSON decision on stdout with exit 0, never exit 2: hooks.json ends each command with `|| true`,
    # so an older CLI without `hook` (argparse exits 2) can never block a write. A kickoff bug exits 1.
    try:
        raw = sys.stdin.buffer.read().decode("utf-8") if not sys.stdin.isatty() else ""
        payload = json.loads(raw) if raw.strip() else {}
        code, message = HANDLERS[args.event](payload)
    except Exception as exc:  # noqa: BLE001
        print(f"kickoff hook {args.event}: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    if code == 2:
        print(json.dumps(_decision(args.event, message), ensure_ascii=False))
    elif message:
        print(message)
    return 0
