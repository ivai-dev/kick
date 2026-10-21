# Kickoff and the design tools

Two design skills are required next to ECC: **Anthropic `frontend-design`** and **`impeccable`** (pbakaus/impeccable). `kickoff design doctor` checks that both are installed (G1, G2), that the project turned impeccable's telemetry off (G3), and reports the optional skills (G4). Every skill that uses them names the command in its own step and points to this file.

## Why

Products made with kickoff looked alike (`lessons.md` row 31). The cause was a lookup: the same product type gave the same palette and fonts, and the template filled the gaps with blue. These tools replace the lookup with judgment and a deterministic check:

- `frontend-design` is a short set of principles: ground the design in the subject's world, choose type and colour on purpose, spend boldness in one place, and test every plan against the brief before building ("would this fit any product like it?"). It also lists the traits AI-generated design clusters around, which the art director checks.
- `impeccable` is a design system for agents: a new-visual-world flow that rolls directions from the audiences' world and shows them on a decision page, 24 commands (`critique`, `audit`, `polish`, `typeset`, `colorize`, `layout`, `bolder`, `quieter`, `distill`, `animate`, `delight`, `harden`, …) and a detector with deterministic anti-pattern rules that needs no model.

## Ownership

**Kickoff owns the records; the tools work.**

- Kickoff alone writes gates, `.kickoff/*`, the design brief, the directions, the co-design record, the direction ADR, `design-system.md` and the FE v0 files.
- impeccable writes its own context files: `PRODUCT.md` (`/impeccable init`, answered from the kickoff documents), `DESIGN.md` (`/impeccable document`, after the lock) and `.impeccable/`. They help impeccable's later commands; they never replace a kickoff record, and a conflict is resolved in favour of the kickoff record.
- impeccable's choices (a dealt direction, a pick) are proposals. The lead shortlists and the customer chooses (gate CD).

## Where each is used

| Phase, step | Tool | Use |
| --- | --- | --- |
| design-direction, step 2 | `kickoff design setup` | telemetry off, scratch files git-ignored |
| design-direction, step 3 | `/impeccable init` | `PRODUCT.md` from the kickoff documents |
| design-direction, step 4 | impeccable's new-visual-world flow | seven candidates from the audiences' world, the roll, the decision page, the shortlist |
| design-direction, step 5; prototype, step 4 | `frontend-design` | the two-pass plan per direction and per screen |
| design-direction, step 7; prototype, step 9 | `/impeccable critique`; the `kickoff:art-director` agent reads `frontend-design` | distinctiveness and brand fit |
| design-direction, step 9 | `/impeccable document` | `DESIGN.md` for the locked world |
| prototype, step 8 | `/impeccable audit`, `/impeccable polish`, the detector on the running app | pre-delivery quality |
| every `kickoff fe check` | impeccable's detector on `apps/web/src` and `packages/ui/src` | anti-pattern findings fail the check (`--skip-detect` reports it as skipped) |
| feedback, visual items | `/impeccable typeset`, `colorize`, `layout`, `quieter`, `bolder`, `distill` | the fix, inside the locked direction |

## Rules

- **The brief wins.** A colour, face or brand rule the customer owns is pinned; every direction keeps it.
- **The floor stays.** Directions and fixes keep the structural rules of `design-system.md`: density per audience, type roles, line heights for stacked diacritics, overlays and consequences, data at volume, copy, contrast AA in light and dark.
- **Detector findings are fixed, or ruled out with a reason.** A rule that does not fit the project goes into `.impeccable/config.json` `detector.ignoreRules` with the reason in the commit message; `--skip-detect` is only for machines without impeccable (CI) and is reported as skipped.
- **Telemetry.** impeccable's roll API deals the directions and never receives project files or names. With telemetry on, it also records which card won; `kickoff design setup` turns that off for customer projects. The lead may turn it back on.
- **impeccable's hooks.** The plugin runs its detector after UI edits and at the end of a turn and shows the findings. Treat them like `kickoff fe check` output.
- **Optional skills.** `ui-ux-pro-max` is a reference for UX guidelines, chart choice and stack rules; never take a palette, font or style from it, and never run `--design-system`. Emil Kowalski's skills (`emilkowalski/skills`) add animation review (`review-animations`, `improve-animations`), worst-case data (`break-ui`) and variant switchers (`prototype`); use them when installed.
