"""Range estimates: the totals of a kick's tasks, and of the whole product from the roadmap, where a feature that
has its own kick counts with that kick's tasks instead of its roadmap row."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .errors import KickError
from .files import DONE, RESERVED, SLUG, kick_dir, project_dir
from .kickfile import Kick, load_kick
from .tables import FEATURES, TASKS, Item, read_items


@dataclass
class Total:
    low: float = 0.0
    likely: float = 0.0
    high: float = 0.0
    items: int = 0
    points: int = 0
    low_confidence: int = 0
    unestimated: int = 0
    by_release: dict[str, list[float]] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)  # tables that could not be read, so their rows are missing

    def add(self, low: float, likely: float, high: float, release: str = "") -> None:
        self.low += low
        self.likely += likely
        self.high += high
        if release:
            r = self.by_release.setdefault(release, [0.0, 0.0, 0.0])
            r[0] += low
            r[1] += likely
            r[2] += high

    def add_item(self, item: Item, release: str = "") -> None:
        self.items += 1
        if item.likely is None:
            self.unestimated += 1
            return
        self.points += item.point
        self.low_confidence += item.confidence == "low"
        self.add(item.low, item.likely, item.high, release)

    def as_dict(self, overhead: float, budget: float | None) -> dict:
        return {"work": [r(self.low), r(self.likely), r(self.high)],
                "overhead_rate": overhead,
                "overhead": [r(self.low * overhead), r(self.likely * overhead), r(self.high * overhead)],
                "total": [r(self.low * (1 + overhead)), r(self.likely * (1 + overhead)), r(self.high * (1 + overhead))],
                "items": self.items, "point_estimates": self.points, "low_confidence": self.low_confidence,
                "unestimated": self.unestimated, "budget_days": budget,
                "by_release": {k: [r(x) for x in v] for k, v in self.by_release.items()},
                "warnings": self.warnings}


def r(value: float) -> float:
    return round(value + 1e-9, 1)


def kick_items(kick: Kick) -> tuple[list[Item], list[str]]:
    """The kick's tasks and the errors met reading them; error texts start with "tasks.md"."""
    path = kick.path / "tasks.md"
    if not path.is_file():
        return [], ["tasks.md does not exist"]
    return read_items(path, TASKS)


def kick_total(kick: Kick, remaining: bool = False) -> Total:
    total = Total()
    items, errors = kick_items(kick)
    total.warnings += [f"{kick.slug}: {e}" for e in errors]
    for item in items:
        if remaining and item.status == "done":
            continue
        total.add_item(item)
    return total


def roadmap_items(root: Path) -> tuple[list[Item], list[str]]:
    path = project_dir(root) / "roadmap.md"
    if not path.is_file():
        return [], []
    return read_items(path, FEATURES)


def linked_kick(root: Path, slug: str) -> Kick | None:
    """The kick a roadmap row names, active or done; None when the cell is empty, not a kick name (it could point
    outside docs/kick/) or names no kick. A broken kick.yaml raises KickError."""
    if not slug or not SLUG.fullmatch(slug) or slug in RESERVED:
        return None
    for folder in (kick_dir(root) / slug, kick_dir(root) / DONE / slug):
        if (folder / "kick.yaml").is_file():
            return load_kick(folder)
    return None


def product_total(root: Path, remaining: bool = False) -> Total:
    """Roadmap rows; a row whose kick exists counts with that kick's tasks (nothing when it is done and only the
    remaining work is asked for; the row itself while the kick has no estimated task yet)."""
    total = Total()
    items, errors = roadmap_items(root)
    total.warnings += [f"roadmap: {e}" for e in errors]
    for item in items:
        try:
            kick = linked_kick(root, item.kick) if item.kick else None
        except KickError as exc:
            total.warnings.append(str(exc))
            kick = None
        if kick is None:
            total.add_item(item, item.release)
            continue
        if remaining and kick.status == "done":
            total.items += 1
            continue
        sub = kick_total(kick, remaining)
        total.warnings += sub.warnings
        if kick_total(kick).items - kick_total(kick).unestimated == 0:  # no estimated task yet: the row counts
            total.add_item(item, item.release)
            continue
        total.items += 1
        total.points += sub.points
        total.low_confidence += sub.low_confidence
        total.add(sub.low, sub.likely, sub.high, item.release)
    return total


def days(low: float, likely: float, high: float) -> str:
    return f"{fmt(low)}–{fmt(likely)}–{fmt(high)} days"


def fmt(value: float) -> str:
    value = r(value)
    return str(int(value)) if value == int(value) else str(value)


def estimate_lines(label: str, total: Total, overhead: float, budget: float | None) -> list[str]:
    o = overhead
    out = [label,
           f"  work      {days(total.low, total.likely, total.high)}  ({total.items} rows; "
           f"{total.points} point estimates; {total.low_confidence} low confidence"
           + (f"; {total.unestimated} without days" if total.unestimated else "") + ")"]
    if o:
        out.append(f"  overhead  {fmt(o * 100)}%: {days(total.low * o, total.likely * o, total.high * o)}")
        out.append(f"  total     {days(total.low * (1 + o), total.likely * (1 + o), total.high * (1 + o))}")
    if budget:
        likely, high = total.likely * (1 + o), total.high * (1 + o)
        verdict = ("the likely and the max fit" if high <= budget else
                   "the likely fits, the max does not" if likely <= budget else "the likely does not fit")
        out.append(f"  budget    {fmt(budget)} days: {verdict}")
    for release, (low, likely, high) in total.by_release.items():
        out.append(f"  release {release}: {days(low, likely, high)}")
    out += [f"warn: {w} (its rows are not counted; run kick check)" for w in total.warnings]
    return out
