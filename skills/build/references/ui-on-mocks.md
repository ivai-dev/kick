# The real screens on mock data

A product kick builds the product's own screens in the chosen frontend stack, with tests, running on mock data. They are kept: this is not a throw-away prototype. Nothing is stored yet, so changes are still cheap.

## Set-up (the `shell` task)

- **The app shell** in the chosen stack: structure, navigation, the design rules in code (tokens, components), the product languages and their formats.
- **One API layer.** Every screen calls the server only through it. Today it answers from the mock layer; a feature kick later points one endpoint at a time to the real server, and the screens do not change.
- **The mock layer** (MSW or the stack's equivalent): one handler per endpoint, with a short delay and a switch to answer with an error, so loading and error states are real.
- **A "sample data" banner** on every screen, in the product language, so nobody mistakes it for the finished product.

## Mock rules

- **Data only, no business logic.** A mock returns data; it never decides (prices, permissions, due dates). Where a screen has to do server work to look right, mark it in the endpoint's details in `docs/kick/project/api.md` so a feature kick moves it to the server.
- **Realistic data** in the product language: real-looking names with accents, long names, many rows, none, odd values. Synthetic only, never real people or internal names.
- **Roles from the start.** Each endpoint states who may see or change what; the mock answers per role.
- **States:** empty, loading, error and paging exist for every list.
- **Every endpoint is a row** in the `## Endpoints` table of `docs/kick/project/api.md`, written as soon as the mock exists: Endpoint, Used by (screens), Roles, Status `mock`, Cost. Its details (what it takes, what it returns, the states) go under Details, marked as a draft: the fields may still change when the server side is built, feature by feature. At the end of the kick, check that every mock the screens call has its row.

## Price the costly endpoints

Before people try the screens, ask the `ecc:architect` agent to read `api.md` and mark endpoints that would be expensive to build for real (a live total over all records, full-text search, real-time updates). Write the reason in the Cost cell. When people ask for more of those during the trials, say the price.

## Probes, side by side

Run each `(probe)` task while the screens are built: the smallest test that answers the risk (connect the old scanner, load 100,000 rows, call the partner's test system). Write the answer in `design.md`; delete the probe's code.

## Reviews on the running screens

After the first full pass of a journey:

1. Capture screenshots of every screen of the journey, for every kind of user who sees it, with the extremes (playwright, or ECC's Chrome DevTools). Save them under `<kick>/reviews/<date>/` with a short journey note per file and a `BRIEF.md`: the product, the kinds of users, the decisions already taken (do not reopen), where the pages are, and the rules for reviewers (read-only, research first, concrete findings, rank P1–P3, synthetic data only).
2. Run in parallel, read-only: one `kick:viewpoint-reviewer` per kind of user, `kick:ia-reviewer`, `kick:craft-auditor` and `kick:art-director`. Each prompt names the absolute paths of the review folder and its `BRIEF.md`, the project's `design.md` (with the design rules), the design philosophy (`skills/using-kick/references/design-philosophy.md` under the plugin root, two levels above the `build` skill's folder) and, for a viewpoint reviewer, the kind of user it speaks for; ask for the report in the docs language. Save each report in the review folder.
3. Run `kick:integrator` on the reports. Its decisions for the person are decision cards; the rest is a list of changes by file.
4. Fix the P1s, then the agreed changes; take new screenshots and compare.
5. Journey tests with `ecc:e2e-testing` keep the journeys working while comments are fixed.

Review per journey, not per screen, to keep the cost down.
