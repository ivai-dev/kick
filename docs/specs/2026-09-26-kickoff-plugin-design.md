# Kickoff plugin — design

- **Date:** 2026-09-26
- **Status:** Approved (brainstorming and written-spec review, 2026-09-26); amended while writing the implementation plan; later amended to make the plugin self-contained (one external skill dependency) and the AI Minute example plain committed data
- **Origin:** the project-start workflow run on AI Minute (ivai-dev/ai-minute, PRs #27 and #82), packaged for reuse

## 1. Purpose

A Claude Code plugin that takes a software project from the first customer meeting to a baselined plan with tickets, through a fixed sequence of phases and approval gates:

discovery → research → feature map → UX design → full-product prototype → customer sign-off and MVP lock → solution design → plan, WBS and estimate → tickets and tracking, with a customer-feedback loop that can reopen sign-off.

The core principle, taken from the project lead's experience:

> Lock the MVP scope, but lock the **full** feature set with the customer first, using a clickable prototype of the final product. Only then design the database, technology, architecture and design patterns. Features built after that rarely expand in scope or need refactoring because of late customer feedback.

The plugin enforces this principle with gates. It is self-contained apart from `ui-ux-pro-max` (design work); every phase skill says exactly when to invoke it, and the shared working methods (interview, approval, build plan, task run, verification) live in one reference file (section 3).

### Decisions taken in brainstorming

| # | Decision |
| --- | --- |
| B1 | Own repository `ivai-dev/kickoff-plugin` (private), shipped as a Claude Code marketplace containing one plugin, `kickoff`. |
| B2 | General-purpose. Everything project-specific lives in `.kickoff/project.yaml`. AI Minute is the worked example and the regression fixture. |
| B3 | Tracker: GitHub Projects fully supported through a `Tracker` adapter interface; other trackers are later adapters. |
| B4 | Prototype: a no-build kit (Preact + htm from a CDN), published as a claude.ai Artifact. |
| B5 | Orchestration: one skill per phase, plus a router skill that reads project state and enforces gates. Phases can be re-entered. |
| B6 | Plan source is YAML. A tested CLI generates the formula-only Excel estimate workbook (WBS, effort and schedule; no progress tracking) and the Markdown plan documents. |
| B7 | Tracking in v1: the customer-feedback loop and two-way tracker sync. Status-report pages and interactive re-planning are out of scope. |
| B8 | Architecture: skills for judgement work and a bundled, tested Python CLI for everything that must be exactly right (scheduling, validation, workbook, docs generation, tracker sync, prototype checks). |

## 2. Repository layout

```
.claude-plugin/
  plugin.json              # name: kickoff, semver
  marketplace.json         # marketplace "kickoff" listing the plugin
skills/
  using-kickoff/           # router: reads state, names the next phase, blocks on open gates;
                           # references/methods.md holds the working methods every phase skill uses
  init/                    # interview -> .kickoff/project.yaml, folder skeleton, AGENTS.md template
  discovery/
  research/
  feature-map/
  ux-design/
  prototype/
  signoff/
  feedback/
  solution/
  plan/
  tickets/
commands/
  kickoff.md               # /kickoff: status + next step (runs using-kickoff)
  kickoff-sync.md          # /kickoff-sync: tickets pull + schedule + push --dry
hooks/
  hooks.json               # SessionStart: prints kickoff status when .kickoff/ exists
cli/                       # Python package "kickoff" (section 6)
  src/kickoff/
    kit/prototype/         # prototype core (section 7), shipped inside the package
    docker/lo-calc/        # LibreOffice image for `kickoff workbook --verify`, shipped inside the package
  tests/
examples/
  ai-minute/               # full worked example (committed data, not generated)
    .kickoff/              # project, features, plan, state, tickets
    expected/schedule.json # golden schedule the scheduler must reproduce
  mini/                    # tiny project used by kit and CI tests
docs/
  specs/, plans/
README.md                  # English: phases/gates diagram, quickstart, example
```

Each skill folder holds `SKILL.md`, and where useful `references/` (checklists, lessons) and `templates/` (document skeletons with placeholders the skill fills in).

### Per-project layout (created by `init`)

```
.kickoff/
  project.yaml   # team, calendar, languages, tracker, rules, security, hard dates
  state.yaml     # phases done, gates approved (who, when, evidence), stale markers
  features.yaml  # single source for epics/features -> feature-map.md
  plan.yaml      # work packages, dependencies, estimates, gates, risks, assumptions
  tickets.yaml   # written by the CLI: WBS code <-> issue number, pulled actuals
<docs_root>/     # default "docs"
  01-discovery/ 02-requirements/ 03-research/ 04-architecture/adr/ 05-design/ 06-planning/
  specs/ plans/
```

## 3. Dependencies on other skills

The plugin is self-contained. Its only external dependency is `ui-ux-pro-max`:

| Skill | Used by |
| --- | --- |
| `ui-ux-pro-max` | ux-design (`--design-system` with `--variance/--motion/--density`, then `--domain ux/typography/color/chart`), prototype (stack and domain queries, `references/pro-rules.md` pre-delivery checklist), feedback (visual items) |

`using-kickoff` checks that `ui-ux-pro-max` is installed and stops with install instructions if not.

### Working methods

Six methods that other workflow plugins ship as separate skills are written once, in `skills/using-kickoff/references/methods.md`. Every phase skill refers to them by section name:

| Method | Rule | Used by |
| --- | --- | --- |
| Interview | One question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is fully answered | init, discovery, feature-map, prototype (presentation choices) |
| Bounded approval | One table of proposed changes; nothing changes before an explicit yes or edit | feedback |
| Option decision | For each decision: 2–3 options with cost, risk and what they block; a recommendation; the result recorded as an ADR | research, solution |
| Build plan | A checklist of tasks; each names its files, inputs, exact verification command and expected output; each task leaves the project working | prototype, plan |
| Task run | One task at a time (a fresh subagent per task is optional); verification after each task; one commit per task; rulings recorded (section 9) | prototype build, any multi-task phase output |
| Verify | Before a phase is called done: run the commands in the skill's Verify section, read the real output, report failures as failures and skipped checks as skipped; then `kickoff phase done` and a Conventional Commit | end of every phase |

## 4. Phases and gates

| # | Skill | Outputs | Gate to leave |
| --- | --- | --- | --- |
| 0 | `init` | `project.yaml`, folder skeleton, `AGENTS.md` from template (security rules, language conventions, Definition of Done) | — |
| 1 | `discovery` | `vision-scope.md`, stakeholders, `open-questions.md` (each question with a "needed by" date and the work it blocks), decision log | **C1 Vision** — project lead |
| 2 | `research` | technical validation plan (bounded investigations instead of throwaway spikes), ADRs as *Proposed*, assumptions and constraints | — (runs alongside 3) |
| 3 | `feature-map` | `features.yaml` → `feature-map.md` (epic/feature IDs, release, P0–P2, platforms), `nfr.md` | **C2 Draft scope** — project lead |
| 4 | `ux-design` | `ux-spec.md` (IA per role, screen inventory SC-/W-/A-… with release, behaviour rules, copy guide), `design-system.md` | — |
| 5 | `prototype` | full-product prototype (all releases), scope layer, guided demo scenarios, clean `proto check`, private Artifact link in `state.yaml` | `proto check` passes |
| 6 | `signoff` | workshop pack (demo script, decision list for the customer), sign-off record | **C3 Features signed off** — customer; **C4 MVP locked** — lead + customer |
| ↺ | `feedback` | classified feedback, updates along the chain, reopens C3 | back to C3 |
| 7 | `solution` | architecture, data model, technology, design patterns; ADRs *Accepted* | **C5 Solution** — project lead |
| 8 | `plan` | `plan.yaml` → role-based schedule, estimate workbook, `wbs.md`, `plan.md`, `risk-register.md` | **C6 Baseline** — project lead |
| 9 | `tickets` | epics/stories/tasks in the tracker, blocked-by links, fields, sprints; pulled state in `tickets.yaml` | — (repeats) |

Gate rules:

1. `solution` refuses to start until C3 and C4 are approved. This is the hard gate that encodes the core principle.
2. `plan` may run in **draft** mode after C2 so an early estimate exists. A baseline needs C5.
3. Approving a gate writes `approved_by`, `date` and `evidence` (a link to a record or commit) to `state.yaml`. Without `--by` or without evidence, the gate is not approved.
4. Reopening C3 (through `feedback`) marks every phase output produced after C3 as `stale`. `using-kickoff` lists stale items first.
5. Every phase ends with the Verify method: real commands (`kickoff validate`, `kickoff docs --check`, `kickoff proto check` when relevant) and a Conventional Commit.
6. A stale phase blocks the phases that depend on it until it is re-run; re-running it (`phase done`) removes the gates that follow it, so they are approved again. C4 needs C3 and C6 needs C5.

### Phase skill contract

Every phase `SKILL.md` has the same sections: *When to use*, *Preconditions* (gates and files), *Inputs*, *Steps* (with named skill invocations), *Outputs* (exact paths), *Verify* (exact commands), *Lessons* (the relevant rows of section 10), and *Handoff* (what `using-kickoff` should suggest next).

## 5. Data model

All files carry `schema_version: 1` and are validated with JSON Schema by `kickoff validate`.

### project.yaml

```yaml
schema_version: 1
name: AI Minute
languages: { repo: en, chat: vi, workbook: vi, ui: vi }
docs_root: docs
calendar:
  weekend: [sat, sun]
  holidays: [2026-09-02, 2027-01-01]
roles:
  - { id: lead, name: Project lead, focus: 0.8 }
  - { id: dev, name: Full-stack developer, focus: 0.9 }
  - { id: qa, name: QA, focus: 0.9 }
releases: [MVP, Pilot, Apps, R2, R3, Rollout, Warranty]
hard_dates: { G5: 2026-11-27 }
tracker:
  kind: github
  org: ivai-dev
  repo: ai-minute
  project: 1
  assignee: hienlpv
  priority: { source: org-field, map: { P0: High, P1: Medium, P2: Low, blocker: Urgent } }
  labels: { type: [epic, story, task, bug], area: [web, api, asr, llm, ux, planning] }
rules:
  owners_by_role: true           # tickets and docs name roles, never people or assistants
  forbidden_phrases: ['\bClaude\b', 'AI[- ]assist']  # regexes; estimates may assume AI help, no document states it
  synthetic_data_only: true
security:                        # copied into AGENTS.md by init
  - Never log, print, or send to analytics any customer content.
```

### features.yaml

```yaml
schema_version: 1
epics:
  - id: E6
    name: Minutes
    features:
      - id: F6.1
        name: Draft minutes from a template
        release: MVP
        prio: P0
        platforms: W            # free text: W web, D Windows, M Android
        screens: [SC-12]
        wbs: [2.3.1]
      - { id: F6.9, name: Multi-step approval, release: R2, prio: P2, status: removed, removed_by: D-2026-09-26 }
```

### plan.yaml

```yaml
schema_version: 1
start: 2026-09-28
phases:                # level 1; `objective` is the phase description in the workbook's WBS sheet; the other descriptive fields are for plan.md prose
  - { code: "1", name: Preparation and technical validation, objective: "...", in_scope: "...", out_scope: "...",
      deliverables: "...", exit: "...", risks: "..." }
groups:                # level 2
  - { code: "1.2", name: Requirements, architecture and design, desc: "..." }
packages:              # level 3 leaves, in plan order
  - code: 1.2.7
    name: Customer feature sign-off          # workbook language
    desc: Signed feature list
    ref: F0.9
    role: lead
    effort: 1          # person-days at 100% focus
    done: 0            # fraction complete, overridden by pulled actuals; ignored by the estimate workbook
    prio: P0
    deps: [1.2.3]
    coop: Customer
    note: ""
    release: MVP
    schedule: seq      # default; or {fixed: [start, end]} | {span: [from, to]} | {period: {after: code, months: 12}} | {tail: {of: code, days: 5}}
    effort_rate: null  # level-of-effort packages: effort = round(workdays / 5 * rate, 1)
    ticket:            # present only for packages pushed to the tracker
      title: Customer sign-off of the full-product prototype   # repo language
      type: task       # story | task
      epic: E0
      areas: [area:planning]
      desc: "..."
      ac: ["Signed feature list stored in docs/01-discovery", "..."]
      sprint: Preparation
order_after:           # code -> place it right after this code in its role's queue (applied in order)
  "1.2.7": "1.3.4"
gates:
  - { id: G5, name: MVP acceptance, at: "3", hard: true, criteria: "...", evidence: "...", approver: Customer }
sprints:               # tracker iterations
  - { name: Preparation, start: 2026-09-28, days: 14 }
cut_order: [F14.3, F8.6]
risks:
  - { id: R19, title: Late feature sign-off, phase: "GĐ1", p: 3, i: 3, mitigation: "Book the workshop date now", trigger: "No signed list by 2026-10-07", status: open }
assumptions:
  - { id: A10, kind: Dependency, text: "Customer answers Q1, Q6, Q7 before 2026-10-02", scope: "GĐ1", source: Open questions, status: Pending }
```

### tickets.yaml (written by the CLI only)

```yaml
schema_version: 1
tracker_cache: { project_id: PVT_xxx, fields: { Status: PVTSSF_xxx, Release: PVTSSF_yyy } }  # IDs looked up by the CLI
items:
  "1.2.7": { issue: 80, type: task, parent: "1.2", state: open, synced: 2026-09-26T10:00:00Z, body_hash: 9f2c41 }
actuals:
  "1.2.2": { started: 2026-09-29, done: 2026-10-02 }
```

### state.yaml

```yaml
schema_version: 1
phases: { init: done, discovery: done, feature-map: done, prototype: done }
gates:
  C3: { approved_by: customer, date: 2026-10-01, evidence: "docs/01-discovery/open-questions.md#decision-log" }
prototype: { artifact: "https://claude.ai/artifact/<id>", version: 6 }
stale: [plan, tickets]
```

### Languages in data files

- `plan.yaml` and the text fields of `project.yaml` (role and release names) are written in the workbook language; `features.yaml` in the repository language. `ticket` blocks are always in the repository language.
- Any item may carry translations: `i18n: {<lang>: {<field>: "..."}}`. Generators pick `item.i18n[lang][field]` when present, else `item[field]`. Workbook output uses the workbook language, Markdown documents and tracker issues use the repository language.
- When `repo` differs from `workbook`, `kickoff validate` warns once per kind (phases, groups, packages, gates, risks, assumptions) about items without `i18n.<repo>` text, because generated documents would show them in the workbook language.
- Phases, groups, gates, risks and assumptions accept extra descriptive fields (objective, criteria, approver, mitigation, trigger…); packages are strict. Risk probability and impact are 1–5 (a smaller scale such as 1–3 is a valid subset).
- The tracker priority mapping lives in `tracker.priority: {source: org-field, map: {P0: High, ...}}`; org issue-field IDs (Priority options, Start, Target) in `tracker.issue_fields`, because GitHub offers no stable lookup for them.

### ID rules

- IDs are permanent: `E<n>`, `F<epic>.<n>`, screens `SC-nn` (web), `W-nn` (Windows), `A-nn` (Android) or prefixes from `project.yaml`, WBS codes in dotted numbers, `R<n>`, `A<n>`, `Q<n>`, `D-<date>`, `FB-<n>`.
- Renaming never changes an ID. Removal sets `status: removed` with a reference to the decision; the entry stays.
- Tracker issues are matched by a hidden key in the body, `<!-- kickoff:1.2.7 -->`, never by title.

## 6. CLI `kickoff`

Python 3.11+, installed with `uv tool install --force <plugin>/cli` (or `pipx install --force`), repeated after every plugin update: `using-kickoff` checks that the CLI version equals `.claude-plugin/plugin.json`. The kit, the templates and the LibreOffice Dockerfile ship inside the package (`kickoff/kit/prototype`, `kickoff/templates`, `kickoff/docker/lo-calc`), so a normal, non-editable install works outside the source checkout. Dependencies: `pyyaml`, `openpyxl`, `jsonschema`. The tracker adapter calls the `gh` CLI, so the plugin stores no tokens.

| Command | Behaviour |
| --- | --- |
| `kickoff validate` | Schema check; duplicate or dangling IDs; features without WBS and WBS without features; unknown roles; cycles across `deps` and `order_after` (reports the exact cycle); dependencies and span ends that point at a package that is not `seq` or `fixed`. Exit code 1 on any error. |
| `kickoff schedule [--json]` | Role-based schedule (below). Prints gate dates; warns when a hard date slips and lists the `cut_order` candidates with the effort each frees. `--json` writes `{code: [start, end, workdays, effort, name, role]}`. |
| `kickoff workbook [--verify]` | Writes the baseline estimate workbook, a formula-only xlsx with the WBS, effort and schedule (*Workbook sheets* below); it tracks no progress. `--verify` recalculates it with LibreOffice headless in Docker (image from `kickoff/docker/lo-calc`, shipped inside the package), requires zero error cells, and compares every WBS row's dates, working days and effort, the gate dates and the total effort with the baseline schedule. Without Docker it says the recalculation was skipped. |
| `kickoff docs [--check]` | Generates `feature-map.md`, `wbs.md`, `risk-register.md` and the tables inside `plan.md` between `<!-- kickoff:begin <name> -->` and `<!-- kickoff:end <name> -->`; hand-written prose is kept. `--check` fails if regeneration would change anything. |
| `kickoff tickets plan` | Builds the intended issue set: one Epic per feature-map epic (`[E6] Minutes`), and one Story or Task per package that has a `ticket` block (`[1.2.7] ...`), linked to its epic as a sub-issue. Bodies in the repo language state WBS code, owning role, effort, planned dates and priority, then the description, acceptance criteria and references. |
| `kickoff tickets push [--dry] [--adopt]` | Idempotent sync through the adapter: creates missing `type:*`/`area:*` labels and milestones, then creates/updates issues, sub-issues and blocked-by links (read from the tracker; only missing links are sent), Project fields (Status, Release, Sprint) and org fields (Priority, Start date, Target date). `--dry` prints the diff. Title or body drift made in the tracker is reported, not overwritten; issues mapped with `tickets link` are only taken over with `--adopt`. |
| `kickoff tickets pull` | Reads state and dates into `actuals`, then re-runs `schedule` and prints which gates moved. |
| `kickoff status [--json]` | Phases, gates, stale items and the suggested next skill; used by `using-kickoff`. |
| `kickoff init --name NAME` | Creates `.kickoff/` from a valid template and the docs folders; refuses if `.kickoff/` exists. |
| `kickoff can <phase> [--baseline]` | Exit 0 when the phase may start, 1 with the blocking phases and gates. |
| `kickoff phase start\|done <phase>` | Records phase progress; `done` clears the phase's stale marker. |
| `kickoff gate approve\|reopen <id>` | Approves a gate with `--by` and `--evidence` (both required), or reopens it with `--reason`, marking later phases stale. |
| `kickoff tickets link <key> <number>` | Maps a WBS code or epic to an existing issue before the first push (adopting a tracker populated by hand). |
| `kickoff proto new` | Scaffolds a prototype from the kit and one stub per screen in `ux-spec.md`. |
| `kickoff proto check [routes] [--jobs N]` | Section 7. |
| `kickoff proto lint` | Section 7. |
| `kickoff proto bundle [--out FILE]` | Writes the prototype as one self-contained HTML file (project scripts inlined) for publishing as an Artifact or handing over as a single file. |

### Scheduling model

- One person per role; each `seq` package joins its role's queue in plan order, then `order_after` moves are applied in file order (remove the code, insert it right after its target).
- `duration = max(1, round(effort * (1 - done) / focus))` working days.
- `start = WORKDAY(max(plan_start - 1, previous package end of the same role, end of every dependency), 1, holidays)`; `end = WORKDAY(start, duration - 1, holidays)`.
- Other modes: `fixed` keeps given dates; `span` runs from the start of one package to the end of another; `period` starts the working day after a package ends and lasts N months (`EDATE(start, N) - 1`); `tail` ends with a package and covers its last N working days. Level-of-effort packages derive effort from `effort_rate`.
- Groups and phases take the earliest start, the latest end and the summed effort of their leaves. A gate's date is the end date of the code in `at`.
- Actuals override: a done package uses its real dates; a started package keeps its real start.
- The estimate workbook expresses the same model as a baseline: `done` fractions and actuals are ignored (`build_schedule(..., baseline=True)` is the test oracle for the formulas). Formulas use `WORKDAY`, `NETWORKDAYS`, `EDATE`, `MAX`, `ROUND` (the `.INTL` forms when the weekend is not Saturday and Sunday) with the `HolidayDates` and `PlanStart` named ranges, so a customer or manager can change an effort, a role's focus, the plan start or a holiday and see durations, dates and totals move.

### Workbook sheets

Estimate (plan start, planned end, working days, total effort; milestones with planned date, hard date, spare working days and verdict; effort by phase and role, and by release and role), WBS (one row per phase, group and package: effort, working days, start and end as formulas), Resources (focus per role, the input every duration uses), Assumptions, Holidays (the `HolidayDates` range) — five sheets generated from the model; the plan (Task 7) lists each sheet's columns and formulas. Inputs are effort, effort rate, fixed dates, focus, plan start, hard dates and holidays; role, schedule mode, dependencies and queue order are structure and change in `plan.yaml`. The workbook holds no progress (section 13). Labels come from a language table keyed by `languages.workbook` (`en` and `vi` in v1).

### Tracker adapter

```python
class Tracker(Protocol):
    def prepare(self, specs: list[IssueSpec]) -> None: ...  # create missing labels and milestones
    def get(self, number: int) -> Issue | None: ...
    def find_by_key(self, key: str) -> Issue | None: ...
    def upsert_issue(self, spec: IssueSpec, existing: Issue | None) -> tuple[Issue, str]: ...
    def set_parent(self, child: Issue, parent: Issue) -> None: ...
    def set_blocked_by(self, issue: Issue, blockers: list[Issue]) -> None: ...
    def set_fields(self, issue: Issue, fields: dict, *, created: bool) -> bool: ...  # False = warning, not abort
    def list_states(self, numbers: list[int]) -> dict[int, IssueState]: ...
```

`GitHubTracker` reads with `gh issue list --json` (including `parent` and `blockedBy`) and writes with `gh` and `gh api graphql`: `addSubIssue(replaceParent: true)`, `addBlockedBy`, `setIssueFieldValue` for org fields, `updateProjectV2ItemFieldValue` for Project fields and iterations. The issue type is a `type:*` label in v1. Field and option IDs are looked up once and cached in `tickets.yaml`. Failing to set Project or org fields is a warning, never an abort.

### Two-way sync rules

- The tracker owns state (open, in progress, done) and actual dates.
- `plan.yaml` owns scope, estimates and dependencies.
- An issue whose title or body was edited in the tracker since the last push is reported as drift; `push` leaves it until the user chooses a side. An issue mapped with `tickets link`, or found without sync state and without the hidden key, is only taken over with `push --adopt`.
- Parent and blocked-by links are read from the tracker on every push and only missing links are sent, so manual edits are repaired and a second push changes nothing.

## 7. Prototype kit

The generic core of the AI Minute prototype with all project content removed. Global namespace `window.KIT`.

### Core files (not edited per project)

- `index.html` — follows the Artifact page contract: no doctype/html/head/body, a `<title>`, token blocks for light, dark-by-media and `[data-theme]`; loads Preact 10.24.3, preact/hooks and htm 3.1.1 from jsdelivr; includes `table{color:inherit}` and script `charset`.
- `core.js` — `KIT.register(id, {comp, code, name, roles, platforms, rel})`; hash parser `#<screen>[-light|-dark][-full|-tags|-mvp][-<role>]` that strips tokens from the right in any order, with roles from config; a guard in `jump()` that refuses a screen whose `roles` exclude the current role; capture of `error`, `unhandledrejection` and render errors into `document.documentElement.dataset.err`.
- `shell.js` — role picker, desktop shell, phone frame (390×844), Windows app frame, per-role home routing at every width, theme and scope toggles.
- `scope.js` — `Rel({r, children, inline})` with modes full, tags and mvp; release names from config.
- `scenario.js` — `#scn-<id>` runs scenario steps automatically, can be cancelled by the viewer, sets `data-err` when a step fails.
- `ui.js` — token-based components (Button, Field, Table, KPI, StatusChip, Drawer, InfoPopover, EmptyState, Toast), SVG charts (line, bar, donut) drawn to one scale, type-scale classes `.t-cap .t-meta .t-ui .t-strong .t-body .t-h1 .t-h2 .t-h3 .t-kpi`.
- `tokens.css` — filled from `ui-ux-pro-max --design-system`; defaults to the calm-density rules: 7-step scale 12/13/14/16/18/22/28, weights 400 body / 500 labels / 600 headings and KPI numbers only, line height 1.6, 4 px spacing grid, 32 px between sections.

### Per-project files (written by the `prototype` skill)

- `js/config.js` — roles, releases, platforms, product name.
- `js/data.js` — synthetic data only; invented names and addresses; no development infrastructure (VPN names, private IP ranges of dev tools) in any user-facing string.
- `js/<area>.js` — one module per screen group, registering screens by their ux-spec IDs.
- `js/scenarios.js` — guided demo scenarios for the workshop.

### Checks

- `kickoff proto check` runs Edge or Chrome `--headless=new --dump-dom` on every registered route in light and dark, and every `scn-*` route with a longer virtual-time budget. It uses a real 390 px iframe wrapper (`narrow.html`) because headless screenshots clamp around 520 px, and fails on `data-err`, on horizontal scroll at 390 px, and on coverage gaps: every ux-spec screen must be registered and every registered screen must be in the ux-spec. Screenshots go to `shots/`. Route dumps run in parallel (default 4 browsers, each with its own profile).
- `kickoff proto lint` counts distinct font sizes, weight-600 uses and inline styles against thresholds in `project.yaml` (defaults 16 / 20 / 60), and flags raw hex colours outside `tokens.css`.
- `kickoff proto bundle` inlines the project scripts into one HTML file that follows the Artifact page contract.

### Prototype skill flow

1. The Interview method for presentation choices (one build with a scope layer, which roles, which scenarios).
2. `ui-ux-pro-max` stack and domain queries for each screen group.
3. The Build plan method — one task per screen group, plus shell, scenarios and a consistency pass.
4. The Task run method, with a full-route `proto check` after every task, not only the new routes.
5. The `ui-ux-pro-max` pro-rules pre-delivery checklist and `proto lint`.
6. Publish as a private Artifact when the Artifact tool is available; otherwise run `kickoff proto bundle` and share the single HTML file. Record the link (or bundle path) and version in `state.yaml`.

The prototype is a design artifact. Its CDN use does not relax the product's own security rules; `ux-design` and `solution` restate that the product bundles its fonts and assets.

## 8. Feedback loop (`feedback` skill)

1. Input: workshop notes, Artifact comments (via `ArtifactComments`), or pasted notes.
2. Split into items `FB-<n>`, each classified as **scope** (add, remove or move a feature between releases), **ux** (flow or screen), **visual** (type, colour, density), **question** (new `Q` with a needed-by date) or **decision** (new `D` in the decision log).
3. The project lead approves the classification table once before anything changes.
4. Updates run in chain order: `features.yaml` → `ux-spec.md` → prototype (with `proto check`) → draft `plan.yaml` → `schedule`. The skill reports which gates moved; if a hard date slips, it presents `cut_order` options and asks for a decision.
5. C3 is reopened, later outputs are marked stale, and the session is recorded in `<docs_root>/01-discovery/feedback/YYYY-MM-DD.md`.

## 9. Conventions the plugin carries

- **Languages:** repository and tracker in `languages.repo`; chat in `languages.chat`; the workbook and customer deliverables in the language the lead requests; UI strings and fixtures in `languages.ui`.
- **Estimates:** by role and focus percentage; person-days at 100% focus; every plan has a scope-cut order; a slipped hard date always ends in an explicit decision. When `rules.forbidden_phrases` lists a phrase such as "AI assistance", estimates may assume it but no document, ticket or report states it; `kickoff validate` warns when one does.
- **Owners:** tickets are assigned to `tracker.assignee`; bodies name the owning role; never a person or an assistant as owner.
- **Tickets:** Epic → Story → Task via sub-issues; blocked-by for dependencies; one ticket per WBS leaf; Conventional Commits per ticket.
- **Rulings:** long multi-task runs record decisions in `<docs_root>/plans/<plan>-rulings.md` as `Ruling: <decision> — <why> — <cost if wrong>` and list them to the lead at the end.
- **Irreversible actions:** merges, deleting branches, publishing and pushing to shared branches are confirmed with the lead first.

## 10. Lessons encoded as checks

| Lesson from AI Minute | Where it is enforced |
| --- | --- |
| `chain_after` created a cycle; the schedule ran to 2039 | `validate` cycle detection; `schedule` refuses to run with a cycle |
| Sync matched issues by title and created a duplicate after a rename | hidden body key matching |
| Render errors did not surface in headless checks | `core.js` render-error capture |
| Headless "narrow" screenshots clamped around 520 px | `narrow.html` 390 px iframe |
| Splitting prototype modules dropped imports, found only tasks later | full-route `proto check` after every task |
| No doctype meant quirks mode; tables unreadable in dark mode | `table{color:inherit}` in kit `index.html` |
| Every role saw the chair's home below 760 px | per-role home routing in `shell.js`, covered by check routes per role |
| A role token in the URL let an admin open meeting content | role guard in `jump()` |
| A development VPN name and IP range appeared in product UI | `data.js` rule and `proto lint` pattern list from `project.yaml` |
| Dense, heavy text overwhelmed the reviewer | calm-density token defaults and `proto lint` thresholds |
| A sidebar filter that reloaded a near-identical page confused the reviewer | `ux-design` rule: navigation goes to a distinct page; filters stay in-page |
| Literal `\n` in a Bash heredoc became real newlines in JS | skills write files with file tools, not heredocs |
| A late sign-off moved the MVP gate | `signoff` workshop date is a package in `plan.yaml` with a risk entry; `schedule` shows its effect |

## 11. Testing

- **CLI:** pytest for the scheduler (holidays, weekends, order_after, cycles, actuals), validate, docs round-trip, estimate-workbook formulas against the baseline simulation (formula shapes offline; LibreOffice recalculation in Docker, including an edit of focus and effort), and the GitHub adapter against a fake `gh`.
- **Golden test:** `examples/ai-minute/.kickoff` reproduces the current AI Minute plan: G1 2026-10-14 and G5 2026-11-26, MVP effort (phases 1–3) 84.75 person-days, whole project 336.75; every package's start and end equal `examples/ai-minute/expected/schedule.json` (205 codes; the schedule of the workbook the customer received).
- **Kit:** `proto check` on `examples/mini` with every core feature exercised (roles, scope modes, a scenario, phone frame); a test that the mini prototype's core files equal the kit's; a package-data test and a CI wheel check.
- **Tracker:** adapter tests against a fake `gh` that rejects unknown labels and milestones and emulates sub-issue and blocked-by state; an opt-in sandbox test (`KICKOFF_SANDBOX=org/repo#project`) that pushes twice to a real private repository and asserts zero mutations the second time.
- **Skills:** each skill is written against a pressure scenario run in a fresh subagent with and without the skills, including scenarios for `using-kickoff` (refuses `solution` before C3/C4; lists stale items after feedback) and `feedback` (classifies a mixed note correctly).
- **CI:** GitHub Actions on Ubuntu and Windows running lint, pytest, `kickoff validate` on both examples, a wheel check and `proto check` with headless Chrome (Edge on Windows).

## 12. Release

- Semver in `plugin.json` and `marketplace.json`, starting at 0.1.0.
- Install: `/plugin marketplace add ivai-dev/kickoff-plugin`, then `/plugin install kickoff@kickoff`; CLI with `uv tool install --force <plugin>/cli`, repeated after every plugin update.
- README in English with the phase/gate diagram, a quickstart and the AI Minute example.

## 13. Out of scope for v1

- Status-report Artifact pages.
- Interactive re-planning beyond the slip warning and cut-order suggestions.
- Jira and Azure DevOps adapters.
- Progress tracking in the workbook: Gantt or roadmap grids, status and % done, actual and gate-actual dates, variance, overdue highlighting, resource-load charts, and feature, risk or ticket sheets. Progress lives in the tracker (`tickets pull`, `schedule`, `docs`); the workbook stays the baseline estimate.
- Migrating the ai-minute repository itself to `.kickoff/`; it stays as it is and serves only as the source of the example.

## 14. Acceptance criteria

1. Installing the marketplace and plugin in a fresh Claude Code session exposes the twelve skills and two commands; `using-kickoff` reports a missing `ui-ux-pro-max`; in a project with `.kickoff/` a SessionStart hook prints `kickoff status`.
2. `kickoff validate`, `schedule`, `workbook --verify`, `docs --check` pass on `examples/ai-minute`, the gate dates match section 11, and the recalculated estimate workbook matches the baseline schedule on every WBS row.
3. `kickoff tickets push --dry` on the AI Minute example, tested against a fake `gh` filled from `tickets.yaml`, creates exactly the eleven pending items (epics E14 and E15 and nine Release 2 packages) and changes nothing else; pushing twice in a row makes no changes the second time (fake-`gh` test, and an opt-in sandbox-repository test).
4. `kickoff proto new` followed by `proto check` on `examples/mini` passes with zero `data-err`, no horizontal scroll at 390 px, and full screen coverage.
5. `solution` refuses to proceed in a project whose `state.yaml` lacks C3 or C4.
6. CI is green on the main branch.
7. From a normal (non-editable) `uv tool install --force <plugin>/cli` outside the source checkout, `kickoff proto new` and `kickoff proto bundle` work, because the kit and templates are package data (and `kickoff workbook --verify` finds its Dockerfile the same way).
