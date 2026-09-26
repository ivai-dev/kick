# -*- coding: utf-8 -*-
"""Sync GitHub Project 1 with plan v2: epics, MVP stories/tasks, fields, iterations, dependencies."""
import json
import re
import subprocess
import sys
from datetime import date, datetime

REPO_DIR, SCHED = sys.argv[1], sys.argv[2]
sys.path.insert(0, REPO_DIR + "/tools/plan-workbook")
import plan_data as d  # noqa: E402
import tickets_en as t  # noqa: E402

REPO = "ivai-dev/ai-minute"
BLOB = f"https://github.com/{REPO}/blob/main"
PROJECT = "PVT_kwDOExkNwc4Bkk2M"
F_STATUS, F_RELEASE, F_SPRINT = "PVTSSF_lADOExkNwc4Bkk2MzhjU9Pg", "PVTSSF_lADOExkNwc4Bkk2MzhjVkuk", "PVTIF_lADOExkNwc4Bkk2MzhjVkvA"
STATUS = {"Backlog": "f75ad846", "Ready": "61e4505c", "Done": "98236657"}
IF_PRIORITY, IF_START, IF_TARGET = "IFSS_kgDOAr4JFQ", "IFD_kgDOAr4JFg", "IFD_kgDOAr4JFw"
PRIORITY = {"P0": "IFSSO_kgDOBMzLIA", "P1": "IFSSO_kgDOBMzLIQ", "P2": "IFSSO_kgDOBMzLIg"}
S = json.load(open(SCHED, encoding="utf-8"))
DRY = "--dry" in sys.argv
LOG = []


def gh(*a, inp=None):
    if DRY and a[0] in ("issue",) and a[1] in ("create", "edit", "close", "comment"):
        LOG.append(" ".join(a[:3]))
        return "https://github.com/x/y/issues/0"
    r = subprocess.run(["gh", *a], capture_output=True, text=True, encoding="utf-8", input=inp)
    if r.returncode:
        raise RuntimeError(" ".join(a[:4]) + ": " + r.stderr)
    return r.stdout.strip()


def gql(q, **v):
    if DRY and q.lstrip().startswith("mutation"):
        LOG.append(q[:60])
        return {"data": {}}
    args = ["api", "graphql", "-f", f"query={q}"]
    for k, x in v.items():
        args += ["-f", f"{k}={x}"]
    return json.loads(gh(*args))


def dd(iso):
    return datetime.strptime(iso, "%Y-%m-%d").strftime("%d/%m/%Y")


# ---------------------------------------------------------------- feature map (English) → epic bodies
fm = open(REPO_DIR + "/docs/02-requirements/feature-map.md", encoding="utf-8").read()
EPIC_TITLES, EPIC_ROWS = {}, {}
for part in re.split(r"^## ", fm, flags=re.M)[1:]:
    head, _, body = part.partition("\n")
    m = re.match(r"(E\d+) — (.+)", head.strip())
    if not m:
        continue
    EPIC_TITLES[m.group(1)] = m.group(2)
    rows = []
    for line in body.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cells and re.fullmatch(r"F\d+\.\d+", cells[0]):
            rows.append(cells)
    EPIC_ROWS[m.group(1)] = rows
GOALS = {
    "E0": "Everything needed before feature work: customer answers, signed-off scope, architecture, design, estimate and a ready backlog.",
    "E1": "A working monorepo, CI, web shell and design system so that build batch 1 can start immediately.",
    "E2": "Users sign in, have roles, and admins can manage users.",
    "E3": "Secretaries prepare meetings (or start instantly) with the context that improves recognition and minutes.",
    "E4": "Recording in the browser never loses audio under the stated conditions and recovers from network loss or tab reload.",
    "E5": "Accurate, low-latency Vietnamese transcript live and after the meeting, with test data and a quality harness to prove it.",
    "E6": "Draft minutes in the official template, edited, approved, exported and printed.",
    "E7": "Past meetings are easy to find and review.",
    "E8": "API, database, ingest, workers and audit that the clients and AI services rely on.",
    "E9": "The server side installs offline on one host, is monitored, backed up and restorable; guides for operators and secretaries.",
    "E10": "The MVP is tested against the reliability matrix, performance targets and a customer UAT.",
    "E11": "Pilot in 2–3 units, rollout in waves, training and handover to the customer's IT team.",
    "E12": "Windows app — the recommended recording client on laptops: background recording, crash recovery, offline start, encrypted local storage, signed installer.",
    "E13": "Android app — the recommended recording client on phones: recording with the screen locked, Keystore encryption, APK distribution.",
}
EPIC_RELEASE = {"E11": "Pilot", "E12": "Apps", "E13": "Apps"}
EPIC_AREAS = {"E11": ["area:docs", "area:qa"], "E12": ["area:desktop"], "E13": ["area:mobile"]}
EPIC_TARGET = {"E0": S["1"][1], "E11": S["8"][1], "E12": S["5"][1], "E13": S["5"][1]}


def epic_body(e):
    rows = EPIC_ROWS[e]
    hdr = "| ID | Item | Release | Priority | WBS |\n| --- | --- | --- | --- | --- |"
    lines = [f"## Goal\n\n{GOALS[e]}\n", "## Scope\n", hdr]
    for r in rows:
        # columns: ID, name, release, prio, [platforms], WBS
        lines.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[-1]} |")
    lines.append(f"\n## References\n\n- Feature map: {BLOB}/docs/02-requirements/feature-map.md\n- Plan: {BLOB}/docs/06-planning/plan.md\n- WBS and schedule: `docs/06-planning/ke-hoach-tong-the-ai-minute.xlsx`\n")
    if e in ("E12", "E13"):
        lines.append("Stories are created at the start of the apps phase (WBS 5.1).")
    elif e == "E11":
        lines.append("Stories are created when the pilot is planned (WBS 4.1.1).")
    else:
        lines.append("MVP work packages are linked below as sub-issues.")
    return "\n".join(lines)


# ---------------------------------------------------------------- existing issues
issues = json.loads(gh("issue", "list", "-R", REPO, "--state", "all", "--limit", "200", "--json", "number,title,state"))
by_title = {i["title"]: i["number"] for i in issues}
EPIC_NUM = {}
for i in issues:
    m = re.match(r"\[(E\d+)\] ", i["title"])
    if m:
        EPIC_NUM[m.group(1)] = i["number"]


def node(num):
    return gh("api", f"repos/{REPO}/issues/{num}", "--jq", ".node_id")


# ---------------------------------------------------------------- 1. Release options and iterations
if not DRY:
    res = gql('mutation($f:ID!){updateProjectV2Field(input:{fieldId:$f,singleSelectOptions:['
              '{name:"MVP",color:GREEN,description:"Web MVP, accepted before December 2026"},'
              '{name:"Pilot",color:YELLOW,description:"Pilot in 2–3 units"},'
              '{name:"Apps",color:BLUE,description:"Windows and Android apps (recommended recording clients)"},'
              '{name:"R2",color:ORANGE,description:"Release 2"},{name:"R3",color:PURPLE,description:"Release 3"},'
              '{name:"Rollout",color:GRAY,description:"Rollout and handover"}]})'
              '{projectV2Field{... on ProjectV2SingleSelectField{options{id name}}}}}', f=F_RELEASE)
    REL = {o["name"]: o["id"] for o in res["data"]["updateProjectV2Field"]["projectV2Field"]["options"]}
    ITS = [("Preparation", "2026-09-28", 14), ("Build batch 1", "2026-10-12", 17), ("Build batch 2", "2026-10-29", 12),
           ("Build batch 3 and RC", "2026-11-10", 9), ("UAT and acceptance", "2026-11-19", 9)]
    its = ",".join(f'{{title:"{n}",startDate:"{s}",duration:{du}}}' for n, s, du in ITS)
    res = gql(f'mutation($f:ID!){{updateProjectV2Field(input:{{fieldId:$f,iterationConfiguration:{{startDate:"2026-09-28",duration:14,iterations:[{its}]}}}}){{projectV2Field{{... on ProjectV2IterationField{{configuration{{iterations{{id title}}}}}}}}}}}}', f=F_SPRINT)
    ITER = {i["title"]: i["id"] for i in res["data"]["updateProjectV2Field"]["projectV2Field"]["configuration"]["iterations"]}
    print("release options", REL, "\niterations", ITER)
    ms = json.loads(gh("api", f"repos/{REPO}/milestones"))
    mvp = next(m for m in ms if m["title"] == "MVP")
    gh("api", "-X", "PATCH", f"repos/{REPO}/milestones/{mvp['number']}", "-f", "due_on=2026-11-27T23:59:59Z",
       "-f", f"description=Web MVP accepted before December 2026 (gate G5 planned {dd(S['3'][1])})")
else:
    REL, ITER = {}, {}

items = json.loads(gh("project", "item-list", "1", "--owner", "ivai-dev", "--format", "json", "--limit", "200"))["items"]
ITEM = {it["content"]["number"]: it["id"] for it in items if it.get("content", {}).get("number")}


def ensure_item(num, nid):
    if num in ITEM:
        return ITEM[num]
    r = gql('mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}', p=PROJECT, c=nid)
    ITEM[num] = r["data"]["addProjectV2ItemById"]["item"]["id"] if not DRY else "x"
    return ITEM[num]


def set_item(num, nid, status=None, release=None, sprint=None):
    it = ensure_item(num, nid)
    for field, val in ((F_STATUS, f'{{singleSelectOptionId:"{STATUS[status]}"}}' if status else None),
                       (F_RELEASE, f'{{singleSelectOptionId:"{REL[release]}"}}' if release and REL else None),
                       (F_SPRINT, f'{{iterationId:"{ITER[sprint]}"}}' if sprint and ITER else None)):
        if val:
            gql('mutation($p:ID!,$i:ID!,$f:ID!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:' + val + '}){clientMutationId}}', p=PROJECT, i=it, f=field)


def set_issue_fields(nid, prio=None, start=None, target=None):
    f = []
    if prio:
        f.append(f'{{fieldId:"{IF_PRIORITY}",singleSelectOptionId:"{PRIORITY[prio]}"}}')
    if start:
        f.append(f'{{fieldId:"{IF_START}",dateValue:"{start}"}}')
    if target:
        f.append(f'{{fieldId:"{IF_TARGET}",dateValue:"{target}"}}')
    if f:
        gql(f'mutation($i:ID!){{setIssueFieldValue(input:{{issueId:$i,issueFields:[{",".join(f)}]}}){{clientMutationId}}}}', i=nid)


# ---------------------------------------------------------------- 2. epics
for e in [f"E{i}" for i in range(0, 14)]:
    title = f"[{e}] {EPIC_TITLES[e]}"
    body = epic_body(e)
    if e in EPIC_NUM:
        num = EPIC_NUM[e]
        gh("issue", "edit", str(num), "-R", REPO, "--title", title, "--body-file", "-", inp=body)
    else:
        labels = ["type:epic", *EPIC_AREAS.get(e, [])]
        args = ["issue", "create", "-R", REPO, "--title", title, "--body-file", "-", "--assignee", "hienlpv"]
        for lb in labels:
            args += ["--label", lb]
        url = gh(*args, inp=body)
        num = int(url.rsplit("/", 1)[1])
        EPIC_NUM[e] = num
    nid = node(num) if not DRY else "n"
    set_issue_fields(nid, "P0", "2026-09-24" if e == "E0" else None, EPIC_TARGET.get(e, S["3"][1]))
    set_item(num, nid, status="Ready" if e == "E0" else "Backlog", release=EPIC_RELEASE.get(e, "MVP"))
    print("epic", e, num)

# ---------------------------------------------------------------- 3. close obsolete issues
for num, (reason, text) in t.CLOSE.items():
    st = next((i["state"] for i in issues if i["number"] == num), "OPEN")
    if st == "OPEN":
        gh("issue", "comment", str(num), "-R", REPO, "--body", text)
        gh("issue", "close", str(num), "-R", REPO, "--reason", reason)
        if reason == "completed" and not DRY:
            set_item(num, node(num), status="Done")
    print("closed", num, reason)

# ---------------------------------------------------------------- 4. MVP work packages
all_l3 = [it for ph in ("1", "2", "3") for it in d.W[ph] if it[0] == "L3"]
group_of = {}
for ph in ("1", "2", "3"):
    g = None
    for it in d.W[ph]:
        if it[0] == "L2":
            g = it[1]
        else:
            group_of[it[1]] = g
NUM = {}
for it in all_l3:
    code = it[1]
    title_en, typ, epic, areas, desc, ac = t.T[code]
    role = t.ROLE_EN[d.ROLES[it[9]][0]]
    feats = it[4]
    s_, e_ = S[code][0], S[code][1]
    body = (f"**WBS:** {code} · **Role:** {role} · **Effort:** {it[8]:g} d · **Planned:** {dd(s_)} – {dd(e_)} · **Priority:** {it[5]}\n\n"
            f"{desc}\n\n### Acceptance criteria\n\n" + "\n".join(f"- [ ] {a}" for a in ac) +
            f"\n\n### References\n\n- Features: {feats} ({BLOB}/docs/02-requirements/feature-map.md)\n"
            f"- Schedule and dependencies: `docs/06-planning/ke-hoach-tong-the-ai-minute.xlsx` (WBS {code}); blocked-by links on this issue.\n")
    title = f"[{code}] {title_en}"
    labels = [f"type:{typ}", *areas]
    if code in t.EXISTING:
        num = t.EXISTING[code]
        cur = json.loads(gh("issue", "view", str(num), "-R", REPO, "--json", "labels"))["labels"] if not DRY else []
        rm = [lb["name"] for lb in cur if lb["name"].startswith("type:") or lb["name"].startswith("area:")]
        args = ["issue", "edit", str(num), "-R", REPO, "--title", title, "--body-file", "-"]
        for lb in rm:
            if lb not in labels:
                args += ["--remove-label", lb]
        for lb in labels:
            args += ["--add-label", lb]
        gh(*args, inp=body)
    elif title in by_title:
        num = by_title[title]
        gh("issue", "edit", str(num), "-R", REPO, "--body-file", "-", inp=body)
    else:
        args = ["issue", "create", "-R", REPO, "--title", title, "--body-file", "-", "--milestone", "MVP", "--assignee", "hienlpv"]
        for lb in labels:
            args += ["--label", lb]
        url = gh(*args, inp=body)
        num = int(url.rsplit("/", 1)[1])
    NUM[code] = num
    if DRY:
        continue
    nid = node(num)
    gh("issue", "edit", str(num), "-R", REPO, "--milestone", "MVP", "--add-assignee", "hienlpv")
    set_issue_fields(nid, it[5], s_, e_)
    sprint = t.SPRINT_OF[group_of[code]] if group_of[code] in t.SPRINT_OF else t.SPRINT_OF[code.split(".")[0]]
    status = "Ready" if code.startswith("1.") or group_of[code] == "2.1" else "Backlog"
    set_item(num, nid, status=status, release="MVP", sprint=sprint)
    try:
        gql('mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c,replaceParent:true}){clientMutationId}}', p=node(EPIC_NUM[epic]), c=nid)
    except RuntimeError as ex:
        if "duplicate" not in str(ex).lower():
            raise
    print("wp", code, num, sprint, status, flush=True)

# ---------------------------------------------------------------- 5. blocked-by links
if not DRY:
    NODE = {c: node(n) for c, n in NUM.items()}
    links = 0
    for it in all_l3:
        for dep in it[10]:
            if dep in NODE:
                try:
                    gql('mutation($i:ID!,$b:ID!){addBlockedBy(input:{issueId:$i,blockingIssueId:$b}){clientMutationId}}', i=NODE[it[1]], b=NODE[dep])
                    links += 1
                except RuntimeError as ex:
                    if "already" not in str(ex).lower():
                        raise
    print("blocked-by links", links)
    json.dump(NUM, open(sys.argv[3], "w"), indent=0)

# ---------------------------------------------------------------- 6. project readme
readme = f"""# AI Minute

Repo: https://github.com/ivai-dev/ai-minute · Rules: `AGENTS.md` · Scope: `docs/02-requirements/feature-map.md` · Plan: `docs/06-planning/plan.md` · Schedule: `docs/06-planning/ke-hoach-tong-the-ai-minute.xlsx`

## Delivery

- **MVP (web):** accepted before December 2026 (planned {dd(S['3'][1])}); recording in Chrome/Edge on laptops, phones view and approve minutes.
- **Apps:** Windows and Android apps — the recommended recording clients of the final product (planned {dd(S['5'][1])}).
- Then Pilot, R2, R3, rollout and warranty.

## Conventions

- **Hierarchy:** Epic (`type:epic`) → Story (`type:story`) / Task (`type:task`), linked as sub-issues; dependencies are blocked-by links that mirror the WBS.
- **Titles:** `[E#]` epics, `[<WBS code>]` work packages.
- **Priority (org field):** High = P0, Medium = P1, Low = P2, Urgent = blocker.
- **Release:** MVP / Pilot / Apps / R2 / R3 / Rollout. **Milestone:** MVP (due 27/11/2026).
- **Sprint:** Preparation (28/09), Build batch 1 (12/10), Build batch 2 (29/10), Build batch 3 and RC (10/11), UAT and acceptance (19/11).
- **Dates:** Start/Target come from the workbook schedule. Every body states WBS code, role, effort and planned dates.
- **Status:** Backlog → Ready → In progress → In review → Done. A PR must contain `Closes #<issue>`.
"""
if not DRY:
    gh("project", "edit", "1", "--owner", "ivai-dev", "--readme", readme)
print("done", len(LOG) if DRY else "")
