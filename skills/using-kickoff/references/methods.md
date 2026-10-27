# Working methods

Seven methods every kickoff skill uses. Phase skills name them by section heading ("the Interview method") and carry a one-line rule card where they apply; this file holds the full text. A design choice or a gate request uses the Decision card method, never a bare list of options.

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

## Decision card

**Rule:** a design choice or a gate request is a card: what it decides and locks; 2–3 options, each with what the person will see, who it serves, what it costs and where a wrong choice would surface; a recommendation with its reason; what was assumed; and always "none of these" and "show me first".

Use it for every design confirmation (the brief, concepts, structure, the spec, the prototype approach) and for every gate request. The Interview method fills fields; the Option decision method records an engineering choice as an ADR. A card is how a person who cannot see the result yet makes a choice they will not regret.

Steps:

1. Write the card before asking. If the options cannot be pictured from words, make them visible first: a sketch, an ASCII layout, a screenshot of a reference, a quick mock, or a scenario told as a short story. Ask in the same message as the picture.
2. The card has these parts, in this order:
   - **Decision:** one sentence, and what it locks ("after this the screen inventory is built on it").
   - **Options (2–3):** for each, **what you will see or do** (the picture or a concrete example), **who it serves and who it fails**, **cost** (effort, and the work that would be redone), and **found wrong in:** the phase or event in which a mistake would surface.
   - **Recommendation:** one option and the reason in one or two sentences, tied to the brief.
   - **Assumed:** what you decided on the person's behalf or guessed, as a list they can strike.
   - **Always offered:** "none of these" (they describe what they want) and "show me first" (you produce a sketch or mock before they choose).
3. One decision per card. Several small related decisions may share one message when they are shown together, each with its own recommendation.
4. Restate the choice in one line ("Recorded: …") and what it now locks. A choice made on "show me first" is asked again after the picture.
5. For a gate request, the card is: what is being approved, what becomes expensive to change afterwards, the rulings taken without the approver so far, the open risks, and what you are least sure of.
6. Record the result where the phase's template says (a decision `D<n>`, the brief, the concept record), with the options that were not chosen.

Example:

> **Decision:** how a player moves between the town and a dungeon. Locks the scene list and the loading rules of `ux-design`.
>
> | Option | What you will see | Serves / fails | Cost | Found wrong in |
> | --- | --- | --- | --- | --- |
> | A. A world map | `[town]──[forest]──[dungeon]`, travel by choosing a node | Explorers / players who want to arrive fast | 4 extra scenes | the prototype review |
> | B. A door in the town | the dungeon entrance is a building you walk into | Quick sessions / a sense of travel | 1 scene | the prototype review |
> | C. A menu list | "Go to: Town · Forest · Dungeon" | Speed / immersion | none | the customer's first look |
>
> Recommendation: B, because the brief asks for sessions of ten minutes and a closed town. Assumed: no more than three destinations at launch. Also: none of these · show me a sketch first.

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
  - Files: `apps/web/src/screens/sc-03.tsx` … `sc-07.tsx`, `packages/mocks/src/contract/meeting.ts`
  - Inputs: `ux-spec.md` screens SC-03..SC-07, `design-rules.md`
  - Verify: open each of the five screens in the scenario "Book a loan" and tick it in `prototype-coverage.md`
  - Expected: the five rows read "shown", with the extremes (empty list, 2,000 rows, the longest name) captured
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
3. Report each check as passed, failed (quote the failing lines) or skipped (say why: a tool the project uses is missing, or `kickoff workbook --verify` without Docker says the recalculation was skipped). A skipped check is never reported as passed.
4. With any failure, the phase is not done: fix it and run the checks again, or stop and report.
5. When every check passes, run `kickoff phase done <phase>` and make a Conventional Commit. `feedback` is not a phase: it ends with its commit and the gate reopen, without `kickoff phase done`.

Example:

```text
kickoff validate      -> 0 errors, 1 warning (F3.4 active feature without a WBS package: expected until plan)
placeholder search    -> no "{{" left in docs/01-discovery
Result: passed. Running kickoff phase done discovery, then committing.
```
