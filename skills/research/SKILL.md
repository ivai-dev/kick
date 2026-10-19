---
name: research
description: Use when a project needs technical validation, technology or vendor choices, architecture decision records, or an assumptions and constraints register before scope is locked
---

# Research

Turns the technical unknowns of discovery into a validation plan, *Proposed* ADRs and a register of assumptions and constraints, so the solution phase later decides on evidence. It runs alongside `feature-map` and has no gate of its own.

## When to use

- After C1, when the vision leaves technical unknowns: feasibility, data, integration, hosting, vendors, performance.
- Again when new questions or feedback raise a technical unknown before C3 and C4.

Not for choosing the database, architecture or design patterns: that is `kickoff:solution`, after C3 and C4.

## Preconditions

- `kickoff can research` exits 0 (discovery done, C1 approved).
- `<docs_root>/01-discovery/vision-scope.md` and `open-questions.md` exist.

## Inputs

- `<docs_root>/01-discovery/open-questions.md` and `vision-scope.md` (constraints, decisions, timeline).
- `<docs_root>/02-requirements/nfr.md` and `.kickoff/features.yaml` when `feature-map` has produced them.
- `.kickoff/plan.yaml` (existing `assumptions`) and `.kickoff/project.yaml` (roles, languages).
- Templates in this skill's folder: `templates/validation-plan.md`, `templates/adr.md`, `templates/assumptions.md`.

## Steps

1. Run `kickoff can research`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start research`.
2. **List the technical unknowns** from `open-questions.md` and `vision-scope.md`, each with its question ID (`Q<n>`) or the section it comes from. Ignore business questions; they stay with the lead.
3. **Classify each unknown** with the Option decision method. The options are: a bounded investigation inside a real work package, a throwaway spike, or a decision that can be taken now on known facts. Give each option's cost, risk and what it blocks, recommend one, and let the lead choose.

> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.

4. **Prefer bounded investigations** inside real work packages over throwaway spikes: the work that integrates a component also measures it against a pass criterion, so nothing is built twice. Use a spike only when no real package can carry the question, and time-box it. Write every investigation into `<docs_root>/03-research/validation-plan.md` from the template: ID (`V1`, `V2`, …), Question, Method, Data needed, Pass criterion, Owner role, Due, Feeds decision. Data needed is synthetic unless the customer provides cleared samples.
5. **Write ADRs as *Proposed*** in `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md` from `templates/adr.md` (sections: Status, Context, Decision, Consequences, Alternatives considered, Validation), one per decision the classification produced. The Validation section names the `V<n>` items that will confirm or overturn it. Status stays *Proposed*.
6. **Register assumptions and constraints** in `.kickoff/plan.yaml` under `assumptions`, using the Edit tool. Each entry: `id` (`A<n>`, permanent), `kind` (Assumption, Dependency or Constraint), `text`, `scope` (phase code or "All"), `source` (Q, D or document), `status` (Pending, Confirmed or Rejected). `plan.yaml` is written in the workbook language; when `languages.repo` differs, add `i18n: {<repo>: {text: "..."}}`. Example:

   ```yaml
   assumptions:
     - id: A3
       kind: Dependency
       text: Customer provides three cleared sample recordings by 2026-10-05
       scope: "1"
       source: Q4
       status: Pending
   ```

7. **Mirror the register** in `<docs_root>/03-research/assumptions.md` from `templates/assumptions.md`, same IDs and wording.
8. Update `open-questions.md`: each technical question now names its `V<n>` or `ADR-<nnn>`; a question answered by a decision gets a `D<n>` entry in the Decision log.
9. **Validate:** `kickoff validate`; fix every error.
10. **Verify** (section below), then `kickoff phase done research` and commit `docs: research — validation plan, proposed ADRs and assumptions`.

## Outputs

- `<docs_root>/03-research/validation-plan.md`
- `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md` (status *Proposed*)
- `.kickoff/plan.yaml` `assumptions` and its mirror `<docs_root>/03-research/assumptions.md`
- `<docs_root>/01-discovery/open-questions.md` updated with links to `V<n>`, `ADR-<nnn>` and `D<n>`

## Verify

1. `kickoff validate` reports `0 errors` (duplicate assumption IDs are errors); explain every warning.
2. Search the new and changed files for `{{`: no placeholder is left.
3. Every ADR written in this phase has the status *Proposed*.
4. Every technical unknown from step 2 has a `V<n>` row, an ADR, or a reason in `open-questions.md` why it stays open.
5. The IDs in `assumptions.md` equal the IDs under `assumptions` in `plan.yaml`.
6. Search the written files with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match. Owners are roles.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- ADRs stay *Proposed* until `solution`: the customer has not yet signed off the full feature set, and a feature added at sign-off can change the decision.
- Do not choose the database or the architecture here. Write the forces, the options and the evidence needed; `kickoff:solution` decides after C3 and C4.
- A throwaway spike costs the work twice; a bounded investigation inside a real package costs it once and leaves working code.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:feature-map` if it has not run yet (they run side by side after C1); otherwise `kickoff:ux-design` after C2. `kickoff:solution` later turns the *Proposed* ADRs into *Accepted* or *Superseded* using the validation results. `kickoff status` names the next step.
