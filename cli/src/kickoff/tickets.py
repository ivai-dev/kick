"""Plan tracker issues from .kickoff data, push them idempotently, pull progress back."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from pathlib import Path

from .errors import KickoffError
from .model import (
    KICKOFF_DIR,
    Features,
    Plan,
    Project,
    load_features,
    load_plan,
    load_project,
    load_tickets,
    text,
    to_date,
    write_yaml,
)
from .schedule import Schedule, actuals_of, build_schedule
from .tracker import GitHubTracker, Issue, IssueSpec, Tracker, body_hash, strip_key, with_key


def _fmt(d: date, project: Project) -> str:
    return d.strftime(project.date_format)


def _blob(project: Project, path: str) -> str:
    base = project.tracker.get("blob_base")
    return f"{base}/{path}" if base else path


def epic_body(project: Project, features: Features, eid: str) -> str:
    lang = project.languages["repo"]
    e = features.epic(eid)
    rows = [f"| {f.id} | {text({'name': f.name, 'i18n': f.i18n}, 'name', lang)} | {f.release} | {f.prio} | "
            f"{', '.join(f.wbs) or '—'} |" for f in e.features if f.status == "active"]
    parts = []
    if e.goal:
        parts += ["## Goal", "", e.goal, ""]
    parts += ["## Scope", "", "| ID | Item | Release | Priority | WBS |", "| --- | --- | --- | --- | --- |", *rows, "",
              "## References", "", f"- Feature map: {_blob(project, project.docs_root + '/02-requirements/feature-map.md')}",
              f"- Plan: {_blob(project, project.docs_root + '/06-planning/plan.md')}", "",
              "Work packages are linked below as sub-issues."]
    return "\n".join(parts)


def package_body(project: Project, plan: Plan, sched: Schedule, code: str) -> str:
    lang = project.languages["repo"]
    p = plan.by_code()[code]
    t = p.ticket or {}
    s = sched.slots[code]
    head = (f"**WBS:** {code} · **Role:** {project.role_title(p.role, lang)} · **Effort:** {s.effort:g} d · "
            f"**Planned:** {_fmt(s.start, project)} – {_fmt(s.end, project)} · **Priority:** {p.prio}")
    parts = [head, "", t.get("desc") or text(p.as_item(), "desc", lang), ""]
    if t.get("ac"):
        parts += ["### Acceptance criteria", "", *(f"- [ ] {a}" for a in t["ac"]), ""]
    parts += ["### References", ""]
    if p.ref:
        parts.append(f"- Features: {p.ref} ({_blob(project, project.docs_root + '/02-requirements/feature-map.md')})")
    parts.append(f"- Schedule and dependencies: `.kickoff/plan.yaml` (WBS {code}); blocked-by links on this issue.")
    return "\n".join(parts)


def plan_issues(project: Project, plan: Plan, features: Features, sched: Schedule) -> list[IssueSpec]:
    ticketed = [p for p in plan.packages if p.ticket]
    by = plan.by_code()
    specs: list[IssueSpec] = []
    lang = project.languages["repo"]
    for e in features.epics:
        ends = [sched.slots[p.code].end for p in ticketed if p.ticket["epic"] == e.id]
        fields = {"Priority": "P0", "Release": e.release or project.releases[0].id, "Status": "Backlog"}
        if ends:
            fields["Target"] = max(ends).isoformat()
        specs.append(IssueSpec(
            key=e.id, title=f"[{e.id}] {text({'name': e.name, 'i18n': e.i18n}, 'name', lang)}",
            body=epic_body(project, features, e.id), type="epic", labels=["type:epic", *e.areas], fields=fields))
    for p in ticketed:
        t = p.ticket
        s = sched.slots[p.code]
        specs.append(IssueSpec(
            key=p.code, title=f"[{p.code}] {t['title']}", body=package_body(project, plan, sched, p.code),
            type=t["type"], labels=[f"type:{t['type']}", *t.get("areas", [])],
            milestone=t.get("milestone") or project.tracker.get("milestone"), parent_key=t["epic"],
            blocked_by=[d for d in p.deps if by[d].ticket],
            fields={"Priority": p.prio, "Start": s.start.isoformat(), "Target": s.end.isoformat(),
                    "Release": p.release, "Sprint": t.get("sprint"), "Status": t.get("status", "Backlog")}))
    return specs


def _fields_hash(fields: dict) -> str:
    stable = {k: v for k, v in fields.items() if k != "Status"}
    return hashlib.sha1(json.dumps(stable, sort_keys=True, default=str).encode()).hexdigest()[:12]


@dataclass
class PushReport:
    created: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)
    drift: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    mutations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def make_tracker(project: Project, tickets: dict, dry: bool) -> Tracker:
    if project.tracker.get("kind") != "github":
        raise KickoffError("tracker.kind is not 'github'; nothing to sync")
    return GitHubTracker(project.tracker, tickets.setdefault("tracker_cache", {}), dry=dry)


def _save(root: Path, tickets: dict) -> None:
    write_yaml(root / KICKOFF_DIR / "tickets.yaml", tickets)


def _drift(existing: Issue, rec: dict, spec: IssueSpec, adopt: bool) -> str | None:
    """Why this issue must not be overwritten, or None when it may be updated."""
    if strip_key(existing.body) != strip_key(spec.body):
        if not rec.get("body_hash"):
            if existing.key != spec.key and not adopt:
                return "issue has no recorded sync state (use --adopt to replace its title and body)"
        elif body_hash(existing.body) != rec["body_hash"]:
            return "body edited in the tracker since the last push"
    if rec.get("title") and existing.title not in (rec["title"], spec.title):
        return "title edited in the tracker since the last push"
    return None


def push(root: Path, tracker: Tracker, dry: bool, adopt: bool = False) -> PushReport:
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    tickets = load_tickets(root)
    sched = build_schedule(project, plan, actuals_of(tickets))
    specs = plan_issues(project, plan, features, sched)
    items = tickets.setdefault("items", {})
    if isinstance(getattr(tracker, "cache", None), dict):
        tickets["tracker_cache"] = tracker.cache
    report = PushReport()
    issues: dict[str, Issue] = {}
    now = datetime.now(UTC).replace(microsecond=0).isoformat()
    tracker.prepare(specs)
    for spec in specs:
        rec = dict(items.get(spec.key) or {})
        existing = tracker.get(rec["issue"]) if rec.get("issue") else tracker.find_by_key(spec.key)
        problem = _drift(existing, rec, spec, adopt) if existing else None
        if problem:
            report.drift.append(f"{spec.key} #{existing.number}: {problem}; not overwritten")
            issues[spec.key] = existing
            items[spec.key] = {**rec, "issue": existing.number}
            continue
        issue, action = tracker.upsert_issue(spec, existing)
        {"create": report.created, "update": report.updated, "unchanged": report.unchanged}[action].append(spec.key)
        issues[spec.key] = issue
        fh = _fields_hash(spec.fields)
        synced = True
        if action == "create" or rec.get("fields_hash") != fh:
            synced = tracker.set_fields(issue, spec.fields, created=action == "create")
        rec.update({"issue": issue.number, "type": spec.type, "parent": spec.parent_key, "synced": now,
                    "title": spec.title, "body_hash": body_hash(with_key(spec.body, spec.key))})
        if synced:
            rec["fields_hash"] = fh
        else:
            rec.pop("fields_hash", None)
        items[spec.key] = rec
    for spec in specs:
        issue = issues[spec.key]
        if spec.parent_key in issues and issue.parent != issues[spec.parent_key].number:
            tracker.set_parent(issue, issues[spec.parent_key])
            report.links.append(f"{spec.key} -> parent {spec.parent_key}")
        new = [b for b in spec.blocked_by if b in issues and issues[b].number not in issue.blocked_by]
        if new:
            tracker.set_blocked_by(issue, [issues[b] for b in new])
            report.links.append(f"{spec.key} blocked by {', '.join(new)}")
    report.mutations = list(tracker.log)
    report.warnings = list(tracker.warnings)
    if not dry:
        _save(root, tickets)
    return report


def pull(root: Path, tracker: Tracker, today: date | None = None) -> list[str]:
    today = today or date.today()
    project, plan = load_project(root), load_plan(root)
    tickets = load_tickets(root)
    items, actuals = tickets.setdefault("items", {}), tickets.setdefault("actuals", {})
    before = build_schedule(project, plan, actuals_of(tickets))
    by = plan.by_code()
    states = tracker.list_states([r["issue"] for k, r in items.items() if k in by])
    lines = []
    for key, rec in items.items():
        st = states.get(rec["issue"]) if key in by else None
        if not st:
            continue
        a = {k: to_date(v) for k, v in (actuals.get(key) or {}).items()}
        if st.state == "done" and st.closed and a.get("done") != st.closed:
            a["done"] = st.closed
            lines.append(f"{key}: planned end {before.slots[key].end.isoformat()} -> actual {st.closed.isoformat()}")
        elif st.state == "in_progress" and "started" not in a:
            a["started"] = today
            lines.append(f"{key}: started {today.isoformat()}")
        if a:
            actuals[key] = a
    after = build_schedule(project, plan, actuals_of(tickets))
    b, n = before.gate_dates(plan), after.gate_dates(plan)
    lines += [f"gate {g}: {b[g].isoformat()} -> {n[g].isoformat()}" for g in n if g in b and n[g] != b[g]]
    _save(root, tickets)
    return lines


def link(root: Path, key: str, number: int) -> None:
    tickets = load_tickets(root)
    tickets.setdefault("items", {}).setdefault(key, {})["issue"] = int(number)
    _save(root, tickets)
