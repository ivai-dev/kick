"""The clarity register `.kickoff/clarity.yaml`: how settled each area of the project is, from "open" to "validated"."""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from .errors import KickError
from .model import KICKOFF_DIR, load_raw

AREAS = ["problem", "users", "scope", "solution", "architecture", "design", "estimate"]
STATUS = ["open", "assumed", "decided", "validated"]
CONFIDENCE = ["low", "medium", "high"]
AREA_ID = re.compile(r"^[a-z][a-z0-9-]*$")


def clarity_path(root: Path) -> Path:
    return root / KICKOFF_DIR / "clarity.yaml"


def load_clarity(root: Path) -> dict | None:
    """The register, or None when the project has not started one (a missing file is not an error)."""
    return load_raw(root, "clarity") if clarity_path(root).is_file() else None


def default_clarity(today: date) -> dict:
    return {"schema_version": 1,
            "areas": [{"id": a, "status": "open", "confidence": "low", "updated": today} for a in AREAS]}


def set_area(data: dict, area: str, status: str | None, confidence: str | None, note: str | None,
             refs: list[str], day: date) -> None:
    """Update one area, adding it when the project defines an area of its own. `refs` are added, never dropped."""
    if not AREA_ID.match(area):
        raise KickError(f"area id {area!r}: lowercase letters, digits and hyphens, starting with a letter")
    if status is not None and status not in STATUS:
        raise KickError(f"status {status!r}: one of {', '.join(STATUS)}")
    if confidence is not None and confidence not in CONFIDENCE:
        raise KickError(f"confidence {confidence!r}: one of {', '.join(CONFIDENCE)}")
    entry = next((a for a in data["areas"] if a["id"] == area), None)
    if entry is None:
        entry = {"id": area, "status": "open", "confidence": "low"}
        data["areas"].append(entry)
    if status is not None:
        entry["status"] = status
    if confidence is not None:
        entry["confidence"] = confidence
    if note is not None:
        entry["note"] = note
    if refs:
        entry["refs"] = list(dict.fromkeys([*(entry.get("refs") or []), *refs]))  # added, never dropped, no repeats
    entry["updated"] = day


def weakest(data: dict) -> dict | None:
    """The area to work on next: the lowest status, then the lowest confidence, then the first in the file."""
    areas = data["areas"]
    if not areas:
        return None
    return min(enumerate(areas), key=lambda ia: (STATUS.index(ia[1]["status"]), CONFIDENCE.index(ia[1]["confidence"]),
                                                  ia[0]))[1]


def clarity_lines(data: dict, spread: str | None = None) -> list[str]:
    """`Clarity:` rows for `kickoff status` and the session start; `spread` is appended to the estimate row."""
    lines = ["Clarity:"]
    for a in data["areas"]:
        extra = [a["note"]] if a.get("note") else []
        if a["id"] == "estimate" and spread:
            extra.append(spread)
        lines.append(f"  {a['id']:<14} {a['status']:<10} {a['confidence']:<7} " + " · ".join(extra))
    lines = [line.rstrip() for line in lines]
    w = weakest(data)
    if w:
        refs = f" refs: {', '.join(w['refs'])}" if w.get("refs") else ""
        lines.append(f"Weakest: {w['id']} ({w['status']}, {w['confidence']}){refs}")
    return lines
