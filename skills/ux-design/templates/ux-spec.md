# {{project_name}} — UX specification

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Inputs:** `.kickoff/features.yaml` at commit {{commit}}, `nfr.md`, `design-system.md`

The prototype tools read the Screen inventory below: it stays the first table in this file whose first header cell is "ID", with exactly its five columns.

## Roles and IA per role

| Role id | Role | Shell | Home shape | Home screen | Navigation sections and their screens | Platforms |
| --- | --- | --- | --- | --- | --- | --- |
| {{role id}} | {{role name}} | {{site / app}} | {{approval inbox / pipeline / health and tasks / next-action hero / other: what it opens on}} | {{screen ID}} | {{section: screen IDs; section: screen IDs}} | {{web / windows / android}} |

- **Shell:** `site` for public and self-service audiences (header with a top menu, footer; on phones a compact header and a bottom tab bar), `app` for work tools (sidebar). The prototype draws the same shell.
- **Home shape:** what the home opens on, matched to the role's main job. Homes of different roles do not share one template.
- **Phone tab bar** (site roles used on phones): {{role id}}: {{3–5 screen IDs}}.

## Screen inventory

| ID | Screen | Roles | Platform | Release |
| --- | --- | --- | --- | --- |
| SC-01 | {{screen name}} | {{role id}}, {{role id}} | web | {{release}} |
| W-01 | {{screen name}} | {{role id}} | windows | {{release}} |
| A-01 | {{screen name}} | {{role id}} | android | {{release}} |

- One row per screen of the full product, every release and platform. IDs are permanent: `SC-nn` web, `W-nn` Windows, `A-nn` Android.
- Roles: comma-separated role ids; only these roles may open the screen. Each role's home screen is its first row.
- Platform: `web`, `windows` or `android`. Release: a release id from `.kickoff/project.yaml`.

### Notes

- {{features without a screen and why, e.g. a nightly import; or "None"}}

## Navigation rules

1. Navigation goes to distinct pages; filters, sorting and search stay in-page. No menu item reloads a near-identical page with a filter applied.
2. Each role starts on its own home screen at every width, desktop and phone.
3. A screen opens only for the roles listed in the inventory; any other role sees an access notice, never the content.
4. A menu label is 24 characters or fewer and equals the page title it opens.
5. {{project-specific rule, e.g. "Back from a detail page returns to the list with its filters kept"}}

### Screen content

1. One primary job per screen: above the fold, at most the header, one guidance device and the start of the main content.
2. One main action per screen (one filled button); a screen offers only the actions possible now.
3. No repeated look-alike blocks: two blocks on one screen differ in shape and purpose; no KPI row repeats counts listed below it; the same text never appears twice on a screen.
4. The header sentence names the task or carries live facts (counts, dates, state); with nothing live there is no sentence.

### Guidance devices

| Screen group | Device (from the guidance library) | Where it is not used |
| --- | --- | --- |
| {{screen IDs}} | {{e.g. next-action card, process map, step groups, positive empty state}} | {{e.g. not on list screens}} |

## Behaviour rules

| # | Rule | Screens | Features |
| --- | --- | --- | --- |
| BR-1 | {{rule, e.g. "A loan is due 14 days after it starts; the due date cannot be in the past"}} | {{screen IDs}} | {{feature IDs}} |

## States

| Screen or group | Empty | Loading | Error | Offline |
| --- | --- | --- | --- | --- |
| {{screen IDs}} | {{what the user sees and the next action}} | {{skeleton or progress}} | {{message and recovery}} | {{what still works}} |

## Copy guide

- **Language and locale:** {{languages.ui}}, locale {{e.g. vi-VN}}; sample data uses invented names, organisations and addresses only.
- **Only what the user needs now:** no text that explains system mechanics or policy ({{e.g. "free", "not stored", sign-out timers, how accounts are checked}}); a fact appears when its event happens.
- **Page headers:** a title and one sentence that names the task or carries live facts, or no sentence; rules and detail go into an (i) popover.
- **Never in the UI:** development infrastructure (VPN names, private IP ranges, internal host or tool names), screen codes, prototype words, internal IDs other than the ones users need.

### Voice and tone

Voice in one sentence: {{e.g. "a helpful clerk who speaks plainly: warm, respectful, simple"}}.

| Audience (roles) | Address | Tone | Verbs and words | Avoid | Example |
| --- | --- | --- | --- | --- | --- |
| {{e.g. guest, seeker}} | {{form of address}} | {{e.g. plain, warm, no pressure}} | {{e.g. "Tap" on touch screens; buttons start with a verb}} | {{slang, marketing, officialese, English}} | {{one real string}} |

### Terms

One name per thing. A term in "Do not use" never appears in the UI.

| Term | Use | Do not use |
| --- | --- | --- |
| {{term}} | {{meaning and where it appears}} | {{synonyms to avoid}} |

### Formats

| Thing | Format | Example |
| --- | --- | --- |
| Numbers, percent | {{locale rule}} | {{e.g. 2.304 · 7,1% · −4}} |
| Money | {{rule}} | {{example}} |
| Ranges | {{en dash rule}} | {{e.g. 8–11; 20/10/2026 – 05/11/2026}} |
| Dates | {{rule}} | {{example}} |
| Date with weekday and time | {{rule}} | {{example}} |
| Relative dates | {{rule}} | {{e.g. Today, 06:30 · 2 days left}} |
| Times | {{rule}} | {{e.g. 07:00}} |
| Units | {{non-breaking space rule}} | {{e.g. 60 people · 4 min}} |

### Punctuation and letter case

- Sentence case in titles, buttons, labels and table headers; small uppercase labels {{allowed / not used (stacked diacritics)}}.
- {{locale rules for names of organisations and places}}
- No exclamation marks; typographic quotes “ ”; en dash for ranges; "—" only for missing data in table cells; "·" joins at most two facts; no full stop after labels, buttons or chips.

## Accessibility

- **Target:** {{e.g. WCAG 2.2 AA}} (see {{NFR-ACC<n>}}).
- Text contrast at least 4.5:1 in light and dark themes; large text and icons at least 3:1.
- Every action reachable by keyboard with a visible focus ring; dialogs and drawers trap and return focus.
- Touch targets at least 44 × 44 px on phone screens; no horizontal scroll at 390 px width.
- Tables have captions and header cells; charts have a text label and their values in a table or tooltip.
- Motion respects the reduced-motion setting.
