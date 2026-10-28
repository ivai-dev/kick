---
name: research
description: Use when a project needs technical validation, technology or vendor choices, architecture decision records, or an assumptions and constraints register before scope is locked
---

# Research

Turns the technical unknowns of discovery into a validation plan, *Proposed* ADRs, a register of assumptions and constraints and a labelled Draft architecture sketch, so the estimate has a technical picture and the solution phase later decides on evidence. It runs alongside `feature-map` and has no gate of its own.

## When to use

- After C1, when the vision leaves technical unknowns: feasibility, data, integration, hosting, vendors, performance.
- Again when new questions or feedback raise a technical unknown before C3 and C4.
- To sketch a draft architecture early, so feasibility against the NFRs is tested and the estimate has a technical picture.

Not for committing to the database, architecture or design patterns: that is `kickoff:solution`, after C3 and C4. A sketch labelled `Status: Draft` is allowed here; it binds nothing.

## Preconditions

- `kickoff can research` exits 0 (discovery done, C1 approved).
- `<docs_root>/01-discovery/vision-scope.md` and `open-questions.md` exist.

## Inputs

- `<docs_root>/01-discovery/open-questions.md` and `vision-scope.md` (constraints, decisions, timeline).
- `<docs_root>/02-requirements/nfr.md` and `.kickoff/features.yaml` when `feature-map` has produced them.
- `.kickoff/plan.yaml` (existing `assumptions`) and `.kickoff/project.yaml` (roles, languages).
- Templates in this skill's folder: `templates/validation-plan.md`, `templates/adr.md`, `templates/assumptions.md`; for the sketch, `../solution/templates/system-architecture.md` and `data-model.md`.

## Steps

1. Run `kickoff can research`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start research`.
2. **List the technical unknowns** from `open-questions.md` and `vision-scope.md`, each with its question ID (`Q<n>`) or the section it comes from. Ignore business questions; they stay with the lead.
3. **Research each unknown with ECC first** (`../using-kickoff/references/ecc.md`):
   - Run `ecc:search-first` for existing tools, libraries, services and vendors.
   - Also run `ecc:deep-research` when its firecrawl or exa MCP server is connected; otherwise use web search.
   - Keep the sources: every option you later write cites them.
   - When two options stay close on cost and risk, run `ecc:council` and record its verdict and dissent under "Alternatives considered" in the ADR.
   - Never use ECC's ADR skill: it writes `docs/adr/`, outside the kickoff record.

   **Classify each unknown** with the Option decision method. The options are: a bounded investigation inside a real work package, a throwaway spike, or a decision that can be taken now on known facts. Give each option's cost, risk and what it blocks, recommend one, and let the lead choose. Put each choice to the lead in plain words (`../using-kickoff/references/methods.md`, Plain words): what is being decided, what each option means for cost and risk, what becomes expensive to change; no ADR or question IDs, phase names or CLI terms.

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
9. **Architecture sketch (draft).** Write `<docs_root>/04-architecture/system-architecture.md` and `data-model.md` from `../solution/templates/` as a hypothesis, to test feasibility against the NFRs in `nfr.md` and to feed the estimate:
   - The first lines of each file carry `- **Status:** Draft (hypothesis)`. Before C3 and C4 the pre-write hook lets a file under `04-architecture/` (except `adr/`) through only when `Status: Draft` is in its first 20 lines; without it the write is blocked.
   - List what the sketch assumes as `A<n>` in `plan.yaml` `assumptions` and `assumptions.md` (step 6 and 7 format), and name the `V<n>` that would confirm each one.
   - It decides nothing: every ADR stays *Proposed*, the containers and the data store are marked as options, and no implementation starts from it. `kickoff:solution` later diffs it against the signed-off scope.
   - Present the sketch to the lead in plain words (methods.md, Plain words): "a first guess at how it could be built, to check it is feasible and to size the work; nothing is decided". Where it shows a feature or quality target is hard or costly, say so in everyday terms and note it for the estimate (`kickoff:feature-map` sizes features, `kickoff:plan` refines them). No file names, ADR IDs or `A<n>` IDs in what the lead reads.
10. **Validate:** `kickoff validate`; fix every error. An ADR with status *Accepted* before C3 and C4 is an error.
11. **Set the clarity areas** this phase touched: `kickoff clarity set solution` and `kickoff clarity set architecture`, each with `--status`, `--confidence`, a short `--note` and a `--ref` for the `V<n>`, `A<n>` and `ADR-<nnn>` behind it. Use `assumed` for a hypothesis and `validated` only when a passed `V<n>` confirms it (the ref names that `V<n>`); `decided` is for `kickoff:solution`, after C3 and C4.
12. **Verify** (section below), then `kickoff phase done research` and commit `docs: research — validation plan, proposed ADRs, assumptions and draft architecture`.

## Outputs

- `<docs_root>/03-research/validation-plan.md`
- `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md` (status *Proposed*)
- `<docs_root>/04-architecture/system-architecture.md` and `data-model.md`, labelled `Status: Draft (hypothesis)`
- `.kickoff/clarity.yaml`: `solution` and `architecture` set
- `.kickoff/plan.yaml` `assumptions` and its mirror `<docs_root>/03-research/assumptions.md`
- `<docs_root>/01-discovery/open-questions.md` updated with links to `V<n>`, `ADR-<nnn>` and `D<n>`

## Verify

1. `kickoff validate` reports `0 errors` (duplicate assumption IDs are errors); explain every warning.
2. `kickoff check-docs <the new and changed files>` prints `check-docs passed` (no placeholder, no forbidden phrase). Owners are roles.
3. Every ADR written in this phase has the status *Proposed*.
4. Every technical unknown from step 2 has a `V<n>` row, an ADR, or a reason in `open-questions.md` why it stays open.
5. The IDs in `assumptions.md` equal the IDs under `assumptions` in `plan.yaml`.
6. Every technology or vendor option in the validation plan and the ADRs cites at least one source.
7. Each architecture sketch file carries `- **Status:** Draft (hypothesis)` in its first lines, and every assumption it rests on is an `A<n>`.
8. Every ADR is still *Proposed*: the sketch decided nothing.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- ADRs stay *Proposed* until `solution`: the customer has not yet signed off the full feature set, and a feature added at sign-off can change the decision.
- Commit late, explore early: a Draft sketch is allowed here and tests feasibility before the estimate, but do not commit to the database or the architecture. Write the forces, the options and the evidence needed; `kickoff:solution` decides after C3 and C4.
- A sketch without its Draft label gets mistaken for a decision. The label, the `A<n>` list and the *Proposed* ADRs keep it a hypothesis.
- A throwaway spike costs the work twice; a bounded investigation inside a real package costs it once and leaves working code.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:feature-map` if it has not run yet (they run side by side after C1); otherwise `kickoff:ux-design` after C2. `kickoff:solution` later starts from the Draft sketch and turns the *Proposed* ADRs into *Accepted* or *Superseded* using the validation results. `kickoff status` names the next step.
