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
- `.kickoff/state.yaml` has `prototype: { artifact, version }`: the link (or path) and the version the feedback is about.
- The tool named in the prototype approach ADR is available to the team. If it is not, say so: a change cannot be checked with a tool that is missing.

## Inputs

- Workshop notes, the sign-off record `<docs_root>/01-discovery/signoff/YYYY-MM-DD-signoff-record.md` (its **Changes requested** table), e-mails, pasted remarks.
- Comments on the prototype when it was published as an Artifact, read with the `ArtifactComments` tool on the link in `state.yaml` `prototype.artifact`; comments in the design tool when it has them.
- The chain: `.kickoff/features.yaml`, `ux-spec.md` (`design.ux_spec`, default `<docs_root>/05-design/ux-spec.md`), the project's `design-rules.md`, the locked concept record and `design-brief.md`, the prototype (as recorded; its brief, `prototype-coverage.md` and approach ADR), `.kickoff/plan.yaml` (`cut_order`, gates), `.kickoff/project.yaml` (`hard_dates`, releases).
- Philosophy: `../using-kickoff/references/design-philosophy.md`.
- `<docs_root>/01-discovery/open-questions.md` (questions and the Decision log) and earlier sessions in `<docs_root>/01-discovery/feedback/` (the last `FB-<n>` used).
- `templates/feedback-session.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`. Lessons: `../using-kickoff/references/lessons.md`.

## Steps

1. Run `kickoff can feedback`. Exit 1: stop and tell the lead in plain words what is not finished yet (methods.md, Plain words), not the raw `blocked:` lines. Run `kickoff schedule` once and note the gate dates: they are the "before" column of the session record.
2. **Gather every input** and read it fully. For Artifact comments, read the threads with `ArtifactComments`; do not answer or resolve them until the lead approves the session (an answer to the customer is publishing). Keep each remark's source: role, channel, date.
3. **Split into items** `FB-<n>`, numbering on from the last session (IDs are permanent across sessions). One remark that asks for two things is two items. Quote each remark as said. Classify each item as exactly one of:

   | Class | Means | Changes |
   | --- | --- | --- |
   | scope | add, remove or move a feature between releases | `features.yaml`, then `ux-spec.md`, prototype, `plan.yaml` |
   | ux | a flow, a screen, a behaviour rule | `ux-spec.md`, then prototype |
   | visual | one screen's or one element's look or wording, within the locked concept: type, colour, density, spacing, icons, copy | `design-rules.md`, the shared parts of the prototype, the ux-spec copy guide |
   | concept | structure, flow or the overall feel: the customer rejects how the product is built or how it feels, not a detail of it | reopens CD: `kickoff:design-concept` runs again with the customer before the ux-spec and prototype change |
   | question | something to find out before deciding | a new `Q<n>` with a needed-by date in `open-questions.md` |
   | decision | the customer decided something | a new `D<n>` in the Decision log, with its date and source |

   A remark that does not say what is wanted is a question, not a guess. A remark that clearly asks to add, remove or move a feature is scope even when its details are still open (what exactly, for which role): classify it as scope and name the open details as a `Q<n>` in its Proposed change. A remark that moves a feature to a later release is scope, even when it sounds like a plan remark.
4. **Confirm the classification, then present one table of changes.** Everything the lead reads in this step is in plain words (methods.md, Plain words): the lead has not seen this plugin's vocabulary, so the message names no item ID (`FB-<n>`), class name, gate, file or command. Call the items "remark 1, remark 2" and describe each class as what it means:

   | Class | Say it to the lead as |
   | --- | --- |
   | scope | "add, remove or move a feature" |
   | ux | "change how something works or where it is" |
   | visual | "change the look or wording of something, inside the agreed look and feel" |
   | concept | "rethink the overall structure or feel: we would go back to the customer to agree the look and feel again before changing any screen" |
   | question | "something we must find out before deciding" |
   | decision | "something the customer has decided" |

   - An item whose class is not obvious, above all `concept` versus `ux` versus `visual` (a concept item reopens CD, the others do not), is a card with the Decision card method, in plain words: the options are the possible classes, each with what will change and be redone, who it serves, its cost, and where a wrong class would surface (for the concept option, say that the customer's earlier agreement on the look and feel is reopened and the screens and prototype wait for it); a recommendation; what was assumed; "none of these" and "show me first"; and what the lead must do (pick one).

> **Decision card:** a design choice or a gate request is a card: what it decides and locks; 2–3 options, each with what the person will see, who it serves, what it costs and where a wrong choice would surface; a recommendation with its reason; what was assumed; and always "none of these" and "show me first".

   - Then present **one classification table** with the Bounded approval method, in plain words, and wait. Columns shown to the lead: Remark (number), Who said it (role), What they said (quoted), What kind of change (the plain wording above), What I propose to change, What it touches (in words: the feature list, screens, the prototype, the plan), What it may move (dates, the customer's agreement on the features, the first release). Close the message with what approving means: the customer's agreement on the feature list is withdrawn until they confirm the changed prototype, work already done after that agreement may need redoing (name it in words), and the lead must reply "yes" or say which rows to change. The session record written later uses the file columns: ID, Source, Feedback (quoted), Class, Proposed change, Files, Effect. This approval is the gate of this skill.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   Change nothing before the lead's explicit yes or edits. Apply the edits to the table and show it again if the lead changed a class or a proposed change. An item the lead rejects keeps its row with status `Rejected` and a `D<n>`.
5. **Apply the approved items in chain order**, all items of one link before the next link, writing files with the file tools. A session with a **concept** item first runs `kickoff gate reopen CD --reason "Feedback session YYYY-MM-DD: FB-<n>"` (`design-concept` goes back to in progress and the later phases turn stale) and re-runs `kickoff:design-concept` with the customer; the ux-spec and prototype links below then follow its outcome, for those items.
   1. **`features.yaml`** (scope items): new features get new IDs (`F<epic>.<n>`, never reused); a release move changes `release`; a removal sets `status: removed` with `removed_by: D<n>` and the decision goes into the Decision log the same day. Run `kickoff docs` (refreshes `feature-map.md`) and `kickoff validate`; fix every error.
   2. **`ux-spec.md`** (scope and ux items): screens in the screen inventory table in its exact format `| ID | Screen | Roles | Platform | Release |`, behaviour rules, states, copy. New screen IDs are permanent; a screen of a removed feature keeps its row marked removed or moves to the later release.
   3. **Prototype** (scope, ux and visual items): follow `kickoff:prototype` with the tool of the approach ADR. A new screen gets its row in `prototype-coverage.md`, its per-screen plan with the fit test, and its states and extremes; a screen of a later release is marked as such. For **visual** items, fix the cause where it is defined (the project's `design-rules.md`, the shared parts of the prototype, the copy guide) and search every screen for the same pattern: one complaint about one dense screen is a fix for the whole product. What goes back to the customer shows the real product chrome and the customer's language (the fidelity rule of `kickoff:prototype`); a remark caused by a prototype that differed from the product is fixed in the prototype, not classified as scope. Then run the Verify of the prototype's build plan for the changed screens and walk `kickoff:prototype`'s `references/coverage-checklist.md`; a check that could not run is skipped, say so and stop. Deliver the new version the way the prototype was delivered and record it with `kickoff prototype record --artifact "<link or path>"`, which raises `prototype.version` by one. Sending the new version to the customer is publishing: ask the lead first, in plain words.
   4. **`plan.yaml`** (draft): packages for added features (role, effort in person-days at 100% focus, deps, release, `ref`), the feature's `wbs` link, removed or moved work taken out of its phase. Follow `kickoff:plan` for the rules. Run `kickoff validate`.
   5. **Schedule:** run `kickoff schedule` and compare the gate dates with step 1. Report every date that moved to the lead in plain words ("the first release scope must now be locked by <date>, was <date>"), with before and after, not gate IDs.
   6. **Questions and decisions:** add each question item as `Q<n>` (needed-by date, what it blocks, owner role) and each decision item as `D<n>` (date, source, taken by role) to `open-questions.md`.
6. **Hard-date slip.** If `kickoff schedule` exits 3, it prints `<gate> slips: planned …, hard date … (<n> working days late)` and the `cut candidate` lines from `cut_order` with the effort each frees. Present these options to the lead as one table in plain words (methods.md, Plain words): which fixed date slips and by how many working days; the options (move these features to a later release, with what each frees; add people; agree a later date with the customer; accept the delay), each with what it means and what it costs; and ask the lead for a decision. No gate IDs or `cut_order` in the message. Record it as `D<n>`, apply it through `features.yaml` and `plan.yaml` in chain order, and run `kickoff schedule` again. Never move dates by hand.
7. **Refresh documents:** `kickoff docs` (feature map, WBS, risk register, plan tables).
8. **Reopen the gates.** CD was already reopened in step 5 when the session had a **concept** item. **Reopen C3:** `kickoff gate reopen C3 --reason "Feedback session YYYY-MM-DD: FB-<a>..FB-<b>"`. It removes C3 and C4, sets `signoff` back to `in_progress`, marks every later phase that was done as stale, and prints `C3 reopened; stale: <phases>`. Tell the lead what that means in plain words (methods.md, Plain words): the customer's agreement on the feature list is open again and the changed prototype must be confirmed by the customer; these later pieces of work (named in words, such as the technical design or the plan) need redoing because something they depend on changed. Do not paste the printed line. Do this for every session that changed `features.yaml`, `ux-spec.md` or the prototype, even when C3 was never approved: the changed set needs a sign-off.
9. **Write the session record** at `<docs_root>/01-discovery/feedback/YYYY-MM-DD.md` from `templates/feedback-session.md`: the item table (ID, Source, Feedback (quoted), Class, Change made, Files, Status), the gate dates before and after, the slip decision if any, new questions and decisions, the reopen output. When the items came from a sign-off record, fill its **Changes requested** table's Feedback item column with the `FB-<n>` IDs.
10. **Verify** (section below), then commit `docs: feedback session YYYY-MM-DD` with every changed file, including `.kickoff/state.yaml`. Then answer the Artifact comment threads if the lead agrees; ask in plain words ("May I reply to the customer's comments on the prototype? They will see the answers"). The closing report to the lead says in plain words what changed, what moved in the plan, what the customer must confirm next and what the lead must do, with no IDs or file names.

## Outputs

- `<docs_root>/01-discovery/feedback/YYYY-MM-DD.md`
- Changed along the chain: `.kickoff/features.yaml` and `feature-map.md`, `ux-spec.md`, `design-rules.md`, the prototype files, `.kickoff/plan.yaml` and the generated plan documents
- `<docs_root>/01-discovery/open-questions.md`: new `Q<n>` and `D<n>`
- The sign-off record's Changes requested table linked to the `FB-<n>` items
- `.kickoff/state.yaml`: C3 and C4 removed, `signoff: in_progress`, later phases stale, `prototype.version` raised

## Verify

1. `kickoff check-docs <session record> <every other written file>` prints `check-docs passed` (no placeholder, no forbidden phrase). Sources and owners are roles.
2. Every item in the record has a class and a status; every applied item names the files it changed, and `git status` shows no changed file that is not in the table.
3. `kickoff validate` reports `0 errors`; explain every warning.
4. If the prototype changed: `prototype-coverage.md` still covers every inventory screen, the checklist is walked for the changed screens, and the report separates tool-checked from person-reviewed (a check that did not run is skipped, not passed).
5. `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as `D<n>`.
6. `kickoff docs --check` prints `documents up to date`.
7. `kickoff status` shows C3 open, `signoff` in progress and the stale phases the reopen reported.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

Feedback is not a phase: skip `kickoff phase done` here. The commit closes the session; `kickoff:signoff` records the new sign-off.

## Lessons

- Dense, heavy text overwhelmed the reviewer: a visual remark is fixed across the whole product (the rules, the shared parts), not on the one screen it was made about (lessons row 10).
- "Feels like an admin console" is a remark about structure and feel, not a colour: it is a `concept` item, and CD reopens.
- A small change that skips the chain leaves the feature map, the ux-spec, the prototype and the plan disagreeing; the next sign-off then signs something nobody built. Always run the chain in order.
- A late sign-off moved the MVP gate: report gate moves after every session, and end a hard-date slip in an explicit decision.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:signoff`: the customer confirms the changed prototype, and C3 (then C4) is approved again with evidence. After that, re-run the stale phases in order (`kickoff status` lists them first): `kickoff:solution`, `kickoff:plan`, then `kickoff export` again.
