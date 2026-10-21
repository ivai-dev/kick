# Lessons encoded as checks

Each row is a mistake made on a real project and the check that now prevents it: rows 1–13 come from AI Minute (a meeting-minutes product), rows 14–27 from a public employment portal with a Vietnamese UI (job seekers, employers, staff and commune kiosks), rows 28–30 from running kickoff next to the ECC plugin. Phase skills quote the rows that apply to them in their **Lessons** section.

| Lesson | Where it is enforced |
| --- | --- |
| `chain_after` created a cycle; the schedule ran to 2039 | `validate` cycle detection; `schedule` refuses to run with a cycle |
| Sync matched issues by title and created a duplicate after a rename | retired in 0.6: no tracker sync; the export keys every item by its WBS code |
| Render errors did not surface in headless checks | the e2e sweep of `kickoff fe check` fails on console errors, page errors and `data-kickoff-error` |
| Headless "narrow" screenshots clamped around 520 px | the sweep sets a real 390×844 viewport for every screen and role |
| Splitting prototype modules dropped imports, found only tasks later | `kickoff fe check` (typecheck, build, sweep) after every task |
| No doctype meant quirks mode; tables unreadable in dark mode | the sweep runs every screen in light and dark, with axe in light |
| Every role saw the chair's home below 760 px | a home per role in `config.ts`; the sweep opens every screen in every role of its row |
| A role token in the URL let an admin open meeting content | the role guard of the `@kickoff/kit` router |
| A development VPN name and IP range appeared in product UI | synthetic seed in `packages/mocks`; `fe check` scans `apps/` and `packages/` with `fe.forbidden` |
| Dense, heavy text overwhelmed the reviewer | density per role and the type-role classes; the kit's ESLint rules |
| A sidebar filter that reloaded a near-identical page confused the reviewer | `ux-design` rule: navigation goes to a distinct page; filters stay in-page |
| Literal `\n` in a Bash heredoc became real newlines in JS | skills write files with file tools, not heredocs |
| A late sign-off moved the MVP gate | `signoff` workshop date is a package in `plan.yaml` with a risk entry; `schedule` shows its effect |
| Public pages of the product had a top menu, but the prototype could only show the kit sidebar; the team wrote "the prototype differs from the product" | `shell: "site"` per role in `config.ts`; the FE v0 is the product's own UI |
| Kiosk and other device views of a web screen could not be opened from a link, screenshotted or checked | route parameters `#/<role>/<screen>?kiosk=1`, reached by scenario steps in the sweep |
| "No change", "No data yet", "Close" appeared in a Vietnamese product UI, and the prototype bar spoke English to the customer | i18next with the `languages.ui` file; the prototype bar speaks `config.lang` |
| "+7.1%" sat next to "2.304" | `kickoff fe new` writes `locale` from `languages.ui`; shared `Intl` formatters |
| Small uppercase labels crowded stacked Vietnamese diacritics | the `@kickoff/kit` foundation CSS drops forced upper-case for `lang="vi"` |
| A kit improvement could reach an existing prototype only through `proto new --force`, which overwrites project files | `kickoff fe update [--dry]` replaces `packages/kit` only |
| Screen codes in product UI, look-alike KPI rows on every home, text explaining system mechanics, unclear next actions | `ux-design` home shape per role, anti-flooding and copy rules, `content-and-craft.md`, `guidance-library.md`; `prototype` screen checklist and design review loop |
| Republishing the prototype Artifact from a new session was refused | `prototype` publish step: read the published Artifact and compare it with the bundle of the recorded commit |
| Screens felt heavy and sticky: 93–100 % of public text at weight ≥ 600, a rounded font at 800, `line-height: 1` on text boxes | `ux-design` quiet type rules per UI language; the kit's type-role tokens; ESLint (no weight above 700, no inline font styles) |
| The same task opened a drawer, a dialog or a bottom sheet; 9 overlay mechanisms with different focus bugs | overlay decision table; `@app/ui` overlays only (shadcn on Radix) |
| Route changes swapped the whole screen in one frame and kept the old scroll and focus | the kit router: focus to the `h1`, scroll restore, `document.title`; motion tokens |
| Screens designed for 15 rows could not hold thousands | data at volume in the screen briefs; `DataTable` with server-style paging on the seeded API |
| Kiosk and phone sizes leaked onto desktop and staff screens | density per role in `config.ts`; the `--control-h*` tokens |
| Card slots moved with content length (salary drift 46 px) | card presets in `packages/ui`; stress fixtures in the seed and the screen checklist |
| ECC's GateGuard stopped the first write of every kickoff document | `kickoff ecc setup` exempts `.kickoff/**`, `docs_root` and `AGENTS.md`; `ecc doctor` D5 |
| ECC handoffs were broken: `plan-orchestrate` emits an unloaded `/orchestrate`, and the `epic-*` commands use a script path relative to the current folder | `kickoff ecc run`; `references/ecc.md` never uses `plan-orchestrate` |
| The installed plugin (0.3.0) lagged the repository (0.3.1) and the CLI matched the old one | start-up check 1 compares the CLI with `plugin.json`; install from the marketplace with auto-update |

## Which skill applies each row

1. Dependency cycle: `plan` runs `kickoff validate` before `kickoff schedule` and fixes the reported cycle instead of working around it.
2. Title matching: retired in 0.6 (kickoff no longer syncs a tracker); `kickoff export` gives each work item its permanent WBS code.
3. Render errors: `prototype` treats every sweep failure of `kickoff fe check` as a failure.
4. Narrow screenshots: `prototype` checks phone width only through the sweep (real 390 px viewport) and `fe check --shots`.
5. Dropped imports: `prototype` runs `kickoff fe check` after every task, never only `--skip-e2e`.
6. Dark mode: the sweep covers both themes; `prototype` reads the dark screenshots in the screen checklist.
7. Wrong home per role: `ux-design` defines a home screen per role; `kickoff fe new` writes it into `config.ts`; the sweep opens every role.
8. Role token in the URL: `ux-design` lists the roles of every screen; `screens.ts` keeps them, and `fe check` reports role drift as `coverage:`.
9. Development infrastructure in UI: `init` records the patterns in `fe.forbidden`; `prototype` keeps the seed synthetic; `fe check` scans for them.
10. Dense text: `ux-design` writes density modes per audience and the type roles; `prototype` uses the type-role classes; `feedback` fixes visual items across the whole product, not one screen.
11. Filter as a page: `ux-design` writes the rule into the ux-spec navigation rules; `prototype` follows it.
12. Heredocs: every skill writes files with the file tools (see `conventions.md`, Files).
13. Late sign-off: `signoff` makes the workshop a package in `plan.yaml` with a risk entry and runs `kickoff schedule`; `plan` keeps both.
14. Prototype differs from the product: `ux-design` gives every role a shell (`site` or `app`); `prototype` follows the fidelity rule in the product's own UI code; `signoff` and `feedback` show customers only material with the real product chrome.
15. Device views: `ux-design` notes device views as route parameters; `prototype` builds them as parameters and adds them to scenario steps so the sweep reaches them.
16. English strings: `prototype` writes all copy through i18next in `languages.ui`; the screen checklist reads every empty and error state.
17. Number formats: `prototype` formats through the shared formatters with `config.locale`; `ux-design` writes the formats into the Copy guide.
18. Letter case: `ux-design` sets letter case in the Craft rules; the kit drops forced upper-case for Vietnamese; screens add no `uppercase` classes.
19. Kit updates: `prototype` runs `kickoff fe update --dry`, then `kickoff fe update`; `kickoff fe new --force` keeps project files.
20. Flooding: `ux-design` writes home shapes, the anti-flooding rules and the Copy guide (`references/content-and-craft.md`, `references/guidance-library.md`); `prototype` walks the screen checklist and runs the design review loop (`references/design-review.md`); `feedback` fixes such remarks across the whole product.
21. Republish refused: `prototype` reads the published Artifact in a new session, compares it with the bundle of the recorded commit, and asks the lead when it matches none.
22. Heavy type: `ux-design` writes density modes and the type roles with line-height rules into the design system (`references/foundation-rules.md`); `prototype` uses the role classes, and the kit's ESLint rules run in `kickoff fe check`.
23. Many overlay kinds: `ux-design` writes the overlay decision table and the consequence matrix; `prototype` uses only `@app/ui` overlays, one per task.
24. Route motion, scroll and focus: the kit router owns them; `prototype` gives every screen one `h1` and uses the motion tokens.
25. Data at volume: `ux-design` writes volumes and list functions (`references/data-at-volume.md`); `prototype` writes them into every screen brief and builds lists with `DataTable` and `FilterBar` on the seeded API.
26. Density leaks: `config.ts` sets the density per role; `prototype` writes no per-screen control sizes.
27. Card drift: `prototype` builds cards on the presets in `packages/ui` and checks them with the stress fixtures (screen checklist item 24).
28. GateGuard friction: `init` runs `kickoff ecc setup` after the lead's yes; `using-kickoff` offers it when `kickoff ecc doctor` warns D5.
29. Broken ECC handoffs: every skill calls ECC scripts through `kickoff ecc run` and follows `references/ecc.md`.
30. Version drift: `using-kickoff` start-up check 1; the release checklist reinstalls the CLI.
