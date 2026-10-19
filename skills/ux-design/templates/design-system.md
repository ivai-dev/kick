# {{project_name}} — design system

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Direction inputs:** product type {{product type}}; audience {{audience}}; keywords {{keywords}}; density {{1–10, default 3}}, variance {{1–10}}, motion {{1–10}}

The prototype copies the token values below into its tokens block; the names match the prototype kit. The product itself bundles its fonts and assets: the prototype loading fonts from a CDN does not relax that rule.

## Principles

1. {{principle, e.g. "Calm by default: one accent colour, generous spacing, three font weights"}}
2. {{principle, e.g. "The task first: every page answers one question for one role"}}
3. {{principle}}

## Tokens

Colours for the light theme and the dark theme. Contrast is checked for text tokens on `--bg` and `--surface`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | {{hex}} | {{hex}} | page background |
| `--surface` | {{hex}} | {{hex}} | cards, tables, drawers |
| `--surface-2` | {{hex}} | {{hex}} | raised or alternate rows |
| `--line` | {{hex}} | {{hex}} | borders and dividers |
| `--ink` | {{hex}} | {{hex}} | primary text |
| `--ink-2` | {{hex}} | {{hex}} | body text |
| `--ink-3` | {{hex}} | {{hex}} | secondary text, captions |
| `--primary` | {{hex}} | {{hex}} | primary actions, links, focus |
| `--primary-soft` | {{hex}} | {{hex}} | selected rows, soft buttons |
| `--accent` | {{hex}} | {{hex}} | highlights and release tags |
| `--ok` / `--ok-soft` | {{hex}} / {{hex}} | {{hex}} / {{hex}} | success status |
| `--warn` / `--warn-soft` | {{hex}} / {{hex}} | {{hex}} / {{hex}} | warning status |
| `--danger` / `--danger-soft` | {{hex}} / {{hex}} | {{hex}} / {{hex}} | errors, destructive actions |

Fonts: UI {{font family}}, monospace {{font family}}.

## Type scale

Seven steps, three weights, line height 1.6.

| Size | Class | Weight | Use |
| --- | --- | --- | --- |
| 12 px | `.t-cap` | 500 | captions, eyebrows, table group labels |
| 13 px | `.t-meta` | 400 | metadata, hints, timestamps |
| 14 px | `.t-ui`, `.t-strong` | 500 | controls, labels, emphasised cells |
| 16 px | `.t-body`, `.t-h3` | 400 / 600 | body text; card titles |
| 18 px | `.t-h2` | 600 | section titles |
| 22 px | `.t-h1` | 600 | page titles |
| 28 px | `.t-kpi` | 600 | KPI numbers |

Weights: 400 body, 500 labels and controls, 600 headings and KPI numbers only.

## Spacing

A 4 px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48 px (`--sp-1` … `--sp-12`). 32 px between page sections (`--sp-section`). Radii {{e.g. 6 / 8 / 12 / 16 px}}.

## Motion

- Durations: fast {{120 ms}}, base {{200 ms}}, slow {{320 ms}}; easing {{ease-out curve}}.
- Motion explains a change (a drawer opening, a row added); nothing moves on its own.
- With the reduced-motion setting, transitions are instant.

## Status vocabulary

One label and one tone per status across the whole product. Tones: `ok`, `warn`, `danger`, `info`, `accent`, `neutral`.

| Status | Label | Tone | Used on |
| --- | --- | --- | --- |
| {{status key}} | {{label in the UI language}} | {{tone}} | {{screen IDs}} |

## Components

| Component | Rule |
| --- | --- |
| Page header | Title, one short sentence, optional (i) popover for detail; actions on the right. |
| Button | One primary action per page section; destructive actions ask for confirmation. |
| Table | Caption, header cells, numbers right-aligned; an empty state instead of an empty grid. |
| Field | Label above, hint below, error message next to the field, required fields marked. |
| Drawer | Create and edit forms; closes with Escape and returns focus. |
| KPI | Label, number, optional delta and one-line note. |
| {{component}} | {{rule}} |

## Charts

- One scale per chart; values labelled; colours from the status and accent tokens only.
- {{data kind}}: {{chart type and why}}

## Scope layer

The prototype shows every release. Parts of later releases are marked, never hidden by default:

| View | What the reviewer sees |
| --- | --- |
| Full | the product as designed, all releases |
| Tags | a small release tag on every part that is not in the first release |
| MVP | the first release only; later parts are muted placeholders |

## Density and copy

- Density {{value}}: generous white space, at most {{n}} KPIs per row, tables before charts when both show the same data.
- One short sentence under each page header; details go into an (i) popover.
- Sample data is invented; development infrastructure (VPN names, private IP ranges, internal hosts) never appears in product UI.

## Accessibility

- Target {{e.g. WCAG 2.2 AA}}; text contrast at least 4.5:1 in both themes.
- Visible focus ring (`--ring`) on every interactive element; keyboard order follows the reading order.
- Touch targets at least 44 × 44 px on phone screens.
- Colour is never the only carrier of meaning: every status has a label.
