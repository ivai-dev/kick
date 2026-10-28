"""The three Markdown tables kick reads: Tasks (a kick's tasks.md), Features (project/roadmap.md) and Endpoints
(project/api.md). Everything else in the pages is prose for people."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from pathlib import Path

KEY = re.compile(r"^[a-z0-9][a-z0-9-]*$")
DAYS_SPLIT = re.compile(r"\s*[–—/]\s*|\s+-\s+|(?<=\d)-(?=\d)")
COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
CONFIDENCE = ("low", "medium", "high")
TASK_STATUS = ("todo", "doing", "done")
ENDPOINT_STATUS = ("mock", "real")

TASKS = ("Tasks", "Task", ("Task", "Done when", "After", "Days", "Confidence", "Basis", "Status"))
FEATURES = ("Features", "Feature", ("Feature", "After", "Days", "Confidence", "Basis", "Release", "Kick"))
ENDPOINTS = ("Endpoints", "Endpoint", ("Endpoint", "Used by", "Roles", "Status", "Cost"))


@dataclass
class Item:
    """A task or a roadmap feature."""
    key: str
    title: str
    line: int
    after: list[str] = field(default_factory=list)
    low: float | None = None
    likely: float | None = None
    high: float | None = None
    point: bool = False
    confidence: str = ""
    basis: str = ""
    status: str = ""
    release: str = ""
    kick: str = ""

    @property
    def probe(self) -> bool:
        return "(probe)" in self.title.lower()


@dataclass
class Endpoint:
    endpoint: str
    status: str
    cost: str
    line: int


def _cells(line: str) -> list[str]:
    body = line.strip()
    body = body[1:] if body.startswith("|") else body
    body = body[:-1] if body.endswith("|") and not body.endswith("\\|") else body
    return [c.replace("\\|", "|").strip() for c in re.split(r"(?<!\\)\|", body)]


def _column(header: list[str], name: str) -> int | None:
    """The index of the column whose name starts with `name` ("Days" matches "Days (min–likely–max)")."""
    want = name.lower()
    return next((i for i, h in enumerate(header) if h.lower() == want or h.lower().startswith(want + " ")), None)


def read_table(path: Path, heading: str) -> tuple[list[str], list[tuple[int, list[str]]]] | None:
    """The header and the (line number, cells) rows of the first table under `## heading`; None when the page has
    no such heading. HTML comments are skipped."""
    text = COMMENT.sub(lambda m: "\n" * m.group(0).count("\n"), path.read_text(encoding="utf-8-sig"))
    lines = [line.rstrip("\r") for line in text.split("\n")]  # not splitlines(): a cell may hold U+2028
    start = next((i for i, line in enumerate(lines) if line.strip().lower() == f"## {heading.lower()}"), None)
    if start is None:
        return None
    rows: list[tuple[int, list[str]]] = []
    header: list[str] = []
    for i in range(start + 1, len(lines)):
        line = lines[i].strip()
        if line.startswith("## "):
            break
        if not line.startswith("|"):
            if header:
                break
            continue
        cells = _cells(line)
        if not header:
            header = cells
        elif all(re.fullmatch(r":?-{3,}:?", c) for c in cells if c):
            continue
        else:
            rows.append((i + 1, cells))
    return header, rows


def parse_days(text: str) -> tuple[float, float, float, bool]:
    """(min, likely, max, point) from "2–3–5", "2-3-5", "2 / 3 / 5" or one number; a decimal comma is allowed."""
    raw = text.strip().replace(",", ".")
    parts = [p for p in DAYS_SPLIT.split(raw) if p]
    try:
        values = [float(p) for p in parts]
    except ValueError as exc:
        raise ValueError(f"days {text!r} is not min–likely–max or one number") from exc
    if not all(math.isfinite(v) and v >= 0 for v in values):
        raise ValueError(f"days {text!r}: days are finite numbers, 0 or more")
    if len(values) == 1:
        return values[0], values[0], values[0], True
    if len(values) != 3:
        raise ValueError(f"days {text!r} is not min–likely–max or one number")
    low, likely, high = values
    if not low <= likely <= high:
        raise ValueError(f"days {text!r}: min ≤ likely ≤ max does not hold")
    return low, likely, high, False


def _split_key(text: str) -> tuple[str, str]:
    key, sep, title = text.partition(":")
    key = key.strip().strip("`")
    if not sep or not KEY.fullmatch(key):
        raise ValueError(f"{text!r} does not start with a short key and a colon (for example `login: …`)")
    return key, title.strip()


def read_items(path: Path, spec) -> tuple[list[Item], list[str]]:
    """Tasks or roadmap features from `path`, with the errors found while reading them."""
    heading, first, columns = spec
    rel = path.name
    table = read_table(path, heading)
    if table is None:
        return [], [f"{rel}: no '## {heading}' table"]
    header, rows = table
    if not header:
        return [], [f"{rel}: '## {heading}' has no table"]
    index = {name: _column(header, name) for name in columns}
    missing = [name for name, i in index.items() if i is None]
    if missing:
        return [], [f"{rel}: the '## {heading}' table lacks the column(s) {', '.join(missing)}"]
    release_col = _column(header, "Release")
    items, errors = [], []
    for line, cells in rows:
        cells += [""] * (len(header) - len(cells))
        get = {name: cells[i] for name, i in index.items()}
        where = f"{rel}:{line}"
        try:
            key, title = _split_key(get[first])
        except ValueError as exc:
            errors.append(f"{where}: {exc}")
            continue
        item = Item(key, title, line, after=[a.strip().strip("`") for a in get["After"].split(",") if a.strip()])
        if get["Days"]:
            try:
                item.low, item.likely, item.high, item.point = parse_days(get["Days"])
            except ValueError as exc:
                errors.append(f"{where}: {exc}")
        item.confidence = get["Confidence"].lower()
        if item.confidence and item.confidence not in CONFIDENCE:
            errors.append(f"{where}: confidence {get['Confidence']!r} is not low, medium or high")
        item.basis = get["Basis"]
        if "Status" in get:
            item.status = get["Status"].lower() or "todo"
            if item.status not in TASK_STATUS:
                errors.append(f"{where}: status {get['Status']!r} is not todo, doing or done")
        if release_col is not None:
            item.release = cells[release_col]
        if "Kick" in get:
            item.kick = get["Kick"].strip().strip("`")
        items.append(item)
    return items, errors + check_links(items, rel)


def check_links(items: list[Item], rel: str) -> list[str]:
    """Duplicate keys, After keys that do not exist, and cycles."""
    errors, seen = [], {}
    for item in items:
        if item.key in seen:
            errors.append(f"{rel}:{item.line}: the key {item.key} is used twice (also line {seen[item.key]})")
        seen.setdefault(item.key, item.line)
    by_key = {i.key: i for i in items}
    for item in items:
        for dep in item.after:
            if dep not in by_key:
                errors.append(f"{rel}:{item.line}: {item.key} waits for {dep}, which is not in the table")
    state: dict[str, int] = {}

    def visit(key: str, path: list[str]) -> list[str] | None:
        state[key] = 1
        for dep in by_key[key].after:
            if dep not in by_key:
                continue
            if state.get(dep) == 1:
                return [*path, key, dep]
            if not state.get(dep):
                cycle = visit(dep, [*path, key])
                if cycle:
                    return cycle
        state[key] = 2
        return None

    for key in by_key:
        if not state.get(key):
            cycle = visit(key, [])
            if cycle:
                start = cycle.index(cycle[-1])
                errors.append(f"{rel}: the tasks wait for each other in a circle: {' → '.join(cycle[start:])}")
                break
    return errors


def fill_cell(path: Path, spec, key: str, column: str, value: str) -> bool:
    """Write `value` into the `column` cell of the row whose key is `key`, when that cell is empty. False when the
    row or column is missing or the cell already holds something else."""
    heading, first, _ = spec
    table = read_table(path, heading)
    if table is None:
        return False
    header, rows = table
    key_col, col = _column(header, first), _column(header, column)
    if key_col is None or col is None:
        return False
    lines = path.read_text(encoding="utf-8-sig").split("\n")
    for number, cells in rows:
        cells += [""] * (len(header) - len(cells))
        try:
            row_key, _ = _split_key(cells[key_col])
        except ValueError:
            continue
        if row_key != key:
            continue
        if cells[col] not in ("", value):
            return False
        cells[col] = value
        lines[number - 1] = "| " + " | ".join(c.replace("|", "\\|") for c in cells) + " |"
        path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
        return True
    return False


def read_endpoints(path: Path) -> tuple[list[Endpoint], list[str]]:
    heading, _, columns = ENDPOINTS
    rel = path.name
    table = read_table(path, heading)
    if table is None:
        return [], [f"{rel}: no '## {heading}' table"]
    header, rows = table
    index = {name: _column(header, name) for name in columns}
    missing = [name for name, i in index.items() if i is None]
    if missing:
        return [], [f"{rel}: the '## {heading}' table lacks the column(s) {', '.join(missing)}"]
    out, errors = [], []
    for line, cells in rows:
        cells += [""] * (len(header) - len(cells))
        status = cells[index["Status"]].lower()
        if status not in ENDPOINT_STATUS:
            errors.append(f"{rel}:{line}: status {cells[index['Status']]!r} is not mock or real")
        out.append(Endpoint(cells[index["Endpoint"]], status, cells[index["Cost"]], line))
    return out, errors
