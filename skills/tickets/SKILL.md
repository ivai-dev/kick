---
name: tickets
description: Use when creating, updating or syncing epics, stories and tasks in the tracker from the plan, or pulling tracker progress back into the schedule
---

# Tickets

Creates and updates the tracker issues from the plan, and pulls their progress back into the schedule. The CLI does all tracker work through `gh`: one Epic per feature-map epic, one Story or Task per package with a `ticket` block, sub-issue and blocked-by links, labels, milestones and Project fields. Issues are matched by a hidden key in the body (`<!-- kickoff:1.2.7 -->`), never by title. A push writes to a shared tracker: it always goes through a dry run and the lead's yes.

## When to use

- **Push mode:** after `kickoff:plan`, to create the issues; again whenever `plan.yaml` changed (scope, estimates, dependencies, sprints).
- **Sync mode:** during delivery, to pull issue states and actual dates into the schedule and see which gates moved (the `/kickoff-sync` command runs it).
- To adopt a tracker that already holds issues created by hand.

## Preconditions

- `kickoff can tickets` exits 0 (plan done and not stale). After a feedback session, re-run `kickoff:plan` first.
- `.kickoff/project.yaml` `tracker` has `kind: github`, `org`, `repo`, and `project` (Project number), `assignee`, `milestone`, the priority mapping and, if the org uses issue fields, `issue_fields`. With another kind the push stops: `tracker.kind is not 'github'; nothing to sync`.
- The `gh` CLI is installed and signed in with access to the repository and the Project (`gh auth status`).

## Inputs

- `.kickoff/plan.yaml` (packages with `ticket` blocks, deps, sprints), `.kickoff/features.yaml` (epics), `.kickoff/project.yaml` (`tracker`, `languages.repo`).
- `.kickoff/tickets.yaml`: issue numbers, sync state and pulled actuals. Written by the CLI only; never edit it.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md` (Ask before, Tickets, Owners).

## Steps

### Push mode

1. Run `kickoff can tickets`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start tickets`.
2. Run `kickoff validate`. Fix every error through `kickoff:plan` (an unknown epic or sprint in a `ticket` block is an error). Explain the warnings.
3. Run `kickoff tickets plan`. It prints one line per intended issue: type, title (`[E3] …` for epics, `[1.2.7] …` for packages), parent epic and blocked-by codes. Show the lead a summary: epics, stories and tasks by count, and the packages without a `ticket` block that will get no issue.
4. **Existing issues created by hand:** map each to its key before the first push with `kickoff tickets link <key> <number>` (a WBS code such as `1.2.7` or an epic id such as `E3`). Propose the mapping as one table with the Bounded approval method and link only after the lead's yes.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   A linked issue, or one found without sync state and without the hidden key, is reported as drift and left alone. It is taken over only with `kickoff tickets push --adopt`, which replaces its title and body with the plan's: ask the lead first, naming the issues it will replace.
5. **Dry run:** `kickoff tickets push --dry`. It reads the tracker (no writes) and prints `created`, `updated`, `drift`, `links` and `warnings` lines, then a summary `<n> created, <n> updated, <n> unchanged, <n> drift, <n> mutations (dry run)`. Exit 1 means drift. Show the lead the summary and every created, updated and drift line.
6. **Ask the lead** before the real push: it writes to a shared tracker. Only after an explicit yes, run `kickoff tickets push`.
7. **Report** what was created, updated and linked. Warnings (a Project or org field that could not be set) do not stop the push: name them and the `project.yaml` setting that fixes them.
8. **Drift:** an issue whose title or body was edited in the tracker since the last push is reported, never overwritten; the CLI has no option to force it. Show the lead each drift item next to the issue as it is in the tracker (read-only, for example `gh issue view <number>`), and let the lead choose a side: **plan** (the edit is undone in the tracker, by the lead or with their yes, and the next push updates the issue) or **tracker** (carry the change into the package's `ticket` block in `plan.yaml` through `kickoff:plan`). Re-run `kickoff tickets push --dry` until the item is gone or the lead decides to leave it.
9. After a successful push (the first one completes the phase): **Verify** (section below), then `kickoff phase done tickets` and commit `.kickoff/tickets.yaml` and `.kickoff/state.yaml` with `chore(tickets): push issues to the tracker`.

### Sync mode

1. `kickoff tickets pull`: reads the state of every mapped issue. A closed issue sets its package's actual end date; an issue in progress sets its actual start (today). It prints each change (`<code>: planned end … -> actual …`, `<code>: started …`) and every gate that moved (`gate G5: … -> …`), or `no changes`. It writes `tickets.yaml`.
2. `kickoff schedule`: the gate dates with the actuals. Exit 3 means a hard date slips: present the `cut_order` candidates it prints and ask the lead to decide (`kickoff:plan`, slip decision procedure).
3. `kickoff docs`: `wbs.md` and the `plan.md` tables now show the actual dates.
4. Report the moved gates, the started and finished packages, and any slip.
5. `kickoff tickets push --dry`: planned dates in the issue bodies and fields follow the actuals; show the pending changes and ask before pushing them.
6. Commit `.kickoff/tickets.yaml` and the regenerated documents (`chore(tickets): sync tracker progress`). Sync mode does not change the phase state.

The estimate workbook is the baseline: progress does not change it, and sync mode does not regenerate it. `kickoff:plan` regenerates it when `plan.yaml` changes.

## Outputs

- Issues in the tracker: epics, stories and tasks with sub-issue and blocked-by links, labels, milestone, Project and org fields
- `.kickoff/tickets.yaml`: issue numbers, sync state, pulled actuals
- Sync mode: regenerated `wbs.md` and `plan.md` tables
- `.kickoff/state.yaml`: `tickets: done` after the first successful push

## Verify

1. `kickoff validate` reports `0 errors`.
2. After a real push, `kickoff tickets push --dry` reports `0 created, 0 updated` and `0 mutations`, and `0 drift` unless the lead chose to leave a drift item (a second push changes nothing).
3. Every key that `kickoff tickets plan` lists has an issue number in `tickets.yaml` `items`.
4. Sync mode: `kickoff docs --check` prints `documents up to date` after `kickoff docs`.
5. `ticket` blocks name roles, never people, and match no pattern of `rules.forbidden_phrases` (`kickoff validate` warns on matches).

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Sync matched issues by title and created a duplicate after a rename: issues are created, renamed and linked only through `kickoff tickets push`, which matches them by the hidden body key (lessons row 2).
- The tracker owns state and actual dates; `plan.yaml` owns scope, estimates and dependencies. Change scope in the plan, never in the tracker.
- A push to a shared tracker cannot be taken back quietly: dry run, the lead's yes, then the push.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

Tracking: run sync mode (or `/kickoff-sync`) regularly; `kickoff:feedback` when customer feedback arrives; `kickoff:plan` when scope or estimates change, then push mode again. `kickoff status` names the next step.
