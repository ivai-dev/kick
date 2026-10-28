"""Where kick keeps its files, the templates, and YAML in and out."""

from __future__ import annotations

import re
from datetime import date
from importlib.resources import files
from pathlib import Path

import yaml

from .errors import KickError

KICK_DIR = Path("docs") / "kick"
PROJECT, DONE = "project", "done"
RESERVED = frozenset({PROJECT, DONE})
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{1,40}$")


def find_root(start: Path) -> Path | None:
    """The nearest folder at or above `start` that holds docs/kick/."""
    start = start.resolve()
    return next((p for p in (start, *start.parents) if (p / KICK_DIR).is_dir()), None)


def resolve_root(arg: Path | None) -> Path:
    """`--root` when given; else the nearest folder with docs/kick/; else the current folder (before `kick init`)."""
    if arg is not None:
        if not arg.is_dir():
            raise KickError(f"--root {arg} is not a folder")
        return arg.resolve()
    return find_root(Path.cwd()) or Path.cwd().resolve()


def kick_dir(root: Path) -> Path:
    return root / KICK_DIR


def project_dir(root: Path) -> Path:
    return kick_dir(root) / PROJECT


def check_slug(slug: str) -> str:
    if not isinstance(slug, str) or not SLUG.fullmatch(slug):
        raise KickError(f"invalid name {slug!r}: use 2-41 lowercase letters, digits and dashes, starting with a "
                        "letter or digit")
    if slug in RESERVED:
        raise KickError(f"{slug!r} is reserved: pick another name")
    return slug


def read_yaml(path: Path) -> dict:
    try:
        text = path.read_text(encoding="utf-8-sig")
    except FileNotFoundError as exc:
        raise KickError(f"{path} does not exist") from exc
    except (OSError, UnicodeDecodeError) as exc:
        raise KickError(f"{path}: cannot be read: {exc}") from exc
    try:
        data = yaml.safe_load(text)
    except (yaml.YAMLError, ValueError) as exc:  # PyYAML raises ValueError for an impossible date (2026-02-30)
        raise KickError(f"{path}: invalid YAML: {exc}") from exc
    if not isinstance(data, dict):
        raise KickError(f"{path}: expected a mapping at the top")
    return data


def write_yaml(path: Path, data: dict) -> None:
    path.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True), encoding="utf-8", newline="\n")


def as_date(value) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError as exc:
        raise KickError(f"{value!r} is not a date (YYYY-MM-DD)") from exc


def copy_templates(kind: str, dest: Path, values: dict[str, str]) -> list[Path]:
    """Copy the Markdown templates of `kind` ("project" or "kick") into `dest`, filling `{key}` placeholders;
    a file that already exists is left alone."""
    written = []
    for src in sorted(files("kick.templates").joinpath(kind).iterdir(), key=lambda p: p.name):
        if not src.name.endswith(".md"):
            continue
        target = dest / src.name
        if target.exists():
            continue
        text = src.read_text(encoding="utf-8")
        for key, value in values.items():
            text = text.replace("{" + key + "}", value)
        target.write_text(text, encoding="utf-8", newline="\n")
        written.append(target)
    return written
