---
name: shape
description: Use when a kick's brief is agreed and the solution, architecture, technology and look must be chosen with the person before tasks are planned
---

# Shape

Settles what is expensive to change, early and with the person: the solution, the architecture, the technology and, when there are screens, how the product is organised and how it looks. Everything is chosen from options that differ in kind, as decision cards.

Read `../using-kick/references/plain-words.md` first. Use the Option decision and Decision card methods (`../using-kick/references/methods.md`) and the design philosophy (`../using-kick/references/design-philosophy.md`).

## 1. Companions

Run `kick companions --step shape` and offer what fits this kick: drawio for diagrams; frontend-design, impeccable and ui-ux-pro-max when there are screens; figma when the team designs in Figma; superdesign when many variants are wanted quickly.

## 2. Before you start

- Read the agreed `brief.md`, `docs/kick/project/` and the unclear markers (`kick status <name>`).
- When understanding was not agreed, say what that risks, ask, and log the answer.

## 3. Product kick

Work through these in order; each choice is a decision card, and each result is a titled, dated decision in the kick's `design.md`.

1. **Solution and architecture.** Ask the `ecc:architect` agent for 2–3 options that differ in kind, with cost, risk and what each makes hard later. Use `ecc:council` when two stay close. Draw the chosen one (drawio when installed, else mermaid). Details: `references/architecture.md`.
2. **Technology.** The frontend stack is firm now, because the real screens are built next. Choose the backend language, framework and hosting too. **The data model and the final API wait** until people have used the real screens: say why when asked.
3. **Technical risks.** List what might not work (an integration, an old device, performance, a migration), each with a small throw-away probe that will answer it during the build.
4. **Screen map.** The journeys of each kind of user, left to right, with the screens under each; a line marks what goes into the first release.
5. **Look and feel.** 2–3 directions that differ in kind, each shown as **one key screen** with real content and the extremes; the person chooses one. Then the design rules. Details: `references/ui-direction.md`.
6. **Product languages.** When the product's text needs two or more languages, record it as a decision with its extra cost.
7. **Rough size.** Draft `docs/kick/project/roadmap.md`: Foundation first (sign-in, database, deployment, one flow end to end), then each feature with a range, confidence and basis, and the first-release cut. Run `kick estimate` and say the range in plain words. Ask once, as an optional question, whether there is a limit on time ("Is there a number of working days this must fit in? If not, we just size it."); write the answer as `budget_days` in `docs/kick/project/project.yaml` (a product) or in the kick's `kick.yaml` (a feature). When `budget_days` is set and the likely total does not fit, propose what to cut (cut, move to a later release, keep and accept the risk) as a Bounded approval.

A product without screens (a service, an API, a tool) skips 4 and 5; its contract is drafted now with `ecc:api-design` and `ecc:contract-first` into `docs/kick/project/api.md`.

## 4. Feature kick

- Reuse `docs/kick/project/design.md`: the look, the rules and the architecture already agreed. Offer options only where the feature has a real choice.
- Decide the feature's data and API here, in the kick's `design.md` (Data and API). Say before changing anything another feature uses.
- A module or a larger feature gets the `ecc:security-reviewer` and `ecc:database-reviewer` agents on the design (read-only, in parallel); save their reports under `<kick>/reviews/<date>/`.
- New screens follow the project's design rules; a screen with a new pattern gets one key screen to agree first.

## 5. Fresh eyes, then agree

1. Ask a fresh agent (the Agent tool, read-only) to read `brief.md` and `design.md` and list contradictions, gaps and unstated assumptions. Fix what is right; turn the rest into unclear markers.
2. Ask in plain words:

   > This is how we'll build it and how it will look: … Before I break it into tasks: is anything wrong? After this, changing the technology or the look costs rework.

3. On a yes: `agreed: shape` in `kick.yaml`, a dated line in `log.md`, `kick check <name>`.

## Verify

`kick check` and `kick estimate`: read the real output. Every decision in `design.md` has its date, its reason and what it gave up.

Then hand over to `kick:plan`.
