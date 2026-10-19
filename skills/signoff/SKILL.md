---
name: signoff
description: Use when preparing or recording a customer review workshop that signs off the full feature set and locks the MVP
---

# Sign-off

Prepares the customer review workshop on the full-product prototype and records its outcome. The customer signs off the **full** feature set (gate C3), and the customer and the project lead lock the MVP (gate C4). Only then may `kickoff:solution` design the database, technology and architecture.

## When to use

- After `kickoff:prototype`, to prepare the workshop pack and book the workshop.
- After the workshop, to write the sign-off record and record the gates.
- Again after `kickoff:feedback` applied changes the customer asked for, to record the sign-off of the changed feature set.

## Preconditions

- `kickoff can signoff` exits 0 (prototype done).
- `.kickoff/state.yaml` has `prototype.artifact` (the published link or the bundle path) and `prototype.version`.
- The prototype's scenarios run cleanly: the last `kickoff proto check` printed `prototype check passed`.

## Inputs

- `.kickoff/features.yaml` and `<docs_root>/02-requirements/feature-map.md`: the feature set to sign off, by release.
- The prototype: link and version in `.kickoff/state.yaml`, scenarios in `<proto.dir>/js/scenarios.js`.
- `<docs_root>/01-discovery/open-questions.md`: questions due and the Decision log.
- `.kickoff/plan.yaml`: the workshop package, risks, gates, `cut_order`; `.kickoff/project.yaml`: `hard_dates`, `releases`.
- Workshop notes, minutes, e-mails or signed documents after the workshop.
- `templates/workshop-pack.md` and `templates/signoff-record.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

### Before the workshop

1. Run `kickoff can signoff`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start signoff`.
2. **Make the workshop a planned package.** `.kickoff/plan.yaml` must have a package for the sign-off workshop (role `lead`, `coop: Customer`, the first release, `prio: P0`, depending on the prototype package when there is one) and a risk for late sign-off, with `p` and `i` from 1 to 5, a mitigation and a trigger date. Once the date is booked, give the package `schedule: {fixed: [<date>, <date>]}`. If either entry is missing, propose both with the Bounded approval method. A plan with no phases yet also needs a phase and a group for the package (package codes have three levels, quoted: `"1.2.7"`); `kickoff:plan` can complete the draft later.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   After the lead's yes, edit `plan.yaml` with the Edit tool and run `kickoff validate`, then `kickoff schedule`. Report the workshop date and the MVP gate date it prints. Exit 3 means a hard date slips: show the `cut_order` candidates it lists and ask the lead to decide; never move dates by hand. Then run `kickoff docs` to refresh `risk-register.md` and the plan tables.
3. **Write the workshop pack** at `<docs_root>/01-discovery/signoff/YYYY-MM-DD-workshop-pack.md` from `templates/workshop-pack.md`, in the language the lead asks for (customer deliverables). Sections:
   - **Goal:** sign off the full feature set across all releases, and lock the MVP.
   - **Agenda** with timings.
   - **Demo script:** one row per scenario, with its link `#scn-<id>` (appended to the prototype link) and the feature IDs it shows. Every feature in `features.yaml` is shown by a scenario or listed for a walk-through.
   - **Decisions the customer must take:** a table of ID (the `Q<n>` the decision answers), Decision, Options, Recommended, Deadline.
   - **Open questions due:** questions from `open-questions.md` whose needed-by date falls before or soon after the workshop.
   - **Scope-cut order if dates are fixed:** the `cut_order` of `plan.yaml` with the effort each cut frees, as `kickoff schedule` reports it.
4. Commit `docs: sign-off workshop pack`. Sending the pack or the prototype link to the customer is publishing: ask the lead first.

### After the workshop

5. **Write the sign-off record** at `<docs_root>/01-discovery/signoff/YYYY-MM-DD-signoff-record.md` from `templates/signoff-record.md`. Sections:
   - **Date and attendees** by role (and organisation).
   - **Features signed off by release**, referencing `.kickoff/features.yaml` at the commit shown at the workshop (`git log -1 --format=%h -- .kickoff/features.yaml` before any change made after it).
   - **MVP scope:** the features of the first release, and whether the MVP is locked.
   - **Changes requested:** each request quoted, with the role that raised it, handed to `kickoff:feedback`.
   - **Decisions:** `D<n>` entries, also added to the Decision log of `open-questions.md` the same day.
   - **Next steps** with owner roles and dates.

   Write only what the customer said or signed. A gate needs evidence: signed minutes, an e-mail, or the record confirmed by the customer.
6. **If the customer asked for changes:** commit the record, do not approve C3, and invoke `kickoff:feedback` with the Changes requested. It applies them in chain order and reopens C3. When the changed prototype is confirmed by the customer, add a dated confirmation to the record and continue with step 7.
7. **Verify** (section below), then `kickoff phase done signoff` and commit `docs: feature sign-off record`.
8. **Record the gates** only when the record says so, and never on anyone's behalf:
   - C3 when the customer signed off the full feature set: `kickoff gate approve C3 --by Customer --evidence "<record path>"`.
   - C4 when the customer and the project lead locked the MVP (it needs C3): `kickoff gate approve C4 --by "Customer and project lead" --evidence "<record path>"`.

   Commit `chore: approve C3 and C4` (or only C3). If the record signs off the features but leaves the MVP open, approve C3 only and list what blocks C4.

## Outputs

- `<docs_root>/01-discovery/signoff/YYYY-MM-DD-workshop-pack.md`
- `<docs_root>/01-discovery/signoff/YYYY-MM-DD-signoff-record.md`
- `.kickoff/plan.yaml`: the workshop package and the late-sign-off risk; regenerated `risk-register.md` and plan tables
- `<docs_root>/01-discovery/open-questions.md`: decisions taken at the workshop
- `.kickoff/state.yaml`: `signoff: done`, C3 and C4 when the record says so

## Verify

1. Search the pack and the record for `{{`: no placeholder is left.
2. Every active feature in `features.yaml` at the referenced commit appears in the record, as signed off or as a change requested.
3. Every scenario in the demo script exists in `js/scenarios.js`, and `kickoff proto check` prints `prototype check passed` (it runs every scenario; exit 4 is a skipped check, not a pass).
4. `kickoff validate` reports `0 errors`; `kickoff schedule` exits 0, or exits 3 with the lead's slip decision recorded as a `D<n>`; `kickoff docs --check` prints `documents up to date`.
5. Every decision in the record is in the Decision log with its date and source.
6. Search both files with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match. Attendees and owners are roles.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- A late sign-off moved the MVP gate: the workshop is a package in `plan.yaml` with a risk entry, and `kickoff schedule` shows its effect on the MVP gate before the date is booked.
- C3 is the sign-off of the **full** feature set, not only the MVP: features added after the architecture is designed cause the refactors this workflow exists to prevent.
- No evidence, no gate: a verbal "looks fine" in the meeting is a note, not a sign-off.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

With C3 and C4 approved: `kickoff:solution` (`kickoff can solution` now exits 0), and `kickoff:plan` to update the draft plan with the signed-off scope. With changes requested: `kickoff:feedback`, then back here. `kickoff status` names the next step.
