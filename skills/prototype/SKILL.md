---
name: prototype
description: Use when building or updating the clickable full-product prototype (the FE v0 screens) that the customer reviews before scope is locked
---

# Prototype

Builds every screen of the full product in the FE v0: every role, platform and release, with the release scope (the MVP line) and guided demo scenarios for the sign-off workshop. The FE v0 is the real frontend on a mock data layer. `kickoff:fe-foundation` scaffolded it and built the reference screens; this phase builds the rest. It is checked with `kickoff fe check`, reviewed from several viewpoints, bundled into one file with `kickoff fe bundle`, and published as a private Artifact.

**Fidelity rule:** the prototype shows exactly what the product will show: its chrome, navigation and wording, in the customer's language. Customer feedback on anything else has no value. The FE v0 is the product's UI code, so build what the product shows: the site shell, bare screens, or route parameters for device views. Never ship a note that says the prototype differs from the product. The only non-product element is the prototype bar, and customer links hide it with `?demo=0`.

## When to use

- After `kickoff:fe-foundation` and gate CF, to build the full prototype for the customer review.
- Again when the ux-spec changed (new screens, new rules), when the plugin ships a newer `@kickoff/kit`, or before a workshop. Changes the customer asked for go through `kickoff:feedback`, which calls back into this skill in chain order.

## Preconditions

- `kickoff can prototype` exits 0 (fe-foundation done, CF approved).
- The FE v0 is installed (`pnpm install` done) and `kickoff fe check` passed at the end of fe-foundation.
- Node.js 22 or later, pnpm, and Edge or Chrome (or `PW_CHANNEL=chromium` with Playwright's Chromium) for the e2e sweep.
- The `ui-ux-pro-max` skill is available. If it is missing, stop and tell the user: "Install the ui-ux-pro-max skill, then start a new session."

## Inputs

- `ux-spec.md` (Roles and IA with shell and home shape, screen inventory, behaviour rules, Copy guide) and `design-system.md` (Craft rules).
- `.kickoff/features.yaml` (features per screen, releases) and `.kickoff/project.yaml` (`languages.ui`, `fe.*`, `fe.forbidden`).
- The kit guide `packages/kit/README.md`: routes `#/<role>/<screen>?<params>`, `go`, `useScreenParams`, `useRole`, `Rel`, `Placeholder`, the shells, the prototype bar, scenarios and the checks.
- The reference screens and the presets in `packages/ui`, and the mock contract in `packages/mocks`.
- `references/screen-checklist.md` and `references/design-review.md` in this skill's folder; `../ux-design/references/content-and-craft.md`, `guidance-library.md`, `foundation-rules.md` and `data-at-volume.md`.
- ECC (`../using-kickoff/references/ecc.md`): `ecc:react-patterns`, `ecc:react-testing`, `ecc:frontend-a11y`, `ecc:make-interfaces-feel-better`, `ecc:motion-foundations`, the `ecc:react-reviewer` agent, and `ecc:ui-demo` for walkthrough videos.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can prototype`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start prototype`.
2. **Presentation choices** with the lead, using the Interview method: which roles to show (default: every role in the ux-spec); which demo scenarios (2–5, one per key journey, each naming the features it shows); the workshop date. The release scope is always in the build (the prototype bar's *Scope* switch: all releases, MVP only, tagged).

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

3. **Kit update:** when the plugin ships a newer kit, run `kickoff fe update --dry`, then `kickoff fe update`. It replaces `packages/kit` only and prints `migration:` notes; fix them in the first work package. When the ux-spec gained screens, run `kickoff fe new --force`. It rewrites `config.ts`, `screens.ts` and `scenarios.ts` and adds stubs for new screens, keeping existing screen files and project packages. Re-apply your edits to the three generated files afterwards: `git diff` shows them.
4. **Required per screen, before it is built: a `ui-ux-pro-max` brainstorm and a data-at-volume audit.**
   - **Brainstorm:** load `ui-ux-pro-max` and run 2–4 queries. Always use `--domain ux`; add `product`, `chart` or `typography` as the screen needs, and `--stack react` for code patterns. Retry an empty search once. Record the queries, with what was taken or rejected and why, in the screen brief or the build plan.
   - **Data audit:** use `../ux-design/references/data-at-volume.md`: each list's volume, the functions it needs (total, search, filter, sort, paging, bulk, export, history, URL state), the layout per width and the states.
   - A screen without a recorded brainstorm and data audit is not done. Never copy search output you have not checked.
5. **Build plan:** save `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` using the Build plan method and show it to the lead. Tasks, in order:
   1. WP0, the shared library: presets and patterns in `packages/ui`; mock entities, seed and repository functions in `packages/mocks` for every screen group; shared formatters (numbers, dates, units through `config.locale`).
   2. One task per screen group: the screens of one area in `apps/web/src/screens/<id>.tsx`, built from their briefs on the reference patterns, with their device views as route parameters.
   3. Scenarios in `apps/web/src/kickoff/scenarios.ts`.
   4. A consistency pass: the same status labels, page headers, empty states, terms and spacing on every screen.

> **Build plan:** a checklist of tasks, each with files, inputs, verification command and expected output; every task leaves the project working.

   Every task's verification is `kickoff fe check`, and its expected output is `fe check passed`. Tasks that run in parallel are split by file: no two tasks edit the same file, and WP0 owns `packages/ui` and `packages/mocks`.

6. **Run the plan** with the Task run method. After every task, run `kickoff fe check` over everything: typecheck, lint, tests, build, the e2e sweep of every screen, role, width and theme, every scenario, and ux-spec coverage.
   - `kickoff fe check --skip-e2e` is fine while working inside a task, but it never counts as the task's verification.
   - Exit 1 lists the failures: script output, sweep failures, `coverage:` and `forbidden:` lines. Fix them before the next task.
   - Exit 4 means pnpm or a browser is missing: the check was skipped, so stop and report it.
   - A request to skip the full check "to save time" is declined in one sentence: a regression it would catch surfaces tasks later. Run it and report its output.

> **Task run:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.

   How to write the screens:
   - **One module per screen:** `apps/web/src/screens/<id>.tsx` with a default export. Its row in `apps/web/src/kickoff/screens.ts` keeps `code`, `roles`, `platforms` and `rel` equal to the ux-spec; `nav` is its menu group label, and `page` is `data` (lists, queues, dashboards) or `form`.
   - **Shell per role,** from the ux-spec Shell column, in `config.ts`: `shell: "app"` (sidebar) or `"site"` (header, top menu, footer, phone tabs), and `density` per audience (`compact` staff, `comfortable` public desktop, `touch` phones). Never set control sizes per screen.
   - **Exactly one `h1` per screen**, and nothing in the product area that names the prototype: no screen codes, no "demo", no state switches.
   - **Components:** only from `@app/ui` (shadcn on Radix). Use one overlay per task, from the overlay decision table of `../ux-design/references/foundation-rules.md`: `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, `Toaster`. Consequences come from its matrix (undo before confirm). Never import `radix-ui` in `apps/` (the kit's ESLint rule).
   - **Lists at volume:** `DataTable` with server-style paging, sorting and selection, plus `FilterBar`. Keep filters, sort and page in the route params (`go(id, params, { replace: true })`, `useScreenParams()`). While loading, set `aria-busy` on the region.
   - **Data:** screens call the `ApiClient` through TanStack Query, never the seed directly. The seed is deterministic and derives every count from the records. Include the stress fixtures (long names and titles, missing fields, many tags, 0/1/many results). Never type a number that a list beside it contradicts.
   - **Releases:** wrap parts of later releases in `<Rel r="<release>">`, so the *MVP only* and *tagged* scopes show the MVP line. Give whole later screens their `rel` in `screens.ts`.
   - **Route parameters** carry device views (`?kiosk=1`), records (`?id=tt03`) and flow steps, so every view opens from a link and the sweep can reach it.
   - **Language:** all copy follows the ux-spec Copy guide, through i18next with the `languages.ui` file in `apps/web/src/i18n/`. Format numbers and dates with `config.locale` through the shared formatters, never by hand.
   - **Style:** tokens and the type-role classes only (`text-display`, `text-title`, `text-body`, `text-label`, `text-meta`, `text-caption`). No raw hex colours, no inline font sizes or weights, no weight above 700 (the kit's ESLint rules fail them). Use motion from the `--duration-*` and `--ease-*` tokens, and respect reduced motion (`ecc:motion-foundations`). Polish with `ecc:make-interfaces-feel-better`; check accessibility with `ecc:frontend-a11y`.
   - **Tests:** unit-test non-trivial screen logic (`ecc:react-testing`). The kit's sweep covers rendering, errors, one `h1`, phone width and axe.
   - **Never edit `packages/kit`:** a hook refuses it. A kit gap is reported to the plugin maintainers and arrives through `kickoff fe update`; until then, build around it in `packages/ui` or `apps/web`.
   - **Synthetic data only,** in `languages.ui`: invented names, organisations and addresses, and no development infrastructure (`fe.forbidden`).
   - Write every file with the file tools, never with heredocs.

7. **Code review:** after each screen group, run the `ecc:react-reviewer` agent (read-only) on the changed files. Fix CRITICAL and HIGH findings in the same task; record the rest as rulings.
8. **Pre-delivery review:** walk `references/screen-checklist.md` and the pre-delivery checklist in `ui-ux-pro-max`'s `references/pro-rules.md`, screen group by screen group. For screenshots, run `kickoff fe check --shots <folder>` with a git-ignored folder: one full-page screenshot per screen, role, width and theme. Fix what fails and run `kickoff fe check` again.
9. **Design review loop,** after the first full build and before the sign-off workshop, following `references/design-review.md`:
   - inputs: the shared screenshot set and a brief file;
   - 4–5 read-only reviewer agents run in parallel (`kickoff:viewpoint-reviewer` once per audience or role group, `kickoff:craft-auditor`, `kickoff:ia-reviewer`), or the lens set for a foundation pass; they research with cited sources and rank findings per screen P1–P3;
   - a cross-review round;
   - one `kickoff:integrator` plan.
   
   The lead decides the open decisions; log each as `D<n>`. Then build in work packages, the shared library first, each package ending with `kickoff fe check`.
10. **Publish:**
    - Run `kickoff fe bundle`. It writes one self-contained file, `apps/web/dist-artifact/index.html` (hash routing, mock data inline).
    - If the Artifact tool is available, publish that file as a private Artifact, and republish to the same URL for every new version. In a new session, a publish to that URL is refused until the session has read it: read the artifact, compare it with the bundle of the recorded commit, and stop and ask the lead when it matches none; then republish.
    - Otherwise share the file itself (not committed: `dist-artifact/` is git-ignored).
    - Customer links append `?demo=0` only for screenshots. The workshop uses the prototype bar for roles, scope and scenarios.
    - Sharing beyond the lead is publishing: ask the lead first.
    - On request, record scenario walkthrough videos with `ecc:ui-demo` for the workshop pack.
11. **Record** the link with `kickoff fe record --artifact "<link or path>"`. It writes `prototype: { artifact, version }` in `.kickoff/state.yaml` and raises the version by one with every publish. `state.yaml` is never edited by hand (a hook refuses it).
12. **Verify** (section below), then `kickoff phase done prototype` and commit `feat(prototype): full-product FE v0 v<n>`. List the rulings from `<docs_root>/08-task-plans/<plan>-rulings.md` to the lead and ask which ones to revisit.

## Outputs

- Every ux-spec screen built in `apps/web/src/screens/`, the shared library in `packages/ui`, the mock data in `packages/mocks`, the scenarios in `apps/web/src/kickoff/scenarios.ts` (`packages/kit` unchanged)
- `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` (build plan, tasks ticked) and `<docs_root>/08-task-plans/YYYY-MM-DD-prototype-rulings.md`
- The design review folder (brief, reports, cross-reviews, integrator plan; git-ignored or in the task plans as the lead prefers) and the lead's decisions as `D<n>`
- A private Artifact link (or `apps/web/dist-artifact/index.html`), recorded in `.kickoff/state.yaml` `prototype`

## Verify

1. `kickoff fe check` exits 0 and prints `fe check passed`. Exit 4 is a skipped check, not a pass, and the phase is not done.
2. No screen still renders `<Placeholder />`: search `apps/web/src/screens` for `Placeholder`.
3. Every item of `references/screen-checklist.md` and of the `pro-rules.md` pre-delivery checklist is ticked or has a ruling.
4. The design review's P1 findings are fixed or carry a lead decision.
5. `.kickoff/state.yaml` has `prototype.artifact` and `prototype.version` for this publish, and `kickoff validate` reports `0 errors`.
6. `kickoff check-docs apps/web/src packages/ui/src packages/mocks/src` prints `check-docs passed` (no forbidden phrase).

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

Rows 3–11 and 14–27 of the lessons table (`../using-kickoff/references/lessons.md`), as they apply to the FE v0:

- **Render errors** and **dropped imports** surfaced only tasks later: `kickoff fe check` after every task (typecheck plus the sweep's error capture).
- **Wrong width, case and roles:**
  - A phone width that headless screenshots clamped: the sweep sets a real 390 px viewport.
  - Every role saw one role's home: `config.ts` has a home per role, and the sweep opens every screen in every role of its row.
  - A role token in the URL showed another role's content: the router's role guard renders "not available for this role".
- **What reached the customer:**
  - Development infrastructure appeared in the UI: synthetic seed data and `fe.forbidden`, scanned by `fe check`.
  - Dense, heavy text: density from the shell and type-role classes, enforced by the kit's ESLint rules.
  - The team wrote "the prototype differs from the product": the FE v0 is the product's UI; follow the fidelity rule.
  - Screen codes, look-alike KPI rows and system-mechanics text reached the customer: the screen checklist and the design review loop.
  - English strings and en-US numbers appeared in a Vietnamese UI: i18next, `config.locale`, and no forced upper-case in Vietnamese.
- **Patterns:**
  - One task opened a drawer, a dialog or a sheet: one `@app/ui` overlay per task from the decision table.
  - Screens built for 15 rows could not hold thousands: a data audit per screen and `DataTable` with server-style paging on the seeded API.
  - Card slots moved with content length: shared card presets in `packages/ui` and the stress fixtures.
- **Tooling:** a kit fix could reach a project only by overwriting it: `kickoff fe update` replaces `packages/kit` alone.

## Handoff

`kickoff:signoff`: prepare the customer workshop with the demo scenarios and the published link. Feedback that arrives before the workshop goes to `kickoff:feedback`.
