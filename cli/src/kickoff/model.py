"""Typed access to the .kickoff/*.yaml files."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

import yaml

from .errors import KickoffError
from .schemas import schema_errors

KICKOFF_DIR = ".kickoff"
WEEKDAY = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


class ModelError(KickoffError):
    """A .kickoff file is missing, unreadable or fails its schema."""


# ---------------------------------------------------------------- paths and YAML
def find_root(start: Path) -> Path:
    start = start.resolve()
    for p in (start, *start.parents):
        if (p / KICKOFF_DIR).is_dir():
            return p
    raise ModelError(f"no {KICKOFF_DIR}/ folder in {start} or any parent; run the kickoff:init skill first")


def resolve_root(root: Path | None) -> Path:
    return find_root(root or Path.cwd())


def read_yaml(path: Path) -> Any:
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ModelError(f"missing file: {path}") from exc
    try:
        return yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        raise ModelError(f"{path}: invalid YAML: {exc}") from exc


class _Dumper(yaml.SafeDumper):
    pass


def _represent_str(dumper: yaml.SafeDumper, s: str) -> yaml.ScalarNode:
    try:
        plain = yaml.safe_load(s) == s
    except yaml.YAMLError:
        plain = False
    if "\n" in s:
        style = "|"
    elif plain and s and s.strip() == s:
        style = None
    else:
        style = '"'
    return dumper.represent_scalar("tag:yaml.org,2002:str", s, style=style)


_Dumper.add_representer(str, _represent_str)


def write_yaml(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = yaml.dump(data, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=120)
    path.write_text(out, encoding="utf-8", newline="\n")


def load_raw(root: Path, kind: str) -> dict:
    data = read_yaml(root / KICKOFF_DIR / f"{kind}.yaml")
    errors = schema_errors(kind, data)
    if errors:
        raise ModelError(f"{kind}.yaml: " + "; ".join(errors[:10]))
    return data


# ---------------------------------------------------------------- small helpers
def to_date(value: Any) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))


def code_key(code: str) -> tuple[int, ...]:
    return tuple(int(x) for x in code.split("."))


def text(item: dict, key: str, lang: str | None = None) -> str:
    """item[key], or its translation item['i18n'][lang][key] when one exists."""
    if lang:
        tr = (item.get("i18n") or {}).get(lang) or {}
        if tr.get(key):
            return tr[key]
    return item.get(key) or ""


# ---------------------------------------------------------------- project
@dataclass(frozen=True)
class Role:
    id: str
    name: str
    focus: float
    duties: str = ""
    i18n: dict = field(default_factory=dict)


@dataclass(frozen=True)
class Release:
    id: str
    name: str


@dataclass
class Project:
    name: str
    languages: dict[str, str]
    docs_root: str
    weekend: tuple[int, ...]
    holidays: dict[date, dict]
    roles: dict[str, Role]
    releases: list[Release]
    hard_dates: dict[str, date]
    tracker: dict[str, Any]
    rules: dict[str, Any]
    security: list[str]
    proto: dict[str, Any]
    date_format: str

    @classmethod
    def from_dict(cls, d: dict) -> Project:
        holidays: dict[date, dict] = {}
        for h in d["calendar"]["holidays"]:
            h = h if isinstance(h, dict) else {"date": h}
            holidays[to_date(h["date"])] = {"name": h.get("name", ""), "kind": h.get("kind", "")}
        roles = {
            r["id"]: Role(r["id"], r["name"], float(r["focus"]), r.get("duties", ""), r.get("i18n") or {})
            for r in d["roles"]
        }
        releases = [
            Release(r, r) if isinstance(r, str) else Release(r["id"], r.get("name", r["id"])) for r in d["releases"]
        ]
        return cls(
            name=d["name"],
            languages=d["languages"],
            docs_root=d.get("docs_root", "docs"),
            weekend=tuple(WEEKDAY[w] for w in d["calendar"]["weekend"]),
            holidays=holidays,
            roles=roles,
            releases=releases,
            hard_dates={k: to_date(v) for k, v in (d.get("hard_dates") or {}).items()},
            tracker=d["tracker"],
            rules=d.get("rules") or {},
            security=d.get("security") or [],
            proto=d.get("proto") or {},
            date_format=d.get("date_format", "%d/%m/%Y"),
        )

    def role_title(self, role_id: str, lang: str | None = None) -> str:
        role = self.roles[role_id]
        return text({"name": role.name, "i18n": role.i18n}, "name", lang)


# ---------------------------------------------------------------- plan
def parse_schedule(value: Any) -> tuple:
    if value in (None, "seq"):
        return ("seq",)
    ((mode, arg),) = value.items()
    if mode == "fixed":
        return ("fixed", to_date(arg[0]), to_date(arg[1]))
    if mode == "span":
        return ("span", str(arg[0]), str(arg[1]))
    if mode == "period":
        return ("period", str(arg["after"]), int(arg["months"]))
    if mode == "tail":
        return ("tail", str(arg["of"]), int(arg["days"]))
    raise ModelError(f"unknown schedule mode {mode}")


@dataclass
class Package:
    code: str
    name: str
    role: str
    effort: float
    done: float = 0.0
    prio: str = "P1"
    deps: tuple[str, ...] = ()
    desc: str = ""
    ref: str = ""
    coop: str = ""
    note: str = ""
    release: str | None = None
    status: str = "todo"
    schedule: tuple = ("seq",)
    effort_rate: float | None = None
    ticket: dict | None = None
    i18n: dict = field(default_factory=dict)

    @property
    def mode(self) -> str:
        return self.schedule[0]

    @classmethod
    def from_dict(cls, d: dict) -> Package:
        return cls(
            code=d["code"],
            name=d["name"],
            role=d["role"],
            effort=float(d["effort"]),
            done=float(d.get("done", 0.0)),
            prio=d.get("prio", "P1"),
            deps=tuple(d.get("deps") or ()),
            desc=d.get("desc", ""),
            ref=d.get("ref", ""),
            coop=d.get("coop", ""),
            note=d.get("note", ""),
            release=d.get("release"),
            status=d.get("status", "todo"),
            schedule=parse_schedule(d.get("schedule")),
            effort_rate=d.get("effort_rate"),
            ticket=d.get("ticket"),
            i18n=d.get("i18n") or {},
        )

    def as_item(self) -> dict:
        """The fields text() understands (name, desc and their translations)."""
        return {"name": self.name, "desc": self.desc, "i18n": self.i18n}


@dataclass
class Plan:
    start: date
    phases: list[dict]
    groups: list[dict]
    packages: list[Package]
    order_after: dict[str, str]
    gates: list[dict]
    sprints: list[dict]
    cut_order: list[str]
    risks: list[dict]
    assumptions: list[dict]

    @classmethod
    def from_dict(cls, d: dict) -> Plan:
        return cls(
            start=to_date(d["start"]),
            phases=list(d.get("phases") or []),
            groups=list(d.get("groups") or []),
            packages=[Package.from_dict(p) for p in d.get("packages") or []],
            order_after={str(k): str(v) for k, v in (d.get("order_after") or {}).items()},
            gates=list(d.get("gates") or []),
            sprints=list(d.get("sprints") or []),
            cut_order=list(d.get("cut_order") or []),
            risks=list(d.get("risks") or []),
            assumptions=list(d.get("assumptions") or []),
        )

    def by_code(self) -> dict[str, Package]:
        return {p.code: p for p in self.packages}


# ---------------------------------------------------------------- features
@dataclass
class Feature:
    id: str
    epic: str
    name: str
    release: str
    prio: str
    platforms: str = ""
    screens: tuple[str, ...] = ()
    wbs: tuple[str, ...] = ()
    status: str = "active"
    removed_by: str = ""
    i18n: dict = field(default_factory=dict)


@dataclass
class Epic:
    id: str
    name: str
    goal: str = ""
    release: str | None = None
    areas: tuple[str, ...] = ()
    features: list[Feature] = field(default_factory=list)
    i18n: dict = field(default_factory=dict)


@dataclass
class Features:
    epics: list[Epic]

    @classmethod
    def from_dict(cls, d: dict) -> Features:
        epics = []
        for e in d.get("epics") or []:
            feats = [
                Feature(
                    id=f["id"],
                    epic=e["id"],
                    name=f["name"],
                    release=f["release"],
                    prio=f["prio"],
                    platforms=f.get("platforms", ""),
                    screens=tuple(f.get("screens") or ()),
                    wbs=tuple(f.get("wbs") or ()),
                    status=f.get("status", "active"),
                    removed_by=f.get("removed_by", ""),
                    i18n=f.get("i18n") or {},
                )
                for f in e.get("features") or []
            ]
            epics.append(
                Epic(e["id"], e["name"], e.get("goal", ""), e.get("release"), tuple(e.get("areas") or ()), feats,
                     e.get("i18n") or {})
            )
        return cls(epics)

    def all(self) -> list[Feature]:
        return [f for e in self.epics for f in e.features]

    def by_id(self) -> dict[str, Feature]:
        return {f.id: f for f in self.all()}

    def epic(self, eid: str) -> Epic:
        for e in self.epics:
            if e.id == eid:
                return e
        raise ModelError(f"unknown epic {eid}")


# ---------------------------------------------------------------- loaders
def load_project(root: Path) -> Project:
    return Project.from_dict(load_raw(root, "project"))


def load_plan(root: Path) -> Plan:
    return Plan.from_dict(load_raw(root, "plan"))


def load_features(root: Path) -> Features:
    return Features.from_dict(load_raw(root, "features"))


def load_state(root: Path) -> dict:
    return load_raw(root, "state")


def load_tickets(root: Path) -> dict:
    if not (root / KICKOFF_DIR / "tickets.yaml").exists():
        return {"schema_version": 1, "items": {}, "actuals": {}}
    return load_raw(root, "tickets")
