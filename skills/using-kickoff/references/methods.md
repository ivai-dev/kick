# Working methods

Six methods every kickoff skill uses. Phase skills name them by section heading ("the Interview method") and carry a one-line rule card where they apply; this file holds the full text.

## Interview

**Rule:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when every field of the output template is filled.

Steps:

1. Open the output template the interview fills and list its empty fields. That list is the interview; do not ask anything that fills no field.
2. Confirm facts already in the inputs instead of asking for them again: "The brief says the MVP is web only. Correct?"
3. Ask one question per message. When a choice exists, offer 2–4 options labelled A–D, mark one as recommended and give the reason in one line. When no choice exists, ask an open question with an example answer.
4. Restate each answer in one line ("Recorded: …") before the next question. If the user corrects it, restate again.
5. An answer the user does not know becomes an open question with a needed-by date and the work it blocks, never a guess.
6. Stop when every field is filled. Write the file, then show the user where it is.

Example:

> Which weekend does the team observe?
> A. Saturday and Sunday (recommended: the calendar of the team's country)
> B. Friday and Saturday
> C. Sunday only
>
> User: A
>
> Recorded: weekend = Saturday and Sunday. Next question: which country's public holidays apply?

## Bounded approval

**Rule:** present one table of proposed changes; nothing changes before an explicit yes or edit.

Steps:

1. Collect every proposed change first. Do not edit files while collecting.
2. Present one table: `#`, Item, Proposed change, Files touched, Effect (for example a gate that moves).
3. Ask: "Approve all, edit rows, or reject?"
4. Change nothing until the answer is an explicit yes or an edit of named rows. "Looks interesting" or silence is not approval. An edit changes the table; show the edited table again only when the edit is ambiguous.
5. Apply exactly the approved rows. A row that cannot be applied as approved is reported, not improvised.

Example:

| # | Item | Proposed change | Files touched | Effect |
| --- | --- | --- | --- | --- |
| 1 | FB-1 | Move F4.2 Excel export from R2 to MVP | `features.yaml`, `plan.yaml` | +3 person-days for dev before G1 |
| 2 | FB-2 | Lighter admin tables (density 3) | `ux-spec.md`, prototype | none |

## Option decision

**Rule:** for each decision, 2–3 options with cost, risk and what each blocks; a recommendation; the result recorded as an ADR.

Steps:

1. State the decision in one sentence and the forces behind it: the NFRs, constraints, open questions and assumptions it depends on (with their IDs).
2. List 2–3 real options. A straw-man option that nobody would choose does not count.
3. For each option give its cost (effort in person-days, licences, running cost), its risk (what can go wrong and how likely), and what it blocks or makes hard to undo.
4. Recommend one option and say why in one or two sentences.
5. The project lead decides. Record the result as an ADR in `<docs_root>/04-architecture/adr/` (*Proposed* during `research`, *Accepted* or *Superseded* during `solution`), with the rejected options under "Alternatives considered".
6. If the decision cannot be taken without evidence, add a row to the validation plan instead and keep the ADR *Proposed*.

Example:

| Option | Cost | Risk | Blocks |
| --- | --- | --- | --- |
| A. Managed speech-to-text API | 2 pd integration, per-minute fee | customer data leaves the network | on-premise deployment |
| B. Self-hosted model on a GPU server | 8 pd setup, hardware | accuracy unproven for the domain | nothing; needs a validation run |

Recommendation: B, validated by V2 (accuracy on 3 synthetic recordings) before C5.

## Build plan

**Rule:** a checklist of tasks; each names its files, inputs, exact verification command and expected output; every task leaves the project working.

Steps:

1. Save the plan as `<docs_root>/08-task-plans/YYYY-MM-DD-<topic>.md`.
2. Write one checkbox (`- [ ]`) per task. Each task names:
   - **Files:** the paths it creates or changes;
   - **Inputs:** the documents and IDs it uses;
   - **Verify:** the exact command;
   - **Expected:** the output that counts as success.
3. Order the tasks so that after each one the checks still pass. No task leaves a broken build or a failing check for a later task to fix.
4. Keep tasks small enough to verify on their own; split a task that needs "and also".
5. Show the plan to the project lead before running it.

Example:

```markdown
- [ ] **Task 3: Meetings screen group**
  - Files: `docs/05-design/prototype/js/meetings.js`, `docs/05-design/prototype/js/data.js`
  - Inputs: `ux-spec.md` screens SC-03..SC-07, `design-system.md`
  - Verify: `kickoff proto check`
  - Expected: exit 0 and `prototype check passed` (all routes and scenarios, coverage complete)
```

## Task run

**Rule:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.

Steps:

1. Take the next unchecked task of the build plan. A fresh subagent per task is optional; give it the task text, the file paths and the conventions, not the whole conversation.
2. Do the task, writing files with the file tools (never shell heredocs).
3. Run the task's verification command and read the real output. Fix and re-run until the expected output appears, or stop and report the failure.
4. Tick the task and make one Conventional Commit for it.
5. When a judgement call is taken without the lead, record it in `<docs_root>/08-task-plans/<plan>-rulings.md` as `Ruling: <decision> — <why> — <cost if wrong>`.
6. At the end, list the rulings to the lead and ask which ones to revisit.

Example:

```text
Ruling: the empty state of SC-05 reuses the SC-03 illustration — the ux-spec names no asset — one extra asset task if the customer asks for a distinct one
```

## Verify

**Rule:** run the commands in the skill's Verify section, read the real output, report failures as failures and skipped checks as skipped; only then `kickoff phase done <phase>` and a commit.

Steps:

1. Run every command listed in the skill's Verify section, in order.
2. Read the real output and exit code of each. Do not infer a result from an earlier run or from the absence of an error message.
3. Report each check as passed, failed (quote the failing lines) or skipped (say why: `kickoff proto check` exit 4 means no Edge or Chrome was found; `kickoff workbook --verify` without Docker says the recalculation was skipped). A skipped check is never reported as passed.
4. With any failure, the phase is not done: fix it and run the checks again, or stop and report.
5. When every check passes, run `kickoff phase done <phase>` and make a Conventional Commit. `feedback` is not a phase: it ends with its commit and the gate reopen, without `kickoff phase done`.

Example:

```text
kickoff validate      -> 0 errors, 1 warning (F3.4 active feature without a WBS package: expected until plan)
placeholder search    -> no "{{" left in docs/01-discovery
Result: passed. Running kickoff phase done discovery, then committing.
```
