"""Hook handlers, each returning (exit code, message). They never block: the message is for the agent to read.

session-start: the languages line and the status, so every session follows the agreed languages.
post-write: kick check after an edit of a kick YAML file or a page with a table kick reads."""

from __future__ import annotations

from pathlib import Path

from .commands.hook_cmd import CHECKED
from .ecc import doctor
from .errors import KickError
from .files import KICK_DIR, find_root
from .projectfile import load_project
from .report import check_root, status_lines


def _cwd(payload: dict) -> Path:
    return Path(payload.get("cwd") or Path.cwd())


def session_start(payload: dict) -> tuple[int, str]:
    root = find_root(_cwd(payload))
    if root is None:
        return 0, ""
    lines = ["kick project: use the kick:using-kick skill. Talk to the person in plain words, in the chat language "
             "below; write documents, code, the product's text and commits in theirs."]
    try:
        lines += status_lines(root, load_project(root))
    except KickError as exc:
        lines.append(f"kick: {exc}")
    lines += [f"kick needs ECC: {c.text}" for c in doctor(root) if c.level == "fail"]
    return 0, "\n".join(lines)


def post_write(payload: dict) -> tuple[int, str]:
    tool_input = payload.get("tool_input")
    raw = tool_input.get("file_path") if isinstance(tool_input, dict) else None
    if not isinstance(raw, str) or not raw:
        return 0, ""
    path = Path(raw)
    path = path if path.is_absolute() else _cwd(payload) / path
    if path.name not in CHECKED:
        return 0, ""
    root = find_root(path.parent)
    if root is None:
        return 0, ""
    try:
        path.resolve().relative_to((root / KICK_DIR).resolve())
    except ValueError:
        return 0, ""
    found = check_root(root)
    if not found.errors and not found.warnings:
        return 0, ""
    rel = path.resolve().relative_to(root.resolve()).as_posix()
    lines = [f"kick check after editing {rel}:"]
    lines += [f"error: {e}" for e in found.errors] + [f"warn: {w}" for w in found.warnings]
    return 0, "\n".join(lines)


HANDLERS = {"session-start": session_start, "post-write": post_write}
