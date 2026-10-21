"""Cross-file consistency checks for .kickoff/."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .errors import KickoffError
from .model import Features, ModelError, Plan, Project, load_raw
from .schedule import CycleError, build_schedule

FEATURE_REF = re.compile(r"\bF\d+\.\d+\b")


@dataclass(frozen=True)
class Finding:
    level: str  # "error" | "warning"
    where: str
    message: str

    def __str__(self) -> str:
        return f"{self.level}: {self.where}: {self.message}"


def _dups(values: list[str]) -> list[str]:
    return sorted({v for v in values if values.count(v) > 1})


def check_plan(project: Project, plan: Plan) -> list[Finding]:
    out: list[Finding] = []

    def err(where: str, msg: str) -> None:
        out.append(Finding("error", where, msg))

    by = plan.by_code()
    level1 = {n["code"] for n in plan.phases}
    level2 = {n["code"] for n in plan.groups}
    for c in _dups([p.code for p in plan.packages]):
        err(c, "duplicate package code")
    releases = {r.id for r in project.releases}
    for p in plan.packages:
        parts = p.code.split(".")
        if len(parts) != 3:
            err(p.code, "package codes have three levels (phase.group.package)")
        else:
            if parts[0] not in level1:
                err(p.code, f"phase {parts[0]} is not in phases")
            if ".".join(parts[:2]) not in level2:
                err(p.code, f"group {'.'.join(parts[:2])} is not in groups")
        if p.role not in project.roles:
            err(p.code, f"unknown role {p.role}")
        if p.release and p.release not in releases:
            err(p.code, f"unknown release {p.release}")
        for dep in p.deps:
            if dep not in by:
                err(p.code, f"unknown dependency {dep}")
            elif by[dep].mode not in ("seq", "fixed"):
                err(p.code, f"dependency {dep} must be a seq or fixed package, not {by[dep].mode}")
        refs = {"span": p.schedule[1:3], "period": p.schedule[1:2], "tail": p.schedule[1:2]}.get(p.mode, ())
        for ref in refs:
            if ref not in by:
                err(p.code, f"schedule refers to unknown package {ref}")
            elif p.mode in ("span", "period") and by[ref].mode not in ("seq", "fixed"):
                err(p.code, f"{p.mode} must refer to a seq or fixed package, not {ref} ({by[ref].mode})")
            elif p.mode == "tail" and by[ref].mode == "tail":
                err(p.code, f"tail cannot refer to another tail package ({ref})")
        if p.effort_rate is not None and p.mode not in ("span", "period", "tail"):
            err(p.code, "effort_rate needs a span, period or tail schedule")
    for code, after in plan.order_after.items():
        where = f"order_after {code}"
        if code not in by or after not in by:
            err(where, f"unknown code {code if code not in by else after}")
        elif code == after:
            err(where, "a package cannot be ordered after itself")
        elif by[code].mode != "seq" or by[after].mode != "seq":
            err(where, "both packages must be seq packages")
        elif by[code].role != by[after].role:
            err(where, f"{code} ({by[code].role}) and {after} ({by[after].role}) are in different role queues")
    codes = level1 | level2 | set(by)
    for g in plan.gates:
        if g["at"] not in codes:
            err(f"gate {g['id']}", f"unknown code {g['at']}")
    gate_ids = {g["id"] for g in plan.gates}
    for c in _dups([g["id"] for g in plan.gates]):
        err(f"gate {c}", "duplicate gate id")
    for gid in project.hard_dates:
        if gid not in gate_ids:
            err(f"hard_dates {gid}", "not a gate id")
    for kind in ("risks", "assumptions"):
        for c in _dups([x["id"] for x in getattr(plan, kind)]):
            err(f"{kind} {c}", "duplicate id")
    if not out:
        try:
            build_schedule(project, plan)
        except CycleError as exc:
            err("schedule", f"dependency cycle: {exc}")
    return out


def report_plan_errors(project: Project, plan: Plan) -> bool:
    """Print the plan's error findings; True when there were any (commands then exit 1 like `validate`)."""
    errors = [f for f in check_plan(project, plan) if f.level == "error"]
    for f in errors:
        print(f)
    return bool(errors)


def check_features(project: Project, plan: Plan, features: Features) -> list[Finding]:
    out: list[Finding] = []
    by = plan.by_code()
    codes = {n["code"] for n in [*plan.phases, *plan.groups]} | set(by)
    releases = {r.id for r in project.releases}
    all_features = features.all()
    for c in _dups([e.id for e in features.epics]):
        out.append(Finding("error", c, "duplicate epic id"))
    for c in _dups([f.id for f in all_features]):
        out.append(Finding("error", c, "duplicate feature id"))
    for f in all_features:
        if f.release not in releases:
            out.append(Finding("error", f.id, f"unknown release {f.release}"))
        for code in f.wbs:
            if code not in codes:
                out.append(Finding("error", f.id, f"unknown WBS code {code}"))
        if f.status == "active" and not f.wbs:
            out.append(Finding("warning", f.id, "active feature without a WBS package"))
        if f.status == "removed" and not f.removed_by:
            out.append(Finding("warning", f.id, "removed feature without removed_by (decision reference)"))
    epic_ids = {e.id for e in features.epics}
    sprint_names = {s["name"] for s in plan.sprints}
    for p in plan.packages:
        t = p.item
        if not t:
            continue
        if t["epic"] not in epic_ids:
            out.append(Finding("error", p.code, f"item epic {t['epic']} is not in features.yaml"))
        if t.get("sprint") and t["sprint"] not in sprint_names:
            out.append(Finding("error", p.code, f"item sprint {t['sprint']!r} is not in sprints"))
    known = {f.id for f in all_features}
    for p in plan.packages:
        for fid in FEATURE_REF.findall(p.ref):
            if fid not in known:
                out.append(Finding("warning", p.code, f"ref names unknown feature {fid}"))
    for fid in plan.cut_order:
        if fid not in known:
            out.append(Finding("error", "cut_order", f"unknown feature {fid}"))
    return out


def check_languages(project: Project, plan: Plan) -> list[Finding]:
    """Generated documents use the repo language; plan text is written in the workbook language."""
    repo, book = project.languages["repo"], project.languages["workbook"]
    if repo == book:
        return []
    kinds = {
        "phases": ("name", [(n["code"], n) for n in plan.phases]),
        "groups": ("name", [(n["code"], n) for n in plan.groups]),
        "packages": ("name", [(p.code, {"i18n": p.i18n}) for p in plan.packages]),
        "gates": ("name", [(g["id"], g) for g in plan.gates]),
        "risks": ("title", [(r["id"], r) for r in plan.risks]),
        "assumptions": ("text", [(a["id"], a) for a in plan.assumptions]),
    }
    out = []
    for kind, (key, items) in kinds.items():
        missing = [ident for ident, item in items if not ((item.get("i18n") or {}).get(repo) or {}).get(key)]
        if missing:
            out.append(Finding("warning", f"plan.yaml {kind}",
                               f"{len(missing)} of {len(items)} items have no i18n.{repo}.{key}; generated documents "
                               f"show them in the workbook language ({book}); first: {', '.join(missing[:3])}"))
    return out


def _strings(node, path=""):
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for k, v in node.items():
            yield from _strings(v, f"{path}/{k}" if path else str(k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _strings(v, f"{path}/{i}" if path else str(i))


def check_phrases(project: Project, raw: dict[str, dict]) -> list[Finding]:
    patterns = [re.compile(p, re.I) for p in project.rules.get("forbidden_phrases") or []]
    out: list[Finding] = []
    for kind in ("features", "plan"):
        for path, value in _strings(raw.get(kind) or {}):
            for pat in patterns:
                if pat.search(value):
                    out.append(Finding("warning", f"{kind}.yaml {path}", f"forbidden phrase /{pat.pattern}/"))
    return out


DOC_SUFFIXES = {".md", ".yaml", ".yml", ".js", ".html", ".txt"}
PLACEHOLDER_SUFFIXES = {".md", ".yaml", ".yml"}  # `{{` is ordinary code in JS and HTML (htm style objects)
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})")


def _doc_files(paths: list[Path]) -> list[Path]:
    out: dict[Path, None] = {}
    for p in paths:
        if p.is_dir():
            out.update((f, None) for f in sorted(p.rglob("*")) if f.is_file() and f.suffix.lower() in DOC_SUFFIXES)
        elif p.is_file():
            out[p] = None
        else:
            raise KickoffError(f"no such file or folder: {p}")
    return list(out)


def check_docs(project: Project, paths: list[Path]) -> tuple[list[str], int]:
    """`{{` placeholders outside code fences (Markdown and YAML) and forbidden phrases (every file):
    (findings as `path:line: problem`, number of files read)."""
    try:
        patterns = [re.compile(p, re.I) for p in project.rules.get("forbidden_phrases") or []]
    except re.error as exc:
        raise KickoffError(f"rules.forbidden_phrases in project.yaml: invalid regular expression: {exc}") from exc
    files = _doc_files(paths)
    out: list[str] = []
    for f in files:
        fence = ""  # the opening marker of the code block we are in, e.g. "```" or "~~~~"
        for n, line in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            m = FENCE.match(line)
            if m and not fence:
                fence = m.group(1)
            elif m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence) and not line.strip(" `~"):
                fence = ""
            elif "{{" in line and not fence and f.suffix.lower() in PLACEHOLDER_SUFFIXES:
                out.append(f"{f}:{n}: placeholder {{{{…}}}}")
            out += [f"{f}:{n}: forbidden phrase /{pat.pattern}/" for pat in patterns if pat.search(line)]
    return out, len(files)


def validate_root(root: Path) -> list[Finding]:
    raw: dict[str, dict] = {}
    out: list[Finding] = []
    for kind in ("project", "features", "plan", "state"):
        try:
            raw[kind] = load_raw(root, kind)
        except ModelError as exc:
            out.append(Finding("error", f"{kind}.yaml", str(exc)))
    if out:
        return out
    try:
        project = Project.from_dict(raw["project"])
        plan = Plan.from_dict(raw["plan"])
        features = Features.from_dict(raw["features"])
    except KickoffError as exc:
        return [Finding("error", "model", str(exc))]
    return [*check_plan(project, plan), *check_features(project, plan, features),
            *check_languages(project, plan), *check_phrases(project, raw), *check_legacy(root, raw)]


def check_legacy(root: Path, raw: dict[str, dict]) -> list[Finding]:
    """Leftovers of the ticket management that kickoff 0.6 removed: harmless, reported once each."""
    out: list[Finding] = []
    if (root / ".kickoff" / "tickets.yaml").exists():
        out.append(Finding("warning", "tickets.yaml", "kickoff no longer syncs a tracker; the file can be deleted"))
    if raw.get("project", {}).get("tracker") is not None:
        out.append(Finding("warning", "project.yaml tracker", "ignored since kickoff 0.6; the setting can be deleted"))
    legacy = [p["code"] for p in raw.get("plan", {}).get("packages") or [] if "ticket" in p]
    if legacy:
        out.append(Finding("warning", "plan.yaml", f"`ticket` is renamed `item` ({len(legacy)} packages, first "
                                                   f"{legacy[0]}); kickoff 0.7 no longer reads `ticket`"))
    return out
