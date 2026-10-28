---
name: plan
description: Use when a kick's shape is agreed and the work must be broken into tasks with range estimates (how much, how sure, based on what) before building starts
---

# Plan

Breaks the work into the task table of the kick's `tasks.md`, each task with when it is done, what it waits for, a range of days, how sure we are and what that rests on. Read `../using-kick/references/plain-words.md` first.

## 1. Companions

Run `kick companions --step plan` and offer what it lists (usually nothing).

## 2. Before you start

Read the brief, the design and the unclear markers (`kick status <name>`). When the shape was not agreed, say what that risks, ask and log the answer. Each unclear marker that changes the work becomes a task, a probe or a range with low confidence.

## 3. The task table

Write rows under `## Tasks` (format below). Keep the heading and the column names in English; the cells are in the docs language.

| Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status |
| --- | --- | --- | --- | --- | --- | --- |
| shell: app shell, design rules in code, key screen | the key screen matches the chosen look | | 2–3–5 | medium | similar shell in an earlier app | todo |

- **Task:** a short key, a colon, the plain title. Add `(probe)` for throw-away work.
- **After:** the keys it waits for. Empty means it can start any time; tasks that can start together run side by side.
- **Days:** `min–likely–max`, or one number for a point estimate. Each task at most about 10 days; split bigger ones.
- **Confidence:** low, medium or high. Low is honest when the task rests on a guess or an unclear point; never raise it to look better.
- **Basis:** what the number rests on: similar work, a probe, or "a guess, nothing to compare with".
- **Status:** todo.

### Product kick: the screens on mock data

Plan the UI stage (the `ui-on-mocks.md` reference of `kick:build`):

1. **shell:** the app shell, the design rules in code, the one API layer, the mock layer, the "sample data" banner.
2. One task per journey or screen group from the screen map, first release first, each with done-when in terms of the journey ("a librarian lends a book in three steps").
3. One `(probe)` task per technical risk from the design.
4. The review rounds and the try-out rounds with real people (two at most per screen).

Then, under `## Finished when`, the criteria for "this is the product": the main journeys can be completed; every screen had at most two rounds of comments; how many unclear points may remain. They are agreed with the plan.

### Product kick without screens

A service, an API or a tool: one task to turn the drafted contract into a mock server or a set of contract tests that the future users (another team, a partner, a script) can call; one `(probe)` task per technical risk; one task to walk the future users through the contract and classify their comments. `## Finished when`: the users agree the contract covers what they need. The `api.md` rows stay `mock` until feature kicks build them.

### Feature kick

One task per piece of real work: endpoints, data, screens, migrations, tests. On a product built on mock data, add per endpoint its contract test and the switch from the mock (the `contract-tests.md` reference of `kick:build`). Pick the first slice: the smallest set of tasks that makes one flow work end to end.

## 4. Totals and review

1. Run `kick check <name>` and fix every error.
2. Run `kick estimate <name>`; for a product, also `kick estimate` (the product total from the roadmap). When a time budget is set and does not fit, propose cuts as a Bounded approval. For a product, ask once whether a share of time goes to coordination (meetings, handovers); when it does, write it as `overhead` (for example `0.1`) in `docs/kick/project/project.yaml`, and say the total with it.
3. For a larger kick, ask the `ecc:planner` agent (read-only) to look for missing work; add what is real.

## 5. Agree

Say the total in plain words, with what it depends on and what you are least sure of:

> Building the screens on sample data comes to between 18 and 31 days, most likely 23. The least certain part is the lending screen, because we don't know yet whether the old scanner works. Shall we start?

On a yes: `agreed: plan` in `kick.yaml`, a dated line in `log.md`, `kick check <name>`.

## Verify

`kick check <name>` reports no errors, and `kick estimate <name>` prints the totals you told the person.

Then hand over to `kick:build`.
