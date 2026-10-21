"""The design skills kickoff requires (Anthropic frontend-design, impeccable): where they are, project setup and
impeccable's deterministic detector."""

from __future__ import annotations

import json
import os
import re
import shlex
import shutil
from pathlib import Path

from .ecc import Change, Check, config_dir, plugin_install
from .errors import KickoffError

# check id -> (skill folder name, what to install)
REQUIRED = {
    "G1": ("frontend-design", "Anthropic frontend-design: /plugin install frontend-design@claude-code-plugins"),
    "G2": ("impeccable", "impeccable: /plugin marketplace add pbakaus/impeccable, "
                         "then /plugin install impeccable@impeccable"),
}
# skill folder name -> what it adds; reported, never required
OPTIONAL = {
    "emil-design-eng": "Emil Kowalski's skills (npx skills@latest add emilkowalski/skills): variants, animation review",
    "ui-ux-pro-max": "ui-ux-pro-max: UX guidelines, chart and stack references",
}
TELEMETRY_ENV = ("IMPECCABLE_NO_TELEMETRY", "DO_NOT_TRACK")
IMPECCABLE_CONFIG = Path(".impeccable") / "config.json"
IGNORE_BEGIN, IGNORE_END = "# impeccable-ignore-start", "# impeccable-ignore-end"
IGNORE_BLOCK = f"""{IGNORE_BEGIN}
# Ephemeral impeccable output (written by kickoff design setup). Shared artefacts stay tracked:
# config.json, live/config.json, design.json, surfaces/*.md, critique/*.md.
**/.impeccable/config.local.json
**/.impeccable/hook.cache.json
**/.impeccable/hook.pending.json
**/.impeccable/*.png
**/.impeccable/review/
**/.impeccable/questions/
**/.impeccable/live/server.json
**/.impeccable/live/sessions/
**/.impeccable/live/previews/
**/.impeccable/live/annotations/
**/.impeccable/live/cache/
**/.impeccable/live/*.png
{IGNORE_END}
"""
VERSION_LINE = re.compile(r"^version:\s*[\"']?([^\"'\s]+)", re.M)


class DesignError(KickoffError):
    """A required design skill is missing, or a file kickoff would change cannot be read."""


def skill_dir(name: str, project: Path | None = None) -> Path | None:
    """The folder holding `<name>/SKILL.md`: the project's .claude/skills, then a plugin whose key is `<name>@…`,
    then the user's skills folder."""
    places = [project / ".claude" / "skills" / name] if project is not None else []
    install = plugin_install(lambda key: key.split("@", 1)[0] == name, project)
    if install is not None:
        places.append(install.root / "skills" / name)
    places.append(config_dir() / "skills" / name)
    return next((p for p in places if (p / "SKILL.md").is_file()), None)


def skill_version(folder: Path) -> str:
    m = VERSION_LINE.search((folder / "SKILL.md").read_text(encoding="utf-8", errors="replace")[:2000])
    return m.group(1) if m else ""


def _read_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def telemetry_off(project: Path) -> bool:
    if any(os.environ.get(name) for name in TELEMETRY_ENV):
        return True
    return _read_json(project / IMPECCABLE_CONFIG).get("telemetry") is False


def doctor(project: Path | None) -> list[Check]:
    """G1 frontend-design, G2 impeccable (required); G3 impeccable telemetry off in the project; G4 optional skills."""
    out = []
    for gid, (name, how) in REQUIRED.items():
        folder = skill_dir(name, project)
        if folder is None:
            out.append(Check("fail", f"{gid} {name} is not installed: {how}"))
        else:
            version = skill_version(folder)
            out.append(Check("ok", f"{gid} {name}{' ' + version if version else ''} at {folder}"))
    if project is not None:
        out.append(Check("ok", "G3 impeccable telemetry is off for this project") if telemetry_off(project)
                   else Check("warn", "G3 impeccable telemetry is on for this project: run kickoff design setup"))
    for name, what in OPTIONAL.items():
        found = skill_dir(name, project)
        out.append(Check("ok", f"G4 optional {name}: " + ("installed" if found else f"not installed ({what})")))
    return out


# ---------------------------------------------------------------- setup
def config_change(project: Path) -> Change | None:
    """Merge "telemetry": false into .impeccable/config.json."""
    path = project / IMPECCABLE_CONFIG
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    try:
        data = json.loads(old.removeprefix("\ufeff")) if old.strip() else {}
    except ValueError as exc:
        raise DesignError(f"{path}: invalid JSON, nothing written: {exc}") from exc
    if not isinstance(data, dict):
        raise DesignError(f"{path}: expected a JSON object, nothing written")
    if data.get("telemetry") is False:
        return None
    data["telemetry"] = False
    return Change(path, old, json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def gitignore_change(project: Path) -> Change | None:
    """Add (or refresh) impeccable's ignore block in the project's .gitignore."""
    path = project / ".gitignore"
    old = path.read_bytes().decode("utf-8") if path.exists() else ""  # bytes: keep CRLF line ends as they are
    eol = "\r\n" if "\r\n" in old else "\n"
    block = IGNORE_BLOCK.replace("\n", eol)
    if IGNORE_BEGIN in old and IGNORE_END in old:
        head, rest = old.split(IGNORE_BEGIN, 1)
        new = head + block + rest.split(IGNORE_END, 1)[1].removeprefix(eol)
    else:
        new = old + ("" if old.endswith("\n") or not old else eol) + (eol if old else "") + block
    return None if new == old else Change(path, old, new)


# ---------------------------------------------------------------- detector
def detector(project: Path | None = None) -> list[str] | None:
    """The command that runs impeccable's detector: `KICKOFF_IMPECCABLE`, the launcher of the installed skill, or
    `impeccable` on PATH. None when there is none."""
    env = os.environ.get("KICKOFF_IMPECCABLE")
    if env:
        return shlex.split(env, posix=os.name != "nt")
    folder = skill_dir("impeccable", project)
    if folder is not None:
        launcher = folder / "scripts" / ("impeccable.cmd" if os.name == "nt" else "impeccable")
        if launcher.is_file():
            return [str(launcher)]
    found = shutil.which("impeccable")
    return [found] if found else None
