# Prototype kit

A clickable, no-build prototype of the full product: every role, platform and release, with synthetic data only. Plain JavaScript on Preact 10.24.3 and htm 3.1.1 from jsdelivr; open `index.html` in a browser, publish it as an Artifact, or bundle it into one file with `kickoff proto bundle`.

The prototype is a design artifact. Its CDN use does not relax the product's own rules: the product bundles its fonts and assets.

## Files

| File | Edited per project | Purpose |
| --- | --- | --- |
| `index.html` | tokens block and modules block only | Page, design tokens, component CSS, script list |
| `narrow.html` | no | 390 × 844 iframe wrapper used by `kickoff proto check` |
| `js/route.js` | no | Hash parser `KIT.makeParser`, `KIT.formatHash` |
| `js/core.js` | no | `KIT` namespace, configuration, `KIT.register`, error capture |
| `js/ui.js` | no | `KIT.ui` components |
| `js/charts.js` | no | `KIT.charts` SVG charts |
| `js/scope.js` | no | Release scope layer (`KIT.ui.Rel`) |
| `js/shell.js` | no | Start page, desktop shell, Windows frame, phone frame |
| `js/scenario.js` | no | Guided scenario runner and panel |
| `js/main.js` | no | App root, navigation, `<html>` check attributes |
| `js/config.js` | yes | `window.KIT_CONFIG` |
| `js/data.js` | yes | Synthetic sample data (`KIT.D`) |
| `js/<area>.js` | yes | Screen modules, one per screen group |
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

## Screens

```js
KIT.register("sc-02", { comp: Loans, code: "SC-02", name: "Loans", roles: ["librarian"], platforms: ["web"], rel: "MVP", nav: "Library", icon: "book" });
```

- Defaults: `roles` every role, `platforms` `["web"]`, `rel` the first release. `nav` is the sidebar (or phone tab bar) section label; a screen without `nav` is reached only through links. `icon` is a `KIT.ui.Icon` name.
- The route id is the ux-spec code in lower case. A component takes no props: it reads `KIT.useApp()` → `{ role, theme, resolved, lens, platform, params, screen, narrow, layout, go, back, toast, setRole, setTheme, setLens, setPlatform }`.
- The shell gives each screen its container (`.page` on the desktop, `.m-content` on the phone); a screen returns its sections only.
- Role guard: a screen whose `roles` exclude the current role renders `KIT.ui.Denied`, never the screen.
- Navigate with `KIT.go(id, params)` or `useApp().go`. Below 760 px a screen with an `android` platform shows as the phone app and every other screen in the responsive web shell; on wider windows `android` screens show in the phone frame and `windows` screens in the Windows frame. Each role starts on its own home at every width.

`KIT.ui`: `Icon, Button, Field, Table, KPI, StatusChip, Card, PageHeader, InfoPopover, EmptyState, Drawer, Menu, Toasts, Placeholder, Denied, NotFound, Rel, RelBadge, ScreenRel`. `KIT.charts`: `LineChart, BarChart, Donut` (one scale per chart, colours from tokens through `tone`).

Use the type-scale classes `.t-cap .t-meta .t-ui .t-strong .t-body .t-h1 .t-h2 .t-h3 .t-kpi`, the layout utilities at the end of `index.html`, and token colours. No inline styles and no raw hex colours in screen modules: `kickoff proto lint` counts them.

## Release scope

`Rel({ r, children, inline })` wraps a part of a screen that arrives in release `r`:

| Lens | Result |
| --- | --- |
| `full` | children as designed |
| `tags` | children with a small release tag when `r` is not the first release |
| `mvp` | children for the first release; otherwise a muted `r` placeholder (block) or nothing (inline) |

Whole screens of a later release get a note strip (`tags`) or are dimmed under a note (`mvp`).

## Hash routes

`#<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>]`, tokens in any order, for example `#sc-02-librarian-dark` or `#a-01-member`. No hash opens the start page (roles, scenarios, theme). `#scn-<id>` runs a guided scenario.

## Guided scenarios

```js
KIT.SCENARIOS = [
  { id: "borrow", name: "Lend a book at the desk", role: "librarian", platform: "web", steps: [
    { text: "Home shows the books on loan.", go: ["sc-01"], expect: '[data-kpi="loans"]' },
    { text: "Loans lists every loan.", go: ["sc-02"], expect: "table" },
  ] },
];
```

`#scn-<id>` sets the role and platform, runs one step every 600 ms, and checks each step's `expect` selector after it renders. The viewer can stop the run; the guide panel then steps through by hand.

## Attributes for checks

After the first render `<html>` carries `data-ready="1"`, `data-screens="<id>|<code>|<role>+<role>;…"` and `data-scenarios="<id>,<id>"`. Script errors, rejected promises, render errors, unknown routes and configuration mismatches set `data-err` (first 200 characters). A scenario run sets `data-scenario="done"` after its last step, or `data-err="scenario <id> step <n>: missing <selector>"`. `narrow.html#<route>` sets `data-ok="narrow"`, or `data-err` when the page scrolls sideways at 390 px.

## Page contract

`index.html` has no doctype, `html`, `head` or `body` tags, a `<title>` in the first 8 KB, `table{color:inherit}` (the page renders in quirks mode), and scripts only from jsdelivr (Preact, preact/hooks, htm) plus fonts from Google Fonts.

## Data

Synthetic only: invented names, addresses and numbers. No development infrastructure (VPN names, private address ranges, internal host names) in any user-facing string; list such patterns in `project.yaml` `proto.forbidden` and `kickoff proto lint` fails on them.
