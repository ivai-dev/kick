---
name: prototype
description: Use when building or updating the full-product prototype, in whatever tool the project chooses, that the customer reviews before scope is locked
---

# Prototype

Builds a prototype that covers the **whole** product: every screen of the `ux-spec.md` inventory, for every audience and release, with the MVP line visible and 2–5 guided scenarios for the sign-off workshop. The plugin defines what the prototype must cover and how it is reviewed; the project chooses how to build it (a design tool, code in the project's own stack, an engine vertical slice, paper, a video) and records the choice as an ADR. A "screen" is any unit of experience: a screen, a scene, a level, a flow state.

**Fidelity rule** (principle 8 of `../using-kickoff/references/design-philosophy.md`): the prototype shows what the product will show: its chrome, navigation and wording, in the customer's language. Customer feedback on anything else has no value. Never ship a note that says the prototype differs from the product. The only non-product element is the prototype's own controls (a scenario player, a release switch), and they are kept out of the customer's screens.

## When to use

- After `kickoff:ux-design`, to build the full prototype for the customer review.
- Again when the ux-spec changed (new screens, new rules) or before a workshop. Changes the customer asked for go through `kickoff:feedback`, which calls back into this skill in chain order.

## Preconditions

- `kickoff can prototype` exits 0 (`ux-design` done; `design-concept` and gate CD already passed before it).
- The ux-spec screen inventory is valid: `kickoff validate` reports `0 errors`.
- The tool the project picks in step 2 is available to the team. If it is not, say so and stop: nothing is "checked" with a tool that is missing.

## Inputs

- `ux-spec.md` (`design.ux_spec`, default `<docs_root>/05-design/ux-spec.md`): the screen inventory `| ID | Screen | Roles | Platform | Release |`, behaviour rules, copy guide.
- `<docs_root>/05-design/design-brief.md`, the locked concept record (`concepts.md`) and the project's own `design-rules.md`: the audiences' world, the chosen structure and feel, the signature, the rules each with its test and the accessibility and inclusion targets.
- `.kickoff/features.yaml` (features per screen, releases), `.kickoff/project.yaml` (`languages.ui`, `design.forbidden`, `rules.synthetic_data_only`, releases).
- Philosophy and methods: `../using-kickoff/references/design-philosophy.md`, `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.
- `references/coverage-checklist.md` and `references/design-review.md` in this skill's folder.
- ECC (`../using-kickoff/references/ecc.md`): `ecc:search-first` to look for an existing tool or library before building one. Optional aids for web UI, when installed: `frontend-design`, `impeccable`, `ui-ux-pro-max`; never a dependency, never a source of the look.

## Steps

1. Run `kickoff can prototype`. Exit 1: stop and tell the lead in plain words what is not finished yet (methods.md, Plain words), not the raw `blocked:` lines. Then `kickoff phase start prototype`.
2. **Decide the prototype approach** with the Decision card method, written in plain words (methods.md, Plain words): the lead has not seen this plugin, so the card names no phase, gate, ADR or file. Options are real ways to build this product's prototype (for example a design file; code in the project's own stack; an engine vertical slice for a game; paper or a recorded walk-through). Each shows what the customer will click or watch, who it serves, its cost and where a wrong choice surfaces (usually the workshop). The card says what the lead is choosing ("how we build the clickable model the customer reviews"), what each answer means, that it settles only the tool for the model and not the real product's technology, and what the lead must do (pick one, or ask to see more first). Look for an existing tool first (`ecc:search-first`).

> **Decision card:** a design choice or a gate request is a card: what it decides and locks; 2–3 options, each with what the person will see, who it serves, what it costs and where a wrong choice would surface; a recommendation with its reason; what was assumed; and always "none of these" and "show me first".

   Record the choice as `<docs_root>/04-architecture/adr/ADR-<nnn>-prototype-approach.md` with status `Accepted — <date> (prototype tooling)`. It decides prototype tooling only: backend, database, architecture, hosting and integrations still wait for C3 and C4, and that hard gate stays. State this in the ADR.
3. **Prototype brief and coverage.** With the Interview method, in plain words (methods.md, Plain words), settle the factual fields (which kinds of users are shown, the workshop date); ask "which kinds of users should the customer see this through?", not "which audiences". Scenario choices are Decision cards, also in plain words: describe each scenario as a short story a person would follow, not by feature IDs.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

   Write:
   - `<docs_root>/05-design/prototype-brief.md`: the approach (link to the ADR), the audiences shown, the workshop date, and 2–5 scenarios: one per key journey, each naming the features it shows (feature IDs).
   - `<docs_root>/05-design/prototype-coverage.md`: the **coverage matrix**. One row per inventory screen and audience (role), one column per release (the MVP line is a visible column or divider), and in each cell how the screen is shown, or a ruling why it is not (`Ruling: <decision> — <why> — <cost if wrong>`). A screen with no row, or a cell with neither, is not covered.
4. **Per-screen plan,** before a screen is built. For each screen write: its one job and the next step; its states (default, empty, error, slow, and the project's own); its volume and extremes (none, one, many, the longest name, the worst case, per principle 6); the language and formats; and where the concept's signature appears. Test it with the fit test (design-philosophy, "The fit test"): could this screen belong to any product like it? Revise what fails. Record the plan, and what the test changed, in the build plan. A screen without a plan is not done.
5. **Build plan:** save `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` using the Build plan method, then ask the lead to confirm it in plain words (methods.md, Plain words): the order of the work, what the lead will be able to open after each part, how each part will be checked, which screens or kinds of users are left out and why, and what the lead must answer before the work starts. Do not paste the file path, task codes or screen IDs into the message; name screens as the customer will see them. Tasks, in order: shared parts (the things every screen reuses, as the tool calls them), one task per screen group (the screens of one area, with their states and extremes), the scenarios, then a consistency pass (the same terms, labels, empty states and spacing everywhere).

> **Build plan:** a checklist of tasks, each with files, inputs, verification command and expected output; every task leaves the project working.

   Each task's **Verify** names how that tool is checked, and its **Expected** the observable result. Examples: "open every screen of the scenario and compare each with its coverage-matrix cell"; "run the project's build and lint, then walk the group"; "export the strings and run `kickoff check-docs` on them". Tasks that run in parallel are split by file or by artboard: no two edit the same one.
6. **Run the plan** with the Task run method. After every task, run its Verify and read the real output; fix before the next task. Synthetic data only, in `languages.ui` (`rules.synthetic_data_only`), with no development infrastructure or internal codes in user-facing text (`design.forbidden`). Write files with the file tools, never heredocs. Rulings are listed to the lead at the end of every task group, not only at the end of the phase, in plain words (methods.md, Plain words): "a small call I made without asking: <what>, because <why>; changing it later would cost <cost>; tell me if you disagree".

> **Task run:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.

7. **Pre-delivery review:** walk `references/coverage-checklist.md` and every row of the project's `design-rules.md`, screen group by screen group. Tick each item in the build plan or record a ruling. Run the tool's own checks where it has them (linter, contrast or accessibility check, build) and keep their output as tool-checked evidence.
8. **Design review loop,** after the first full build and before the sign-off workshop, following `references/design-review.md`:
   - inputs: the shared shot set and a brief file;
   - 5–6 read-only reviewer agents in parallel: `kickoff:viewpoint-reviewer` once per audience group, `kickoff:craft-auditor`, `kickoff:ia-reviewer`, `kickoff:art-director` against the design brief and the locked concept. They already ran earlier, on the concepts (`kickoff:design-concept`) and on the spec (`kickoff:ux-design`); here they see the whole product;
   - a cross-review round, then one `kickoff:integrator` plan, findings ranked P1–P3 per screen.

   Show the findings to the lead in plain words (methods.md, Plain words), not as the reviewers' reports: group them as "must fix before the customer sees it", "should fix" and "nice to have", each saying which screen (by the name the customer sees), what a person would run into, who it affects and what fixing it costs. Do not use the reviewer agents' names, the priority codes or screen IDs in the message. The lead decides the open decisions as Decision cards, also in plain words; log each as `D<n>`. Then build in work packages, the shared parts first, each package ending with its Verify. List the rulings to the lead after every package.
9. **Deliver and record.** Sharing the prototype beyond the lead is publishing: ask the lead first, in plain words ("May I share the prototype with <who>? They will be able to open and click it"). Delivery is whatever fits the tool: a private Artifact when the Artifact tool is available and the prototype is a self-contained web file; a link to a design file; a build; a recorded walk-through. For an Artifact, republish to the same URL for each new version; in a new session a publish is refused until the session has read the artifact, so read it, compare it with the recorded version and ask the lead when it matches none. Record the link or path with `kickoff prototype record --artifact "<link or path>"`: it writes `prototype: {artifact, version}` in `.kickoff/state.yaml` and raises the version by one with every publish. `state.yaml` is never edited by hand.
10. **Verify** (section below), then `kickoff phase done prototype` and commit `feat(prototype): full-product prototype v<n>`. List the rulings from `<docs_root>/08-task-plans/<plan>-rulings.md` to the lead, in plain words and without the file name, and ask which ones to revisit.

## Outputs

- The prototype itself, in the approach the ADR names, covering every inventory screen
- `<docs_root>/04-architecture/adr/ADR-<nnn>-prototype-approach.md` (status `Accepted — <date> (prototype tooling)`)
- `<docs_root>/05-design/prototype-brief.md` and `prototype-coverage.md`
- `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` (build plan with per-screen plans, tasks ticked) and `YYYY-MM-DD-prototype-rulings.md`
- The design review folder (brief, reports, cross-reviews, integrator plan; where the lead prefers) and the lead's decisions as `D<n>`
- The link or path, recorded in `.kickoff/state.yaml` `prototype`

## Verify

1. Every row of the inventory (`kickoff validate` lists it) has a coverage-matrix row per audience, each cell filled or ruled; the MVP line and each scenario's features are visible in the matrix.
2. Every item of `references/coverage-checklist.md` and every row of `design-rules.md` is ticked or has a ruling.
3. The design review's P1 findings are fixed or carry a lead decision.
4. `kickoff prototype record` ran for this publish: `.kickoff/state.yaml` has `prototype.artifact` and `prototype.version`, and `kickoff validate` reports `0 errors`.
5. `kickoff check-docs <prototype-brief> <prototype-coverage> <build plan>` prints `check-docs passed`, and so does every text export of the prototype (strings, copy sheet) when the tool has one.
6. The report to the lead is in plain words (methods.md, Plain words) and separates **tool-checked** (what the tool's own checks printed), **person-reviewed** (who walked what) and **assumed**. A check that did not run is skipped, never passed, and a phase with a skipped check the lead has not accepted is not done.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- **A prototype of a few screens hid the rest:** the coverage matrix puts every screen, audience and release in front of the lead before the build.
- **Skipped checks passed as green:** report what ran, what a person reviewed and what was assumed; never "passed" for a check that did not run.
- **"The prototype differs from the product" reached the customer:** feedback on a stand-in is wasted; follow the fidelity rule.
- **Development infrastructure, screen codes and English strings reached the customer:** `design.forbidden`, `languages.ui` and the checklist.
- **Screens built for 15 records could not hold thousands, or none:** the per-screen plan names volume and extremes before the build.
- **Look-alike blocks and a screen that could belong to any product:** the per-screen fit test and the design review loop.
- **A tool choice sneaked in the architecture:** the approach ADR decides prototype tooling only; backend, database, architecture, hosting and integrations wait for C3 and C4.
- **A Figma file, a video or paper does not exempt a prototype from coverage and review:** the tool changes how a check is done, never whether.

## Handoff

`kickoff:signoff`: prepare the customer workshop with the scenarios and the recorded link. Feedback that arrives before the workshop goes to `kickoff:feedback`.
