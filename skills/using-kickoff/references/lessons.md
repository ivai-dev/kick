# Lessons encoded as checks

Each row is a mistake made on a real project and the check that now prevents it: rows 1–13 come from AI Minute (a meeting-minutes product), rows 14–27 from a public employment portal with a Vietnamese UI (job seekers, employers, staff and commune kiosks). Phase skills quote the rows that apply to them in their **Lessons** section.

| Lesson | Where it is enforced |
| --- | --- |
| `chain_after` created a cycle; the schedule ran to 2039 | `validate` cycle detection; `schedule` refuses to run with a cycle |
| Sync matched issues by title and created a duplicate after a rename | hidden body key matching |
| Render errors did not surface in headless checks | `core.js` render-error capture |
| Headless "narrow" screenshots clamped around 520 px | `narrow.html` 390 px iframe |
| Splitting prototype modules dropped imports, found only tasks later | full-route `proto check` after every task |
| No doctype meant quirks mode; tables unreadable in dark mode | `table{color:inherit}` in kit `index.html` |
| Every role saw the chair's home below 760 px | per-role home routing in `shell.js`, covered by check routes per role |
| A role token in the URL let an admin open meeting content | role guard in `jump()` |
| A development VPN name and IP range appeared in product UI | `data.js` rule and `proto lint` pattern list from `project.yaml` |
| Dense, heavy text overwhelmed the reviewer | density modes and type roles in the kit, `proto lint` thresholds |
| A sidebar filter that reloaded a near-identical page confused the reviewer | `ux-design` rule: navigation goes to a distinct page; filters stay in-page |
| Literal `\n` in a Bash heredoc became real newlines in JS | skills write files with file tools, not heredocs |
| A late sign-off moved the MVP gate | `signoff` workshop date is a package in `plan.yaml` with a risk entry; `schedule` shows its effect |
| Public pages of the product had a top menu, but the prototype could only show the kit sidebar; the team wrote "the prototype differs from the product" | kit site shell (`shell: "site"`) and bare screens; `ux-design` shell per role; `prototype` fidelity rule |
| Kiosk and other device views of a web screen could not be opened from a link, screenshotted or checked | route parameters `#<screen>[-tokens]?key=value`; `proto check` accepts routes with role tokens and parameters |
| "No change", "No data yet", "Close" appeared in a Vietnamese product UI, and the prototype bar spoke English to the customer | `KIT.t` with `en` and `vi` packs, `KIT_CONFIG.lang` and `KIT_CONFIG.strings` |
| "+7.1%" sat next to "2.304" | `proto new` writes `locale` and `lang` from `languages.ui`; `proto lint` fails on a non-English UI without `locale` |
| Small uppercase labels crowded stacked Vietnamese diacritics | `--cap-case` token; `proto new` sets `none` for vi |
| A kit improvement could reach an existing prototype only through `proto new --force`, which overwrites project files | `kickoff proto update [--dry]` |
| Screen codes in product UI, look-alike KPI rows on every home, text explaining system mechanics, unclear next actions | `ux-design` home shape per role, anti-flooding and copy rules, `content-and-craft.md`, `guidance-library.md`; `prototype` screen checklist and design review loop |
| Republishing the prototype Artifact from a new session was refused | `prototype` publish step: read the published files and compare their hashes with git before overwriting |
| Screens felt heavy and sticky: 93–100 % of public text at weight ≥ 600, a rounded font at 800, `line-height: 1` on text boxes | `ux-design` quiet type rules per UI language; kit role tokens; `proto lint` L1–L3 and the runtime audit |
| The same task opened a drawer, a dialog or a bottom sheet; 9 overlay mechanisms with different focus bugs | overlay decision table; one `KIT.ui` overlay set on a library; `proto lint` L11–L13; `#kit-selftest` |
| Route changes swapped the whole screen in one frame and kept the old scroll and focus | `commitNav` with View Transitions, scroll reset and restore, focus to the `h1`; self-test S7 |
| Screens designed for 15 rows could not hold thousands | data at volume in the screen briefs; DataTable family; seeded data generator |
| Kiosk and phone sizes leaked onto desktop and staff screens | density modes from the shell; `proto lint` L8 |
| Card slots moved with content length (salary drift 46 px) | EntityCard anatomy with reserved slots and clamps; stress fixtures in the screen checklist |

## Which skill applies each row

1. Dependency cycle: `plan` runs `kickoff validate` before `kickoff schedule` and fixes the reported cycle instead of working around it.
2. Title matching: `tickets` syncs only through `kickoff tickets push`, never by creating or renaming issues by hand.
3. Render errors: `prototype` treats any `data-err` reported by `kickoff proto check` as a failure.
4. Narrow screenshots: `prototype` checks phone width only through `kickoff proto check` (390 px iframe), never by resizing a headless window.
5. Dropped imports: `prototype` runs `kickoff proto check` over all routes after every task, not only the new routes.
6. Quirks mode: `prototype` never edits the kit core files (`narrow.html` and `js/{route,core,ui,charts,scope,shell,scenario,main}.js`) and changes `index.html` only in its tokens and modules blocks.
7. Wrong home per role: `ux-design` defines a home screen per role; `prototype` checks every role's home at 390 px.
8. Role token in the URL: `ux-design` lists the roles of every screen; `prototype` registers screens with their `roles` so the guard in `jump()` applies.
9. Development infrastructure in UI: `init` records the patterns in `proto.forbidden`; `prototype` keeps `data.js` synthetic and runs `kickoff proto lint`.
10. Dense text: `ux-design` writes density modes per audience and the type roles; `prototype` runs `kickoff proto lint`; `feedback` fixes visual items across the whole product, not one screen.
11. Filter as a page: `ux-design` writes the rule into the ux-spec navigation rules; `prototype` follows it.
12. Heredocs: every skill writes files with the file tools (see `conventions.md`, Files).
13. Late sign-off: `signoff` makes the workshop a package in `plan.yaml` with a risk entry and runs `kickoff schedule`; `plan` keeps both.
14. Prototype differs from the product: `ux-design` gives every role a shell (`site` or `app`); `prototype` follows the fidelity rule, configures the site shell and uses bare screens; `signoff` and `feedback` show customers only material with the real product chrome.
15. Device views: `ux-design` notes device views as route parameters; `prototype` registers them as parameters (bare when they have their own frame) and checks them with `kickoff proto check "<route>?<param>=1"`.
16. English kit strings: `prototype` sets `lang` in `js/config.js` and overrides single strings with `KIT_CONFIG.strings`; the screen checklist reads every empty and unchanged state.
17. Number formats: `prototype` keeps the `locale` that `kickoff proto new` writes and formats numbers through the kit; `kickoff proto lint` fails without it; `ux-design` writes the formats into the Copy guide.
18. Letter case: `ux-design` sets letter case in the Craft rules; the kit sets `--cap-case: none` from `lang` for languages with stacked diacritics.
19. Kit updates: `prototype` runs `kickoff proto update --dry`, then `kickoff proto update`, never `kickoff proto new --force` on a built prototype.
20. Flooding: `ux-design` writes home shapes, the anti-flooding rules and the Copy guide (`references/content-and-craft.md`, `references/guidance-library.md`); `prototype` walks the screen checklist and runs the design review loop (`references/design-review.md`); `feedback` fixes such remarks across the whole product.
21. Republish refused: `prototype` reads the published files in a new session, compares their hashes with the committed files, and asks the lead when one matches no commit.
22. Heavy type: `ux-design` writes density modes and the type roles with line-height rules into the design system (`references/foundation-rules.md`); `prototype` uses the role classes and passes `kickoff proto lint` and the audit in `kickoff proto check`.
23. Many overlay kinds: `ux-design` writes the overlay decision table and the consequence matrix; `prototype` uses only `KIT.ui` overlays, kept mounted with `open=`; `kickoff proto check` runs the self-test.
24. Route motion, scroll and focus: the kit owns them; `prototype` puts `data-kit-key` on openers and one `h1` per screen.
25. Data at volume: `ux-design` writes volumes and list functions (`references/data-at-volume.md`); `prototype` writes them into every screen brief and builds lists with `DataTable`, `FilterBar` and `Pager` on a seeded generator.
26. Density leaks: the shell sets the density; `prototype` writes no per-screen control sizes (`proto lint` L8).
27. Card drift: `prototype` builds cards on `EntityCard` and checks them with the stress fixtures (screen checklist item 25).
