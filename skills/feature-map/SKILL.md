---
name: feature-map
description: Use when listing or changing a project's epics and features, their releases, priorities and platforms, or its non-functional requirements
---

# Feature map

Turns the approved vision into the full feature set of the product, across every release, with permanent IDs, priorities and platforms, plus the non-functional requirements. The project lead approves it as the draft scope (gate C2). The prototype, the customer sign-off, the plan and the tickets all build on these IDs.

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

1. Run `kickoff can feature-map`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start feature-map`.
2. **Derive the epics** from `vision-scope.md` (Scope by release, Users and roles, Goals). An epic is a user-facing capability area: `E1`, `E2`, … with a name, a one-line goal and the release in which it first delivers. Show the epic list as one table and confirm it with the lead. Re-running: keep every existing ID.
3. **Walk the lead through the features, one epic at a time**, using the Interview method. For each epic, propose a table of features with release, priority and platforms, then ask one question at a time about the rows the lead questions.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

   - **Release:** list the full product across all releases in `project.yaml`, not only the MVP. A feature the customer mentioned "for later" still gets a row in its later release.
   - **Priority:** `P0` the release cannot ship without it; `P1` expected in its release; `P2` can move to a later release (the first scope-cut candidates).
   - **Platforms:** free text, short codes: `W` web, `D` Windows desktop, `M` Android (combine, e.g. `W, M`).
   - An answer the lead does not know becomes a question in `open-questions.md` with a needed-by date and the work it blocks.

4. **Write `.kickoff/features.yaml`** with the file tools, in the repository language:

   ```yaml
   schema_version: 1
   epics:
     - id: E1
       name: Loans
       goal: Lend books at the desk and let members follow their loans.
       release: MVP
       features:
         - { id: F1.1, name: Lend and return, release: MVP, prio: P0, platforms: W }
         - { id: F1.2, name: Phone loan list, release: MVP, prio: P1, platforms: M }
         - { id: F1.3, name: Monthly report, release: R2, prio: P2, platforms: W }
   ```

   - IDs are permanent: `E<n>` and `F<epic>.<n>`. Never reuse or renumber them. A rename keeps the ID.
   - Removal is `status: removed` with `removed_by: D<n>`, the decision in the Decision log of `open-questions.md` (add the entry the same day). The row stays.
   - `release` must be a release id from `project.yaml`. `screens` is filled by `kickoff:ux-design` and `wbs` by `kickoff:plan`. Leave both out for now.

5. **Write `<docs_root>/02-requirements/nfr.md`** from `templates/nfr.md`. Use one row per requirement: ID `NFR-<area><n>` (areas such as `PERF`, `AVAIL`, `SEC`, `PRIV`, `ACC`, `COMP`, `OPS`, `DATA`, `LOC`), Requirement, Measure, Target, Release, Verified by. Sources are the constraints in `vision-scope.md`, the `security` rules in `project.yaml` and the research results. Every target is measurable. A target nobody can state yet becomes a question with a needed-by date, and the row says `TBD (Q<n>)`.
6. **Generate and validate:** `kickoff docs` writes `<docs_root>/02-requirements/feature-map.md`; it also refreshes `wbs.md`, `risk-register.md` and the tables in `plan.md` from the current plan. Then run `kickoff validate`. Fix every error (unknown release, duplicate ID). The warning "active feature without a WBS package" is expected until `kickoff:plan` runs. Say so to the lead instead of hiding it.
7. **Verify** (section below), then `kickoff phase done feature-map` and commit `docs: feature map and non-functional requirements`.
8. **Ask the project lead to approve C2** (Draft scope). Show the feature count by release and priority, the MVP line, the removed features with their decisions, and the NFRs marked `TBD`. Only after an explicit yes, run `kickoff gate approve C2 --by "Project lead" --evidence "<commit or record link>"` and commit `chore: approve C2`. If the lead asks for changes, make them, verify again and repeat steps 7 and 8.

## Outputs

- `.kickoff/features.yaml`: every epic and feature of the full product.
- `<docs_root>/02-requirements/feature-map.md` (generated by `kickoff docs`, never edited by hand).
- `<docs_root>/02-requirements/nfr.md`.
- `<docs_root>/01-discovery/open-questions.md` updated with new questions and decisions.
- `.kickoff/state.yaml`: `feature-map: done`, and C2 once the lead approves.

## Verify

1. `kickoff validate` reports `0 errors`; explain every warning.
2. `kickoff docs --check` prints `documents up to date` (exit 0).
3. Search `nfr.md` for `{{`: no placeholder is left.
4. Every release in `project.yaml` has at least one feature, or `vision-scope.md` says why not. Every active feature has a release, a priority and platforms.
5. Every removed feature has `removed_by` naming a `D<n>` that exists in the Decision log.
6. Search `features.yaml` and `nfr.md` with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match. Owners and verifiers are roles.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- List the full product now. Features that surface after the architecture is designed cause the refactors this workflow exists to prevent.
- Every feature gets a WBS package later (`kickoff validate` warns until it has one), so a feature list without releases and priorities cannot be estimated or cut.
- IDs never change. Tickets, screens and decisions refer to them, and a renumbered feature breaks every link.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

After C2: `kickoff:ux-design`. `kickoff:research` can still run alongside, and `kickoff:plan` may now make a draft estimate. `kickoff status` names the next step.
