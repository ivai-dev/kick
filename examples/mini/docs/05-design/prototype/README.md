# Prototype kit

A clickable, no-build prototype of the full product: every role, platform and release, with synthetic data only. Plain JavaScript on Preact 10.24.3 and htm 3.1.1 from jsdelivr, with the UI library Web Awesome 3.14.0 (MIT, `@awesome.me/webawesome@3.14.0`, pinned) behind `KIT.ui`; open `index.html` in a browser, publish it as an Artifact, or bundle it into one file with `kickoff proto bundle`.

The prototype is a design artifact. Its CDN use does not relax the product's own rules: the product bundles its fonts and assets, and the product stack is chosen in `kickoff:solution`; the library is prototype tooling only (design documents name behaviour contracts, never the library).

## Files

| File | Edited per project | Purpose |
| --- | --- | --- |
| `index.html` | tokens block and modules block only | Page, design tokens, Foundation tokens, kit CSS, script list |
| `narrow.html` | no | 390 × 844 iframe wrapper used by `kickoff proto check` (also relays runtime audit failures) |
| `js/route.js` | no | Hash parser `KIT.makeParser`, `KIT.formatHash` |
| `js/logic.js` | no | Pure helpers `KIT.logic` (folding, density, window classes, toast timing, paging, sorting, dates, the StatusTabs form, overlay stack, selection, contrast), tested with `node --test` |
| `js/core.js` | no | `KIT` namespace, configuration, `KIT.register`, `KIT.frame`, strings, error capture, `KIT.util` |
| `js/ui.js` | no | `KIT.ui` part 1: buttons, links, tips, the overlay set, toaster, structure and feedback components |
| `js/ui-form.js` | no | `KIT.ui` part 2: fields and choice controls |
| `js/ui-data.js` | no | `KIT.ui` part 3: DataTable family, filters, bulk actions, shortcuts, reorder, settings |
| `js/charts.js` | no | `KIT.charts` SVG charts, `KIT.ui.ChartCard` |
| `js/scope.js` | no | Release scope layer (`KIT.ui.Rel`) |
| `js/shell.js` | no | Start page, prototype bar, app and site shells, frames, Windows and phone frames |
| `js/scenario.js` | no | Guided scenario runner and panel |
| `js/audit.js` | no | Runtime audit, `#kit-selftest`, the internal overlay gallery `#kit-overlays` |
| `js/main.js` | no | App root, navigation (`commitNav`), density, `<html>` check attributes |
| `test/*.test.js` | no | Node tests (`node --test "test/*.test.js"`) |
| `test/overlays.html`, `test/cdp-overlays.mjs` | no | Overlay regression page and its headless run (see `test/README.md`) |
| `js/config.js` | yes | `window.KIT_CONFIG` |
| `js/data.js` | yes | Synthetic sample data (`KIT.D`), generated at realistic volume |
| `js/<area>.js` | yes | Screen modules, one per screen group (`common.js` for project presets) |
| `js/scenarios.js` | yes | `KIT.SCENARIOS` |

Project scripts are listed in `index.html` between `<!-- kickoff:modules:begin -->` and `<!-- kickoff:modules:end -->`, in this order: `config.js`, `data.js`, the screen modules, `scenarios.js`. Each script tag carries `charset="utf-8"`.

## Configuration

```js
window.KIT_CONFIG = {
  product: "Library Loans",
  roles: [{ id: "librarian", name: "Librarian", home: "sc-01" }],
  releases: ["MVP", "R2"],           // the first one is the MVP
  platforms: ["web", "android"],     // subset of "web", "windows", "android"
  defaultRole: "librarian",
};
```

Role ids are lowercase letters and digits only (they appear in the URL).

Optional settings:

```js
window.KIT_CONFIG = {
  // …
  locale: "vi-VN",          // numbers and dates (KIT.util.nf); kickoff proto new sets it from languages.ui
  lang: "vi",               // the kit's own words: "en" or "vi" (default: the locale's language); sets <html lang data-lang>
  strings: { "table.empty": "Không có dòng nào." },   // override single kit strings (keys in js/core.js)
  density: { app: "compact", site: "comfortable", phone: "touch", windows: "compact" },   // defaults per shell
  fonts: ["https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400..700&display=swap"], // replaces the kit's Inter link
  audit: { maxSizes: 6 },   // runtime audit thresholds: change only with the project lead's yes (lint warns, L17)
  roles: [
    { id: "visitor", name: "Visitor", home: "sc-01", shell: "site" },
    { id: "member", name: "Member", home: "sc-02", shell: "site", tabs: ["sc-02", "sc-05", "sc-06", "sc-07"] },
    { id: "librarian", name: "Librarian", home: "sc-10", shell: "app", density: "compact" },
  ],
  site: {
    org: "City Library",                     // line under the product name in the header
    menu: ["sc-05", "sc-06"],                // top-menu screens in order (default: nav screens outside `account`)
    account: "My account",                   // nav label whose screens form the account navigation
    accountLabel: "My account",              // text of the account button (default: the role name)
    signIn: [{ label: "Sign in", go: "sc-03" }, { label: "Register", go: "sc-04" }],   // shown to a visitor
    signOut: "visitor",                      // role that "Sign out" switches to
    footer: ["Opening hours 8:00–17:00"],
  },
};
```

- **Shells.** `shell: "app"` (default) is the work-tool layout: sidebar, top bar, content; below 760 px the sidebar is a navigation drawer. `shell: "site"` is the public-site layout: a header with the brand, the top menu, the account navigation or the sign-in buttons (never a filled button: the last is secondary, the others ghost; below 600 px only the first stays in the header), the page, a footer; below 760 px a compact header with a menu panel and, when the role has `tabs`, a bottom tab bar. A project may draw its own header or footer: `KIT.site.Header = function () { … }`, `KIT.site.Footer = …` (read `KIT.useApp()`). The prototype must show the shell the product will have.
- **Letter case.** `.t-cap` and table headers keep the letter case (`--cap-case`, default `none`); languages that want small capitals set `--cap-case: uppercase` in the tokens block.
- **Fonts.** The prototype loads Inter (variable, optical sizes 14–32, weights 400–700) and JetBrains Mono from Google Fonts in `<head>`; the product self-hosts a latin + vietnamese subset. `KIT_CONFIG.fonts` accepts only `https://fonts.googleapis.com/css2?…` URLs (lint L7). Never load fonts from a module.
- **Kit strings.** Every word the kit shows goes through `KIT.t(key, vars)`: the `en` and `vi` packs, then `strings`. The library's own words (close buttons) follow the same language.

## Screens

```js
KIT.register("sc-02", { comp: Loans, code: "SC-02", name: "Loans", roles: ["librarian"], platforms: ["web"], rel: "MVP", nav: "Library", icon: "book", page: "data" });
```

- Defaults: `roles` every role, `platforms` `["web"]`, `rel` the first release, `page` `"data"`. `nav` is the sidebar (or phone tab bar) section label; a screen without `nav` is reached only through links. `icon` is a `KIT.ui.Icon` name. In the site shell `menu` overrides the top-menu label (`menu: false` keeps the screen out of the site menus) and `tab` the bottom-tab label.
- `page: "data" | "form"`: staff pages start next to the sidebar (the page title is at the same x on every console page); data pages (tables, queues, dashboards) are fluid to 1600 px, form and detail pages stop at 1200 px.
- `density`: a per-screen density (rare; the shell decides).
- `bare: true` or `bare: (params, role) => boolean` renders the screen on the stage without any shell. `frame: "kiosk"` (or `(params, role) => name`) renders it inside the project's frame component, registered once with `KIT.frame("kiosk", KioskFrame)`: the frame receives `{ children }`, owns `data-frame`, `data-density`, zoom and its head, dock and footer (mark them with `KIT.ui.Persist`), and wraps its scrolling body in `KIT.ui.FrameScroll` (it becomes `#kit-content`). The frame stays mounted across routes; only the body changes.
- The route id is the ux-spec code in lower case. A component takes no props: it reads `KIT.useApp()` → `{ role, theme, resolved, lens, platform, params, screen, narrow, layout, density, wc, coarse, go, back, toast, dismiss, setRole, setTheme, setLens, setPlatform, setDensity }`.
- The shell gives each screen its container (`.page`, `.site-page`, `.m-content`, `.frame-body`); a screen returns its sections only, and exactly one `h1` (use `KIT.ui.PageHeader`, whose `h1` has `tabindex="-1"` and takes focus after a route).
- Role guard: a screen whose `roles` exclude the current role renders `KIT.ui.Denied`, never the screen.
- Navigate with `KIT.go(id, params, { replace })` or `useApp().go`. `replace: true` changes params (filters, tabs, paging) without a history entry, a transition or a remount. Below 760 px a screen with an `android` platform shows as the phone app and every other screen in the responsive web shell; on wider windows `android` screens show in the phone frame and `windows` screens in the Windows frame.

## Density modes

One attribute, `data-density="compact | comfortable | touch | kiosk"`, drives control sizes and the type roles. `main.js` stamps it on `<html>` (overlays and toasts read it there) and the shells repeat it on their root.

| Mode | Where | Controls (`--ctl-h`) | Body text |
| --- | --- | --- | --- |
| compact | staff consoles (app shell) | 32 | 14/20 |
| comfortable | public desktop (site shell) | 40 | 16/24 |
| touch | phones, below 760 px, a coarse pointer on the site shell | 48 | 16/24 |
| kiosk | the kiosk frame (864 px layout) | 64 | 21/32 |

Resolution (`KIT.logic.resolveDensity`): frame → screen → the user's choice (app shell only, `A.setDensity("compact" | "comfortable" | null)`, also in the prototype bar) → touch for phone layouts, narrow windows and coarse pointers on the site shell → the role's `density` → `KIT_CONFIG.density` for the shell. `KIT.ui.DensityScope({ mode })` sets a density for a part of a screen. Window classes (`compact < 600 · medium < 840 · expanded < 1200 · large < 1600 · xlarge`) are stamped as `<html data-wc>` and given as `useApp().wc`.

Components read only density tokens (`--ctl-h`, `--ctl-h-sm`, `--ctl-h-lg`, `--chip-h`, `--tag-h`, `--row-h`, `--card-p`, `--section-gap`, …); never write a literal height on a control (lint L8).

## Type roles

Each role is a `font` shorthand token per density: `--t-display`, `--t-headline`, `--t-title-l`, `--t-title`, `--t-body-l`, `--t-body`, `--t-prose`, `--t-body-s`, `--t-label`, `--t-button`, `--t-meta` (the smallest size allowed outside charts: source lines, release tags), `--t-caption` (chart axes only; below the A7 minimum anywhere else), `--t-figure`, `--t-figure-l`, `--t-value`, `--t-code`. Classes: `.t-display .t-headline .t-title-l .t-title .t-body .t-body-l .t-prose .t-body-s .t-label .t-strong .t-meta .t-cap .t-caption .t-figure .t-figure-l .t-value .t-code` (0.2 names `.t-h1 .t-h2 .t-h3 .t-ui .t-kpi .mono` are aliases). Weights 400 · 500 · 600 · 700 (700 only for display), never 800. Line height ≥ 1.2 on any text box, ≥ 1.34 where text wraps, ≥ 1.5 (or `.12em` padding) where text is clipped: use `.clamp1`, `.clamp2`, `.clamp3` or `KIT.ui.Clamp`. No negative letter-spacing. At most 6 sizes per screen.

Kit token defaults are declared with zero specificity (`:where(…)`) after the tokens block, so a project's `:root { … }` or `[data-density="…"] { … }` in its tokens block always wins.

## KIT.ui

| Group | Components |
| --- | --- |
| Commands and links | `Button` (kinds `primary · secondary · ghost · danger · act · link`, sizes `sm · md · lg · xl`, `loading`, `unavailable` reason, `href`), `IconButton`, `Link` (`go`, `variant` back · more), `Tip`, `Icon` |
| Overlays | `Dialog` (`size` s · m · l · full, `kind` transactional · passive, `dirty`), `ConfirmDialog` / `Confirm` (`question`, `consequence`, `confirmLabel`, `typeToConfirm`), `SidePanel` / `Drawer` (`modal`, `size`, `side`, `pager`, `onExpand`, `dirty`), `BottomSheet` / `Sheet`, `Popover` (`anchor`), `MenuButton` (`items` with `danger`, `unavailable`, `sub`), `InfoPopover`, `Menu` (legacy) |
| Feedback | `A.toast(msg, { icon, tone, action, ms, key })` and `A.dismiss(id)` (the `Toaster`), `Banner`, `ErrorSummary`, `EmptyState` (`kind`, `art`), `Skeleton`, `JobProgress`, `Meter`, `Count`, `StatusChip`, `Num` |
| Structure | `PageHeader` (`title`, `sentence`, `back` { label, go }, `info`, `actions`), `SectionHead`, `SubNav`, `StatusTabs` / `Tabs`, `Stepper`, `Pager` (`mode` numbers · more · cursor), `Disclosure`, `Reveal`, `Card` / `Surface` (`tone`), `StatTile` / `KPI`, `EntityCard` (`layout` vertical · row), `ListRow`, `SummaryList`, `Timeline`, `ActionBar`, `Clamp`, `ChartCard`, `BarList`, `Funnel` |
| Fields and choice | `Field` (`span` 1–6, `width` num3 · money · date · phone · tax · id · commune · name · full, `prefix`, `suffix`, `optional`), `NumberField`, `Combobox` (diacritic-insensitive), `DateField` (date · memorable · month), `PeriodPicker`, `CheckboxGroup`, `ChoiceGroup` (cards · chips · segmented · list), `SegmentedControl`, `ToggleChip`, `FilterChip`, `DisclosureChip`, `Switch`, `FileDrop` |
| Lists at volume | `DataTable` / `Table` (`rowLink`, `onOpen`, `selection`, `selectAllMatching`, `sort`, `page`, `columnsMenu`, `narrow` cards · scroll, `rowLevel`, `shortcuts`), `FilterBar`, `FilterRail`, `FilterTray`, `BulkBar`, `SavedViews`, `ShortcutLayer`, `ReorderList`, `SettingsLayout`, `SettingRow` |
| Frames and motion | `DensityScope`, `Persist`, `FrameScroll`, `usePresence(open, exitMs)` |

`KIT.charts`: `BarChart` (single, or `series` with `layout` group · stack), `LineChart`, `Donut`, `BarList`, `Funnel`: one scale per chart, marks only from `--c` tones, an `id` so the entrance plays once per session. Every component puts `data-kit="<Name>"` on its root. Layout helpers: `.g12` + `.c-1 … .c-12`, `.fgrid` + `.span-1 … .span-6`, `.l-form`, `.l-flow`, `.l-support`, `.l-listdetail`, `.l-panel`, `.l-solo`.

Use the type-role classes, the layout helpers and token colours. No inline styles and no raw hex colours in screen modules: `kickoff proto lint` counts them.

## Overlays

Projects never write `<wa-*>` tags (lint L5) or hand-made dialogs, scrims or Escape handlers (lint L11): every surface is a `KIT.ui` overlay, picked from the decision table of the design system (inline expansion → toggletip → tooltip → menu → select/combobox → inline choice → popover → ConfirmDialog → Dialog → SidePanel → BottomSheet → page). In short:

| Surface | Use for |
| --- | --- |
| `ConfirmDialog` | destroy, lock out, publish or unpublish, overwrite, leave a dirty form (focus on "Cancel", no outside click) |
| `Dialog` S/M/L/full | short task (≤ 4 fields), reading, media, preview at real width |
| `SidePanel` modal | create or edit one item with 5–8 fields (`dirty` asks before closing) |
| `SidePanel` non-modal | read-only detail beside a list (docks when the list keeps 560 px) |
| `BottomSheet` | phone and kiosk filters, pickers, help |
| `Popover` | a value or filter tied to one control |
| `MenuButton` | 2–7 commands on one object (never navigation) |
| toast | low-stakes success of the user's own action (never on the kiosk) |

Keep overlays mounted and pass `open=` so they can animate out (`cond && html\`<${U.Dialog}…\`` is lint error L13). All overlays share one stack (`KIT.overlays`): Escape and the browser Back button close only the top one; focus moves in, stays in modal surfaces, and returns to the opener (or the page `h1` when the opener is gone). Inside a device frame (`data-frame` on the frame's screen element) overlays are placed in the frame box: dialogs and confirms anchor to the bottom, side panels become bottom sheets.

Toast timing: 5 s plus 1 s per 40 characters above 80, paused on hover, focus and a hidden window; a toast with an action stays until closed, its action, a route change, or a new toast with the same `key`.

## Motion

- Every navigation goes through one commit point (`commitNav`): the content region cross-fades in a View Transition (staff 150 ms, public 200 ms; forward and back add a short shift), the shell parts stay still; without View Transitions, with reduced motion or in a page that renders no frames, a short CSS entrance plays instead. A running transition finishes at once when a new navigation starts.
- After a route the screen starts at its top with focus on its `h1`; Back returns to the scroll position the screen was left at and focuses the element that opened the detail. Put `data-kit-key="<unique key>"` on openers (DataTable and EntityCard links have one) so Back finds them; `document.title` is "<screen> · <product>".
- `KIT.util.flip(container, mutate)` moves reordered children (FLIP); `KIT.util.collapseOut(el)` fades a leaving row out of the flow; `KIT.ui.Reveal` reveals height with `grid-template-rows`; `KIT.ui.usePresence(open, exitMs)` keeps a kit-native surface mounted while it animates out (`data-state="closing"`); `KIT.util.motion()` reads the motion tokens.
- Tokens: `--dur-1 … --dur-5` (100–300 ms, the cap), `--dur-tint`, `--ease-standard`, `--ease-enter`, `--ease-exit`, `--shift-1`, `--shift-2`, `--vt-dur`. Animate transform and opacity only (plus `grid-template-rows`); never width, height, top, left, margin or padding (lint L14). Reduced motion keeps ≤ 150 ms dissolves and drops travel; mark looping decorations with `data-loop`.

## Release scope

`Rel({ r, children, inline })` wraps a part of a screen that arrives in release `r`:

| Lens | Result |
| --- | --- |
| `full` | children as designed |
| `tags` | children with a small release tag when `r` is not the first release |
| `mvp` | children for the first release; otherwise a muted `r` placeholder (block) or nothing (inline) |

Whole screens of a later release get a note strip (`tags`) or are dimmed under a note (`mvp`).

## Hash routes

`#<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>][?key=value&…]`, tokens in any order, for example `#sc-02-librarian-dark` or `#a-01-member`. Parameters after `?` become the screen's `params` (integers become numbers, `true`/`false` booleans). `kickoff proto check` takes the same routes. No hash opens the start page (roles, scenarios, theme). `#scn-<id>` runs a guided scenario. Internal kit routes: `#kit-selftest` (self-test) and `#kit-overlays` (overlay gallery); they are not in the screen list.

## Guided scenarios

```js
KIT.SCENARIOS = [
  { id: "borrow", name: "Lend a book at the desk", role: "librarian", platform: "web", steps: [
    { text: "Home shows the books on loan.", go: ["sc-01"], expect: '[data-kpi="loans"]' },
    { text: "Loans lists every loan.", go: ["sc-02"], expect: "table" },
  ] },
];
```

`#scn-<id>` sets the role and platform, starts after the page is ready, runs one step every 600 ms, and checks each step's `expect` selector after it renders. The viewer can stop the run; the guide panel then steps through by hand.

## Attributes for checks

After the UI library and the fonts are ready (≤ 4.5 s), `<html>` carries `data-ready="1"`, `data-screens="<id>|<code>|<role>+<role>;…"` and `data-scenarios="<id>,<id>"`. Script errors, rejected promises, render errors, unknown routes, configuration mismatches and a library that did not load (`ui library: …`) set `data-err` (first 200 characters). The runtime audit (A1–A18 of the foundation: weights, sizes per screen, line heights, clipped text, tracking and letter case, minimum sizes, accessible names, roles, target sizes, filled buttons per region, one `h1`, layout shift, clickable rows, empty cells, long lists without paging, images, duplicate ids) stamps `data-audit-fail` (errors) and `data-audit-warn` (warnings), 400 characters each. `#kit-selftest` stamps `data-selftest="pass"` or `data-err="selftest S<n>: …"`. A scenario run sets `data-scenario="done"` after its last step. `narrow.html#<route>` sets `data-ok="narrow"`, or `data-err` when the page scrolls sideways at 390 px or the audit fails there.

## Page contract

`index.html` has no doctype, `html`, `head` or `body` tags, a `<title>` in the first 8 KB, `table{color:inherit}` (the page renders in quirks mode), scripts only from jsdelivr (Preact, preact/hooks, htm and `@awesome.me/webawesome@3.14.0`) and stylesheets only from Google Fonts and the Web Awesome theme (`@awesome.me/webawesome@3.14.0/dist-cdn/styles/themes/default.css`). Never a version range or `latest`, never Web Awesome Pro (lint L7). It runs from `file://`, in a sandboxed Artifact frame and in `msedge --headless --dump-dom`.

## Data

Synthetic only: invented names, addresses and numbers, generated at the real volume (a seeded generator in `data.js` with derived counts and edge cases: long names, long titles, missing fields, many tags, 0/1/many results). No development infrastructure (VPN names, private address ranges, internal host names) in any user-facing string; list such patterns in `project.yaml` `proto.forbidden` and `kickoff proto lint` fails on them.

## Migrating to 0.3

`kickoff proto update` brings the kit core up and prints `migration:` lines for what the project must change. The 0.2 APIs keep working; these are deprecated and removed in 0.4.0 (lint L18 warns):

| 0.2 | 0.3 |
| --- | --- |
| `KIT.ui.Menu({ anchor })` | `MenuButton({ items })` (focus, keys and flip fixed in the legacy Menu meanwhile) |
| `Button kind="soft"` | `secondary` (renders as secondary) |
| `Table onRow=` | `DataTable rowLink=` for links, `onOpen=` for panels (`onRow` still works: the first cell becomes a button) |
| `--ease-spring`, `--d-fast`, `--d-base`, `--d-slow`, `--ease-out`, `--fw-bold`, `--lh` | `--ease-enter`, `--dur-1`, `--dur-3`, `--dur-4`, `--ease-standard`, `--fw-semibold`, the role tokens |
| `--fw-heavy`, weight 800 | 600/700 through the role tokens (lint L1) |
| `line-height: 1` on text | ≥ 1.2 (lint L2; `/* kit:allow L2 */` for digits-only boxes) |
| `Drawer` mounted as `open && html…` | `SidePanel open=${open}` (lint L13) |
| hand-made scrims, `role="dialog"`, Escape handlers | `KIT.ui` overlays (lint L11) |
| `title=` on buttons | a `label` (icon buttons show a `Tip`) (lint L6) |
| `.page { max-width }` overrides | `register(id, { page: "data" | "form" })` (lint L9) |
| per-screen control sizes, `.site-page .btn { height }` | density modes (lint L8) |
| `A.toast(…, { action })` that vanished after 4 s | action toasts stay until closed (timing above) |

Other changes: `.t-body` is now the body role (14 px on staff screens; long paragraphs use `.t-prose`); `.t-cap` no longer uppercases; disabled buttons use `--ink-3` on `--surface-3` instead of opacity (use `unavailable` with a reason); the sidebar collapses without a width animation and remembers its state; the site header has no filled button; the account menu is a disclosure navigation; the phone frame zooms instead of scaling.

## Upgrading the library

Change `KIT.lib.version` in `js/core.js` and the three Web Awesome URLs in `index.html` (theme link, component base in the module loader, the localize import follows it); run `node --test "test/*.test.js"`, `uv run pytest` in `cli/`, `kickoff --root examples/mini proto check`, and the regression page `test/overlays.html` with `node test/cdp-overlays.mjs` (see `test/README.md`); record API differences in the CHANGELOG. Never use a range or `latest`.

## Appendix: fallback recipe without the library

If the library cannot be used, the same `KIT.ui` props can be implemented on native platform features: `<dialog>.showModal()` for Dialog, ConfirmDialog, SidePanel and BottomSheet (focus trap, Escape and top layer included), the Popover API (`popover="auto"`) for Popover, menus and tooltips, and Floating UI 1.8.0 for anchoring and flipping:

- `https://cdn.jsdelivr.net/npm/@floating-ui/core@1.8.0/dist/floating-ui.core.umd.min.js`
- `https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.8.0/dist/floating-ui.dom.umd.min.js`

Keep the overlay contract (focus in and back, one stack, Escape and Back close the top layer, exits that animate) and the self-test green.
