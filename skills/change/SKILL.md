---
name: change
description: Use when something already agreed in a kick must change - the brief, the design, the tasks, or a shared project page such as the API, the data or the roadmap - so everything that depends on it is updated in order and re-agreed
---

# Change

Something agreed changes. Say in plain words what else must follow and what it costs, ask, then update everything in order. Read `../using-kick/references/plain-words.md` first.

## 1. Companions

Run `kick companions --step change` and offer what it lists (usually nothing).

## 2. Trace what follows

Write down the change in one sentence, then follow it through, in this order:

1. **brief.md**: does it change the problem, the users, what is in or out?
2. **design.md**: a decision, the screens, the data or the API of this kick?
3. **tasks.md**: tasks to add, change or drop; their days.
4. **docs/kick/project/**: when the change touches what other features use (an endpoint, a table, the design rules, the roadmap), name those features from the roadmap and the endpoint table.

Comments from people trying the screens are classified in the build step (its trials reference); come here only when one of them changes something already agreed.

## 3. Price it

Run `kick estimate <name>` before and after the edits you plan (or work out the difference by hand) and give the extra days as a range.

## 4. Ask

Present the set as a Bounded approval (`../using-kick/references/methods.md`): what changes, what it means for the person, the extra days, and which agreement it reopens, in their words:

> Adding reservations changes what we agreed about how the app works: two new screens, and the lending screen changes. About 4 to 7 more days. I would check the look of the new screens with you again. Approve, change some rows, or drop it?

Nothing changes before an explicit yes.

## 5. Apply

1. Update the pages in the order above; mark new unknowns `[unclear: …]`.
2. Clear the agreements the change reopens, and every later one, in `kick.yaml` (a change to the brief clears `understand` and everything after it; to the design, `shape` onward; to the tasks only, `plan` onward). Kept agreements stay.
3. A dated line in `log.md`: what changed, why, and the cost the person accepted.
4. `kick check` (and `kick check <name>`) and read the real output.
5. Continue with the first step that is no longer agreed (`kick status <name>` shows it); its agreement is asked again in plain words.

## Verify

`kick check` reports no errors; `kick status <name>` shows the cleared agreements; `log.md` has the line.
