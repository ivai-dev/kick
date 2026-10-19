# {{project_name}} — UX specification

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Inputs:** `.kickoff/features.yaml` at commit {{commit}}, `nfr.md`, `design-system.md`

The prototype tools read the Screen inventory below: it stays the first table in this file whose first header cell is "ID", with exactly its five columns.

## Roles and IA per role

| Role id | Role | Home screen | Navigation sections and their screens | Platforms |
| --- | --- | --- | --- | --- |
| {{role id}} | {{role name}} | {{screen ID}} | {{section: screen IDs; section: screen IDs}} | {{web / windows / android}} |

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
4. {{project-specific rule, e.g. "Back from a detail page returns to the list with its filters kept"}}

## Behaviour rules

| # | Rule | Screens | Features |
| --- | --- | --- | --- |
| BR-1 | {{rule, e.g. "A loan is due 14 days after it starts; the due date cannot be in the past"}} | {{screen IDs}} | {{feature IDs}} |

## States

| Screen or group | Empty | Loading | Error | Offline |
| --- | --- | --- | --- | --- |
| {{screen IDs}} | {{what the user sees and the next action}} | {{skeleton or progress}} | {{message and recovery}} | {{what still works}} |

## Copy guide

- **Language:** {{languages.ui}}; sample data uses invented names, organisations and addresses only.
- **Voice:** {{e.g. plain, polite, short sentences; address the user as "you"}}
- **Page headers:** a title and one short sentence; any further detail goes into an (i) popover.
- **Formats:** dates {{format}}, numbers {{format}}, currency {{format}}.
- **Never in the UI:** development infrastructure (VPN names, private IP ranges, internal host or tool names), internal IDs other than the ones users need.

| Term | Use | Do not use |
| --- | --- | --- |
| {{term}} | {{meaning and where it appears}} | {{synonyms to avoid}} |

## Accessibility

- **Target:** {{e.g. WCAG 2.2 AA}} (see {{NFR-ACC<n>}}).
- Text contrast at least 4.5:1 in light and dark themes; large text and icons at least 3:1.
- Every action reachable by keyboard with a visible focus ring; dialogs and drawers trap and return focus.
- Touch targets at least 44 × 44 px on phone screens; no horizontal scroll at 390 px width.
- Tables have captions and header cells; charts have a text label and their values in a table or tooltip.
- Motion respects the reduced-motion setting.
