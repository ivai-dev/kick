# Changelog

All notable changes to this plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.7.0] - 2026-10-21

Design studio. Products made with kickoff looked alike: the direction came from a lookup by product type (`ui-ux-pro-max --design-system` gave two of four B2B briefs the same `#2563EB`), and the FE template defaulted to blue and Segoe UI. Now the customer chooses the look from two or three directions drawn from the product's own world, on the real FE v0 screens, before the prototype is built. Spec: docs/plans/2026-10-21-kickoff-v0.7.0.md.

**Breaking:**
- New required plugins: Anthropic `frontend-design` (`/plugin install frontend-design@claude-code-plugins`) and `impeccable` (`/plugin marketplace add pbakaus/impeccable`, then `/plugin install impeccable@impeccable`). `kickoff design doctor` checks them, and `using-kickoff` stops without them.
- `ui-ux-pro-max` is optional and no longer chooses the direction.
- `kickoff phase start` refuses a phase that `kickoff can` blocks.
- Projects keep working without a migration: a project whose prototype had started (or whose sign-off or solution was done) before 0.7.0 skips `design-direction` and CD, and `kickoff status` says so.

### Added

- **Phase `design-direction` and gate CD** ("Customer approved the design direction"), between `fe-foundation` (CF) and `prototype`. The new skill `kickoff:design-direction` writes a design brief, runs impeccable's direction round (seven candidates from the audiences' world, a random roll against the category rut), builds two or three directions as themes of the real FE v0, reviews them, runs the co-design session with the customer (`references/codesign.md`) and locks the chosen one with an ADR.
- **`kickoff design doctor`** (G1 frontend-design, G2 impeccable, G3 impeccable telemetry off in the project, G4 optional skills) and **`kickoff design setup [--dry]`** (telemetry off in `.impeccable/config.json`, impeccable's scratch files git-ignored).
- **`kickoff fe check`:** impeccable's deterministic anti-pattern detector over `apps/web/src` and `packages/ui/src` (findings fail the check; `--skip-detect` reports it as skipped); the direction checks (a CSS file with a dark block per direction, imported by `directions.css`; a locked direction once `design-direction` is done); `--direction <id>` sweeps in one direction.
- **`@kickoff/kit` 0.7.0:** a Direction switch and a **Tweaks** panel in the prototype bar (brand hue and chroma, corner radius, motion, a live contrast reading of the primary button, Reset, a "Copy link" that carries `?direction=` and `?tweak=`); `config.ts` `directions` and `direction`; the manifest reports them; the sweep reads `KICKOFF_DIRECTION`.
- **The `kickoff:art-director` agent:** a read-only distinctiveness and brand-fit review (the swap test, the brief's world, the signature, restraint, the AI-default clusters) in the concept review and the prototype design review.
- `using-kickoff/references/design-tools.md`: how kickoff uses `frontend-design` and impeccable, the files impeccable owns, the rules.
- Lessons row 31.

### Changed

- **The FE template's tokens are neutral** (brand chroma 0, the system font stack) and derive from `--brand-h` and `--brand-c`; `apps/web/src/styles/directions.css` is the new entry for directions.
- `ux-design` no longer picks a direction or runs a concept round; its design system holds the structural rules, and the colour, font, radius and signature rows wait for `design-direction`.
- `fe-foundation` decides no visual direction (CF is technical) and keeps the tokens neutral.
- `prototype` plans each screen with `frontend-design`'s two passes in place of the `ui-ux-pro-max` brainstorm, and uses `/impeccable audit` and `/impeccable polish` before delivery.
- `feedback` gains the class *direction* (the customer rejects the look as a whole), which reopens CD; visual items use impeccable's commands.
- CI installs impeccable's CLI and runs the detector on the example's FE v0.

## [0.6.0] - 2026-10-21

Plan, not tickets. Kickoff no longer manages tickets. It keeps the prototype (FE v0), the feature set, the WBS and the estimate, ends at the baselined plan (C6), and hands the WBS over as files. Spec: docs/plans/2026-10-21-kickoff-v0.6.0.md.

**Breaking:**
- `kickoff tickets …`, the `kickoff:tickets` skill, the `/kickoff-sync` command and the `tickets` phase are gone.
- Projects keep working without a migration:
  - a `tickets: done` entry in `state.yaml` is ignored;
  - `project.yaml` `tracker` and `.kickoff/tickets.yaml` are ignored, and `kickoff validate` warns that they can be deleted;
  - a package `ticket` block is read as `item`, with a warning, until 0.7.

### Added

- **`kickoff export [--out DIR] [--format csv,json,md] [--lang LANG]`** writes `wbs.csv`, `wbs.json` and `wbs-items.md` (default `<docs_root>/06-planning/export/`). Each package is one record: role, effort, deps, release, priority, features, baseline dates, and the `item` fields (title, type, epic, areas, description, acceptance criteria, sprint).
  - The CSV carries a BOM so Excel shows Vietnamese correctly.
  - The output has no timestamps, so a re-export diffs cleanly.
- **The package `item` block** (renamed from `ticket`, without the tracker-only `status` and `milestone`).
- `kickoff ecc setup --router` refreshes a route block written by an older kickoff.

### Changed

- `kickoff status` ends with `done: plan baselined; …; kickoff export hands the WBS over`.
- `kickoff schedule`, `kickoff docs` and the workbook use the plan alone: no actual dates from a tracker.
- The `plan` skill ends with the export.
- `using-kickoff`, `init` (no tracker question), `feedback`, `conventions`, `lessons`, the ECC contract, the AGENTS template and the README describe the handover in place of tracker sync.
- `project.yaml` no longer requires `tracker`.

### Removed

- `tickets.py`, `tracker.py`, `tickets.schema.json`, the GitHub tracker sync and its fake `gh` tests, and the `github` test marker.

## [0.5.0] - 2026-10-21

FE foundation. The prototype is now the real frontend (FE v0): a pnpm monorepo in the project repository, built with React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Router, Query and Table, React Hook Form with zod, and i18next. A mock data layer sits behind a typed API client, which the real API replaces after sign-off. The HTML prototype kit is removed. Spec: docs/plans/2026-10-21-kickoff-v0.5.0.md.

**Breaking:**
- `kickoff proto …` is gone.
- Projects that built their prototype on the kit stay on 0.4.x, or move to the FE v0: `kickoff fe new`, then rebuild the screens on `@app/ui`.
- `project.yaml` `proto` settings are read for one release (`ux_spec`, `forbidden`); new projects use `fe`.

### Added

- **Phase and gate:** new phase `fe-foundation` and gate CF ("Frontend foundation approved", project lead). It decides the presentation stack and the frontend features as *Accepted* ADRs, scaffolds the FE v0, and builds the reference screens. `prototype` now needs CF.
- **`kickoff fe` commands:**
  - `new [--force]`: scaffold, and generate the screen registry, scenarios and stubs from the ux-spec;
  - `update [--dry]`: replace the plugin-owned `packages/kit`;
  - `check [--skip-e2e] [--shots DIR]`: typecheck, lint, tests, build, the e2e sweep, ux-spec coverage and `fe.forbidden`; exit 4 when pnpm or a browser is missing;
  - `bundle`: the one-file customer build for the Artifact;
  - `record`.
- **The FE v0 template** (`cli/src/kickoff/templates/fe`): `apps/web`, `packages/ui` (shadcn components, `DataTable`, `FilterBar`, page header, empty state, combobox), `packages/mocks` (zod contract, seeded generator with stress fixtures, in-memory repository, `ApiClient`), and the plugin-owned `packages/kit` (`@kickoff/kit`).
  - **Router and shells:** hash routes `#/<role>/<screen>?<params>` with a role guard; the `app` and `site` shells.
  - **Prototype bar:** role, screens, theme, density, release scope, scenario player; hidden with `?demo=0`.
  - **Components and styles:** `Rel`, `Placeholder`, and the foundation CSS (density, type roles, motion, no forced upper-case in Vietnamese).
  - **Checks:** the Playwright sweep (screens × roles × 1440/390 px × light/dark: errors, one `h1`, no sideways scroll, axe; scenarios; the single file from `file://` and a sandboxed iframe), the manifest script, and the ESLint rules.
  - **Versions:** pinned with `minimumReleaseAge` of 14 days and a committed lockfile.
- **ECC frontend components** in the manifest and the skills: `react-patterns`, `vite-patterns`, `react-testing`, `contract-first`, `make-interfaces-feel-better`, `motion-foundations`, `ui-demo`, and the `react-reviewer` agent.
- **CI job `fe`:** scaffolds `examples/mini` and runs `kickoff fe check` end to end.

### Changed

- **Core principle:** the presentation stack is the one stack decision before C3 and C4 (gate CF). Backend, database, architecture, hosting and integrations stay locked.
- **`kickoff:prototype`:** rewritten for the FE v0. The screen checklist, design review loop and lessons now point at the FE v0 checks.
- **Other skills:** `ux-design`, `feedback`, `signoff`, `solution`, `init`, the conventions, the AGENTS template and the review agents describe the FE v0.
- **Pre-write hook:** guards `packages/kit` in place of the kit core.

### Removed

- The HTML prototype kit (Preact and htm, Web Awesome), `kickoff proto new|update|check|lint|bundle|record`, and the CI `kit` job.

## [0.4.1] - 2026-10-21

### Fixed

- **`kickoff proto check` retries transient failures.** The kit loads its libraries from a CDN at run time, so a slow or failed fetch looked like a broken screen. This was seen on CI runners as "prototype not ready", "ui library: timeout" and "Cannot destructure property 'useState' of 'hooks'".
  - A failure that looks transient (not ready, timeout, an undefined library global, a failed fetch) now runs once more, one at a time, with twice the time budget.
  - A failure that repeats is reported as before. One that recovers is printed as `warn: passed on a retry after a transient failure: …`.
- **`kickoff ecc setup --router` works outside a kickoff project.** The router table belongs to the user, not to a project; the GateGuard exemption still needs a project.

## [0.4.0] - 2026-10-21

ECC bridge. ECC (`ecc@ecc` 2.2.3 or later) is now a required companion plugin. Kickoff keeps the gates, state, IDs, documents, plan and tickets; ECC does research, options and reviews, and takes over after tickets. The prototype kit is unchanged (0.5.0 replaces it). Spec: docs/plans/2026-10-21-kickoff-v0.4.0.md.

After updating: run `uv tool install --force "<plugin root>/cli"`, then `kickoff ecc doctor`. In an existing project, run `kickoff ecc setup --dry`, then `kickoff ecc setup`.

### Added

- **`kickoff ecc` commands:**
  - `root`: locates ECC from `installed_plugins.json` (project scope first) or `KICKOFF_ECC_ROOT`.
  - `doctor`: checks D1–D6: installed, version, the components kickoff uses, the hook profile, the GateGuard exemption and the router route.
  - `setup [--router] [--dry]`: exempts `.kickoff/**`, `docs_root` and `AGENTS.md` from GateGuard in `.claude/settings.json` (or in `settings.local.json` when that file holds the value); with `--router`, it also adds the kickoff route to the ecc-router table.
  - `run <script>`: runs an ECC script from the ECC folder, with the project as the current folder.
- **`kickoff hook session-start | pre-write | post-write`,** wired in `hooks/hooks.json`:
  - pre-write refuses hand edits of `state.yaml` and `tickets.yaml`, architecture documents outside `adr/` before C3 and C4, and edits of the kit core;
  - post-write runs `kickoff validate` after an edit of `.kickoff/*.yaml` and sends its errors back to the model.
- **Other new commands:** `kickoff proto record --artifact <link> [--version <n>]` (the only way to write the `prototype` key in `state.yaml`), and `kickoff check-docs <paths…>` (placeholders and forbidden phrases with file and line).
- **Review agents:** `kickoff:viewpoint-reviewer`, `kickoff:craft-auditor`, `kickoff:ia-reviewer` and `kickoff:integrator`, read-only, for the design review loop and the concept round.
- **`skills/using-kickoff/references/ecc.md`:** the ownership rule, the ECC writers kickoff never uses, how to call ECC, GateGuard and the router, and the delegation table.
- Lessons rows 28–30, pressure scenarios 4 and 5, live ECC tests (`pytest -m ecc`), and `docs/plans/ecc-upstream-notes.md`.

### Changed

- **Start-up:** the checks run `kickoff ecc doctor`. `ui-ux-pro-max` is now checked only by `ux-design` and `prototype`.
- **Delegation to ECC:**
  - discovery runs the `ecc:product-lens` diagnostics as a lens;
  - research uses `ecc:search-first` (and `ecc:deep-research` when its MCP server is connected) and `ecc:council` for close decisions;
  - solution gets its options from an `ecc:architect` agent and reviews from `ecc:security-reviewer` and `ecc:database-reviewer` before C5;
  - plan runs `ecc:council` on slip options and an `ecc:planner` review of the baseline WBS.
- **Verify sections** use `kickoff check-docs` in place of manual searches.
- **Hooks:**
  - The SessionStart hook calls `kickoff hook session-start`, and falls back to `kickoff status` with an older CLI. It prints the GateGuard rule in projects that `kickoff ecc setup` has not configured.
  - Hooks report a block as a JSON decision with exit 0, so an older CLI can never block a write.
  - Outside a kickoff project, `kickoff hook` returns before importing anything beyond the standard library.
  - Path guards ignore letter case on Windows.

## [0.3.1] - 2026-10-21

Kit fixes found while a Vietnamese employment-services project adopted 0.3.0 (its foundation work package). Run `kickoff proto update` to take them; no project change is needed, and project rules that padded these targets can be removed.

### Fixed

- Kit audit (A10): EntityCard and ListRow title links were measured by their text, although their stretched overlay makes the whole card or row the target; the audit now measures the overlay. The inline exception follows WCAG 2.5.8: a link is exempt when its block holds other words (a link in a sentence), not only when its parent has its own text node.
- Kit: DataTable first-cell links and buttons, column sort buttons, `Link` back and "see all" variants and SummaryList change links were below `--min-target`; they now take it in both directions.
- Kit: the InfoPopover (toggletip) button, SegmentedControl segments (the ChartCard "Chart · Table" switch) and the Switch were below the target size in touch (40) and kiosk (56), the Switch also in compact (24); the Switch keeps its track and grows a transparent hit area.
- Kit (A7): the ChartCard source line and the release tag used the caption role (12–13 px), below the text minimum of compact, comfortable and touch; both use the meta role. The caption role is for chart axes only.
- Kit: StatusTabs measured its detached tab strip after switching to the select form and could loop its ResizeObserver ("ResizeObserver loop completed with undelivered notifications" in `data-err`). The form now comes from `KIT.logic.tabsForm`, decided once per container width with a 24 px hysteresis, with a node test.

## [0.3.0] - 2026-10-21

Foundation for heavy, inconsistent prototypes: a UI library behind KIT.ui, density modes, quiet type, one overlay set, motion, data-at-volume components, and checks. Spec: docs/plans/2026-10-21-kickoff-v0.3.0.md.

### Added

- Kit: Web Awesome 3.14.0 (MIT, pinned) as the behaviour foundation of KIT.ui overlays, menus, tooltips and toasts; a token bridge from the kit tokens; device-frame scoping for overlays; the library's own words (close buttons) follow the kit language; projects never use library tags.
- Kit: density modes (`data-density` compact · comfortable · touch · kiosk) driving control sizes and type roles; `KIT_CONFIG.density`, per-role and per-user settings, a "Density" switch in the prototype bar; window classes (`data-wc`).
- Kit: role type tokens (`--t-*`) and classes; Inter variable font with optical sizing; weights 400–700; `KIT_CONFIG.fonts`; `<html lang data-lang>`.
- Kit: layout tokens, page types (`page: "data" | "form"`), left-anchored staff pages, 1200 px public container, persistent device frames (`KIT.frame`, `frame` on `register`, `KIT.ui.Persist`, `KIT.ui.FrameScroll`).
- Kit: components Dialog, ConfirmDialog, SidePanel, BottomSheet, Popover, MenuButton, Tip, IconButton, Link, StatusTabs, SegmentedControl, ChoiceGroup, ToggleChip, FilterChip, DisclosureChip, Switch, NumberField, Combobox (diacritic-insensitive), DateField, PeriodPicker, CheckboxGroup, FileDrop, Banner, ErrorSummary, Skeleton, JobProgress, Meter, Count, SectionHead, SubNav, Stepper, Pager, Disclosure, Reveal, DataTable, FilterBar, FilterRail, FilterTray, BulkBar, SavedViews, ShortcutLayer, EntityCard, ListRow, SummaryList, Timeline, ChartCard, ActionBar, Clamp, Num, ReorderList, SettingsLayout, SettingRow, DensityScope, Persist; charts BarList, Funnel, grouped and stacked bars.
- Kit: motion tokens, `commitNav` with View Transitions and a fallback, scroll restore and focus to `h1`, `go(…, { replace })`, `usePresence`, `flip`, `collapseOut`, `Reveal`; reduced motion keeps dissolves; the overlay stack `KIT.overlays` (Escape and Back close the top overlay).
- Kit: `js/logic.js` (pure helpers with node tests) and `js/audit.js` (runtime audit A1–A18, `#kit-selftest` S1–S8, the overlay gallery `#kit-overlays`); `test/overlays.html` and `test/cdp-overlays.mjs` for library upgrades.
- CLI: `proto check` reads runtime audits (`data-audit-fail` fails, `data-audit-warn` prints `warn:`) and runs the self-test; `proto lint` rules L1–L18 with warnings; `proto update` prints migration notes.
- Skills: density, type for Vietnamese and other stacked-diacritic languages, overlays, motion, data at volume (`ux-design` references `foundation-rules.md` and `data-at-volume.md`); a required per-screen `ui-ux-pro-max` brainstorm and data-at-volume audit before each screen is built; screen checklist items 23–32; lessons rows 22–27.

### Changed

- Kit: Table is DataTable, KPI is StatTile, Drawer is SidePanel, Toasts follow the new timing (action toasts persist), `.t-cap` no longer uppercases by default, `.t-body` is the body role, disabled buttons no longer use opacity, the sidebar collapses without a width animation, the site header has no filled button, the account menu is a disclosure navigation, the narrow navigation is a modal drawer, the phone frame zooms instead of scaling, `narrow.html` waits 4 s and relays audit failures.
- CLI: `proto new` no longer writes `--cap-case` into the tokens block (the kit sets it from `lang`).

### Deprecated

- `KIT.ui.Menu` (use MenuButton), `kind: "soft"`, `onRow` on tables, `--ease-spring`, `--d-*`, `--fw-bold`; removed in 0.4.0.

### Removed

- The global reduced-motion kill-switch; spring easing on menus and toasts; `pageIn`, `menuIn`, `toastIn`, `sheetIn`; the kit's `.toasts`, `.toast` and `.info-pop` classes (the legacy `.scrim`, `.sheet*` and `.menu` classes stay until 0.4.0).

### Notes

- Library API differences from the spec table (checked against `dist-cdn/custom-elements.json` 3.14.0): `wa-dialog` and `wa-drawer` report Escape and backdrop close requests with the same `source` (the inner dialog); ConfirmDialog therefore relies on not setting `light-dismiss`. `wa-popover` toggles itself on clicks of a `for` anchor, so the kit sets its `anchor` property instead. `wa-toast` removes its items after they hide, so the kit creates toast items itself. There is no `vi` translation file; the kit registers its own words with `registerTranslation` from `utilities/localize.js`.
- The self-test needs rendered frames: a `--dump-dom` run renders none, so `proto check` runs it in a headless browser over the DevTools Protocol with a screencast that keeps frames coming.

## [0.2.2] - 2026-10-20

### Added

- Kit: `KIT_CONFIG.site.menu` lists the top-menu screens of the site shell explicitly, so a public page can sit in the site menu without joining the app sidebars.

## [0.2.1] - 2026-10-20

### Added

- Kit: `menu: false` on a screen keeps it out of the site-shell menus (sign-in and registration pages reached from the header buttons, device start screens) while it stays in the app sidebar of other roles.

## [0.2.0] - 2026-10-20

Prototype fidelity and design review, from lessons of a real project (a public employment portal with a Vietnamese UI). Plan: `docs/plans/2026-10-20-kickoff-v0.2.0.md`.

### Added

- Kit: site shell. A role with `shell: "site"` gets a public-site layout: header (brand, organisation line, top menu, account area), page, footer, and on phones a compact header with a menu sheet and an optional bottom tab bar (`tabs` on the role). Configured with `KIT_CONFIG.site = { org, account, accountLabel, signIn, signOut, footer }`; `menu` on a screen overrides its top-menu label; `KIT.site.Header` and `KIT.site.Footer` can replace the defaults.
- Kit: bare screens. `KIT.register(id, { bare })`, with `bare: true` or `(params, role) => boolean`, renders a screen without any shell (device frames such as a kiosk, full-screen start screens).
- Kit: route parameters. `#<screen>[-tokens][?key=value&…]`; integers become numbers, `true`/`false` booleans; `formatHash` writes them back; deep links, the screen index and `proto check` routes keep them.
- Kit: `KIT.t(key, vars)` with `en` and `vi` string packs, chosen from `KIT_CONFIG.lang` or the locale; `KIT_CONFIG.strings` overrides single strings.
- Kit: `--cap-case` token (default `uppercase`) for `.t-cap` and table headers.
- CLI: `kickoff proto update [--dry]` copies the kit core over the project's copies and refreshes `index.html` outside the title, tokens and modules blocks; it never touches project modules and prints what changed.
- CLI: `kickoff proto check` accepts routes with role tokens and parameters (`"sc-08-guest?kiosk=1&id=tt03"`), and `--shots` also writes a narrow (390 px) screenshot.
- CLI: `kickoff proto lint` fails when `languages.ui` is not English and `config.js` sets no `locale`.
- `ux-design`: a shell (`site` or `app`) and a home shape per role; anti-flooding rules (one primary job and one main action per screen, no look-alike blocks, a header sentence that names the task); a concept round with 3–4 options before the design system; a copy guide with voice per audience, a term table, "only what the user needs now", punctuation, letter case and locale formats; craft rules. New references `content-and-craft.md` and `guidance-library.md`.
- `prototype`: the fidelity rule; site shell, bare screens, route parameters and kit strings in the project-file rules; parallel builds split by file with CSS marker sections; the republish check against git; the design review loop in the new reference `design-review.md`.
- Templates: Shell and Home shape columns, screen-content rules, guidance devices and a full Copy guide in `ux-spec.md`; a Craft rules section in `design-system.md`.
- Screen checklist items 13–22 (fidelity, screen codes, localised kit strings, locale formats, letter case, one main action, look-alike blocks, home per role, phone bottom bar, device views).
- Lessons rows 14–21; this changelog.

### Changed

- `kickoff proto new` writes `locale`, `lang` and `shell: "app"` into `config.js` from `languages.ui`, and `--cap-case: none` for vi.
- Every kit string, in the product area and in the prototype chrome, goes through `KIT.t`.
- `prototype` updates an existing prototype with `kickoff proto update` instead of `kickoff proto new --force`.
- `feedback` and `signoff`: material shown to the customer has the real product chrome and the customer's language.
- `examples/mini` refreshed with `kickoff proto update` and given a site role.

### Fixed

- Numbers in non-English prototypes were formatted as en-US ("+7.1%" next to "2.304") because no `locale` was set.
- English kit strings ("No change", "No data yet", "Close") appeared in non-English product UI and prototype chrome.
- Small uppercase labels crowded stacked diacritics in Vietnamese.
- `Button` lost its classes when a screen passed `class` or `cls`.

## [0.1.0] - 2026-10-19

First release: twelve skills from init to tickets with approval gates C1–C6, the `kickoff` CLI (validation, role-based schedule, estimate workbook, generated documents, GitHub tracker sync, prototype kit with `proto new`, `check`, `lint` and `bundle`), and the `ai-minute` and `mini` examples.
