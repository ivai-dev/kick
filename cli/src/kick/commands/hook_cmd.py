"""kick hook session-start | post-write  (called by the plugin's hooks.json)

This runs on every Write and Edit in every repository where the plugin is enabled, so it imports only the standard
library until it has found a docs/kick/ folder; `kick.cli.main` calls `fast_run` before it builds the parser."""

from __future__ import annotations

import json
import sys
from pathlib import Path

EVENTS = ("post-write", "session-start")


def register(sub) -> None:
    p = sub.add_parser("hook", help="Claude Code hook handlers; read the hook JSON on stdin")
    p.add_argument("event", choices=EVENTS)
    p.set_defaults(func=run)


def _start(event: str, payload: dict) -> Path | None:
    """The folder to search upwards from for docs/kick/, or None when the payload names no file."""
    cwd = Path(payload.get("cwd") or Path.cwd())
    if event == "session-start":
        return cwd
    tool_input = payload.get("tool_input")
    raw = tool_input.get("file_path") if isinstance(tool_input, dict) else None
    if not isinstance(raw, str) or not raw:
        return None
    path = Path(raw)
    return (path if path.is_absolute() else cwd / path).parent


def _in_project(start: Path) -> bool:
    start = start.resolve()
    return any((p / "docs" / "kick").is_dir() for p in (start, *start.parents))


def fast_run(event: str) -> int:
    # kick never blocks: a message is printed for the agent to read, and a kick bug exits 1 (hooks.json ends with
    # `|| true`, so the session goes on).
    if event not in EVENTS:
        print(f"kick hook: unknown event {event}; events: {', '.join(EVENTS)}", file=sys.stderr)
        return 1
    try:
        raw = sys.stdin.buffer.read().decode("utf-8") if not sys.stdin.isatty() else ""
        payload = json.loads(raw) if raw.strip() else {}
        if not isinstance(payload, dict):
            raise ValueError("the hook input is not a JSON object")
        start = _start(event, payload)
        if start is None or not _in_project(start):
            return 0
        from ..hook import HANDLERS  # the heavy imports start here, inside a kick project only

        _, message = HANDLERS[event](payload)
    except Exception as exc:  # noqa: BLE001
        print(f"kick hook {event}: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    if message:
        print(message)
    return 0


def run(args) -> int:
    return fast_run(args.event)
