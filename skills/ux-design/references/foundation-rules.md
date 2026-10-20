# Foundation rules

The rules the design system writes down and the prototype kit implements. Library-agnostic: sizes in CSS px, states, timings and ARIA patterns only; the product stack is chosen in `kickoff:solution`. Kiosk values are in the kiosk frame's layout px.

## Principles (each one is a test)

| # | Principle | Test |
| --- | --- | --- |
| 1 | One job, one filled action: at most one filled button per region (page header, panel footer, dialog footer, sticky bar); the site header has none | runtime audit A11 |
| 2 | Density follows the surface, never the component | lint L8; audit A10 (targets) |
| 3 | Quiet type: ≤ 6 sizes per screen, ≤ 2 weights per component, no weight above 700, line-height rules below, no negative tracking | audit A1–A7; lint L1–L3 |
| 4 | Fixed anatomy, robust content: one slot position per card kind, clamps by lines, "—" for empty values, numbers never break from their unit | stress fixtures; audit A15 |
| 5 | Anchored, never stranded: staff pages start at the sidebar edge; the public container is 1200 px centred; a block wider than 720 px has a trailing slot or a second column | screenshots at 1366/1440/1920; lint L9 |
| 6 | Proximity carries meaning: inner gap < group gap < grid gap ≤ section gap / 2; grid gap ≥ card padding | spacing tokens; lint L10 |
| 7 | One surface per task, one overlay contract | self-test; lint L11–L13 |
| 8 | Consequences are honest: confirm only what destroys, locks out, publishes or overwrites; undo for the rest | consequence matrix per screen |
| 9 | Only the changed region moves: ≤ 300 ms, transform and opacity only, exits faster than entries | self-test S7; lint L14; audit A13 |
| 10 | Built for the real volume: every list shows its total, searches, filters, sorts, pages and keeps its state in the URL | `data-at-volume.md`; audit A16 |

## Density modes

| Token | Use | compact (staff) | comfortable (public desktop) | touch (phone, coarse pointer) | kiosk |
| --- | --- | --- | --- | --- | --- |
| `--ctl-h` / `-sm` / `-lg` | controls | 32 / 28 / 36 | 40 / 32 / 48 | 48 / 40 / 52 | 64 / 56 / 72 |
| `--ctl-r` | control radius | 6 | 8 | 8 | 12 |
| `--chip-h` / `--tag-h` | chips / status pills | 28 / 20 | 32 (filters 36) / 24 | 40 / 24 | 56 / 32 |
| `--row-h` / `-2` / `-dense` | table rows | 40 / 56 / 32 | 48 / 64 / 40 | cards | cards |
| `--card-p` / `--card-r` | card padding / radius | 16 / 8 | 20 / 12 | 16 / 12 | 24 / 16 |
| `--gap-inner` · `--gap-group` · `--gap-grid` · `--section-gap` | rhythm | 2 · 12 · 16 · 32 | 4 · 16 · 24 · 48 | 4 · 12 · 16 · 32 | 6 · 24 · 24 · 40 |
| `--topbar-h` · `--nav-h` · `--bar-h` · `--menu-item-h` | chrome | 48 · 36 · 56 · 32 | 64 · 40 · 64 · 36 | 56 · 48 · 64 · 48 | — · 64 · 88 · 64 |
| minimum target | | 24 (32 recommended) | 24 | 44 | 56 |

Choosing the mode: a device frame sets its own (kiosk); the staff shell defaults to compact with a per-user "comfortable" setting; the public shell is comfortable, touch below 760 px or with a coarse pointer; phones are touch.

## Type roles

Each role is size/line-height · weight per mode: compact · comfortable · touch · kiosk.

| Role | Values | Use |
| --- | --- | --- |
| display | 22/30·600 · 40/52·700 · 32/40·700 · 80/104·700 | one per screen (hero, poster) |
| headline | 22/30 · 28/38 · 24/32 · 44/60 (600; kiosk 700) | page h1 |
| title-l | 16/24 · 20/28 · 18/26 · 28/38 (600) | section heads, dialog and panel titles |
| title | 14/20 · 18/26 · 18/26 · 24/32 (600) | card titles, primary cell |
| body | 14/20 · 16/24 · 16/24 · 21/32 (400) | text, inputs, cells |
| prose | 14/22 · 16/24 · 16/24 · 21/32 (400, max 68ch) | paragraphs |
| body-s | 13/18 · 14/20 · 14/20 · 19/28 (400) | card context lines |
| label / button | 14/20 500 · 16/24 500/600 · 16/24 · 21/30 600 | labels, tabs, nav / every button |
| meta | 13/18 · 14/20 · 14/20 · 19/28 (400; 500 when interactive) | hints, timestamps, units, pills |
| caption | 12/16 · 13/18 · 13/18 · 19/28 | chart axes and legends only |
| figure / figure-l | 14/20 · 18/26 · 18/26 · 24/32 / 28/36 · 32/40 · 28/36 · 44/56 (600, tabular) | salary, counts / stat values |

Weights 400 · 500 · 600 · 700 (700 only for display and the kiosk headline), never 800. Hierarchy comes from de-emphasis: primary (title role, 600, ink), secondary (body, 400, ink-2), tertiary (meta, 400, ink-3). A semantic colour replaces a level's colour; it never adds a level.

Line height (re-measure with a specimen when the font changes): paragraphs ≥ 1.5; single-line UI 1.4–1.45 (height from min-height and padding, never line-height 1); titles that can wrap ≥ 1.34 (stacked capitals Ẩ Ổ Ủ Ứ at the start of line 2); figures alone 1.2–1.3; any box that clips text (ellipsis, line clamp) ≥ 1.5 or 0.12 em vertical padding. Languages with stacked diacritics are never uppercase in small text.

## Layout

Window classes: compact < 600 · medium 600–839 · expanded 840–1199 · large 1200–1599 · xlarge ≥ 1600 (the shell switches to its phone form below 760). Content widths: public container 1200 centred; staff data pages fluid to 1600, form and detail pages 1200, left-anchored after a 32 px (24 below 1366) margin; one form pane 760 with a 6-track field grid; one-question flows and sign-in 640 centred; supporting pane 360; side panels 480 (560 at ≥ 1600) and 640; a lone card without a trailing slot 720.

Form grid: span by expected answer (long text 6, names and emails 3, commune 3, phone 2, date 2, tax code 2, small number 1–2), at most 3 fields per row, rows complete or end their section; units on the control's centre line; labels above, hints under the label, errors under the control; one error summary at the top after a failed submit.

Surfaces: one boundary (border or shadow) between the page and any content; a card inside a card loses both. Status pills are the only filled small elements in a row.

## Card anatomy (entity cards and rows)

Slots in fixed positions: media (48 public, 40 staff, 64 kiosk) · eyebrow · title (clamp 2; the only link, stretched over the card) · subtitle (clamp 1) · key figure (reserved line, the same role for "negotiable") · up to 2 meta rows (icon 16 + text, clamp 1) · body (clamp 2) · footer pinned to the bottom: up to 2–3 facts with "+n", one action or a chevron. Badges sit in a top-right slot (vertical card) or a fixed slot after the one-line title (row), never inside wrapping text. In one grid row the key figure has 0 px vertical spread.

## Overlay decision table

Read top to bottom; the first row that matches wins.

| Surface | Use when | Never for |
| --- | --- | --- |
| Inline expansion | optional detail or a sub-task ≤ 3 fields | confirmations; > 3 fields |
| Toggletip (i) | a rule explained in ≤ 300 characters (staff pages) | required information; public and kiosk screens say it on screen |
| Tooltip | the name of an icon-only control | anything else; touch |
| Menu | 2–7 commands on one object | navigation, forms |
| Select / combobox | pick one value (≤ 15 select, more or search combobox) | commands; kiosk (tiles) |
| Inline choice | 1 of 2–5 | more options |
| Popover | a value or filter tied to one control | forms > 3 fields; confirmations |
| Confirm dialog | destroy, lock out, publish or unpublish, overwrite, leave a dirty form | reversible routine actions (undo) |
| Dialog S/M/L/full | short task ≤ 4 fields, reading, media, preview | > 4 fields; anything that needs a URL |
| Side panel, modal | create or edit 5–8 fields with the list behind | confirmations, previews, > 8 fields |
| Side panel, non-modal | read-only detail of the selected row | data entry beyond a note |
| Bottom sheet | phone and kiosk filters, pickers, help | desktop; stacking |
| Page | > 8 fields, a live preview, several sections, many entry points, a URL | quick confirmations |
| Toast | low-stakes success of the user's own action, ≤ 80 characters | errors; the kiosk |
| Banner | persistent state, server errors | field validation |

One overlay contract: focus moves in (first field; "Cancel" in a confirm; never the ×), Tab stays inside modal surfaces, Escape and Back close only the top layer, focus returns to the opener (or the page h1), the background is inert, exits animate. At most one modal plus one confirm over it.

## Consequence matrix

| Class | Examples | Pattern |
| --- | --- | --- |
| A reversible, own data, nobody told | hide a post, remove a list entry, filters | immediate + undo (toast with action, inline undo) |
| B reversible, notifies someone | decline, approve, send for review | immediate; the notice is held 10 s with an inline undo |
| C reversible but harmful | lock an account, unpublish | confirm dialog |
| D irreversible | delete | confirm dialog naming the item and the consequence |
| E irreversible and wide | restore a backup, purge logs, bulk delete | confirm dialog + type-to-confirm or the count |
| F leaving a dirty form | any edit panel or long form | "Discard changes?" |

## Motion

Tokens: 100 ms (state feedback) · 150 ms (exits, staff route fade) · 200 ms (entries, public route) · 250 ms (panels, reveal, kiosk step) · 300 ms (the cap); curves standard `cubic-bezier(.2, 0, 0, 1)`, enter `(0, 0, 0, 1)`, exit `(.3, 0, 1, 1)`; shifts 4 px and 8/12/16/24 px per mode. Rules: the shell never animates; one region, one motion, one direction per action; transform and opacity only; exits faster than entries; forward from the inline end, back from the inline start, lateral moves fade; a new screen starts at its top (Back: where it was left) with focus on its h1; a new action finishes the running transition at once; no count-up, no stagger. Reduced motion: no travel, dissolves ≤ 150 ms.
