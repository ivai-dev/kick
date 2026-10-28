"""One kick: docs/kick/<slug>/ with kick.yaml and its pages. The current step is derived from the agreements."""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from .errors import KickError
from .files import DONE, RESERVED, as_date, check_slug, copy_templates, kick_dir, read_yaml, write_yaml
from .schemas import schema_errors

KINDS = ("product", "feature")
AGREEMENTS = ("understand", "shape", "plan", "result")
RESULT = {"product": "this is the product", "feature": "it works as agreed"}


@dataclass
class Kick:
    slug: str
    path: Path
    title: str
    kind: str
    started: date
    status: str
    agreed: dict[str, date] = field(default_factory=dict)
    budget_days: float | None = None
    roadmap: str | None = None

    @property
    def step(self) -> str:
        """understand, shape, plan, build, finish (result agreed, not yet moved to done/) or done."""
        if self.status == "done":
            return "done"
        for step in ("understand", "shape", "plan"):
            if step not in self.agreed:
                return step
        return "finish" if "result" in self.agreed else "build"

    def agreement_warnings(self) -> list[str]:
        """Agreements out of order: a later step agreed while an earlier one is not."""
        out = []
        for i, later in enumerate(AGREEMENTS):
            missing = [s for s in AGREEMENTS[:i] if s not in self.agreed]
            if later in self.agreed and missing:
                out.append(f"{self.slug}: '{later}' is agreed but '{missing[0]}' is not")
        return out


def load_kick(folder: Path) -> Kick:
    path = folder / "kick.yaml"
    data = read_yaml(path)
    errors = schema_errors("kick", data)
    if errors:
        raise KickError(f"{path}: " + "; ".join(errors))
    agreed = {k: as_date(v) for k, v in (data.get("agreed") or {}).items()}
    return Kick(folder.name, folder, data["title"], data["kind"], as_date(data["started"]), data["status"], agreed,
                data.get("budget_days"), data.get("roadmap"))


def kick_folders(root: Path, done: bool = False) -> list[Path]:
    """The kick folders (with a kick.yaml): the active ones, or those under done/."""
    base = kick_dir(root) / DONE if done else kick_dir(root)
    if not base.is_dir():
        return []
    return [p for p in sorted(base.iterdir()) if p.is_dir() and p.name not in RESERVED and (p / "kick.yaml").is_file()]


def find_kick(root: Path, slug: str) -> Path:
    check_slug(slug)
    for folder in (kick_dir(root) / slug, kick_dir(root) / DONE / slug):
        if (folder / "kick.yaml").is_file():
            return folder
    raise KickError(f"no kick named {slug} in {kick_dir(root)}")


def new_kick(root: Path, slug: str, title: str, kind: str, roadmap: str | None = None,
             today: date | None = None) -> list[Path]:
    check_slug(slug)
    if kind not in KINDS:
        raise KickError(f"kind must be one of {', '.join(KINDS)}")
    if not title.strip():
        raise KickError("the title is empty")
    folder = kick_dir(root) / slug
    if folder.exists() or (kick_dir(root) / DONE / slug).exists():
        raise KickError(f"a kick named {slug} already exists")
    today = today or date.today()
    data = {"schema_version": 1, "title": title.strip(), "kind": kind, "started": today, "status": "active",
            "agreed": {}}
    if roadmap:
        data["roadmap"] = roadmap
    errors = schema_errors("kick", data)
    if errors:
        raise KickError("; ".join(errors))
    folder.mkdir(parents=True)
    write_yaml(folder / "kick.yaml", data)
    values = {"title": title.strip(), "date": today.isoformat(), "result": RESULT[kind]}
    return [folder / "kick.yaml", *copy_templates("kick", folder, values)]


def _tracked(root: Path, path: Path) -> bool:
    git = shutil.which("git")
    if not git:
        return False
    run = subprocess.run([git, "ls-files", "--error-unmatch", str(path)], cwd=root, capture_output=True)
    return run.returncode == 0


def finish_kick(root: Path, slug: str) -> tuple[Path, list[str]]:
    """Mark the kick done and move it to docs/kick/done/ (git mv when tracked). Returns the new folder and the
    warnings (the result was not agreed)."""
    folder = kick_dir(root) / check_slug(slug)
    if not (folder / "kick.yaml").is_file():
        raise KickError(f"no active kick named {slug}")
    kick = load_kick(folder)
    target = kick_dir(root) / DONE / slug
    if target.exists():
        raise KickError(f"{target} already exists")
    warnings = [] if "result" in kick.agreed else [
        f"{slug}: nobody agreed '{RESULT[kick.kind]}' yet; it is moved to done/ anyway"]
    target.parent.mkdir(parents=True, exist_ok=True)
    if _tracked(root, folder):
        moved = subprocess.run([shutil.which("git"), "mv", str(folder), str(target)], cwd=root, capture_output=True,
                               text=True)
        if moved.returncode != 0:
            raise KickError(f"git mv failed: {moved.stderr.strip()}")
    else:
        shutil.move(str(folder), str(target))
    data = read_yaml(target / "kick.yaml")  # written after the move: a failed move leaves the kick as it was
    data["status"] = "done"
    write_yaml(target / "kick.yaml", data)
    return target, warnings
