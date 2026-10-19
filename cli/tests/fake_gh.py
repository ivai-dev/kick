"""An in-memory stand-in for the gh CLI, enough for GitHubTracker."""

from __future__ import annotations

import json


class FakeGh:
    def __init__(self):
        self.issues: dict[int, dict] = {}
        self.status: dict[int, str] = {}
        self.labels: set[str] = set()
        self.milestones: set[str] = set()
        self.calls: list[list[str]] = []
        self.mutations: list[str] = []

    def add(self, number, title, body="", state="OPEN", labels=(), closed_at=None, reason=None, milestone=None):
        self.labels.update(labels)
        if milestone:
            self.milestones.add(milestone)
        self.issues[number] = {"number": number, "id": f"I_{number}", "title": title, "body": body, "state": state,
                               "labels": [{"name": n} for n in labels],
                               "milestone": {"title": milestone} if milestone else None, "closedAt": closed_at,
                               "stateReason": reason, "parent": None, "blockedBy": {"nodes": [], "totalCount": 0}}

    def _opt(self, args, flag):
        return [args[i + 1] for i, a in enumerate(args) if a == flag]

    def _vars(self, args):
        out = {}
        for i, a in enumerate(args[:-1]):
            if a in ("-f", "-F") and "=" in args[i + 1] and not args[i + 1].startswith("query="):
                k, v = args[i + 1].split("=", 1)
                out[k] = v
        return out

    @staticmethod
    def _number(node_id):
        return int(node_id.split("_")[1])

    def _check_exists(self, labels, milestones):
        missing = [x for x in labels if x not in self.labels] + [m for m in milestones if m not in self.milestones]
        assert not missing, f"gh would fail: unknown label or milestone {missing}"

    def __call__(self, args, stdin=None):
        self.calls.append(args)
        if args[:2] == ["issue", "list"]:
            return json.dumps(list(self.issues.values()))
        if args[:2] == ["issue", "view"]:
            return json.dumps({"id": f"I_{args[2]}"})
        if args[:2] == ["label", "list"]:
            return json.dumps([{"name": n} for n in sorted(self.labels)])
        if args[:2] == ["label", "create"]:
            self.labels.add(args[2])
            self.mutations.append(f"label {args[2]}")
            return ""
        if args[:3] == ["api", "--method", "GET"]:
            return json.dumps([{"title": t} for t in sorted(self.milestones)])
        if args[0] == "api" and args[1].startswith("repos/") and args[1].endswith("/milestones"):
            title = next(a[len("title="):] for a in args if a.startswith("title="))
            self.milestones.add(title)
            self.mutations.append(f"milestone {title}")
            return "{}"
        if args[:2] == ["issue", "create"]:
            n = max(self.issues, default=0) + 1
            ms = self._opt(args, "--milestone")
            labels = self._opt(args, "--label")
            self._check_exists(labels, ms)
            self.add(n, self._opt(args, "--title")[0], stdin or "", labels=labels, milestone=ms[0] if ms else None)
            self.mutations.append(f"create {n}")
            return f"https://github.com/o/r/issues/{n}\n"
        if args[:2] == ["issue", "edit"]:
            it = self.issues[int(args[2])]
            self._check_exists(self._opt(args, "--add-label"), self._opt(args, "--milestone"))
            if self._opt(args, "--title"):
                it["title"] = self._opt(args, "--title")[0]
            if "--body-file" in args:
                it["body"] = stdin
            names = [x["name"] for x in it["labels"]]
            names = [n for n in names if n not in self._opt(args, "--remove-label")] + self._opt(args, "--add-label")
            it["labels"] = [{"name": n} for n in names]
            if self._opt(args, "--milestone"):
                it["milestone"] = {"title": self._opt(args, "--milestone")[0]}
            self.mutations.append(f"edit {args[2]}")
            return ""
        if args[:2] == ["project", "item-list"]:
            return json.dumps({"items": [{"content": {"number": n}, "status": s} for n, s in self.status.items()]})
        if args[:2] == ["api", "graphql"]:
            q = next(a[len("query="):] for a in args if a.startswith("query="))
            if q.lstrip().startswith("mutation"):
                self.mutations.append(q.split("(input", 1)[0].split("{", 1)[1])
                v = self._vars(args)
                if "addSubIssue" in q:
                    self.issues[self._number(v["c"])]["parent"] = {"number": self._number(v["p"])}
                if "addBlockedBy" in q:
                    node = self.issues[self._number(v["i"])]["blockedBy"]
                    node["nodes"].append({"number": self._number(v["b"])})
                    node["totalCount"] += 1
            if "projectV2(number" in q:
                return json.dumps({"data": {"organization": {"projectV2": {"id": "PVT_1", "fields": {"nodes": [
                    {"id": "F_S", "name": "Status", "options": [{"id": "o_b", "name": "Backlog"}, {"id": "o_r", "name": "Ready"}]},
                    {"id": "F_R", "name": "Release", "options": [{"id": "o_m", "name": "MVP"}]},
                    {"id": "F_I", "name": "Sprint", "configuration": {"iterations": [{"id": "it1", "title": "Sprint 1"}]}},
                    {}]}}}}})
            if "addProjectV2ItemById" in q:
                return json.dumps({"data": {"addProjectV2ItemById": {"item": {"id": "PVTI_1"}}}})
            return json.dumps({"data": {}})
        raise AssertionError(f"unexpected gh call {args}")
