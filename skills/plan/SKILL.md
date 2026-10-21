---
name: plan
description: Use when creating or updating the work breakdown, estimates, role-based schedule, milestones, risks or the estimate workbook of a project
---

# Plan

Builds `.kickoff/plan.yaml` with the project lead (phases, groups and work packages with role-based estimates, dependencies, gates, risks, assumptions, sprints and the scope-cut order), then lets the CLI compute the schedule, the estimate workbook and the plan documents. Dates are never typed by hand: they come out of `kickoff schedule`.

## When to use

- **Draft** after C2, so an early estimate and the MVP date exist before the prototype and the sign-off.
- **Baseline** after C5, for the plan the team commits to (gate C6).
- Again when scope, estimates, team focus, the calendar or hard dates change, or when the phase is stale after a feedback session.

## Preconditions

- Draft: `kickoff can plan` exits 0 (feature-map done, C2 approved).
- Baseline: `kickoff can plan --baseline` exits 0 (solution done, C5 approved).
- `.kickoff/project.yaml` has the roles with their focus, the calendar, the releases and the hard dates.

## Inputs

- `.kickoff/features.yaml` and `<docs_root>/02-requirements/nfr.md`; `<docs_root>/01-discovery/vision-scope.md` (timeline, constraints).
- `.kickoff/project.yaml`: `roles` (focus), `calendar`, `releases`, `hard_dates`, `languages`.
- The existing `.kickoff/plan.yaml`: the sign-off workshop package and its risk, the `assumptions` from research.
- Baseline: `<docs_root>/04-architecture/system-architecture.md`, `data-model.md` and the ADRs.
- `<docs_root>/01-discovery/open-questions.md` (questions that block work, decisions).
- `references/estimation.md` (estimating model, formulas, slip decisions) and `templates/plan.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can plan` (draft) or `kickoff can plan --baseline` (baseline). Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start plan`, and tell the lead which mode this run is.
2. **Build `plan.yaml` with the lead, one phase at a time.** For each phase, propose its groups and packages as one table with the Bounded approval method (code, name, role, effort, deps, release, schedule mode, ref), take the lead's edits, then write that phase with the Edit tool before the next one.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   - **Structure:** `phases` (level 1, `code: "1"`, with `objective`, `in_scope`, `out_scope`, `deliverables`, `exit`, `risks` for the plan prose), `groups` (level 2, `"1.2"`), `packages` (level 3 leaves, `"1.2.7"`, in plan order). Codes are permanent strings; quote them.
   - **Effort** in person-days at 100% focus, per package, for the one role that does it (`role` is a role id of `project.yaml`). See `references/estimation.md`.
   - **Dependencies** in `deps` (a package that must end first). `order_after` only where a role's queue order must differ from the WBS order.
   - **Schedule modes:** `seq` (default) for normal work; `{fixed: [start, end]}` for booked dates (workshops, trainings); `{span: [from, to]}` for work that runs from the start of one package to the end of another; `{period: {after: code, months: n}}` for warranty or support periods; `{tail: {of: code, days: n}}` for the last working days of a package (acceptance support). Level-of-effort management packages take `effort_rate` (person-days per week) with a span, period or tail mode.
   - **Links to features:** every active feature gets at least one package: the package's `ref` names the feature IDs, and the feature's `wbs` in `features.yaml` lists the package codes.
   - **Gates** at the WBS code whose end date is the gate (`at: "3"` for the end of phase 3), `hard: true` for gates with a date in `project.yaml` `hard_dates`, plus `criteria`, `evidence`, `approver`.
   - **Risks** (`R<n>`, `p` and `i` from 1 to 5, mitigation, trigger, status); keep the late-sign-off risk and the workshop package that `kickoff:signoff` added. **Assumptions** from research stay; add new ones with the same fields.
   - **Sprints** (`name`, `start`, `days`) and **`cut_order`**: feature IDs in the order the lead would give them up, first candidates first.
   - Text is in the workbook language; when `languages.repo` differs, add `i18n: {<repo>: {name: "..."}}`.
3. **Item blocks:** every package the team will track as a work item gets an `item` block in the repository language (`kickoff export` hands it over; a `ticket` block from before 0.6 is no longer read: `kickoff validate` names it, and you rename it to `item`):

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

4. **Validate:** `kickoff validate`. Fix every error; a dependency cycle is fixed in `deps` or `order_after`, never worked around. Explain every warning to the lead (missing translations, features without a package).
5. **Schedule:** `kickoff schedule` prints each gate's date (and its hard date). Report them. Exit 3 means a hard date slips: follow the slip decision procedure in `references/estimation.md` with the lead. Before you present the `cut_order` options, run `ecc:council` on them and give the lead its verdict with the dissent (`../using-kickoff/references/ecc.md`). Never edit dates by hand to hide a slip.
   **Baseline only:** once the schedule passes, run an `ecc:planner` agent as a read-only reviewer. Give it the paths of `plan.yaml`, the signed-off `features.yaml`, `system-architecture.md` and `data-model.md`, and ask for missing work only, not a new plan. Each gap becomes a package (shown with the Bounded approval method) or a ruling.
6. **Estimate workbook:** `kickoff workbook --verify` writes `<docs_root>/06-planning/<project>-estimate.xlsx` (WBS, effort and schedule as formulas; the baseline, no progress) and recalculates it with LibreOffice in Docker. Expected: `verify: OK, zero error cells and every row matches the baseline schedule`. Without Docker it prints that the recalculation was skipped: report it as skipped. Sending the workbook to the customer is publishing: ask the lead first.
7. **Plan prose:** read `<docs_root>/06-planning/plan.md` if it exists. `kickoff docs` (run by earlier phases) already creates this file as a bare skeleton, so it counts as not written yet when it is missing **or** holds nothing but that skeleton: the title (`# Plan`, or its repository-language form from `docs.py`), then `## Gates`, `## Phases` and `## Sprints`, each followed only by a `<!-- kickoff:begin <name> -->` … `<!-- kickoff:end <name> -->` block (empty or already filled with a generated table), and no other text outside the blocks. In both cases write the whole file from `templates/plan.md` (it has the same three blocks, so no generated table is lost). If the file has any other prose, keep that prose and the markers and edit only what changed. Sections: Goal and milestones, Delivery strategy, Team and focus, Feature sign-off, Sprints, Scope-cut order, Assumptions, Risks summary. Write prose only outside the `<!-- kickoff:begin <name> -->` … `<!-- kickoff:end <name> -->` blocks (`gates`, `phases`, `sprints`).
8. **Documents:** `kickoff docs` fills those blocks (also in a plan.md just written from the template, where they are still empty) and regenerates `feature-map.md`, `wbs.md` and `risk-register.md`.
9. **Verify** (section below), then `kickoff phase done plan` and commit `docs: plan, schedule and estimate workbook` (draft) or `docs: baseline plan` (baseline).
10. **Baseline only, gate C6:** show the lead the gate dates, total effort by role, the hard-date verdicts and the cut order. Only after an explicit yes, run `kickoff gate approve C6 --by "Project lead" --evidence "<commit or record link>"` and commit `chore: approve C6`. A draft plan gets no C6 (it needs C5).
11. **Hand over** (baseline only, after C6): run `kickoff export`. It writes the WBS with the baseline dates and the `item` fields as CSV, JSON and Markdown under `<docs_root>/06-planning/export/`. Commit them with `docs: WBS export`. Importing them into a tracker is the team's step; writing to a shared tracker is an action to confirm with the lead first.

## Outputs

- `.kickoff/plan.yaml` and the `wbs` links in `.kickoff/features.yaml`
- `<docs_root>/06-planning/<project>-estimate.xlsx`
- `<docs_root>/06-planning/plan.md` (prose and generated tables), `wbs.md`, `risk-register.md`; `<docs_root>/02-requirements/feature-map.md`
- `.kickoff/state.yaml`: `plan: done`, and C6 for an approved baseline

## Verify

1. `kickoff validate` reports `0 errors`; every warning is explained.
2. `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as a `D<n>`.
3. `kickoff workbook --verify` prints `verify: OK, zero error cells and every row matches the baseline schedule`, or the Docker-skipped line, reported as skipped.
4. `kickoff docs --check` prints `documents up to date`.
5. `kickoff check-docs <docs_root>/06-planning .kickoff/plan.yaml` prints `check-docs passed`: no placeholder, and no forbidden phrase in the plan documents or the `item` blocks. Owners are roles.
6. Every active feature has a `wbs` entry, and every package with an `item` names an epic and a sprint that exist (`kickoff validate` checks both).

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- A dependency chain once created a cycle and the schedule ran to 2039: `kickoff validate` runs before `kickoff schedule`, and a reported cycle is fixed at its source (lessons row 1).
- A late sign-off moved the MVP gate: keep the workshop package and its risk, so `kickoff schedule` shows the effect of a late date (lessons row 13).
- Estimates may assume tooling help; no document, work item or report states it.
- Every plan has a scope-cut order, and a slipped hard date always ends in an explicit decision.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

Draft: continue the design phases (`kickoff:ux-design`, `kickoff:fe-foundation`, `kickoff:design-direction`, `kickoff:prototype`, `kickoff:signoff`). Baseline with C6: the kickoff is complete. Run `kickoff export` and give the lead `wbs.csv`, `wbs.json` and `wbs-items.md` (`<docs_root>/06-planning/export/`) to import into the team's tracker or to hand to an ECC session; kickoff itself creates no issues. `kickoff:feedback` handles later customer feedback.
