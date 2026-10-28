---
name: feature-map
description: Use when listing or changing a project's epics and features, their releases, priorities and platforms, or its non-functional requirements
---

# Feature map

Turns the approved vision into the full feature set of the product, across every release, with permanent IDs, priorities and platforms, plus the non-functional requirements. The project lead approves it as the draft scope (gate C2). The prototype, the customer sign-off, the plan and the WBS export all build on these IDs.

## When to use

- After C1, to write the first `features.yaml` and `nfr.md`.
- Again before C3 when the lead adds, removes, renames or moves features between releases, or changes an NFR.

After the customer has signed off (C3), scope changes go through `kickoff:feedback`, which runs the whole chain and reopens C3. Do not edit `features.yaml` directly then.

## Preconditions

- `kickoff can feature-map` exits 0 (discovery done, C1 approved).
- `<docs_root>/01-discovery/vision-scope.md` exists.
- `.kickoff/project.yaml` lists every release in delivery order (the first is the MVP).

## Inputs

- `<docs_root>/01-discovery/vision-scope.md`: users and roles, scope by release, out of scope, constraints, decisions.
- `<docs_root>/01-discovery/open-questions.md`: open questions and the Decision log (`D<n>`).
- `<docs_root>/03-research/validation-plan.md` and `assumptions.md` when `research` has run.
- `.kickoff/project.yaml`: `releases`, `languages`, `security`; the existing `.kickoff/features.yaml` when re-running.
- `templates/nfr.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. File and ID rules: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can feature-map`. Exit 1: stop, read its output yourself and tell the lead in plain words what is not finished yet and the path to it (methods.md, Plain words), not the raw `blocked:` lines. Then `kickoff phase start feature-map`.
2. **Derive the epics** from `vision-scope.md` (Scope by release, Users and roles, Goals). An epic is a user-facing capability area: `E1`, `E2`, … with a name, a one-line goal and the release in which it first delivers. Show the epic list as one table and confirm it with the lead. Re-running: keep every existing ID.
3. **Walk the lead through the features, one epic at a time**, using the Interview method. For each epic, propose a table of features with release, priority and platforms, then ask one question at a time about the rows the lead questions. Put every question and every table to the lead in plain words (`../using-kickoff/references/methods.md`, Plain words): feature names and what each does, not IDs or file names.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

   - **Release:** list the full product across all releases in `project.yaml`, not only the MVP. A feature the customer mentioned "for later" still gets a row in its later release.
   - **Priority:** `P0` the release cannot ship without it; `P1` expected in its release; `P2` can move to a later release (the first scope-cut candidates).
   - **Platforms:** free text, short codes: `W` web, `D` Windows desktop, `M` Android (combine, e.g. `W, M`).
   - **Size:** give each feature a first estimate while you walk it, in person-days: `estimate: {min, likely, max, confidence, basis}`. A rough range is the point, and `low` confidence is honest. `basis` says what the number rests on (a comparison with similar work, an assumption `A<n>`, a spike result `V<n>`, or "gut feel, no comparison"). Propose the range for each feature, then tell the lead in plain words ("about 3 to 8 days of work, most likely 5, not very sure because the data source is unknown") and take their corrections. Sizes come from you and the lead's knowledge; do not ask the customer for them.
   - An answer the lead does not know becomes a question in `open-questions.md` with an owner, the work it blocks, a priority (`now`, `soon` or `later`), and a needed-by date when scheduling is on.

4. **Write `.kickoff/features.yaml`** with the file tools, in the repository language:

   ```yaml
   schema_version: 1
   epics:
     - id: E1
       name: Loans
       goal: Lend books at the desk and let members follow their loans.
       release: MVP
       features:
         - id: F1.1
           name: Lend and return
           release: MVP
           prio: P0
           platforms: W
           estimate: { min: 6, likely: 10, max: 18, confidence: low, basis: "similar desk-loan module, no spike yet" }
         - { id: F1.2, name: Phone loan list, release: MVP, prio: P1, platforms: M, estimate: { min: 3, likely: 4, max: 6, confidence: medium, basis: "read-only list on the F1.1 data" } }
         - { id: F1.3, name: Monthly report, release: R2, prio: P2, platforms: W }
   ```

   - `estimate` is optional and in person-days; `min` and `max` default to `likely`. A feature with packages in `wbs` is estimated from them once `kickoff:plan` writes them; until then its own `estimate` counts. A feature with neither raises a warning.

   - IDs are permanent: `E<n>` and `F<epic>.<n>`. Never reuse or renumber them. A rename keeps the ID.
   - Removal is `status: removed` with `removed_by: D<n>`, the decision in the Decision log of `open-questions.md` (add the entry the same day). The row stays.
   - `release` must be a release id from `project.yaml`. `screens` is filled by `kickoff:ux-design` and `wbs` by `kickoff:plan`. Leave both out for now.

5. **Write `<docs_root>/02-requirements/nfr.md`** from `templates/nfr.md`. Use one row per requirement: ID `NFR-<area><n>` (areas such as `PERF`, `AVAIL`, `SEC`, `PRIV`, `ACC`, `COMP`, `OPS`, `DATA`, `LOC`), Requirement, Measure, Target, Release, Verified by. Sources are the constraints in `vision-scope.md`, the `security` rules in `project.yaml` and the research results. Every target is measurable. A target nobody can state yet becomes a question with a priority (and a needed-by date when scheduling is on), and the row says `TBD (Q<n>)`.
6. **Generate and validate:** `kickoff docs` writes `<docs_root>/02-requirements/feature-map.md`; it also refreshes `wbs.md`, `risk-register.md` and the tables in `plan.md` from the current plan. Then run `kickoff validate`. Fix every error (unknown release, duplicate ID). The warning "active feature without a WBS package or an estimate" appears only for a feature that has neither a `wbs` package nor an `estimate`: size it, or tell the lead it is still unsized. Then run `kickoff estimate`: it prints the early min, likely and max by release and its Basis line (point estimates, low-confidence items, unsized features). Read it, and tell the lead the range and how wide it is in plain words.
7. **Set the clarity areas** this phase touched (a project from 0.8 has no register yet: run `kickoff clarity init` first): `kickoff clarity set scope` and `kickoff clarity set estimate`, each with `--status`, `--confidence`, a short `--note` and a `--ref` for the open `Q<n>` or `D<n>` behind it. `scope` is `decided` once the lead has agreed the list, `assumed` while features rest on guesses; `estimate` is `assumed` with `low` or `medium` confidence at this stage, since only feature-level sizes exist.
8. **Verify** (section below), then `kickoff phase done feature-map` and commit `docs: feature map and non-functional requirements`.
9. **Ask the project lead to agree, in plain words** (methods.md, Plain words), that the list of features is the draft scope. Tell them what is agreed (what the product will do, release by release, and what comes first), what becomes expensive to change once the design is built on it, and what each answer means. Show the feature count by release and priority, the first-release line, the removed features with their reasons, the quality targets still undefined, and the early estimate range, without IDs, gate names or file names. Only after an explicit yes, record it as C2 with `kickoff gate approve C2 --by "Project lead"`. `--evidence "<commit or record link>"` is optional for this gate: without it the gate records `decision in session <date>`. The `state.yaml` change goes in the next commit; no separate approval commit. If the lead asks for changes, make them, verify again and repeat steps 8 and 9.

## Outputs

- `.kickoff/features.yaml`: every epic and feature of the full product, each with a first `estimate`.
- `.kickoff/clarity.yaml`: `scope` and `estimate` set.
- `<docs_root>/02-requirements/feature-map.md` (generated by `kickoff docs`, never edited by hand).
- `<docs_root>/02-requirements/nfr.md`.
- `<docs_root>/01-discovery/open-questions.md` updated with new questions and decisions.
- `.kickoff/state.yaml`: `feature-map: done`, and C2 once the lead approves.

## Verify

1. `kickoff validate` reports `0 errors`; explain every warning.
2. `kickoff docs --check` prints `documents up to date` (exit 0).
3. `kickoff check-docs <docs_root>/02-requirements/nfr.md .kickoff/features.yaml` prints `check-docs passed` (no placeholder, no forbidden phrase). Owners and verifiers are roles.
4. Every release in `project.yaml` has at least one feature, or `vision-scope.md` says why not. Every active feature has a release, a priority and platforms.
5. Every removed feature has `removed_by` naming a `D<n>` that exists in the Decision log.
6. Every active feature has an `estimate` or will get packages from `kickoff:plan` (say which). `kickoff estimate` shows the early range and its spread; point estimates and low-confidence items are named, not hidden.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- List the full product now. Features that surface after the architecture is designed cause the refactors this workflow exists to prevent.
- A feature list without releases and priorities cannot be estimated or cut, and one without sizes gives no estimate until the WBS exists. Size each feature now: a range with an honest confidence beats no number, and `kickoff validate` warns only when a feature has neither an estimate nor a WBS package.
- A single number looks more certain than it is: write `min`, `likely` and `max`, and say what the range rests on.
- IDs never change. Tickets, screens and decisions refer to them, and a renumbered feature breaks every link.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

After C2: `kickoff:ux-design`. `kickoff:research` can still run alongside, and `kickoff:plan` may now make a draft estimate: a draft estimate already exists right after C2 from the feature sizes (`kickoff estimate`), before any WBS. `kickoff status` names the next step.
