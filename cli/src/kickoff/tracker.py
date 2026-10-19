"""Tracker adapters. GitHubTracker talks to GitHub through the gh CLI, so no token is stored."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date
from typing import Protocol

from .errors import KickoffError

KEY_MARK = re.compile(r"<!-- kickoff:(?P<key>[A-Za-z0-9.\-]+) -->")


class TrackerError(KickoffError):
    pass


def with_key(body: str, key: str) -> str:
    return strip_key(body) + f"\n\n<!-- kickoff:{key} -->\n"


def strip_key(body: str) -> str:
    return KEY_MARK.sub("", (body or "").replace("\r\n", "\n")).rstrip()


def body_hash(body: str) -> str:
    return hashlib.sha1(strip_key(body).encode("utf-8")).hexdigest()[:12]


@dataclass
class IssueSpec:
    key: str
    title: str
    body: str
    type: str
    labels: list[str] = field(default_factory=list)
    milestone: str | None = None
    parent_key: str | None = None
    blocked_by: list[str] = field(default_factory=list)
    fields: dict = field(default_factory=dict)


@dataclass
class Issue:
    number: int
    node_id: str
    title: str
    body: str
    state: str
    labels: list[str] = field(default_factory=list)
    milestone: str | None = None
    closed_at: date | None = None
    state_reason: str | None = None
    parent: int | None = None
    blocked_by: list[int] = field(default_factory=list)

    @property
    def key(self) -> str | None:
        m = KEY_MARK.search(self.body or "")
        return m.group("key") if m else None


@dataclass
class IssueState:
    state: str  # open | in_progress | done | dropped
    closed: date | None = None


class Tracker(Protocol):
    log: list[str]
    warnings: list[str]

    def get(self, number: int) -> Issue | None: ...
    def fetch(self, number: int) -> Issue | None: ...
    def find_by_key(self, key: str) -> Issue | None: ...
    def upsert_issue(self, spec: IssueSpec, existing: Issue | None) -> tuple[Issue, str]: ...
    def set_parent(self, child: Issue, parent: Issue) -> None: ...
    def set_blocked_by(self, issue: Issue, blockers: list[Issue]) -> None: ...
    def prepare(self, specs: list[IssueSpec]) -> None: ...
    def set_fields(self, issue: Issue, fields: dict, *, created: bool) -> bool: ...
    def list_states(self, numbers: list[int]) -> dict[int, IssueState]: ...


Runner = Callable[[list[str], str | None], str]


def run_gh(args: list[str], stdin: str | None = None) -> str:
    r = subprocess.run(["gh", *args], input=stdin, capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        raise TrackerError(f"gh {' '.join(args[:3])}: {r.stderr.strip()}")
    return r.stdout


class GitHubTracker:
    def __init__(self, cfg: dict, cache: dict, runner: Runner = run_gh, dry: bool = False):
        self.cfg, self.cache, self.run, self.dry = cfg, cache, runner, dry
        self.repo = f"{cfg['org']}/{cfg['repo']}"
        self.log: list[str] = []
        self.warnings: list[str] = []
        self._issues: dict[int, Issue] | None = None
        self._pj: dict | None = None  # the Project ids used in this run, even after the cache entry is dropped

    # ------------------------------------------------ reads
    ISSUE_JSON = "number,id,title,body,state,labels,milestone,closedAt,stateReason,parent,blockedBy"

    @staticmethod
    def _issue(i: dict) -> Issue:
        closed = i.get("closedAt")
        blockers = (i.get("blockedBy") or {}).get("nodes") or []
        return Issue(
            i["number"], i["id"], i["title"], i.get("body") or "", i["state"].lower(),
            [lb["name"] for lb in i.get("labels") or []], (i.get("milestone") or {}).get("title"),
            date.fromisoformat(closed[:10]) if closed else None, (i.get("stateReason") or "").lower() or None,
            (i.get("parent") or {}).get("number"), [b["number"] for b in blockers if b.get("number")])

    def _load(self) -> dict[int, Issue]:
        if self._issues is None:
            out = self.run(["issue", "list", "-R", self.repo, "--state", "all", "--limit", "2000", "--json",
                            self.ISSUE_JSON], None)
            self._issues = {i["number"]: self._issue(i) for i in json.loads(out)}
        return self._issues

    def get(self, number: int) -> Issue | None:
        return self._load().get(number)

    def fetch(self, number: int) -> Issue | None:
        """Look one issue up directly (it may be missing from the list: over the limit, deleted, transferred)."""
        if number in self._load():
            return self._load()[number]
        try:
            out = self.run(["issue", "view", str(number), "-R", self.repo, "--json", self.ISSUE_JSON], None)
        except TrackerError:
            return None
        issue = self._issue(json.loads(out))
        self._load()[number] = issue
        return issue

    def find_by_key(self, key: str) -> Issue | None:
        return next((i for i in self._load().values() if i.key == key), None)

    def _gql(self, query: str, **variables) -> dict:
        if query.lstrip().startswith("mutation"):
            self.log.append(query.split("(input", 1)[0].split("{", 1)[1])
            if self.dry:
                return {"data": {}}
        args = ["api", "graphql", "-f", f"query={query}"]
        for k, v in variables.items():
            args += ["-F" if isinstance(v, int) else "-f", f"{k}={v}"]
        return json.loads(self.run(args, None))

    def prepare(self, specs: list[IssueSpec]) -> None:
        """Create the labels and milestones the specs use, once (writes are skipped in a dry run)."""
        labels = sorted({lb for s in specs for lb in s.labels})
        milestones = sorted({s.milestone for s in specs if s.milestone})
        have = {x["name"] for x in json.loads(self.run(
            ["label", "list", "-R", self.repo, "--limit", "500", "--json", "name"], None))}
        for lb in labels:
            if lb not in have:
                self.log.append(f"create label {lb}")
                if not self.dry:
                    self.run(["label", "create", lb, "-R", self.repo], None)
        existing = json.loads(self.run(["api", "--method", "GET", f"repos/{self.repo}/milestones", "-f", "state=all",
                                        "-F", "per_page=100"], None))
        have_ms = {m["title"] for m in existing}
        for m in milestones:
            if m not in have_ms:
                self.log.append(f"create milestone {m}")
                if not self.dry:
                    self.run(["api", f"repos/{self.repo}/milestones", "-f", f"title={m}"], None)

    # ------------------------------------------------ issues
    def upsert_issue(self, spec: IssueSpec, existing: Issue | None) -> tuple[Issue, str]:
        body = with_key(spec.body, spec.key)
        if existing is None:
            self.log.append(f"create {spec.title}")
            if self.dry:
                return Issue(0, "", spec.title, body, "open", list(spec.labels), spec.milestone), "create"
            args = ["issue", "create", "-R", self.repo, "--title", spec.title, "--body-file", "-",
                    "--assignee", self.cfg["assignee"]]
            for lb in spec.labels:
                args += ["--label", lb]
            if spec.milestone:
                args += ["--milestone", spec.milestone]
            number = int(self.run(args, body).strip().rsplit("/", 1)[1])
            node = json.loads(self.run(["issue", "view", str(number), "-R", self.repo, "--json", "id"], None))["id"]
            issue = Issue(number, node, spec.title, body, "open", list(spec.labels), spec.milestone)
            self._load()[number] = issue
            return issue, "create"
        args = ["issue", "edit", str(existing.number), "-R", self.repo]
        changes = []
        if existing.title != spec.title:
            args += ["--title", spec.title]
            changes.append("title")
        if strip_key(existing.body) != strip_key(body) or existing.key != spec.key:
            args += ["--body-file", "-"]
            changes.append("body")
        for lb in existing.labels:
            if lb.startswith(("type:", "area:")) and lb not in spec.labels:
                args += ["--remove-label", lb]
                changes.append(f"-{lb}")
        for lb in spec.labels:
            if lb not in existing.labels:
                args += ["--add-label", lb]
                changes.append(f"+{lb}")
        if spec.milestone and existing.milestone != spec.milestone:
            args += ["--milestone", spec.milestone]
            changes.append("milestone")
        if not changes:
            return existing, "unchanged"
        self.log.append(f"update #{existing.number} {', '.join(changes)}")
        if not self.dry:
            self.run(args, body if "body" in changes else None)
            existing.title, existing.body = spec.title, body
            existing.labels = [lb for lb in existing.labels if not lb.startswith(("type:", "area:"))] + list(spec.labels)
            existing.milestone = spec.milestone or existing.milestone
        return existing, "update"

    # ------------------------------------------------ links
    def _tolerant(self, query: str, **v) -> None:
        try:
            self._gql(query, **v)
        except TrackerError as exc:
            msg = str(exc).lower()
            if "duplicate" not in msg and "already" not in msg:
                raise

    def set_parent(self, child: Issue, parent: Issue) -> None:
        self._tolerant("mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c,replaceParent:true})"
                       "{clientMutationId}}", p=parent.node_id, c=child.node_id)

    def set_blocked_by(self, issue: Issue, blockers: list[Issue]) -> None:
        for b in blockers:
            self._tolerant("mutation($i:ID!,$b:ID!){addBlockedBy(input:{issueId:$i,blockingIssueId:$b})"
                           "{clientMutationId}}", i=issue.node_id, b=b.node_id)

    # ------------------------------------------------ fields
    def _project(self) -> dict:
        if self._pj is not None:
            return self._pj
        c = self.cache.get("project") or {}
        if not c:
            q = ("query($org:String!,$n:Int!){organization(login:$org){projectV2(number:$n){id fields(first:50){nodes{"
                 "... on ProjectV2SingleSelectField{id name options{id name}} "
                 "... on ProjectV2IterationField{id name configuration{iterations{id title}}}}}}}}")
            pj = self._gql(q, org=self.cfg["org"], n=int(self.cfg["project"]))["data"]["organization"]["projectV2"]
            c["id"], c["fields"] = pj["id"], {}
            for f in pj["fields"]["nodes"]:
                if not f:
                    continue
                iteration = "configuration" in f
                opts = f["configuration"]["iterations"] if iteration else f.get("options") or []
                c["fields"][f["name"]] = {"id": f["id"], "kind": "iteration" if iteration else "select",
                                          "options": {o.get("name") or o.get("title"): o["id"] for o in opts}}
            self.cache["project"] = c
        self._pj = c
        return c

    def set_fields(self, issue: Issue, fields: dict, *, created: bool) -> bool:
        """Set Project and org issue fields. A failure or a skipped option becomes a warning and returns False
        (never an abort), so the caller does not record the fields as synced and retries them on the next push."""
        if self.dry:
            self.log.append(f"fields #{issue.number} {sorted(k for k, v in fields.items() if v)}")
            return True
        try:
            complete = self._set_project_fields(issue, fields, created)
            self._set_org_fields(issue, fields)
        except (TrackerError, KeyError, TypeError) as exc:
            self.warnings.append(f"#{issue.number}: fields not set: {exc}")
            return False
        return complete

    def _set_project_fields(self, issue: Issue, fields: dict, created: bool) -> bool:
        """False when a field or option is missing in the Project; the cached ids are then dropped so the next
        push reads them again (a Sprint or Release may have been added to the Project since)."""
        complete = True
        pj = self._project()
        item = self._gql("mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}",
                         p=pj["id"], c=issue.node_id)["data"]["addProjectV2ItemById"]["item"]["id"]
        for name in ("Status", "Release", "Sprint"):
            value = fields.get(name)
            if value is None or (name == "Status" and not created):
                continue
            f = pj["fields"].get(name)
            if not f or value not in f["options"]:
                self.warnings.append(f"#{issue.number}: project field {name} has no option {value!r}")
                self.cache.pop("project", None)
                complete = False
                continue
            v = (f'{{iterationId:"{f["options"][value]}"}}' if f["kind"] == "iteration"
                 else f'{{singleSelectOptionId:"{f["options"][value]}"}}')
            self._gql("mutation($p:ID!,$i:ID!,$f:ID!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,"
                      "fieldId:$f,value:" + v + "}){clientMutationId}}", p=pj["id"], i=item, f=f["id"])
        return complete

    def _set_org_fields(self, issue: Issue, fields: dict) -> None:
        issue_fields = self.cfg.get("issue_fields") or {}
        pmap = (self.cfg.get("priority") or {}).get("map") or {}
        parts = []
        pf, prio = issue_fields.get("Priority"), fields.get("Priority")
        if pf and prio and pmap.get(prio) in (pf.get("options") or {}):
            parts.append(f'{{fieldId:"{pf["id"]}",singleSelectOptionId:"{pf["options"][pmap[prio]]}"}}')
        for name in ("Start", "Target"):
            f, value = issue_fields.get(name), fields.get(name)
            if f and value:
                parts.append(f'{{fieldId:"{f["id"]}",dateValue:"{value}"}}')
        if parts:
            self._gql("mutation($i:ID!){setIssueFieldValue(input:{issueId:$i,issueFields:[" + ",".join(parts) + "]})"
                      "{clientMutationId}}", i=issue.node_id)

    # ------------------------------------------------ progress
    def list_states(self, numbers: list[int]) -> dict[int, IssueState]:
        status: dict[int, str] = {}
        try:
            out = self.run(["project", "item-list", str(self.cfg["project"]), "--owner", self.cfg["org"], "--format",
                            "json", "--limit", "2000"], None)
            for it in json.loads(out).get("items", []):
                num = (it.get("content") or {}).get("number")
                if num:
                    status[num] = it.get("status")
        except TrackerError as exc:
            self.warnings.append(f"project status not read: {exc}")
        result: dict[int, IssueState] = {}
        for n in numbers:
            i = self.get(n)
            if not i:
                continue
            if i.state == "closed":
                result[n] = IssueState("dropped" if i.state_reason == "not_planned" else "done", i.closed_at)
            elif status.get(n) in ("In progress", "In review"):
                result[n] = IssueState("in_progress")
            else:
                result[n] = IssueState("open")
        return result
