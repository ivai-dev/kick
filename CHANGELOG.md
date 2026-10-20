# Changelog

All notable changes to this plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

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
