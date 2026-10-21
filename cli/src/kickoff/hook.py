"""Claude Code hooks: `kickoff hook session-start | pre-write | post-write`.

Each handler takes the hook's JSON input and returns (code, text): 2 blocks a write (pre-write) or sends the text
back to the model (post-write), 0 lets everything through. `kickoff hook` turns a 2 into a JSON decision with
exit 0 (see commands/hook_cmd.py). A tree without .kickoff/ is never touched."""

from __future__ import annotations

from pathlib import Path, PurePosixPath

from .ecc import install_checks
from .errors import KickoffError
from .model import KICKOFF_DIR, ModelError, find_root, load_project, load_state
from .proto import KIT_CORE_JS, proto_dir
from .state import blockers, status_lines
from .validate import validate_root

CLI_ONLY = {
    f"{KICKOFF_DIR}/state.yaml": "state.yaml is written by the kickoff CLI only: use kickoff phase, kickoff gate "
                                 "or kickoff proto record",
    f"{KICKOFF_DIR}/tickets.yaml": "tickets.yaml is written by kickoff tickets only",
}


def _root(start: Path) -> Path | None:
    try:
        return find_root(start)
    except ModelError:
        return None


def _target(payload: dict) -> tuple[Path, Path] | None:
    """(project root, absolute file path) of a Write/Edit/MultiEdit inside a kickoff project."""
    raw = (payload.get("tool_input") or {}).get("file_path")
    if not raw:
        return None
    path = Path(raw)
    if not path.is_absolute():
        path = Path(payload.get("cwd") or Path.cwd()) / path
    path = path.resolve()
    root = _root(path.parent)
    return (root, path) if root else None


def _under(path: Path, folder: Path) -> PurePosixPath | None:
    try:
        return PurePosixPath(path.relative_to(folder.resolve()).as_posix())
    except ValueError:
        return None


def session_start(payload: dict) -> tuple[int, str]:
    root = _root(Path(payload.get("cwd") or Path.cwd()))
    if not root:
        return 0, ""
    lines = ["kickoff project detected: use the kickoff:using-kickoff skill."]
    try:
        lines += status_lines(load_state(root))
    except KickoffError as exc:
        lines.append(f"kickoff status failed: {exc}")
    _, checks = install_checks(root)
    lines += [f"ecc {c}" for c in checks if c.level != "ok"]
    return 0, "\n".join(lines)


def pre_write(payload: dict) -> tuple[int, str]:
    target = _target(payload)
    if not target:
        return 0, ""
    root, path = target
    rel = _under(path, root)
    if rel is None:
        return 0, ""
    if str(rel) in CLI_ONLY:
        return 2, CLI_ONLY[str(rel)]
    try:
        project = load_project(root)
        arch = _under(path, project.docs_dir(root) / "04-architecture")
        kit = _under(path, proto_dir(root, project))
    except KickoffError:
        return 0, ""  # a broken project.yaml is validate's finding, not a reason to block every write
    if arch is not None and arch.parts[:1] != ("adr",):
        try:
            reasons = blockers(load_state(root), "solution")
        except KickoffError:
            reasons = []
        if reasons:
            return 2, "architecture documents wait for C3 and C4: " + "; ".join(reasons)
    if kit is not None and (str(kit) == "narrow.html" or kit.parts[:1] == ("test",)
                            or (len(kit.parts) == 2 and kit.parts[0] == "js" and kit.suffix == ".js"
                                and kit.stem in KIT_CORE_JS)):
        return 2, "the kit core is replaced by kickoff proto update; extend the kit in project files"
    return 0, ""


def post_write(payload: dict) -> tuple[int, str]:
    target = _target(payload)
    if not target:
        return 0, ""
    root, path = target
    rel = _under(path, root)
    if (rel is None or len(rel.parts) != 2 or rel.parts[0] != KICKOFF_DIR or rel.suffix != ".yaml"
            or str(rel) in CLI_ONLY):
        return 0, ""
    errors = [f for f in validate_root(root) if f.level == "error"]
    if not errors:
        return 0, ""
    return 2, "kickoff validate after editing " + str(rel) + ":\n" + "\n".join(str(f) for f in errors)


HANDLERS = {"session-start": session_start, "pre-write": pre_write, "post-write": post_write}
