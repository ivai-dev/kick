# Screen checklist

Walk this list before every publish, screen group by screen group:
- run it after `kickoff fe check` passes and before the `ui-ux-pro-max` pre-delivery checklist;
- tick each item in the build plan, or record a ruling (`Ruling: <decision> — <why> — <cost if wrong>`) when an item is knowingly left open.

Routes are `#/<role>/<screen>?<params>`, for example `#/librarian/sc-02?status=late` or `#/guest/sc-08?kiosk=1`. Per-visit overrides: `demo=0` hides the prototype bar, `theme=dark`, `density=touch`, `scope=mvp` (or `tags`), `scenario=<id>&step=<n>`. Screenshots come from `kickoff fe check --shots <folder>`.

| # | Item | How to check |
| --- | --- | --- |
| 1 | **Role guard.** Every screen's row in `screens.ts` has the roles of its ux-spec row; another role sees "not available for this role", never the content. | `kickoff fe check` reports no `coverage:` line about roles; open a screen with a role outside its row. |
| 2 | **Per-role home at 390 px.** Each role starts on its own home at phone width as well as on the desktop. | `config.ts` `home` per role equals the ux-spec home; read the phone screenshots of every home. |
| 3 | **Light and dark readable.** Text, tables, charts and status badges are readable in both themes. | The sweep runs both themes, with axe in light; read the dark screenshots. |
| 4 | **No horizontal scroll at 390 px.** | The sweep fails on sideways scroll at 390 px for every screen and role; a pass covers it. |
| 5 | **Quiet type.** Type-role classes only, no inline font sizes or weights, no weight above 700, one short sentence per page header. | The kit's ESLint rules pass within `fe check`; read the page headers of every screen. |
| 6 | **Synthetic data only.** Invented names, organisations, addresses and contents in `packages/mocks`; nothing copied from customer material. | Read the seed; search the screens for real names from the discovery inputs. |
| 7 | **No development infrastructure.** No VPN names, private IP ranges, internal host names or tool accounts in any user-facing string. | `fe check` scans `apps/` and `packages/` with `fe.forbidden`; add any new pattern you find to that list. |
| 8 | **Every ux-spec screen registered,** and no screen registered that is not in the ux-spec. | `kickoff fe check` reports no `coverage:` lines. |
| 9 | **Release tags correct** under the *tagged* scope (`?scope=tags`): every later-release part is outlined and labelled, MVP parts are not. | Open each screen group with `scope=tags`; compare with the releases in the ux-spec and `features.yaml`. |
| 10 | **MVP view** under `?scope=mvp` hides later-release blocks and nav items; nothing of a later release reads as part of the MVP. | Open each screen group with `scope=mvp`. |
| 11 | **Navigation versus filters.** Navigation goes to distinct pages; filters stay in-page and live in the route params. | Click through each role's menu: no item reloads a near-identical page with a filter applied. |
| 12 | **Scenarios.** Every scenario of the build plan walks to its end in the prototype bar and names the features it shows. | The sweep walks every scenario; compare `scenarios.ts` with the workshop's demo list. |
| 13 | **Fidelity: the product's chrome.** Each role shows the shell of its ux-spec row (`site`: header with top menu, footer, phone tabs; `app`: sidebar), and nothing on screen says the prototype differs from the product. | Open every role's home on the desktop and at 390 px; compare with the ux-spec Shell column. |
| 14 | **No screen codes or prototype words in product UI.** No "SC-nn" label, no "prototype", "demo", "mock" or state switches in the product area; they belong in the prototype bar only. | Read the screenshots (`demo=0`); add any pattern found to `fe.forbidden`. |
| 15 | **Strings localised.** With a non-English UI, empty states, errors, dialogs and toasts speak `languages.ui` through i18next; no English left in the product area. | Open screens with empty data and an error; read every toast and dialog. |
| 16 | **Locale formats.** Numbers, percentages, money, dates, times and units follow the Copy guide formats through the shared formatters with `config.locale`. | Read table cells, chart axes and date lines in the screenshots; search screens for hand-built number or date strings. |
| 17 | **Letter case.** Sentence case for titles, buttons, labels and table headers; no `uppercase` classes in languages with stacked diacritics. | Read the screenshots; search for `uppercase` in `apps/web/src`. |
| 18 | **One main action per screen.** One filled (default) button; secondary actions outline, ghost or links; only actions that are possible now. | Count the filled buttons in each screenshot. |
| 19 | **No look-alike blocks.** Two blocks on one screen differ in shape and purpose; no KPI row repeats counts listed below it; the same text never appears twice on a screen; at most one guidance device per screen. | Read each screenshot from top to bottom. |
| 20 | **Home differs by role.** Each role's home has the home shape of its ux-spec row and opens on what needs that role now. | Open every role's home side by side. |
| 21 | **Phone tabs for site roles.** Site roles used on phones show the bottom tab bar (first five nav groups) at 390 px. | Read the phone screenshots of every site role. |
| 22 | **Device views via route parameters.** Every device view (a kiosk, a full-screen start) opens from a link with a parameter and renders without product chrome it does not have. | Open each device view; add its route to a scenario so the sweep reaches it. |
| 23 | **Density per audience.** Staff screens compact, public desktop comfortable, phones touch; no per-screen control heights. | `config.ts` `density` per role; switch the density in the prototype bar on a staff screen. |
| 24 | **Card anatomy under stress.** With the stress fixtures (a 100-character title, 12 tags, a missing value), cards of one kind keep every slot in place, clamp long text with the full text available, and show "—" for empty values. | Open the list screens with the stress data. |
| 25 | **Surfaces per the overlay table.** Every overlay is an `@app/ui` overlay; one confirm component (`AlertDialog`); no hand-made dialogs or scrims. | Walk the overlay decision table for each screen's actions. |
| 26 | **Consequences per the matrix.** Confirm only destroy, lock out, publish or unpublish, overwrite and leaving a dirty form; undo for reversible actions (toast with undo). | List each screen's actions with their class in the build plan. |
| 27 | **Focus and scroll after every route.** A new screen starts at its top with focus on its one `h1`; Back returns to the scroll position. | Try Back on each list → detail path. |
| 28 | **Motion only in the changed region,** ≤ 300 ms, transform and opacity, from the motion tokens; reduced motion respected. | Watch one route, one panel and one toast with reduced motion on and off. |
| 29 | **Data at volume.** Every list shows its total, searches, filters, sorts and pages to its realistic volume through the API, and keeps its state in the URL. | Compare each list with its screen brief (`../../ux-design/references/data-at-volume.md`). |
| 30 | **Per-screen `ui-ux-pro-max` brainstorm recorded.** Every screen's brief or the build plan lists its 2–4 queries with what was taken or rejected and why. | Read the build plan: no screen without its brainstorm log. |
