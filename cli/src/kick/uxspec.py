"""The screen inventory of the ux-spec: the one table of the design documents the CLI reads. A "screen" is any unit of
experience (a screen, a scene, a level, a flow state); platform and roles are free text."""

from __future__ import annotations

import re
from pathlib import Path

from .errors import KickError
from .model import Project, inside_root


def ux_spec_path(root: Path, project: Project) -> Path:
    project.docs_dir(root)
    value = project.design.get("ux_spec") or f"{project.docs_root}/05-design/ux-spec.md"
    return inside_root(root, value, "design.ux_spec")


def forbidden_patterns(project: Project) -> list[str]:
    return list(project.design.get("forbidden") or [])


def _cells(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def parse_inventory(path: Path) -> list[dict]:
    """Rows {code, name, roles, platform, release} of the first table whose header starts with `| ID`."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError as exc:
        raise KickError(f"missing ux-spec: {path}") from exc
    rows: list[dict] = []
    in_table = False
    for line in lines:
        stripped = line.strip()
        if not in_table:
            if re.match(r"\|\s*ID\b", stripped, re.IGNORECASE):
                in_table = True
            continue
        if not stripped.startswith("|"):
            break
        cells = _cells(stripped)
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            continue
        cells += [""] * (5 - len(cells))
        rows.append({"code": cells[0], "name": cells[1],
                     "roles": [r.strip() for r in re.split(r"[,;/]", cells[2]) if r.strip()],
                     "platform": cells[3], "release": cells[4]})
    return rows


def problems(rows: list[dict], releases: set[str]) -> list[tuple[str, str]]:
    """(level, text) findings of an inventory: duplicate or empty IDs and unknown releases are errors."""
    out: list[tuple[str, str]] = []
    seen: dict[str, str] = {}
    for row in rows:
        code = row["code"]
        if not code:
            out.append(("error", f"ux-spec screen {row['name']!r} has no ID"))
            continue
        key = code.lower()
        if key in seen:
            out.append(("error", f"ux-spec screens {seen[key]!r} and {code!r} have the same ID"))
        seen[key] = code
        if row["release"] not in releases:
            out.append(("error", f"ux-spec screen {code}: release {row['release']!r} is not in project.yaml releases"))
        if not row["name"]:
            out.append(("error", f"ux-spec screen {code} has no name"))
    return out
