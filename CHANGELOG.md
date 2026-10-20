# Changelog

All notable changes to this plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

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
