---
name: build
description: Use when a kick's plan is agreed and its tasks are being built - the real screens on mock data for a product kick, or real code through ECC for a feature kick - and when a kick is finished and written back to the project pages
---

# Build

Builds the kick's tasks with ECC, one at a time, keeps the task table up to date, and finishes the kick: the result agreed, the project pages updated, the kick moved to `done/`. Read `../using-kick/references/plain-words.md` first.

## 1. Companions

Run `kick companions --step build` and offer what fits: playwright (the reviewers need screenshots of the running screens; ECC's Chrome DevTools also works), context7 (current library documentation), frontend-design and impeccable for screen work.

## 2. Before you start

When the plan was not agreed, say what that risks (no agreed size, no agreed finish line), ask and log the answer. When the person wants something outside the plan, it goes through `kick:change`.

## 3. The task loop

1. Pick the next task whose `After` tasks are done and whose status is `todo`. Set it to `doing` in `tasks.md`.
2. Hand it to ECC:
   - new behaviour → `ecc:orch-add-feature`;
   - changing what works → `ecc:orch-change-feature`;
   - a defect → `ecc:orch-fix-defect`;
   - a small, clear task → `ecc:tdd-workflow`.

   Give it the task's done-when as the acceptance, and the paths of the brief, the design and the project pages it needs. ECC's own plan approval and commit confirmation are ECC's; they do not replace kick's agreements.
3. When ECC has committed and the done-when holds, set the task to `done`. A decision that changed on the way goes into `design.md` (titled, dated) and a line in `log.md`.
4. A `(probe)` task: write the answer under Technical risks in `design.md`, delete the probe's code, mark it done. When the answer changes the design or the estimate, tell the person in plain words and go through `kick:change`.
5. Run `kick check <name>` after every few tasks; tell the person what is done and what is left (`kick estimate <name> --remaining`) in plain words when they ask, and at every showing.

## 4. Product kick: the real screens on mock data

Follow `references/ui-on-mocks.md` (one API layer, mocks with realistic data and no business logic, every endpoint in the project's API page, costly endpoints priced, probes, reviews on the running screens) and `references/trials.md` (real people try it with tasks; every comment classified now / later / no with its cost; two rounds per screen).

Finish when the criteria under "Finished when" in `tasks.md` hold:

1. Ask: "These screens and features are the product. After this we design the data and build the server side, feature by feature, and changes cost more. Agreed?" On a yes: `agreed: result`, a line in `log.md`.
2. Write back to `docs/kick/project/`: the decisions, the screen map, the look and the design rules to `design.md`; the endpoints (all `mock`, with their roles, states and cost notes) to `api.md`; the main things and how they relate (a draft, no tables yet) to `data.md`; what the product is to `overview.md`.
3. Write `roadmap.md`: **Foundation first** (sign-in, database, deployment, one flow running end to end), then one row per feature with a range, its prerequisites and the release; "later" comments from the trials become rows.
4. `kick check`, `kick estimate`, then `kick done <name>`.
5. Offer to start the Foundation feature kick (`kick:start`).

A product without screens follows the same finish with its contract instead of screens: the users agreed the contract; `api.md` keeps the rows `mock`; the roadmap starts with Foundation.

## 5. Feature kick: real code

Follow `references/feature-build.md`; on a product built on mock data also `references/contract-tests.md`.

Finish:

1. Show the result working and ask: "Does it work the way we agreed? If yes, I'll close this piece of work." On a yes: `agreed: result`, a line in `log.md`.
2. Write back to `docs/kick/project/`: the endpoints this kick made real (`Status` to `real`), its tables in `data.md` and any design change. Check that the roadmap row's Kick cell names this kick (`kick new --roadmap` fills it).
3. `kick check`, then `kick done <name>`.

## Verify

`kick check` reports no errors; `kick status` shows the kick under the finished ones; the project's tests pass in ECC's last run. Report skipped checks as skipped.
