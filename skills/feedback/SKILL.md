---
name: feedback
description: Use when customer or stakeholder feedback arrives on the prototype, scope or plan — workshop notes, artifact comments or pasted remarks
---

# Feedback

Turns customer or stakeholder feedback into classified items `FB-<n>`, gets the project lead's approval of the classification once, and applies the approved changes along the chain `features.yaml` → `ux-spec.md` → prototype → draft `plan.yaml` → schedule. It reopens C3, so the changed feature set is signed off again before any solution or baseline work builds on it.

## When to use

- After a sign-off workshop whose record lists **Changes requested** (`kickoff:signoff` hands them over).
- When comments arrive on the published prototype, or the customer sends remarks by e-mail, chat or call notes.
- When a stakeholder questions scope, a screen, the look of the product or a plan date after the prototype exists.

Not for changes the team found itself before the prototype is shown: those re-run the phase skill that owns the file.

## Preconditions

- `kickoff can feedback` exits 0 (prototype done). It is not a phase in `kickoff status`: there is no `kickoff phase start feedback` (it exits 2 with `unknown phase`).
- `.kickoff/state.yaml` has `prototype: { artifact, version }`: the link (or bundle path) and the version the feedback is about.
- The `ui-ux-pro-max` skill is available for visual items.

## Inputs

- Workshop notes, the sign-off record `<docs_root>/01-discovery/signoff/YYYY-MM-DD-signoff-record.md` (its **Changes requested** table), e-mails, pasted remarks.
- Comments on the prototype Artifact, read with the `ArtifactComments` tool on the link in `state.yaml` `prototype.artifact`.
- The chain: `.kickoff/features.yaml`, `ux-spec.md` (`proto.ux_spec`, default `<docs_root>/05-design/ux-spec.md`), `design-system.md`, the prototype in `proto.dir`, `.kickoff/plan.yaml` (`cut_order`, gates), `.kickoff/project.yaml` (`hard_dates`, releases).
- `<docs_root>/01-discovery/open-questions.md` (questions and the Decision log) and earlier sessions in `<docs_root>/01-discovery/feedback/` (the last `FB-<n>` used).
- `templates/feedback-session.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`. Lessons: `../using-kickoff/references/lessons.md`.

## Steps

1. Run `kickoff can feedback`. Exit 1: stop and show the `blocked:` lines. Run `kickoff schedule` once and note the gate dates: they are the "before" column of the session record.
2. **Gather every input** and read it fully. For Artifact comments, read the threads with `ArtifactComments`; do not answer or resolve them until the lead approves the session (an answer to the customer is publishing). Keep each remark's source: role, channel, date.
3. **Split into items** `FB-<n>`, numbering on from the last session (IDs are permanent across sessions). One remark that asks for two things is two items. Quote each remark as said. Classify each item as exactly one of:

   | Class | Means | Changes |
   | --- | --- | --- |
   | scope | add, remove or move a feature between releases | `features.yaml`, then `ux-spec.md`, prototype, `plan.yaml` |
   | ux | a flow, a screen, a behaviour rule | `ux-spec.md`, then prototype |
   | visual | type, colour, density, spacing, icons | `design-system.md` and prototype tokens or components |
   | question | something to find out before deciding | a new `Q<n>` with a needed-by date in `open-questions.md` |
   | decision | the customer decided something | a new `D<n>` in the Decision log, with its date and source |

   A remark that does not say what is wanted is a question, not a guess. A remark that clearly asks to add, remove or move a feature is scope even when its details are still open (what exactly, for which role): classify it as scope and name the open details as a `Q<n>` in its Proposed change. A remark that moves a feature to a later release is scope, even when it sounds like a plan remark.
4. **Present one classification table** with the Bounded approval method, and wait. Columns: ID, Source, Feedback (quoted), Class, Proposed change, Files, Effect (gates or releases it may move). This approval is the gate of this skill.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   Change nothing before the lead's explicit yes or edits. Apply the edits to the table and show it again if the lead changed a class or a proposed change. An item the lead rejects keeps its row with status `Rejected` and a `D<n>`.
5. **Apply the approved items in chain order**, all items of one link before the next link, writing files with the file tools:
   1. **`features.yaml`** (scope items): new features get new IDs (`F<epic>.<n>`, never reused); a release move changes `release`; a removal sets `status: removed` with `removed_by: D<n>` and the decision goes into the Decision log the same day. Run `kickoff docs` (refreshes `feature-map.md`) and `kickoff validate`; fix every error.
   2. **`ux-spec.md`** (scope and ux items): screens in the screen inventory table in its exact format `| ID | Screen | Roles | Platform | Release |`, behaviour rules, states, copy. New screen IDs are permanent; a screen of a removed feature keeps its row marked removed or moves to the later release.
   3. **Prototype** (scope, ux and visual items): follow the project-file rules of `kickoff:prototype` (register new screens with their ux-spec row, `Rel` for later releases, never edit the kit core). For **visual** items, invoke the `ui-ux-pro-max` skill with `--domain` queries (`typography`, `color`, `ux`) for the concern, then fix it where it is defined (design-system tokens, type-scale classes, shared components) and search every screen for the same pattern: one complaint about one dense screen is a fix for the whole product. Then run `kickoff proto check` with no route arguments: it must print `prototype check passed`; exit 4 is a skipped check, report it and stop. Run `kickoff proto lint` (exit 0). Republish to the same Artifact URL (or run `kickoff proto bundle`) and raise `prototype.version` by one in `state.yaml` with the Edit tool; change no other key. Sending the new version to the customer is publishing: ask the lead first.
   4. **`plan.yaml`** (draft): packages for added features (role, effort in person-days at 100% focus, deps, release, `ref`), the feature's `wbs` link, removed or moved work taken out of its phase. Follow `kickoff:plan` for the rules. Run `kickoff validate`.
   5. **Schedule:** run `kickoff schedule` and compare the gate dates with step 1. Report every gate that moved, with before and after dates.
   6. **Questions and decisions:** add each question item as `Q<n>` (needed-by date, what it blocks, owner role) and each decision item as `D<n>` (date, source, taken by role) to `open-questions.md`.
6. **Hard-date slip.** If `kickoff schedule` exits 3, it prints `<gate> slips: planned …, hard date … (<n> working days late)` and the `cut candidate` lines from `cut_order` with the effort each frees. Present these options as one table (cut candidates, more capacity, a later hard date agreed with the customer, accept the slip) and ask the lead for a decision. Record it as `D<n>`, apply it through `features.yaml` and `plan.yaml` in chain order, and run `kickoff schedule` again. Never move dates by hand.
7. **Refresh documents:** `kickoff docs` (feature map, WBS, risk register, plan tables).
8. **Reopen C3:** `kickoff gate reopen C3 --reason "Feedback session YYYY-MM-DD: FB-<a>..FB-<b>"`. It removes C3 and C4, sets `signoff` back to `in_progress`, marks every later phase that was done as stale, and prints `C3 reopened; stale: <phases>`. Report that line to the lead. Do this for every session that changed `features.yaml`, `ux-spec.md` or the prototype, even when C3 was never approved: the changed set needs a sign-off.
9. **Write the session record** at `<docs_root>/01-discovery/feedback/YYYY-MM-DD.md` from `templates/feedback-session.md`: the item table (ID, Source, Feedback (quoted), Class, Change made, Files, Status), the gate dates before and after, the slip decision if any, new questions and decisions, the reopen output. When the items came from a sign-off record, fill its **Changes requested** table's Feedback item column with the `FB-<n>` IDs.
10. **Verify** (section below), then commit `docs: feedback session YYYY-MM-DD` with every changed file, including `.kickoff/state.yaml`. Then answer the Artifact comment threads if the lead agrees.

## Outputs

- `<docs_root>/01-discovery/feedback/YYYY-MM-DD.md`
- Changed along the chain: `.kickoff/features.yaml` and `feature-map.md`, `ux-spec.md`, `design-system.md`, the prototype project files, `.kickoff/plan.yaml` and the generated plan documents
- `<docs_root>/01-discovery/open-questions.md`: new `Q<n>` and `D<n>`
- The sign-off record's Changes requested table linked to the `FB-<n>` items
- `.kickoff/state.yaml`: C3 and C4 removed, `signoff: in_progress`, later phases stale, `prototype.version` raised

## Verify

1. Search the session record for `{{`: no placeholder is left.
2. Every item in the record has a class and a status; every applied item names the files it changed, and `git status` shows no changed file that is not in the table.
3. `kickoff validate` reports `0 errors`; explain every warning.
4. If the prototype changed: `kickoff proto check` prints `prototype check passed` (exit 4 is skipped, not passed) and `kickoff proto lint` exits 0.
5. `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as `D<n>`.
6. `kickoff docs --check` prints `documents up to date`.
7. `kickoff status` shows C3 open, `signoff` in progress and the stale phases the reopen reported.
8. Search the written files with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match. Sources and owners are roles.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

Feedback is not a phase: skip `kickoff phase done` here. The commit closes the session; `kickoff:signoff` records the new sign-off.

## Lessons

- Dense, heavy text overwhelmed the reviewer: a visual remark is fixed across the whole product (tokens, type scale, shared components), not on the one screen it was made about (lessons row 10).
- A small change that skips the chain leaves the feature map, the ux-spec, the prototype and the plan disagreeing; the next sign-off then signs something nobody built. Always run the chain in order.
- A late sign-off moved the MVP gate: report gate moves after every session, and end a hard-date slip in an explicit decision.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:signoff`: the customer confirms the changed prototype, and C3 (then C4) is approved again with evidence. After that, re-run the stale phases in order (`kickoff status` lists them first): `kickoff:solution`, `kickoff:plan`, `kickoff:tickets`.
