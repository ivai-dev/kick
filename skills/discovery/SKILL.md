---
name: discovery
description: Use when turning customer meeting notes, briefs, calls or documents into vision, scope, stakeholders, open questions and decisions for a project
---

# Discovery

Turns the customer's material into a vision and scope the project lead can approve (gate C1), with every unknown written down as a question that has an owner, a priority and the work it blocks (and a needed-by date once scheduling is on).

## When to use

- After `kickoff:init`, when the first customer material arrives.
- Again whenever new meeting notes, briefs, call transcripts or documents change the vision, scope, stakeholders or open questions. Feedback on the prototype goes to `kickoff:feedback` instead.

## Preconditions

- `kickoff can discovery` exits 0 (phase `init` is done).
- `.kickoff/project.yaml` has the roles, releases and languages filled.

## Inputs

- Every customer document the lead provides: meeting notes, briefs, tender or contract texts, call transcripts, e-mails, spreadsheets.
- `.kickoff/project.yaml`: roles (owners of questions), releases (scope by release), hard dates (the comments under `hard_dates`).
- Existing `<docs_root>/01-discovery/*.md` when re-running.
- Templates in this skill's folder: `templates/vision-scope.md`, `templates/stakeholders.md`, `templates/open-questions.md`.

## Steps

1. Run `kickoff can discovery`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start discovery`.
2. **Read every input fully**, every page and sheet, not a summary or the first screen. List the inputs read, with their dates, at the top of your notes.
3. **Extract** four lists, each item with its source (document and section or timestamp):
   - facts (what the product must do, for whom, where);
   - constraints (dates, budget, platforms, regulations, hosting, data rules);
   - decisions already taken (with the date and who took them, by role);
   - unknowns (anything the documents leave open or contradict).
4. **Confirm with the lead** using the Interview method, in plain words (`../using-kickoff/references/methods.md`, Plain words): the product in one paragraph, users and roles, must-haves, out of scope, success criteria (each measurable). Confirm extracted facts instead of asking for them again. No question ID, file name or kickoff term in what the lead reads.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

5. **Write `<docs_root>/01-discovery/vision-scope.md`** from `templates/vision-scope.md`, sections in this order: Summary, Users and roles, Problem, Goals and success criteria, Scope by release, Out of scope, Constraints, Decisions, Timeline. Scope covers the full product across all releases from `project.yaml`, not only the MVP. Decisions are numbered `D1`, `D2`, … with date and source; the Timeline lists the hard dates.
6. **Write `<docs_root>/01-discovery/stakeholders.md`** from `templates/stakeholders.md`: table Name/role, Organisation, Interest, Influence, Contact channel. Use roles only when the documents give no names; never invent a name.
7. **Write `<docs_root>/01-discovery/open-questions.md`** from `templates/open-questions.md`: one row per unknown with ID (`Q1`, `Q2`, …), Question, Why it matters, Blocks (phase or WBS code), Priority (`now`, `soon` or `later`: how soon the blocked work needs the answer), Needed by (date), Owner (role), Status. While `project.yaml` has `scheduling: "off"` there is no calendar, so Needed by may stay empty: Priority orders the questions. When scheduling is on, every question gets a needed-by date: the latest date an answer still lets the blocked work start on time. Every question has a Blocks entry and an Owner either way. Then the "Decision log" section: one dated entry per decision, `D<n>` with date, decision, source and what it changes. A decision found in the inputs goes in the log the day it is found.
8. **Product lens:** invoke `ecc:product-lens` and run its four diagnostics over the draft `vision-scope.md`, as a lens only. It must not write `PRODUCT-BRIEF.md` (`../using-kickoff/references/ecc.md`). Each gap it finds (the why, the user, the wedge, the success measure) becomes a `Q<n>` in `open-questions.md`, or is answered in `vision-scope.md` with its source.
9. **Set the clarity areas** this phase touched (`kickoff clarity init` first when `.kickoff/clarity.yaml` does not exist): `kickoff clarity set problem`, `users` and `scope`, each with `--status`, `--confidence`, a short `--note` and a `--ref` for every open `Q<n>` or decision `D<n>` behind it. Use `decided` for what the lead confirmed in step 4, `assumed` for a working guess nobody confirmed, `open` for what the material does not answer, and `validated` only when evidence confirms it. `kickoff clarity` then names the weakest area.
10. **Verify** (section below), then `kickoff phase done discovery` and commit `docs: discovery — vision, scope, stakeholders and open questions`.
11. **Ask the project lead to agree, in plain words** (methods.md, Plain words), that the vision and scope describe what is being built. Tell them what is agreed (the product, its users, what is in and out of scope), what becomes expensive to change once the features are listed on top of it, and what each answer means (yes: the work goes on from here; changes: you revise first). Show the summary, the decisions and the unanswered questions that matter most, with no IDs, gate names or file names. Only after an explicit yes, record it as C1 with `kickoff gate approve C1 --by "Project lead"`. `--evidence "<commit or record link>"` is optional for this gate: without it the gate records `decision in session <date>`. The `state.yaml` change goes in the next commit; no separate approval commit. If the lead asks for changes, make them, verify again and repeat step 10 and this step.

## Outputs

- `<docs_root>/01-discovery/vision-scope.md`
- `<docs_root>/01-discovery/stakeholders.md`
- `<docs_root>/01-discovery/open-questions.md` (with the Decision log)
- `.kickoff/clarity.yaml`: `problem`, `users` and `scope` set
- `.kickoff/state.yaml`: `discovery: done`, and C1 once the lead approves

## Verify

1. `kickoff check-docs <docs_root>/01-discovery` prints `check-docs passed` (no placeholder, no forbidden phrase). Owners are roles, not people.
2. Every row of the open-questions table has a Priority, a Blocks entry and an Owner role, and a Needed by date when scheduling is on; every decision has a date and a source.
3. Every unknown from step 3 and every product-lens gap from step 8 is a question in `open-questions.md` or is answered in `vision-scope.md`.
4. `kickoff validate` reports `0 errors`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Questions without an owner and the work they block are never answered: every question gets both and a priority, and the lead sees the `now` questions first. A needed-by date means something only once a calendar exists, so it is required when scheduling is on and optional before.
- Record decisions the day they are taken, with their source; a decision that lives only in a chat or a meeting is lost by the next workshop.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

After C1: `kickoff:feature-map` (gate C2) and `kickoff:research`, which run side by side. `kickoff status` names the next one. Remind the lead of the questions with priority `now` (and the nearest needed-by dates when scheduling is on).
