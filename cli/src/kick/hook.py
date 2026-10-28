"""Hook handlers: (exit code, message) per event. Filled in with the kick project files."""

from __future__ import annotations

HANDLERS = {event: (lambda payload: (0, "")) for event in ("post-write", "session-start")}
