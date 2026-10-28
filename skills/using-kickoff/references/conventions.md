# Conventions

Rules every kickoff skill follows. The first six sections are the conventions of the design spec (§9); the rest make them concrete.

## Languages

Repository and work items in `languages.repo`; chat in `languages.chat`; the workbook and customer deliverables in the language the lead requests; UI strings and fixtures in `languages.ui`.

- `plan.yaml` and the text fields of `project.yaml` (role and release names) are written in the workbook language; `features.yaml` in the repository language; `item` blocks always in the repository language.
- Any item may carry translations: `i18n: {<lang>: {<field>: "..."}}`. When `repo` differs from `workbook`, give plan items an `i18n.<repo>` text, or `kickoff validate` warns that generated documents show them in the workbook language.

## Estimates

An estimate is a range, never a single number. Person-days at 100% focus.

- **Range, confidence, basis.** A package keeps `effort` as the likely value and may add `min`, `max`, `confidence` (`low`, `medium`, `high`) and `basis` (one line: what the number rests on). A feature may carry `estimate: {min, likely, max, confidence, basis}` in `features.yaml`. `kickoff validate` errors unless `min <= effort <= max`. A package without `min` and `max` is a point estimate; say so, and give it a basis.
- **Top-down, then bottom-up.** A feature with `wbs` packages is estimated by them; one without uses its own `estimate`. Estimate each active feature right after C2, then refine it into packages. `kickoff estimate` prints min, likely and max by release and by role, the overhead and a Basis line; `kickoff docs` writes it to `<docs_root>/06-planning/estimate.md`.
- **Overhead is a rate.** `project.yaml` `estimate: {overhead: 0.10}` is the management share added to the work total. Do not add level-of-effort packages for plain project management.
- **Scheduling is optional.** `project.yaml` `scheduling: "off"` (new projects) means no schedule, workbook or hard dates; `kickoff schedule` and `kickoff workbook` print "scheduling is off". With it on (or the key absent), packages are planned by role and focus percentage, every plan has a scope-cut order, and a slipped hard date always ends in an explicit decision.
- **The plan is the estimate and the baseline.** C6 baselines the estimate; the schedule, when on, derives from it.

When `rules.forbidden_phrases` lists a phrase such as "AI assistance", estimates may assume it but no document, work item or report states it; `kickoff validate` warns when one does.

## Talking to the person

- Chat is in plain words, in `languages.chat`. The person does not know kickoff: no phase names, gate IDs (C1 to C6, CD), item IDs (Q3, D2, A4, V1, F1.2, ADR-001), CLI commands, file names or terms such as WBS, ADR, clarity, baseline, stale or decision card. Say what it is in everyday words; the code may follow in brackets for the record (`references/methods.md`, "Plain words").
- A question or confirmation says what is being agreed or chosen, what it makes expensive to change, and what the person will see. It never explains the plugin's process.
- IDs, commands and file names belong in files, commit messages and reports to the lead who asked for them, not in the questions.
- Self-check before sending: read the message as someone who has never seen the plugin. If any word needs the plugin to be understood, rewrite it.

## Owners

Packages and work items name the owning role; never a person or an assistant as owner.

## Work items

One `item` block per WBS leaf the team will track; `kickoff export` hands them over as CSV, JSON and Markdown. Kickoff creates no tracker issues.

## Rulings

Long multi-task runs record decisions in `<docs_root>/08-task-plans/<plan>-rulings.md` as `Ruling: <decision> — <why> — <cost if wrong>` and list them to the lead at the end of every task group and at every gate request, not only at the end of a phase.

## Irreversible actions

Merges, deleting branches, publishing and pushing to shared branches are confirmed with the lead first.

## Role-based owners

- Documents, templates, plans and work items name roles ("Project lead", "QA", "Customer"), never a person or an assistant, as owner of a task, question, risk or decision.
- Gate approvals record the approving role. Evidence is required for the customer's gates (CD, C3, C4): `kickoff gate approve C3 --by "Customer" --evidence "<link>"`. For the project lead's gates (C1, C2, C5, C6) it is optional: `kickoff gate approve C1 --by "Project lead"` records "decision in session <date>"; add `--evidence` when a record exists.
- People's names appear only where the customer gave them as stakeholder data (`stakeholders.md`), never as owners.

## Forbidden phrases

- `rules.forbidden_phrases` in `project.yaml` holds regular expressions (case-insensitive), for example `'\bClaude\b'` and `'AI[- ]assist'`.
- No document, work item, commit message, report or template text may match one. Estimates may assume the help the phrase names; nothing written may state it.
- `kickoff validate` warns on matches in `features.yaml` and `plan.yaml`. For Markdown outputs, search the written files with the same patterns before committing.

## Synthetic data

- With `rules.synthetic_data_only: true`, prototypes, fixtures and examples use invented names, organisations, addresses and contents. Never copy real customer content into them.
- Development infrastructure (VPN names, private IP ranges, internal host names, tool accounts) never appears in a user-facing string. List such patterns in `design.forbidden` (regular expressions in `project.yaml`); `kickoff check-docs` applies them to the files it is given, and the craft auditor looks for them in the prototype.

## Ask before

Confirm with the lead before any of these, and do nothing until the answer is yes:

- merging a branch or pull request; deleting a branch, or deleting files this session did not create;
- publishing (an Artifact shared beyond the lead, a bundle sent outside the team);
- pushing to a shared branch;
- writing to a shared tracker (importing the `kickoff export` files is the lead's step).

## IDs

- IDs are permanent: epics `E<n>`, features `F<epic>.<n>`, screens (any unit of experience: a screen, scene, level or flow state) `SC-nn`, or a platform prefix the ux-spec defines, WBS codes in dotted numbers, risks `R<n>`, assumptions `A<n>`, questions `Q<n>`, decisions `D<n>` (with their date and source), feedback items `FB-<n>`, validation items `V<n>`, ADRs `ADR-<nnn>`.
- Renaming never changes an ID. Removal sets `status: removed` with a reference to the decision (`removed_by: D7`); the entry stays.
- Tracker issues are matched by a hidden key in the body (`<!-- kickoff:1.2.7 -->`), never by title.

## Files

- Write and edit files with the file tools (Write, Edit), never with shell heredocs, `echo` or redirects: a heredoc once turned a literal `\n` into real newlines inside JavaScript.
- `.kickoff/*.yaml` is the source of truth; Markdown tables between `<!-- kickoff:begin <name> -->` and `<!-- kickoff:end <name> -->` are generated by `kickoff docs` and never edited by hand.
- WBS codes are strings: quote them in YAML (`code: "1.2"`, `deps: ["1.1.3"]`), or they read back as numbers.
- Phases and gates in `state.yaml` change only through `kickoff phase` and `kickoff gate`; the prototype link only through `kickoff prototype record`. A hook refuses hand edits of `state.yaml`.
- The project's design rules are its own: `<docs_root>/05-design/design-rules.md`, derived from the brief (`design-philosophy.md`). Kickoff ships no design values.
- Templates use `{{placeholder}}` fields. A finished document has no `{{` left.

## CLI

- Run commands from anywhere inside the project: the CLI uses the nearest folder with `.kickoff/`. `--root <path>` goes before the command (`kickoff --root ../demo status`). `kickoff init` is the only command that works without `.kickoff/`.
- Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | Success; the check passed; the phase may start. |
| 1 | A check failed: `validate` errors, `can` blocked, `docs --check` would change files, `check-docs` findings, `workbook --verify` mismatches. |
| 2 | The command was refused or misused; the reason is on the `error:` line (for example an unknown phase, a gate without `--by`, a customer gate without evidence, no `.kickoff/` folder). |
| 3 | `schedule`: a hard date slips; present the `cut_order` options and ask the lead to decide. |
| 4 | Reserved: no command uses it. A check that cannot run is reported as skipped, never as passed. |

## Commits

Conventional Commits (`docs:`, `feat:`, `chore:` …), one per phase output or per build-plan task, with messages that state what changed. Commit messages follow the forbidden-phrases rule. A gate approval changes `state.yaml`; that change may ride in the next commit, and no separate commit is required for it.
