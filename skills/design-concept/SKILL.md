---
name: design-direction
description: Use when a project's visual direction must be chosen with the customer, explored as two or three distinct directions on the real FE v0 screens and locked before the prototype screens are built
---

# Design direction

Finds the product's own look and gets the customer to choose it. The lead and impeccable's direction round turn the audiences' world into two or three directions that differ in kind, not in shade. Each one is built as a theme of the real FE v0, on the reference screens of `kickoff:fe-foundation` with their seeded data. The customer compares them in the published prototype, switches between them, adjusts them with the Tweaks panel and comments. The chosen direction is locked, and the customer approves gate CD. Every later screen is built in it.

**Floor, not ceiling:** the structural rules of `design-system.md` (density, type roles, Vietnamese line heights, overlays, data at volume, copy) hold in every direction. Palette, type, shape language, motion personality, imagery and the signature are free, and they come from this product's world, never from a catalogue default.

## When to use

- After `kickoff:fe-foundation` and gate CF, before any screen beyond the reference screens is built.
- Again when the customer rejects the locked direction (`kickoff:feedback` reopens CD). A remark about one screen's look is a prototype change, not a new direction. On a re-run, unlock first: remove `direction` from `config.ts`, list the directions to compare in `directions` again, and restore their files from git history or write new ones; while `direction` is set, the kit applies it everywhere and hides the switch.

## Preconditions

- `kickoff can design-direction` exits 0 (fe-foundation done, CF approved).
- `kickoff design doctor` exits 0: Anthropic `frontend-design` and `impeccable` are installed. Exit 1: stop, show its `fail:` lines, and tell the user to install them and start a new session.
- The FE v0 is installed and `kickoff fe check` passes; the reference screens exist.

## Inputs

- `<docs_root>/01-discovery/vision-scope.md` and `stakeholders.md`: purpose, users, the customer's brand and constraints.
- `ux-spec.md` (roles, shells, homes) and `design-system.md` (the structural rules every direction keeps).
- The reference screens in `apps/web/src/screens/`, the presets in `packages/ui`, the kit guide `packages/kit/README.md` (Direction switch, Tweaks panel, `?look=` and `?tweak=` links).
- `references/codesign.md` (the customer session) and the templates `templates/design-brief.md`, `templates/directions.md` and `templates/codesign-record.md` in this skill's folder.
- `../using-kickoff/references/design-tools.md`: what `frontend-design` and `impeccable` do here, and which files they own.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can design-direction`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start design-direction`.
2. **Tools:** run `kickoff design doctor`. On `warn: G3`, propose `kickoff design setup` (impeccable telemetry off for this customer project, its scratch files git-ignored) and run it after the lead's yes.
3. **Design brief,** with the lead, using the Interview method:
   - what the customer already owns and must keep: logo, colours, typefaces, brand guide (a pinned constraint beats every direction);
   - each audience's real scene: where, on which device, in what light, how often, under what pressure;
   - two or three products the customer admires and one they dislike, with the reason;
   - the words the customer uses for how it should feel, and anything that must never appear.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

   Write `<docs_root>/05-design/design-brief.md` from the template. Name the category's default page and its predictable opposite (both are the rut), and the mode of each surface: *Operate* for work screens, *Persuade* for public pages that must win a decision, *Read* for help and documents. Then run `/impeccable init` and answer from the kickoff documents. It writes `PRODUCT.md`, impeccable's own context file.
4. **Direction round** with impeccable's new-visual-world flow (`/impeccable` with the brief: a new world for this product):
   - it derives seven candidates from the audiences' world, rolls `concept-seed --scope direction` (the dice break the category rut) and shows the hand on its decision page;
   - the lead picks two or three for the customer: the dealt direction, a challenger, impeccable's pick, or its canon card (the category standard, played straight) when the lead wants one safe option;
   - the shortlist must differ on at least three of these axes: type family, hue family, shape language (radius, borders, depth), density feel, material and imagery;
   - none is one of the AI-default clusters that `frontend-design` lists (cream with terracotta, near-black with one acid accent, the SaaS card kit, template chrome) unless the brief pins it.

   Write one card per direction in `<docs_root>/05-design/directions.md` from the template: thesis, palette, type, shape, motion, the signature, the honest risk, and where it fits each audience.
5. **Build each direction** in the FE v0:
   - one file `apps/web/src/styles/directions/<id>.css`, with a light block `:root[data-direction="<id>"]` and a dark block `:root[data-direction="<id>"][data-theme="dark"]` that repeats every variable the light block sets;
   - brand colours written in terms of `--brand-h` and `--brand-c`, so the Tweaks panel can move them;
   - fonts added as packages (for example `@fontsource-variable/<family>`), never from a CDN; radius, borders, shadows and motion (`--duration-*`, `--ease-*`) per direction;
   - each file imported by `apps/web/src/styles/directions.css` (a project scaffolded before 0.7.0 creates that file and imports it after `tokens.css` in `index.css`), and listed in `config.ts` `directions` with `id`, `name` and a one-line `summary`.

   **The screens are shared:** directions differ in tokens and CSS only. A signature that needs markup goes into a shared component in `packages/ui` with a CSS hook, so every direction renders the same screens with the same data. Per direction, follow `frontend-design`'s two passes: plan the token system, test the plan against the brief ("would this fit any product like it?"), build, then critique from screenshots.
6. **Check every direction:** `kickoff fe check` (the first direction), then `kickoff fe check --direction <id>` for each of the others. Both run impeccable's detector, and the sweep runs axe in each direction. Take screenshots per direction with `kickoff fe check --direction <id> --shots <folder>/<id>` into a git-ignored folder.
7. **Concept review,** in parallel, read-only agents with a `BRIEF.md` as in `../prototype/references/design-review.md`:
   - `kickoff:art-director` on all directions against `design-brief.md`;
   - `kickoff:craft-auditor` for contrast, type and Vietnamese line heights per direction;
   - one `kickoff:viewpoint-reviewer` per main audience group.

   Add `/impeccable critique` per direction on the reference screens. Fix every P1. Then show the lead the directions in the prototype bar and the reviews, using the Bounded approval method, and agree which directions go to the customer and in what order.

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

8. **Co-design session** with the customer, following `references/codesign.md`:
   - publish the bundle (`kickoff fe bundle`, then a private Artifact) with the prototype bar visible; sharing it with the customer is publishing, so ask the lead first;
   - in the meeting, the customer switches directions, plays the scenarios and moves the Tweaks; you make the changes they ask for in the direction files and republish while they watch;
   - remote feedback comes as Artifact comments and as "Copy link" links, which carry `?look=` and `?tweak=` and reproduce exactly what the customer saw.

   Write `<docs_root>/05-design/codesign-YYYY-MM-DD.md` from the template: who took part (roles), what was shown, reactions word for word, the chosen direction and its tweak link, the changes asked.
9. **Lock the direction:**
   - fold the chosen tweak values into the chosen direction file; set `direction: "<id>"` in `config.ts` and keep only that entry in `directions`; delete the other direction files and their imports (they stay in git history, and `directions.md` links the commit);
   - fill the colour, font, radius and signature rows of `design-system.md` Tokens from the locked file;
   - record the decision with the Option decision method as an ADR with status `Accepted — <date> (presentation layer)`: the options are the directions shown, with the customer's verdict and the signature; log it as `D<n>` in the Decision log;
   - run `/impeccable document`, so impeccable's later commands (`audit`, `polish`, `critique`) read the locked world from its `DESIGN.md`.

> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.

10. **Verify** (section below), then `kickoff phase done design-direction` and commit `feat(design): lock the <name> direction`.
11. **Ask for gate CD:** the customer approves the direction; the lead relays their written yes (an email, the signed record, an Artifact comment). Only then run `kickoff gate approve CD --by "Customer" --evidence "<codesign record or commit link>"` and commit `chore: approve CD`.

## Outputs

- `<docs_root>/05-design/design-brief.md`, `directions.md` and `codesign-YYYY-MM-DD.md`
- `apps/web/src/styles/directions/<id>.css` for the locked direction, imported by `directions.css`; `config.ts` `direction` and `directions`
- `design-system.md` Tokens filled for the locked direction
- `<docs_root>/04-architecture/adr/ADR-<nnn>-visual-direction.md` (*Accepted*) and `D<n>` in the Decision log
- impeccable's own files: `PRODUCT.md`, `DESIGN.md`, `.impeccable/config.json`
- `.kickoff/state.yaml`: `design-direction: done`, and CD once the customer approves

## Verify

1. `kickoff fe check` prints `fe check passed`, with impeccable's detector included (no `--skip-detect`). With `design-direction` done it also fails until a direction is locked and its file has a light and a dark block.
2. `directions.md` has a card for every direction shown, and the shortlist differs on at least three axes.
3. The codesign record names the chosen direction, quotes the customer and links the tweak link or comment it came from.
4. The ADR is *Accepted*, names the directions shown, and decides no backend, database, hosting or integration matter.
5. `kickoff check-docs <docs_root>/05-design` prints `check-docs passed`, and `kickoff validate` reports `0 errors`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Projects made with kickoff looked alike: the direction came from a lookup by product type (two of four B2B briefs got the same `#2563EB`) and the template defaulted to blue. Directions now come from each product's world, and the template is neutral (lessons row 31).
- The concept round was shown to the lead as static artboards, so the customer's taste arrived at sign-off, too late to change cheaply. The customer chooses here, on the real screens, with the real data.
- A direction judged on a hero image fell apart on a list of thousands of rows. Every direction is shown on the same reference screens, including the list at volume.
- Write every file with the file tools, not heredocs (a literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:prototype` after CD: it builds every remaining screen in the locked direction. `kickoff status` names it.
