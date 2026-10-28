---
name: solution
description: Use when designing architecture, data model, technology stack or design patterns after the customer has signed off the full feature set and the MVP is locked
---

# Solution

Designs the architecture, data model, backend technology and design patterns for the feature set the customer signed off. The prototype tooling is already decided (its ADR from `kickoff:prototype`) and decides no backend matter; the prototype's mock data is a first draft of the data the API must carry, not a decision. It decides the *Proposed* ADRs on the evidence of the validation results, records every new decision as an ADR, and adds the work the architecture needs to the plan. It starts from the Draft architecture sketch of `kickoff:research` when one exists. This is the phase the core principle protects: the architecture is committed only after C3 and C4.

## When to use

- After `kickoff:signoff`, once C3 (full feature set signed off) and C4 (MVP locked) are approved.
- Again when it is stale after a feedback session reopened C3 and the new sign-off is approved.

## Preconditions

- `kickoff can solution` must exit 0 (signoff done, C3 and C4 approved). If it exits 1, stop, read its output yourself and tell the lead in plain words what is missing (the customer's sign-off of the full list of features, and the locking of the first release) and the path to it (prototype, workshop, sign-off record), not the raw `blocked:` lines (methods.md, Plain words). Never proceed. Before C3 and C4 only a sketch labelled `Status: Draft` may exist (`kickoff:research` writes it); never an accepted or final architecture, database schema or stack choice: that is this phase's work, done after the sign-off.
- `<docs_root>/02-requirements/nfr.md` exists; the ADRs of the research phase are in `<docs_root>/04-architecture/adr/`.

## Inputs

- The signed-off `.kickoff/features.yaml` (the commit named in the sign-off record) and `<docs_root>/02-requirements/feature-map.md`.
- `ux-spec.md` (roles, screens, platforms) and `<docs_root>/05-design/design-rules.md` (the project's own design rules).
- `<docs_root>/02-requirements/nfr.md`.
- The *Proposed* ADRs in `<docs_root>/04-architecture/adr/`, and the validation results in `<docs_root>/03-research/validation-plan.md` (Results table).
- The Draft `system-architecture.md` and `data-model.md` from `kickoff:research`, when they exist.
- `.kickoff/plan.yaml` (`assumptions`, packages, risks), `.kickoff/project.yaml` (`security`, `languages`, roles), `AGENTS.md`.
- `<docs_root>/01-discovery/open-questions.md` (Decision log) and the sign-off record.
- Templates: `templates/system-architecture.md` and `templates/data-model.md` in this skill's folder; the ADR template `../research/templates/adr.md`.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can solution`. Exit 1: stop as the preconditions say. Exit 0: `kickoff phase start solution`.
   **Start from the Draft sketch** when `system-architecture.md` and `data-model.md` exist with `Status: Draft`: diff them against the signed-off scope (`features.yaml` at the sign-off commit, `nfr.md`, the ux-spec). Keep what still holds, change what the sign-off changed (features added or removed, screens, roles, NFR targets), and tell the lead the changes in plain words (methods.md, Plain words). The Draft's `A<n>` assumptions are checked against the validation results.
2. **List the architectural decisions** the signed-off scope needs: each *Proposed* ADR, plus the decisions no ADR covers yet (hosting and deployment, data store, integration style, identity and access, client platforms, file and media handling, background work, observability). For each, write its forces: the feature and NFR IDs that drive it, the constraints in `vision-scope.md` and `project.yaml` `security`, the assumptions (`A<n>`) and the validation results (`V<n>`) that bear on it.
3. **Decide each one** with the Option decision method, one decision at a time, and let the lead choose. Put each decision to the lead in plain words (`../using-kickoff/references/methods.md`, Plain words): what is being decided, what each option means for cost, risk and later change; no ADR IDs, feature IDs or CLI terms in what the lead reads.

> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.

   - **Options from ECC** (`../using-kickoff/references/ecc.md`):
     - For each decision, run an `ecc:architect` agent. Give it the decision, its forces with their IDs, the constraints and the paths of the documents they come from. It returns 2–3 options with cost, risk and what each blocks.
     - Check every option against the forces before showing it, and drop a straw man.
     - When two options stay close, run `ecc:council` on them and show its verdict with the dissent.
     - The lead decides. The agent and the council never write files.
   - A validation item that **passed** supports its option; one that **failed** overturns it; one still **pending** leaves the ADR *Proposed*, and the decision is listed in system-architecture.md under Open decisions with the `V<n>` due date, unless the lead accepts the risk (record a `D<n>` and a risk in `plan.yaml`).
   - Update each *Proposed* ADR: Status `Accepted — <date>`, the Decision section as chosen, the Validation results filled; or `Superseded by ADR-<nnn> — <date>` when another ADR replaces it. Never delete an ADR or reuse its number.
   - Each new decision becomes `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md` from `../research/templates/adr.md`, with the next free number and the status the lead's choice gives it.
4. **Write `<docs_root>/04-architecture/system-architecture.md`** from `templates/system-architecture.md`, or by revising the Draft. Replace the Draft label with `- **Status:** Accepted — <date>`. Sections:
   - **Context:** the system, its users by role, external systems and data sources.
   - **Containers:** each deployable unit with its responsibility, technology (with its ADR), the design patterns it uses and the features it serves.
   - **Deployment:** environments, hosting, network boundaries, release and rollback.
   - **Data flow:** the main journeys, as numbered steps across containers, including where customer data is stored and processed.
   - **Security:** the rules of `project.yaml` `security`, identity and access per role, secrets, data protection. State that the product bundles its own fonts and assets; a prototype's use of hosted libraries or assets does not carry over to the product.
   - **Observability:** logs, metrics, traces and alerts, without customer content in logs.
   - **NFR mapping:** one row per NFR in `nfr.md`: the mechanism that meets it and how it is verified.
   Diagrams are Mermaid code blocks inside the Markdown.
5. **Write `<docs_root>/04-architecture/data-model.md`** from `templates/data-model.md`, or by revising the Draft, with `- **Status:** Accepted — <date>` in place of the Draft label: entities (with the features that need them), relations, retention per data type, and access scope per role. Every role comes from the ux-spec; every retention period from an NFR, a security rule or a decision.
6. **Review** both documents before the plan changes:
   - Run two read-only ECC agents in parallel, in one message:
     - `ecc:security-reviewer`, against `project.yaml` `security`, `nfr.md` and `system-architecture.md`;
     - `ecc:database-reviewer`, against `data-model.md` and the data flow.
   - Ask each to rank its findings P1–P3, and save each report as `<docs_root>/04-architecture/reviews/YYYY-MM-DD-<security|database>.md`.
   - Fix every P1 in the documents, or record the lead's decision to accept it as `D<n>` with a risk in `plan.yaml`. A P2 is fixed or recorded as a ruling.
7. **Derive new work** into `.kickoff/plan.yaml`: work the architecture adds and the draft plan lacks (environments, integrations, migrations, security hardening, observability, performance tests), as packages with role, effort in person-days at 100% focus, dependencies, release and `ref`, following `kickoff:plan`'s rules. Show the new packages to the lead as one table, in plain words (methods.md, Plain words), before writing them. Then run `kickoff validate` (fix every error) and `kickoff schedule`; report the gate dates it prints (with scheduling off it prints "scheduling is off": there are no dates, and the new packages change the estimate only; `kickoff estimate` shows it). Exit 3 means a hard date slips: present the `cut_order` candidates it lists, in plain words (what would be given up or moved, and what the date does), and ask the lead to decide. Run `kickoff docs`.
8. **Set the clarity areas** this phase touched (a project from 0.8 has no register yet: run `kickoff clarity init` first): `kickoff clarity set solution` and `kickoff clarity set architecture`, each with `--status`, `--confidence`, a short `--note` and a `--ref` for the `ADR-<nnn>`, `V<n>` and `A<n>` behind it. `decided` for what the lead chose here, `validated` where a passed `V<n>` confirms it; a decision still waiting for a `V<n>` stays `assumed`.
9. **Verify** (section below), then `kickoff phase done solution` and commit `docs: solution architecture, data model and accepted ADRs`.
10. **Ask the project lead to agree, in plain words** (methods.md, Plain words), that the technical approach is settled for the signed-off scope. Tell them what is agreed (how it will be built and where the data lives), what becomes expensive to change once the plan is built on it, and what each answer means. Show the decisions, the ones still open, the review findings and how each serious one was settled, and the effect on the plan, without ADR IDs, gate names or file names. Only after an explicit yes, record it as C5 and run `kickoff gate approve C5 --by "Project lead"`. `--evidence "<commit or record link>"` is optional for this gate: without it the gate records `decision in session <date>`. The `state.yaml` change goes in the next commit; no separate approval commit.

## Outputs

- `<docs_root>/04-architecture/system-architecture.md`
- `<docs_root>/04-architecture/data-model.md`
- `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md`: *Accepted* or *Superseded*, new ADRs for new decisions
- `<docs_root>/04-architecture/reviews/YYYY-MM-DD-security.md` and `YYYY-MM-DD-database.md` (ECC agent reports)
- `.kickoff/plan.yaml` with the packages the architecture adds; regenerated plan documents
- `.kickoff/clarity.yaml`: `solution` and `architecture` set
- `.kickoff/state.yaml`: `solution: done`, and C5 once the lead approves

## Verify

1. `kickoff can solution` still exits 0 (no feedback reopened C3 meanwhile).
2. Every ADR in `<docs_root>/04-architecture/adr/` is *Accepted* or *Superseded*, or *Proposed* with a pending `V<n>` listed under Open decisions in `system-architecture.md`.
3. Every NFR ID in `nfr.md` has a row in the NFR mapping; every active feature in `features.yaml` is served by a container; every entity a feature stores is in `data-model.md` with retention and access scope.
4. `kickoff check-docs <docs_root>/04-architecture` prints `check-docs passed` (no placeholder, no forbidden phrase). Owners are roles.
5. `kickoff validate` reports `0 errors`; `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as a `D<n>`; `kickoff docs --check` prints `documents up to date`.
6. Both review reports exist, and every P1 in them is fixed in the documents or has a `D<n>`.
7. No `Status: Draft` label is left in `system-architecture.md` and `data-model.md`: both say `Accepted — <date>`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Features that arrive after the architecture is designed cause the refactors this workflow exists to prevent: design only for the feature set the customer signed off, across all releases, not only the MVP.
- Commit late, explore early: a Draft sketch made before the sign-off tests feasibility and feeds the estimate, binds nothing, and no implementation starts from it. Diff it against the signed-off scope instead of starting over, and never leave the Draft label on a final document.
- Decide on evidence: a validation result can overturn a *Proposed* ADR; a pending one keeps the decision open, in writing.
- A prototype may load libraries and fonts from a hosted source; the product does not. Restate the product's own security rules here.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:plan` in baseline mode (`kickoff can plan --baseline` exits 0 once C5 is approved): the baseline plan, estimate workbook and C6. `kickoff status` names the next step.
