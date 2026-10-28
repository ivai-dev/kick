"""docs/kick/project/: how the product is now. project.yaml holds the languages and the estimate settings."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .errors import KickError
from .files import copy_templates, project_dir, read_yaml, write_yaml
from .schemas import schema_errors

LANGS = ("chat", "docs", "code", "ui", "commits")


@dataclass(frozen=True)
class Project:
    languages: dict
    overhead: float = 0.0
    budget_days: float | None = None


def project_file(root: Path) -> Path:
    return project_dir(root) / "project.yaml"


def _checked(path: Path, data: dict) -> dict:
    errors = schema_errors("project", data)
    if errors:
        raise KickError(f"{path}: " + "; ".join(errors))
    return data


def load_project(root: Path) -> Project:
    path = project_file(root)
    if not path.is_file():
        raise KickError(f"no kick project here ({path} is missing): run kick init")
    data = _checked(path, read_yaml(path))
    return Project(data["languages"], float(data.get("overhead", 0)), data.get("budget_days"))


def make_languages(chat: str | None = None, docs: str | None = None, code: str | None = None,
                   ui: list[str] | None = None, commits: str | None = None, base: dict | None = None) -> dict:
    """The language set: given values first, then `base`, then the defaults (docs and UI follow chat; code and
    commits are English)."""
    base = base or {}
    chat = chat or base.get("chat") or "en"
    return {"chat": chat, "docs": docs or base.get("docs") or chat, "code": code or base.get("code") or "en",
            "ui": ui or base.get("ui") or [chat], "commits": commits or base.get("commits") or "en"}


def languages_line(project: Project) -> str:
    lang = project.languages
    return (f"Languages: chat {lang['chat']} · docs {lang['docs']} · code {lang['code']} · "
            f"UI {', '.join(lang['ui'])} · commits {lang['commits']}")


def init_project(root: Path, languages: dict, update: bool = False) -> list[Path]:
    """Create docs/kick/project/ with project.yaml and the page templates, or (update) change the languages only."""
    path = project_file(root)
    if update:
        if not path.is_file():
            raise KickError(f"no kick project here ({path} is missing): run kick init without --update")
        data = read_yaml(path)
        data["languages"] = languages
        write_yaml(path, _checked(path, data))
        return [path]
    if path.exists():
        raise KickError(f"{path} already exists: use kick init --update to change the languages")
    data = _checked(path, {"schema_version": 1, "languages": languages, "overhead": 0})
    path.parent.mkdir(parents=True, exist_ok=True)
    write_yaml(path, data)
    return [path, *copy_templates("project", path.parent, {})]
