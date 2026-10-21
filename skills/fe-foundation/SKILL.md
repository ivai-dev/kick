---
name: fe-foundation
description: Use when deciding a project's presentation stack and frontend features and scaffolding the FE v0 monorepo the design directions and prototype screens are built in
---

# FE foundation

Decides the presentation stack and the frontend features with the lead, records each decision as an *Accepted* ADR, and scaffolds the FE v0. The FE v0 is the real frontend of the product, a pnpm monorepo in this repository (`apps/web`, `packages/ui`, `packages/mocks`, `packages/kit`), with a mock data layer behind a typed API client. It then builds 2–3 reference screens for real, on the template's neutral tokens, and asks the lead to approve gate CF. `kickoff:design-direction` dresses those same screens in the directions the customer compares; `kickoff:prototype` builds every other screen on the locked direction.

**Scope rule:** only the presentation layer is decided here. Backend, database, system architecture, hosting and integrations wait for C3 and C4 (`kickoff:solution`). The mock data layer stands in for all of them. A request to "also pick the database while we are at it" is declined in one sentence and noted for `kickoff:solution`.

## When to use

- After `kickoff:ux-design`, before the first screen is built.
- Again when the lead changes the stack or a frontend feature: reopen CF (`kickoff gate reopen CF --reason "<why>"`). The prototype phase then becomes stale and is re-run.

## Preconditions

- `kickoff can fe-foundation` exits 0 (ux-design done, C2 approved).
- `ux-spec.md` (screen inventory, a shell per role) and `design-system.md` exist.
- Node.js 22 or later and pnpm are installed (`pnpm --version`). Edge or Chrome is installed for the e2e sweep, or `PW_CHANNEL=chromium` is set after `pnpm --filter web exec playwright install chromium`.

## Inputs

- `ux-spec.md` (roles, shells, homes, screen inventory, behaviour rules, Copy guide) and `design-system.md` (structural tokens, type scale, density, motion, components).
- The NFRs in `<docs_root>/02-requirements/nfr.md` (accessibility, browsers, localisation, performance, offline).
- `.kickoff/features.yaml` (features per screen and release) and `.kickoff/project.yaml` (`languages.ui`, `fe.*`, `rules.forbidden_phrases`).
- ECC (`../using-kickoff/references/ecc.md`): `ecc:react-patterns`, `ecc:vite-patterns`, `ecc:react-testing`, `ecc:contract-first`, `ecc:search-first`, `ecc:council`.
- The kit guide `packages/kit/README.md` after `kickoff fe new`.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can fe-foundation`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start fe-foundation`.
2. **Decisions,** one at a time with the Option decision method, each recorded as an ADR in `<docs_root>/04-architecture/adr/` with status `Accepted — <date> (presentation layer)`:

> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.

   1. **Platform:** a single-page app, or a PWA when an NFR asks for offline use or installation. Server rendering is out of scope for the FE v0; an NFR that needs it (public SEO pages) is recorded as an open decision for `kickoff:solution`.
   2. **Frontend features:** UI languages and locales, density modes, themes, data-at-volume patterns (server-style paging, filters and sort in the URL), the auth shape (role switch and session as a mock), file upload, charts, realtime indicators, printing and export.
   3. **Libraries:** the official stack of the template (React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Router, Query and Table, React Hook Form with zod, Motion, Lucide, Recharts, i18next). An addition or a replacement needs a reason tied to a feature or NFR ID. Research it with `ecc:search-first`, check its licence and maintenance, and run `ecc:council` when two candidates stay close.
3. **Scaffold:** `kickoff fe new` writes the monorepo, `apps/web/src/kickoff/{config,screens,scenarios}.ts` and one stub per ux-spec screen. Then run `pnpm install` and commit `chore(fe): scaffold the FE v0`. In the generated `config.ts`, set each role's `shell` (`app` or `site`) and `density` from the ux-spec. Never edit `packages/kit`: it is plugin-owned, `kickoff fe update` replaces it, and a hook refuses edits.
4. **Structural tokens:** copy the design-system's structural values (type roles, density, spacing, motion durations) into `apps/web/src/styles/tokens.css`, keeping the CSS variable names of `@app/ui` and `@kickoff/kit`. Leave the colours, font and radius at the template's **neutral** values (brand chroma 0, the system font stack): the visual direction is not decided here, and a neutral foundation keeps it from being decided by default. `kickoff:design-direction` writes the directions.
5. **Mock contract** (`ecc:contract-first`): one zod schema per entity in `packages/mocks/src/contract/`, with the fields the screens show and the states of the behaviour rules. Add a deterministic seed generator at realistic volume with the stress fixtures of `../ux-design/references/data-at-volume.md`, and the in-memory repository behind the `ApiClient` interface. Screens use the API client through TanStack Query, never the seed directly. The contract is the first draft of the API that `kickoff:solution` designs.
6. **Reference screens:** build 2–3 screens for real, chosen to cover the main patterns: a list at volume, a form, and a home or public page. Use `ecc:react-patterns` and `ecc:vite-patterns` for the code, `ecc:react-testing` for unit tests of non-trivial logic, and the screen plan and data-at-volume audit of `kickoff:prototype` step 4 (structure, hierarchy and states; the look comes later). These screens become the patterns every later screen copies and the canvas on which `kickoff:design-direction` shows each direction.
7. **Shared library:** add project components and presets to `packages/ui` (for example an entity card, a status badge with the status vocabulary, a page header per page type) instead of styling screens one by one.
8. **Verify** (section below), then `kickoff phase done fe-foundation` and commit `feat(fe): FE v0 foundation`.
9. **Ask the project lead to approve CF:** show the ADRs, the reference screens (run `pnpm dev`, or `kickoff fe bundle` and open the file) and the output of `kickoff fe check`. Only after an explicit yes, run `kickoff gate approve CF --by "Project lead" --evidence "<commit or record link>"` and commit `chore: approve CF`.

## Outputs

- `<docs_root>/04-architecture/adr/ADR-<nnn>-<slug>.md`: one *Accepted* ADR per presentation decision
- The FE v0 monorepo: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `apps/web`, `packages/ui`, `packages/mocks`, `packages/kit`
- `apps/web/src/styles/tokens.css` with the structural values and neutral colours; the mock contract and seed in `packages/mocks`; 2–3 built reference screens
- `.kickoff/state.yaml`: `fe-foundation: done`, and CF once the lead approves

## Verify

1. `kickoff fe check` prints `fe check passed`: typecheck, lint, unit tests, build, the e2e sweep of every screen and role at 1440 and 390 px in light and dark, and ux-spec coverage. Exit 4 is a skipped check, not a pass, and the phase is not done.
2. Every decision of step 2 has an ADR with status *Accepted* and the feature or NFR IDs that drive it. No ADR decides a backend, database, hosting or integration matter.
3. `apps/web/src/styles/tokens.css` holds the design-system's structural values and still the neutral colours, and no screen or component uses a raw colour (the kit's ESLint rules pass within `fe check`).
4. `kickoff check-docs <docs_root>/04-architecture/adr packages/mocks/src` prints `check-docs passed`.
5. `kickoff validate` reports `0 errors`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- The HTML prototype kit grew with every project, and everything built on it was thrown away after sign-off. The FE v0 is the product's own UI code, and only its data layer is a mock.
- Checks that did not run in a real browser missed render errors and sideways scroll at phone width. The e2e sweep of `kickoff fe check` covers every screen, role, width and theme.
- A screen built before the shared patterns existed was rebuilt twice. Reference screens and `packages/ui` presets come first.
- Projects inherited the template's blue and Segoe UI and looked alike. The foundation stays neutral; the customer chooses the look in `kickoff:design-direction` (lessons row 31).
- Write every file with the file tools, not heredocs (a literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:design-direction` after CF: it shows the customer two or three directions on these reference screens and locks one (gate CD). Then `kickoff:prototype` builds every remaining screen. `kickoff status` names it.
