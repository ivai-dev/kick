---
name: discovery
description: Use when turning customer meeting notes, briefs, calls or documents into vision, scope, stakeholders, open questions and decisions for a project
---

# Discovery

Turns the customer's material into a vision and scope the project lead can approve (gate C1), with every unknown written down as a question that has an owner, a needed-by date and the work it blocks.

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
4. **Confirm with the lead** using the Interview method: the product in one paragraph, users and roles, must-haves, out of scope, success criteria (each measurable). Confirm extracted facts instead of asking for them again.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

5. **Write `<docs_root>/01-discovery/vision-scope.md`** from `templates/vision-scope.md`, sections in this order: Summary, Users and roles, Problem, Goals and success criteria, Scope by release, Out of scope, Constraints, Decisions, Timeline. Scope covers the full product across all releases from `project.yaml`, not only the MVP. Decisions are numbered `D1`, `D2`, … with date and source; the Timeline lists the hard dates.
6. **Write `<docs_root>/01-discovery/stakeholders.md`** from `templates/stakeholders.md`: table Name/role, Organisation, Interest, Influence, Contact channel. Use roles only when the documents give no names; never invent a name.
7. **Write `<docs_root>/01-discovery/open-questions.md`** from `templates/open-questions.md`: one row per unknown with ID (`Q1`, `Q2`, …), Question, Why it matters, Blocks (phase or WBS code), Needed by (date), Owner (role), Status. Every question gets a needed-by date: the latest date an answer still lets the blocked work start on time. Then the "Decision log" section: one dated entry per decision, `D<n>` with date, decision, source and what it changes. A decision found in the inputs goes in the log the day it is found.
8. **Verify** (section below), then `kickoff phase done discovery` and commit `docs: discovery — vision, scope, stakeholders and open questions`.
9. **Ask the project lead to approve C1** (Vision): show the summary, the decisions and the questions due first. Only after an explicit yes, record it with `kickoff gate approve C1 --by "Project lead" --evidence "<commit or record link>"` (the commit of step 8, or the meeting record where the lead approved), and commit `chore: approve C1`. If the lead asks for changes, make them, verify again and repeat step 8 and this step.

## Outputs

- `<docs_root>/01-discovery/vision-scope.md`
- `<docs_root>/01-discovery/stakeholders.md`
- `<docs_root>/01-discovery/open-questions.md` (with the Decision log)
- `.kickoff/state.yaml`: `discovery: done`, and C1 once the lead approves

## Verify

1. Search the three files for `{{`: no placeholder is left.
2. Every row of the open-questions table has a Needed by date, a Blocks entry and an Owner role; every decision has a date and a source.
3. Every unknown from step 3 is a question in `open-questions.md` or is answered in `vision-scope.md`.
4. Search the three files with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match. Owners are roles, not people.
5. `kickoff validate` reports `0 errors`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Questions without a needed-by date are never answered in time: every question gets a date and the work it blocks, and the lead sees the questions due first.
- Record decisions the day they are taken, with their source; a decision that lives only in a chat or a meeting is lost by the next workshop.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

After C1: `kickoff:feature-map` (gate C2) and `kickoff:research`, which run side by side. `kickoff status` names the next one. Remind the lead of the questions with the nearest needed-by dates.
