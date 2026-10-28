"""`[unclear: …]` markers: what is still not clear, written where it belongs in the text."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

MARKER = re.compile(r"\[unclear:\s*([^\]]+)\]", re.IGNORECASE)
COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)


@dataclass(frozen=True)
class Unclear:
    path: Path
    line: int
    text: str


def find_unclear(folder: Path) -> list[Unclear]:
    """Markers in the Markdown files directly in `folder`, outside HTML comments (template guidance)."""
    out = []
    for path in sorted(folder.glob("*.md")):
        text = path.read_text(encoding="utf-8-sig")
        text = COMMENT.sub(lambda m: "\n" * m.group(0).count("\n"), text)
        for number, line in enumerate(text.split("\n"), 1):
            out += [Unclear(path, number, m.group(1).strip()) for m in MARKER.finditer(line)]
    return out
