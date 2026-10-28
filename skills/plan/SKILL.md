---
name: plan
description: Use when creating or updating the effort estimate, work breakdown, milestones, risks, estimate workbook or (once the lead turns scheduling on) the role-based schedule of a project
---

# Plan

Estimate first. Builds `.kickoff/plan.yaml` with the project lead (phases, groups and work packages with role-based estimates as ranges, dependencies, risks, assumptions and the scope-cut order) and lets the CLI total the estimate and write the plan documents. A schedule, gates with dates and the estimate workbook come only when `project.yaml` has scheduling on; dates are never typed by hand: they come out of `kickoff schedule`.

## When to use

- **Draft** after C2, so an early estimate exists before the prototype and the sign-off. It may be feature-level only (each feature's own estimate, no WBS yet) and gets refined into packages as the design settles.
- **Baseline** after C5, for the plan the team commits to (gate C6). The baseline needs packages.
- Again when scope, estimates or hard dates change, when the lead wants a schedule (scheduling on), or when the phase is stale after a feedback session.

## Preconditions

- Draft: `kickoff can plan` exits 0 (feature-map done, C2 approved).
- Baseline: `kickoff can plan --baseline` exits 0 (solution done, C5 approved).
- `.kickoff/project.yaml` has the roles and the releases. Scheduling on also needs the roles' focus, the calendar and the hard dates (step 9 asks for them).

## Inputs

- `.kickoff/features.yaml` (features with their `estimate`) and `<docs_root>/02-requirements/nfr.md`; `<docs_root>/01-discovery/vision-scope.md` (timeline, constraints).
- `.kickoff/project.yaml`: `roles`, `releases`, `languages`, `estimate` (overhead), `scheduling`; with scheduling on also `calendar`, `hard_dates`.
- The existing `.kickoff/plan.yaml`: the sign-off workshop package and its risk, the `assumptions` from research.
- Draft architecture (`<docs_root>/04-architecture/`, labelled Draft) when `kickoff:research` wrote it; baseline: the accepted `system-architecture.md`, `data-model.md` and the ADRs.
- `<docs_root>/01-discovery/open-questions.md` (questions that block work, decisions).
- `references/estimation.md` (estimating model, formulas, slip decisions) and `templates/plan.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can plan` (draft) or `kickoff can plan --baseline` (baseline). Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start plan`, and tell the lead which mode this run is.
2. **Read the estimate so far:** `kickoff estimate`. After C2 it totals the feature-level estimates; later it totals packages, and a feature with packages is estimated by them. Note the Basis line (point estimates, low-confidence items, unsized features) and the spread. Tell the lead in plain words (`../using-kickoff/references/methods.md`, Plain words): the range ("about 180 to 300 person-days, most likely 230"), which parts you are least sure of and why, and which features have no size yet.
3. **Estimate with the lead** (`references/estimation.md`, Estimating): every package or feature gets its likely value, a `min` and a `max`, a `confidence` and a `basis`. A big spread is stated, not hidden: it becomes a risk or a validation item. Management is the overhead rate in `project.yaml` (`estimate: {overhead: 0.10}`), not level-of-effort packages.
4. **Build `plan.yaml` with the lead, one phase at a time.** For each phase, propose its groups and packages as one table with the Bounded approval method (name what the work is first; code, role, effort range, deps, release, ref follow), in plain words, take the lead's edits, then write that phase with the Edit tool before the next one. A draft after C2 may stop at feature-level estimates and write only the early packages; the baseline has packages for every active feature.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   - **Structure:** `phases` (level 1, `code: "1"`, with `objective`, `in_scope`, `out_scope`, `deliverables`, `exit`, `risks` for the plan prose), `groups` (level 2, `"1.2"`), `packages` (level 3 leaves, `"1.2.7"`, in plan order). Codes are permanent strings; quote them.
   - **Effort** in person-days at 100% focus, per package, for the one role that does it (`role` is a role id of `project.yaml`). `effort` is the likely value. Add `min`, `max` (`min <= effort <= max`, or `kickoff validate` errors), `confidence` (`low`, `medium` or `high`) and `basis` (what the number rests on: a comparison, a spike result `V<n>`, an assumption `A<n>`). See `references/estimation.md`.
   - **Dependencies** in `deps` (a package that must end first). `order_after` only where a role's queue order must differ from the WBS order.
   - **Schedule modes** (used only when scheduling is on): `seq` (default) for normal work; `{fixed: [start, end]}` for booked dates (workshops, trainings); `{span: [from, to]}` for work that runs from the start of one package to the end of another; `{period: {after: code, months: n}}` for warranty or support periods; `{tail: {of: code, days: n}}` for the last working days of a package (acceptance support). Old plans may still have level-of-effort packages with `effort_rate` (person-days per week); do not add new ones for plain project management: use the overhead rate.
   - **Links to features:** every active feature gets either its own `estimate` or at least one package: the package's `ref` names the feature IDs, and the feature's `wbs` in `features.yaml` lists the package codes. The baseline needs packages.
   - **Gates** (scheduling on): at the WBS code whose end date is the gate (`at: "3"` for the end of phase 3), `hard: true` for gates with a date in `project.yaml` `hard_dates`, plus `criteria`, `evidence`, `approver`.
   - **Risks** (`R<n>`, `p` and `i` from 1 to 5, mitigation, trigger, status); keep the late-sign-off risk and the workshop package that `kickoff:signoff` added. Wide spreads and low-confidence items become risks or validation items. **Assumptions** from research stay; add new ones with the same fields.
   - **Sprints** (`name`, `start`, `days`) and **`cut_order`**: feature IDs in the order the lead would give them up, first candidates first.
   - Text is in the workbook language; when `languages.repo` differs, add `i18n: {<repo>: {name: "..."}}`.
5. **Item blocks:** every package the team will track as a work item gets an `item` block in the repository language (`kickoff export` hands it over; a `ticket` block from before 0.6 is no longer read: `kickoff validate` names it, and you rename it to `item`):

   ```yaml
   item:
     title: Meeting list and filters
     type: story            # story | task | bug | spike
     epic: E3               # an epic of features.yaml
     areas: [area:web]
     desc: List the meetings a role may see, with in-page filters by date and status.
     ac: ["Filters stay on the page and keep their values", "Empty state when nothing matches"]
     sprint: Build batch 1  # a sprint name of plan.yaml
   ```

6. **Validate:** `kickoff validate`. Fix every error (a range where `min <= effort <= max` fails, a dependency cycle: fixed in `deps` or `order_after`, never worked around). Explain every warning to the lead (missing translations, a feature with neither an estimate nor a package).
7. **Estimate:** `kickoff estimate` again, read it, and tell the lead the range by release and by role, the overhead, and the Basis line, in plain words. `kickoff docs` writes it to `<docs_root>/06-planning/estimate.md`. Optionally `kickoff estimate --json FILE` for a machine-readable copy.
8. **Scheduling.** Read `scheduling` in `project.yaml` (absent means on). If it is `"off"`, skip steps 10, 11 and the slip procedure: there are no dates, gates or workbook, and `kickoff schedule` and `kickoff workbook` say "scheduling is off". Offer the schedule once, when the lead asks for dates or the plan is a baseline the team will run against a calendar.
9. **Turn scheduling on** (only when the lead wants dates): ask, one question at a time with the Interview method and in plain words, who is on the team and what each person does, how much of their working week goes to this project (the role's `focus`), which days off and holidays apply this year and next (`calendar`: weekend, holidays), and which dates cannot move and why (`hard_dates`). Show the answers as one table; after an explicit yes edit `.kickoff/project.yaml` with the Edit tool: the roles with their `focus`, the `calendar`, the `hard_dates`, and `scheduling: "on"`. Run `kickoff validate` and fix every error. Never type a date into `plan.yaml`.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

10. **Schedule** (scheduling on only): `kickoff schedule` prints each gate's date (and its hard date). Report them. Exit 3 means a hard date slips: follow the slip decision procedure in `references/estimation.md` with the lead, in plain words (what would be given up or moved, what each option does to the date). Before you present the `cut_order` options, run `ecc:council` on them and give the lead its verdict with the dissent (`../using-kickoff/references/ecc.md`). Never edit dates by hand to hide a slip.
    **Baseline only:** once the estimate (and the schedule, when on) passes, run an `ecc:planner` agent as a read-only reviewer. Give it the paths of `plan.yaml`, the signed-off `features.yaml`, `system-architecture.md` and `data-model.md`, and ask for missing work only, not a new plan. Each gap becomes a package (shown with the Bounded approval method) or a ruling.
11. **Estimate workbook** (scheduling on only): `kickoff workbook --verify` writes `<docs_root>/06-planning/<project>-estimate.xlsx` (WBS, effort and schedule as formulas; the baseline, no progress) and recalculates it with LibreOffice in Docker. Expected: `verify: OK, zero error cells and every row matches the baseline schedule`. Without Docker it prints that the recalculation was skipped: report it as skipped. Sending the workbook to the customer is publishing: ask the lead first.
12. **Plan prose:** read `<docs_root>/06-planning/plan.md` if it exists. `kickoff docs` (run by earlier phases) already creates this file as a bare skeleton, so it counts as not written yet when it is missing **or** holds nothing but that skeleton: the title (`# Plan`, or its repository-language form from `docs.py`), then `## Gates`, `## Phases` and `## Sprints`, each followed only by a `<!-- kickoff:begin <name> -->` … `<!-- kickoff:end <name> -->` block (empty or already filled with a generated table), and no other text outside the blocks. In both cases write the whole file from `templates/plan.md` (it has the same three blocks, so no generated table is lost). If the file has any other prose, keep that prose and the markers and edit only what changed. Sections: Goal and milestones, Delivery strategy, Team and focus, Feature sign-off, Sprints, Scope-cut order, Assumptions, Risks summary. Write prose only outside the `<!-- kickoff:begin <name> -->` … `<!-- kickoff:end <name> -->` blocks (`gates`, `phases`, `sprints`).
13. **Documents:** `kickoff docs` fills those blocks (also in a plan.md just written from the template, where they are still empty) and regenerates `feature-map.md`, `wbs.md`, `risk-register.md` and `estimate.md`.
14. **Set the clarity area** this phase touched: `kickoff clarity set estimate` with `--status`, `--confidence`, a short `--note` and a `--ref` for the `A<n>` or `V<n>` the numbers rest on. A feature-level draft is `assumed` with `low` or `medium` confidence; a baseline built from packages with ranges and bases can be `decided` (the lead agreed it) and `high` only when the spread is small and the bases are comparisons or spike results.
15. **Verify** (section below), then `kickoff phase done plan` and commit `docs: plan and estimate` (draft) or `docs: baseline plan` (baseline).
16. **Baseline only, gate C6:** ask the lead to agree, in plain words (methods.md, Plain words), that this is the plan the team commits to. Tell them what is agreed (the work, the total effort by role as a range, the order features would be given up in), what becomes expensive to change afterwards, and what each answer means. With scheduling on also show the dates and the verdict on each fixed date. Only after an explicit yes, record it as C6 with `kickoff gate approve C6 --by "Project lead"`. `--evidence "<commit or record link>"` is optional for this gate: without it the gate records `decision in session <date>`. The `state.yaml` change goes in the next commit; no separate approval commit. A draft plan gets no C6 (it needs C5).
17. **Hand over** (baseline only, after C6): run `kickoff export`. It writes the WBS with the item fields, and with scheduling on the baseline dates, as CSV, JSON and Markdown under `<docs_root>/06-planning/export/`, with `effort_min`, `effort_max` and `confidence` as the last columns. Commit them with `docs: WBS export`. Importing them into a tracker is the team's step; writing to a shared tracker is an action to confirm with the lead first.

## Outputs

- `.kickoff/plan.yaml` and the `wbs` links in `.kickoff/features.yaml`
- `<docs_root>/06-planning/estimate.md` (generated)
- Scheduling on: `<docs_root>/06-planning/<project>-estimate.xlsx`
- `<docs_root>/06-planning/plan.md` (prose and generated tables), `wbs.md`, `risk-register.md`; `<docs_root>/02-requirements/feature-map.md`
- `.kickoff/clarity.yaml`: `estimate` set
- `.kickoff/state.yaml`: `plan: done`, and C6 for an approved baseline

## Verify

1. `kickoff validate` reports `0 errors`; every warning is explained.
2. `kickoff estimate` was read: the range by release and role, the overhead and the Basis line are reported to the lead, and every low-confidence item and wide spread is named, with a risk or a validation item for the big ones.
3. Scheduling on only: `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as a `D<n>`.
4. Scheduling on only: `kickoff workbook --verify` prints `verify: OK, zero error cells and every row matches the baseline schedule`, or the Docker-skipped line, reported as skipped.
5. `kickoff docs --check` prints `documents up to date`.
6. `kickoff check-docs <docs_root>/06-planning .kickoff/plan.yaml` prints `check-docs passed`: no placeholder, and no forbidden phrase in the plan documents or the `item` blocks. Owners are roles.
7. Draft: every active feature has an `estimate` or a `wbs` entry. Baseline: every active feature has a `wbs` entry. Every package with an `item` names an epic and a sprint that exist (`kickoff validate` checks both).

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- A single number with no range looks certain and is not: state min, likely and max with a confidence and what the number rests on, and a big spread is a risk, not silent padding.
- Plain project management is a rate on the work total, not a scheduled package: use the overhead rate, and keep `effort_rate` only for old plans.
- A schedule built before the team and the calendar are known is guesswork: estimate first; turn scheduling on after the lead confirms team, calendar and hard dates.
- A dependency chain once created a cycle and the schedule ran to 2039: `kickoff validate` runs before `kickoff schedule`, and a reported cycle is fixed at its source (lessons row 1).
- A late sign-off moved the MVP gate: keep the workshop package and its risk, so `kickoff schedule` shows the effect of a late date (lessons row 13).
- Estimates may assume tooling help; no document, work item or report states it.
- Every plan has a scope-cut order, and with scheduling on a slipped hard date always ends in an explicit decision.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

Draft: continue the design phases (`kickoff:design-concept`, `kickoff:ux-design`, `kickoff:prototype`, `kickoff:signoff`); refine the estimate when the design settles. Baseline with C6: the kickoff is complete. Run `kickoff export` and give the lead `wbs.csv`, `wbs.json` and `wbs-items.md` (`<docs_root>/06-planning/export/`) to import into the team's tracker or to hand to an ECC session; kickoff itself creates no issues. `kickoff:feedback` handles later customer feedback.
