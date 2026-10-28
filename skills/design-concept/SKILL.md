---
name: design-concept
description: Use when a project's design concept (structure, interaction model, pace, tone and visual language) must be explored as two or three concepts that differ in kind, chosen with the customer and locked before the UX specification is written
---

# Design concept

Finds the product's own shape and gets the customer to choose it. The lead turns the audiences' world into two or three concepts that differ in kind, not in shade: in flow and structure, interaction model, navigation, pace, tone and visual language. Each is made visible with the cheapest medium that lets the customer feel it, on the same scenarios. Read-only reviewers check the concepts early. The customer chooses in a co-design session, the chosen concept is locked, and the customer approves gate CD. `kickoff:ux-design` then expands it.

The plugin ships no look, no stack and no rules. Everything here follows `../using-kickoff/references/design-philosophy.md`: the brief decides the form, concepts differ in kind, decisions are visible, judge on the worst case.

## When to use

- After `kickoff:feature-map` and gate C2, before the UX specification.
- Again when the customer rejects the locked concept (`kickoff:feedback` reopens CD). A remark about one screen's look is a prototype change, not a new concept.

## Preconditions

- `kickoff can design-concept` exits 0 (feature-map done, C2 approved).
- The project has a way to make a concept visible to the customer (paper, slides, a mock, a sketch tool, a short vertical slice in the product's own tool). Step 4 picks it.

## Inputs

- `<docs_root>/01-discovery/vision-scope.md` and `stakeholders.md`: purpose, audiences, the customer's brand and constraints.
- `<docs_root>/02-requirements/feature-map.md` and `nfr.md`: what the product does, accessibility, devices, locale.
- `../using-kickoff/references/design-philosophy.md`: principles, the brief questions, the fit test.
- `references/codesign.md` (the customer session) and the templates `templates/design-brief.md`, `templates/concepts.md` and `templates/codesign-record.md` in this skill's folder.
- `../prototype/references/design-review.md`: how to write `BRIEF.md` and run the read-only reviewer agents.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can design-concept`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start design-concept`.
2. **Design brief,** with the lead. Facts the documents do not give (what the customer owns, the references and what they dislike, the feeling words) use the Interview method; every choice uses the Decision card method, with the options made visible in the same message.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

> **Decision card:** a design choice or a gate request is a card: what it decides and locks; 2–3 options, each with what the person will see, who it serves, what it costs and where a wrong choice would surface; a recommendation with its reason; what was assumed; and always "none of these" and "show me first".

   Write `<docs_root>/05-design/design-brief.md` from the template, answering for each audience the questions of "The brief decides the form" (job, scene, rhythm, feeling, references). Also:
   - **pinned constraints:** brand assets, platform rules, anything the customer owns (they beat every concept);
   - **the category default and its predictable opposite:** say which one this product is closer to and why, as a decision card when the lead is unsure;
   - **the product's archetype in the customer's words** ("a quiet clerk", "a ship's bridge", "a game hub"), before any concept is drawn;
   - **the hardest audience:** the least skill, the worst device or the highest pressure.
3. **Concept round.** Derive three candidate concepts from the audiences' world (their documents, places, rituals, objects; not the tools they operate). Each is a coherent answer to the brief with a thesis. The lead shortlists two or three (put to the lead in plain words: what each concept feels like and who it serves, not IDs or file names). The shortlist must differ on at least three axes: flow and structure, interaction model, navigation and shell, pace and density, tone and voice, material and visual language, motion personality. A shortlist that varies one idea is one option: replace a concept until it is not. Include the category default only when the lead wants one safe option, and say so.
4. **Make each concept visible,** with the cheapest medium that lets the customer feel it:
   - a story: one scenario told as the user lives it, step by step;
   - a paper-style or ASCII layout of the key moments;
   - a clickable mock or a short vertical slice, only when words and layouts cannot show the pace or the feel.

   Use the same two or three scenarios for every concept: the main job of each main audience, a first-time moment, and a **worst case** (no data, far too much, the longest name, an error, a slow connection). Real content in the real language, invented names.

   Write one card per concept in `<docs_root>/05-design/concepts.md` from the template: thesis, structure and flow, interaction model, navigation and shell, pace and density, tone and voice, visual and material language, motion personality, the signature, the honest risk, which audience it serves and which it fails.
5. **Early concept review,** in parallel, read-only agents with a `BRIEF.md` as in `../prototype/references/design-review.md`: `kickoff:art-director` on all concepts against the brief, `kickoff:ia-reviewer` on structure and navigation, one `kickoff:viewpoint-reviewer` per main audience group; `kickoff:craft-auditor` when wording, type or accessibility targets are visible in the material. Then write the **fit test** for each concept to be shown: one short paragraph per question of "The fit test" in the philosophy. Fix every P1 and every concept that fails the fit test, or drop it. Then show the lead the concepts and the reviews and agree which go to the customer and in what order.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

   The table lists one row per concept: shown or dropped, its position, the reviewers' P1 findings, the fit-test verdict.
6. **Co-design session** with the customer, following `references/codesign.md`. The material goes to the customer by whatever the project uses; sharing it beyond the lead is publishing, so ask the lead first. Write `<docs_root>/05-design/codesign-YYYY-MM-DD.md` from the template: who took part (roles), what was shown and in what order, reactions word for word, the chosen concept and what was mixed or changed, and who approves CD and how.
7. **Lock the concept:**
   - write the chosen concept's final card in `concepts.md` (changes agreed in the session folded in) and mark the verdict on every card;
   - record the decision with the Option decision method as an ADR in `<docs_root>/04-architecture/adr/` with status `Accepted — <date> (design concept)`: the options are the concepts shown, with the customer's verdict and the signature. It decides no backend, database, hosting or integration matter. Log it as `D<n>` in the Decision log.

> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.

8. **Set the clarity area** this phase touched: `kickoff clarity set design` with `--status`, `--confidence`, a short `--note` and a `--ref` for the decision `D<n>` behind it. `decided` once the customer chose the concept in the co-design session; `assumed` while the choice is the lead's guess.
9. **Verify** (section below), then `kickoff phase done design-concept` and commit `feat(design): lock the <name> concept`.
10. **Ask for gate CD** with a decision card whose subject is the gate, put to the customer in plain words (`../using-kickoff/references/methods.md`, Plain words; no gate names, IDs or file names): what the customer agrees (the structure and feel of the product, the chosen concept), what becomes expensive to change afterwards (every screen built on it), the rulings taken without them so far, the open risks, and what you are least sure of. The lead relays the customer's written yes (an email, the signed record, a comment). Only then run `kickoff gate approve CD --by "Customer" --evidence "<codesign record or commit link>"` and commit `chore: approve CD`.

At the end of every group of steps and at the gate, list the rulings you took without the lead (`Ruling: <decision> — <why> — <cost if wrong>`) and ask which to revisit.

## Outputs

- `<docs_root>/05-design/design-brief.md`, `concepts.md` and `codesign-YYYY-MM-DD.md`
- `<docs_root>/04-architecture/adr/ADR-<nnn>-design-concept.md` (*Accepted*) and `D<n>` in the Decision log
- `.kickoff/clarity.yaml`: `design` set
- `.kickoff/state.yaml`: `design-concept: done`, and CD once the customer approves

## Verify

1. The shortlist shown to the customer differs on at least three axes, and `concepts.md` says which.
2. `concepts.md` has a card for every concept shown, with the customer's verdict on each, and a fit-test paragraph per question for every concept shown.
3. The co-design record names the chosen concept, quotes the customer word for word and names who approves CD.
4. The ADR is *Accepted*, names the concepts shown, and decides no backend, database, hosting or integration matter.
5. `kickoff check-docs <docs_root>/05-design` prints `check-docs passed`, and `kickoff validate` reports `0 errors`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- The customer's taste arrived at sign-off, after the whole prototype was built, too late to change cheaply. The customer chooses structure and feel here, before the spec is expanded.
- A concept judged on a hero image fell apart on a list of thousands of rows. Every concept is shown on the same scenarios, including the worst case.
- Products made with kickoff looked alike because the look came from a lookup by product type. The brief decides, and the category default is named and tested.
- A game came out as a management console: structure was decided alone and early, and the only thing the customer chose was colour. The shortlist now differs in structure and feel, and the customer chooses between them.
- Write every file with the file tools, not heredocs (a literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:ux-design` after CD: it expands the chosen concept into the full UX specification. `kickoff status` names it.
