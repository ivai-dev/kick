---
name: ux-design
description: Use when expanding the customer-approved design concept into the UX specification (audiences and structure, screen inventory, behaviour rules, copy guide and the project's own design rules) before building a prototype
---

# UX design

Expands the chosen concept into the full UX specification: for each audience its entry, structure and navigation in the concept's own vocabulary; every screen (or scene, level, flow state) of every release and platform; behaviour rules, states, copy and accessibility targets; and the project's own `design-rules.md`, derived from the brief and the NFRs. It is tool-agnostic and stack-neutral. It ends with an early review and a written fit test, so a structural fault is found here and not in the finished prototype.

The spec follows the concept the customer chose. It does not invent a new shape: where the concept leaves a choice open, the lead decides with a decision card. `kickoff validate` reads the screen inventory of `ux-spec.md`, so that table's format is exact.

## When to use

- After the design concept is approved (gate CD), before the first prototype.
- Again when features gain or lose screens, or a design review changes the rules. Customer feedback on screens goes through `kickoff:feedback`, which updates `ux-spec.md` in chain order.

## Preconditions

- `kickoff can ux-design` exits 0 (design-concept done, CD approved).
- `../using-kickoff/references/design-philosophy.md` read.

## Inputs

- `<docs_root>/05-design/concepts.md`, `design-brief.md` and the co-design record; the design-concept ADR.
- `.kickoff/features.yaml` and `<docs_root>/02-requirements/feature-map.md`: epics, features, releases, platforms.
- `<docs_root>/02-requirements/nfr.md`: accessibility, compatibility, localisation, performance targets.
- `<docs_root>/01-discovery/vision-scope.md` and `open-questions.md` (Decision log).
- `.kickoff/project.yaml`: `releases`, `languages.ui`, `design.ux_spec` (default `<docs_root>/05-design/ux-spec.md`), `design.forbidden`.
- `templates/ux-spec.md` and `templates/design-rules.md` in this skill's folder.
- `../prototype/references/design-review.md`: how to write `BRIEF.md` and run the read-only reviewer agents.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can ux-design`. Exit 1: stop, read its output yourself and tell the lead in plain words what is not finished yet and the path to it (methods.md, Plain words), not the raw `blocked:` lines. Then `kickoff phase start ux-design`.
2. **Read the chosen concept,** the brief and the ADR. List what the concept leaves open (how a second audience enters, what happens on a small device, what a scene or screen is called). Confirm only those with the lead, in plain words (`../using-kickoff/references/methods.md`, Plain words: screen and audience names, not IDs or file names), one card per choice (the Decision card method), each option visible (an ASCII layout, a flow sketch, a short story) in the same message.

> **Decision card:** a design choice or a gate request is a card: what it decides and locks; 2–3 options, each with what the person will see, who it serves, what it costs and where a wrong choice would surface; a recommendation with its reason; what was assumed; and always "none of these" and "show me first".

3. **Audiences and structure.** For each audience write, in the concept's own words (not a shipped vocabulary):
   - its **entry:** what the product opens on for it, and why, from its job in the brief;
   - its **structure and navigation:** the parts it moves between and how, using the concept's model (a hub, a map, a menu, a timeline, a loop);
   - its **platforms** and devices.

   Every audience has its own entry on every platform it uses. Give each audience an id of lowercase letters and digits.
4. **Screen inventory.** One row per unit of experience of the full product (screen, scene, level, flow state), across every release and platform. IDs are permanent. Prefixes are free: the ones in `project.yaml`, or `SC-`, `W-`, `A-`, `S-` and the like. The table is the first table in `ux-spec.md` whose first header cell is `ID`, with exactly these five columns and nothing between the rows:

   ```markdown
   | ID | Screen | Roles | Platform | Release |
   | --- | --- | --- | --- | --- |
   | SC-01 | Home | librarian, admin | web | MVP |
   | S-01 | Harbour | player | console | MVP |
   ```

   - Roles and Platform are free text (the audience ids and the platforms the project uses). Release is a release id from `project.yaml`.
   - List each audience's entry before its other rows.
   - A device or mode view of a screen is a note under the screen in the Notes, not a row.
5. **Link features to screens:** set `screens: [SC-01, …]` on every active feature in `.kickoff/features.yaml` (IDs and releases unchanged). A feature without a screen (a background job, an import) gets a line in the ux-spec Notes saying why.
6. **Write `ux-spec.md`** at `design.ux_spec` from `templates/ux-spec.md`, sections in this order: Audiences and structure, Screen inventory, Navigation rules, Behaviour rules (numbered `BR-<n>`), States (empty, loading, error, offline or equivalent), Copy guide, Accessibility and inclusion, Fit test. Navigation and behaviour rules are the project's: each one comes from the concept or the brief, not from a default. The **Copy guide** holds the voice per audience (address, tone, words to use and avoid, one real example) and the formats of the UI locale (numbers, money, dates, times, units, letter case), derived from the audiences and the language. No value comes from this skill.
7. **Write `<docs_root>/05-design/design-rules.md`** from `templates/design-rules.md`: the project's own rules, derived from the brief and the NFRs (principle 4 of the philosophy). Every rule has its reason (brief or NFR ID), a test and where it applies; a rule no test can check stays in the brief. Then:
   - **Accessibility and inclusion targets** from `nfr.md`, each with how it is verified;
   - **Terms:** one name per thing, and the words that never appear in the UI;
   - **Data at its real volume:** for every screen that shows lists, entities or state, write the expected volume and the extremes (none, the typical, the maximum, the longest name, an error) and what the screen does at each. The prototype is built and reviewed on these.
8. **Regenerate and validate:** `kickoff docs`, then `kickoff validate` (it checks the inventory: unique IDs, releases that exist, every feature's screens listed, screens no active feature serves).
9. **Early review,** in parallel, read-only agents with a `BRIEF.md` as in `../prototype/references/design-review.md`: `kickoff:ia-reviewer` on structure, navigation and naming, one `kickoff:viewpoint-reviewer` per audience group on its journeys, `kickoff:art-director` on whether the spec still carries the chosen concept's signature. Write the **fit test** in the spec's "Fit test" section: one short paragraph per question of "The fit test" in the philosophy, on the spec. Fix every P1. Put the reviewers' conflicts and the structural choices the lead must take into decision cards, and log each as `D<n>` in the Decision log.
10. **Set the clarity area** this phase touched (a project from 0.8 has no register yet: run `kickoff clarity init` first): `kickoff clarity set design` with `--status`, `--confidence`, a short `--note` and a `--ref` for the decision `D<n>` behind it. `decided` once the lead agreed the spec and the fit test passes; `validated` only when the customer has confirmed it on the prototype.
11. **Verify** (section below), then `kickoff phase done ux-design` and commit `docs: UX specification and design rules`.

At the end of every group of steps (3–5, 6–7, 9) list the rulings you took without the lead (`Ruling: <decision> — <why> — <cost if wrong>`) and ask which to revisit.

## Outputs

- `<docs_root>/05-design/ux-spec.md` (or the path in `design.ux_spec`) with the Fit test written
- `<docs_root>/05-design/design-rules.md`
- `.kickoff/features.yaml` with `screens` on every active feature
- Decision log entries `D<n>` for the choices the lead took
- `.kickoff/clarity.yaml`: `design` set
- `.kickoff/state.yaml`: `ux-design: done`

## Verify

1. The Screen inventory header is exactly `| ID | Screen | Roles | Platform | Release |`, no earlier table starts with `ID`, and every row has five cells with a unique ID and a release from `project.yaml`.
2. Every screen named in `features.yaml` `screens` is in the inventory, and every inventory screen serves at least one feature.
3. Every audience in "Audiences and structure" has an entry, its structure and navigation, and its platforms, and its entry is the first row of its screens in the inventory.
4. Every rule of `design-rules.md` names its reason, its test and where it applies. The accessibility targets match `nfr.md`.
5. The Copy guide has voice per audience and the formats of the UI locale, and `design-rules.md` has the term table. Every screen that shows lists or entities has its volumes and extremes written.
6. The Fit test has an answer to each of the five questions, and the reviewers' P1 findings are fixed or logged as decisions.
7. `kickoff check-docs <ux-spec.md> <design-rules.md>` prints `check-docs passed` (no placeholder, no forbidden phrase, none of `design.forbidden`).
8. `kickoff validate` reports `0 errors`, and `kickoff docs --check` prints `documents up to date`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- A game came out as a management console: the spec was expanded from a template shaped for web tools, before the customer had chosen a structure. The spec now starts from the chosen concept, and ends with a review and a fit test.
- Every audience saw the first audience's home below a width: give each audience its own entry on every platform it uses.
- A role token in the URL let one audience open another's content: list the audiences of every screen, so the prototype can guard them.
- Screens designed for 15 rows could not hold thousands: write each screen's volume and extremes here and in the screen briefs.
- The product's public pages had a top menu but the prototype showed a sidebar and the team wrote a "differs from the product" note: the spec states the structure the product will have, and the prototype draws exactly that.
- Text that explained system mechanics crowded a screen: only what the user needs now; facts appear when their event happens.
- Formats and letter case crowded the language's own marks ("+7.1%" beside "2.304"): formats come from the UI locale and are written once in the copy guide.
- Projects made with kickoff looked alike because the look came from a lookup by product type: the rules are derived from this brief.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:prototype`, which builds the clickable full product from this screen inventory and the project's design rules. `kickoff status` names it.
