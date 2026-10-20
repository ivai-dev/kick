# {{project_name}} — design system

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Direction inputs:** product type {{product type}}; audiences {{audiences}}; keywords {{keywords}}; density per audience {{e.g. public 2–3, staff 4–5, kiosk 1–2}}, variance {{1–10}}, motion {{1–10}}

The prototype copies the token values below into its tokens block; the names match the prototype kit, whose defaults (`../references/foundation-rules.md` of the ux-design skill) apply wherever this file says nothing. The product itself bundles its fonts and assets: the prototype loading fonts from a CDN does not relax that rule.

## Principles

1. {{principle, e.g. "One job, one filled action per screen"}}
2. {{principle, e.g. "Density follows the surface, never the component"}}
3. {{principle, e.g. "Built for the real volume"}}

## Tokens

Colours for the light theme and the dark theme. Contrast is checked for text tokens on `--bg` and `--surface`, and for chart marks (≥ 3:1 against `--surface`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | {{hex}} | {{hex}} | page background |
| `--surface` / `--surface-2` / `--surface-3` | {{hex}} | {{hex}} | cards and panels / read-only boxes / tracks and neutral fills |
| `--line` / `--line-strong` | {{hex}} | {{hex}} | dividers / control outlines |
| `--ink` / `--ink-2` / `--ink-3` | {{hex}} | {{hex}} | primary / body / tertiary text |
| `--primary`, `--primary-soft`, `--primary-ink` | {{hex}} | {{hex}} | navigation, links, focus, staff primary, selected states |
| `--act`, `--on-act` | {{hex}} | {{hex}} | the one main action of public and kiosk screens |
| `--ok` / `--warn` / `--danger` (+ `-soft`, `-ink`) | {{hex}} | {{hex}} | good states / waiting / errors and destructive confirms |
| `--accent` | {{hex}} | {{hex}} | release tags, highlights |

Fonts: UI {{font family, e.g. Inter variable (opsz 14–32, wght 400–700)}}, monospace {{font family}} (backup names and ids only).

## Density modes

One attribute per surface drives control sizes and type. Values in CSS px (kiosk in its layout px).

| Token | compact (staff) | comfortable (public desktop) | touch (phone, coarse pointer) | {{kiosk}} |
| --- | --- | --- | --- | --- |
| `--ctl-h` / `-sm` / `-lg` | {{32 / 28 / 36}} | {{40 / 32 / 48}} | {{48 / 40 / 52}} | {{64 / 56 / 72}} |
| `--chip-h` / `--tag-h` | {{28 / 20}} | {{32 / 24}} | {{40 / 24}} | {{56 / 32}} |
| `--row-h` / `-2` / `-dense` | {{40 / 56 / 32}} | {{48 / 64 / 40}} | cards | cards |
| `--card-p` / `--card-r` | {{16 / 8}} | {{20 / 12}} | {{16 / 12}} | {{24 / 16}} |
| `--gap-inner` · `--gap-group` · `--gap-grid` · `--section-gap` | {{2 · 12 · 16 · 32}} | {{4 · 16 · 24 · 48}} | {{4 · 12 · 16 · 32}} | {{6 · 24 · 24 · 40}} |
| minimum target | 24 | 24 | 44 | 56 |

Which surface uses which mode: {{e.g. staff consoles compact with a per-user "comfortable" setting; public site comfortable, touch below 760 px or with a coarse pointer; phones touch; kiosk frame kiosk}}.

## Type scale

Roles × modes (size/line-height · weight). At most 6 sizes per screen, at most 2 weights per component; weights 400 · 500 · 600 · 700 (700 only for display), never 800.

| Role | compact | comfortable | touch | {{kiosk}} | Use |
| --- | --- | --- | --- | --- | --- |
| display | {{—}} | {{40/52 · 700}} | {{32/40 · 700}} | {{80/104 · 700}} | one per screen |
| headline | {{22/30 · 600}} | {{28/38 · 600}} | {{24/32 · 600}} | {{44/60 · 700}} | page h1 |
| title-l | {{16/24}} | {{20/28}} | {{18/26}} | {{28/38}} | section heads, dialog titles |
| title | {{14/20}} | {{18/26}} | {{18/26}} | {{24/32}} | card titles, primary cell |
| body / prose | {{14/20 · 14/22}} | {{16/24}} | {{16/24}} | {{21/32}} | text, inputs, cells / paragraphs (max 68ch) |
| body-s | {{13/18}} | {{14/20}} | {{14/20}} | {{19/28}} | context lines |
| label / button | {{14/20 · 500}} | {{16/24 · 500 / 600}} | {{16/24}} | {{21/30 · 600}} | labels, tabs / buttons |
| meta | {{13/18}} | {{14/20}} | {{14/20}} | {{19/28}} | hints, timestamps, pills (the minimum) |
| caption | {{12/16}} | {{13/18}} | {{13/18}} | {{19/28}} | chart axes only |
| figure / figure-l | {{14/20 · 28/36}} | {{18/26 · 32/40}} | {{18/26 · 28/36}} | {{24/32 · 44/56}} | inline figures / stat values (tabular) |

Line height for languages with stacked diacritics ({{UI language}}): ≥ 1.2 on any text box, ≥ 1.34 where titles wrap, ≥ 1.5 for paragraphs and any box that clips text (or 0.12 em vertical padding); never 1.0 on text. Re-measure with a specimen when the font changes. Tracking never negative.

## Layout and grid

- Window classes: compact < 600 · medium 600–839 · expanded 840–1199 · large 1200–1599 · xlarge ≥ 1600; the shell switches to its phone form below 760.
- Content widths: public container {{1200}} centred; staff data pages fluid to {{1600}}, form and detail pages {{1200}}, left-anchored; one form pane {{760}} (6-track field grid); flows {{640}} centred; supporting pane {{360}}; side panels {{480 / 560 / 640}}.
- Page types per screen: {{list the data and form pages}}.
- Form grid: span by expected answer, at most 3 fields per row, rows complete or end their section; units on the control's centre line.

## Surfaces and elevation

| Level | What | Fill | Boundary | Shadow |
| --- | --- | --- | --- | --- |
| 0 page | canvas | `--bg` | none | none |
| 1 container | card, table, form | `--surface` | {{staff 1 px --line; public clickable cards none}} | {{public cards --shadow-1, --shadow-2 on hover}} |
| 2 inside a container | groups, previews | none or `--surface-2` | none (spacing or a divider) | none |
| 3 floating | menus, dialogs, panels, toasts | `--surface` | none | `--shadow-3` |

One-box rule: at most one boundary between the page and any content; a card inside a card loses its border and shadow.

## Overlays and consequences

The overlay decision table and the consequence matrix of `foundation-rules.md` apply; project-specific cases:

| Case | Surface | Consequence class |
| --- | --- | --- |
| {{e.g. delete a user}} | {{confirm dialog}} | {{D}} |
| {{e.g. decline a candidate}} | {{immediate + 10 s hold with undo}} | {{B}} |

## Behaviour contracts

Per component: purpose, props, states, keyboard and ARIA, density. Library-agnostic.[^impl]

| Component | Contract |
| --- | --- |
| Page header | h1 (focus target after a route), one live sentence, ≤ 1 primary action |
| Button | kinds primary · secondary · ghost · danger · act · link; unavailable = focusable with its reason, never 45 % opacity; loading after 300 ms, ≥ 500 ms |
| Data table | caption with total and sort; sortable headers with aria-sort; the first cell holds the row link; selection across pages; numbered paging; "—" for empty cells; cards below 760 px |
| Combobox | APG list autocomplete, diacritic-insensitive matching |
| Dialog / confirm dialog | APG dialog / alertdialog; focus on the first field / on "Cancel" |
| {{component}} | {{contract}} |

[^impl]: Prototype implementation: KIT.ui on {{the kit's UI library and version}}, prototype tooling only.

## Motion

- Tokens: {{100 · 150 · 200 · 250 · 300}} ms (300 is the cap); curves standard, enter, exit; shifts {{4 px; 8 / 12 / 16 / 24 per mode}}.
- Patterns: route (content region only, forward and back shift), master-detail cross-fade, reveal by `grid-template-rows`, toast, chart entrance once and morph on change.
- The shell never animates; transform and opacity only; exits faster than entries; a new screen starts at its top with focus on its h1, Back returns to where it was left.
- Reduced motion: no travel, dissolves ≤ 150 ms.

## Status vocabulary

One label and one tone per status across the whole product. Tones: `ok`, `warn`, `danger`, `info`, `accent`, `neutral`.

| Status | Label | Tone | Used on |
| --- | --- | --- | --- |
| {{status key}} | {{label in the UI language}} | {{tone}} | {{screen IDs}} |

## Charts

- One scale per chart; marks only from tones with ≥ 3:1 against the surface; never two measures from 0 on top of each other (group or stack); every chart has a table view.
- Quantities toward a target are neutral or primary, never the success colour before the target is reached.
- {{data kind}}: {{chart type and why}}

## Data at volume

| List | Volume (now · 3 years) | Functions |
| --- | --- | --- |
| {{e.g. vacancies}} | {{3,100 · 9,000}} | {{total, search, filters, sort, numbered paging, URL state}} |

## Scope layer

The prototype shows every release. Parts of later releases are marked, never hidden by default:

| View | What the reviewer sees |
| --- | --- |
| Full | the product as designed, all releases |
| Tags | a small release tag on every part that is not in the first release |
| MVP | the first release only; later parts are muted placeholders |

## Density and copy

- One short sentence under each page header; details go into an (i) popover (staff) or onto the screen (public).
- Sample data is invented; development infrastructure (VPN names, private IP ranges, internal hosts) never appears in product UI.

## Craft rules

Small details are rules. Wording, punctuation and formats are in the ux-spec Copy guide; the visual rules are here.

- Letter case: sentence case for titles, buttons, labels and table headers; `--cap-case`: {{none / uppercase}} ({{why}}).
- Spacing steps {{2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64}} px through tokens only.
- Chips: status pills are the only filled small elements in a row; facts are plain text with an icon; selected chips get the primary soft fill and a check icon.
- Buttons: one filled main action per screen ({{colour}}); secondary as outline; tertiary as ghost or link; the icon goes before the label; "›" goes to another page, "▾" opens a menu or popover.
- Icons: {{outline}} style, one meaning each.

| Icon | Meaning |
| --- | --- |
| {{icon name}} | {{the one thing it means}} |

## Accessibility

- Target {{e.g. WCAG 2.2 AA}}; text contrast at least 4.5:1 in both themes; marks and control outlines 3:1.
- Visible focus ring (`--ring`, 2 px, 2 px offset) on every interactive element; keyboard order follows the reading order.
- Targets at least 24 × 24 px (staff), 44 × 44 (touch), 56 × 56 (kiosk).
- Colour is never the only carrier of meaning: every status has a label.
