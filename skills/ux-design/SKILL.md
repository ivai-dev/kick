---
name: ux-design
description: Use when defining a project's information architecture, screen inventory, behaviour rules, copy guide or design system before building a prototype
---

# UX design

Turns the approved feature map into the UX specification (roles, shell and home per role, IA per role, every screen of every release and platform, behaviour rules, states, copy, accessibility) and the design system the prototype is built with. A concept round with the lead comes before the design system. `kickoff proto new` and `kickoff proto check` read the screen inventory of `ux-spec.md`, so its table format is exact.

## When to use

- After C2, before the first prototype.
- Again when features gain or lose screens, the lead changes the design direction, or a design review changes the rules. Customer feedback on screens goes through `kickoff:feedback`, which updates `ux-spec.md` in chain order.

## Preconditions

- `kickoff can ux-design` exits 0 (feature-map done, C2 approved).
- The `ui-ux-pro-max` skill is available. If it is missing, stop and tell the user: "Install the ui-ux-pro-max skill, then start a new session."

## Inputs

- `.kickoff/features.yaml` and `<docs_root>/02-requirements/feature-map.md`: epics, features, releases, platforms.
- `<docs_root>/02-requirements/nfr.md`: accessibility, compatibility and localisation targets.
- `<docs_root>/01-discovery/vision-scope.md`: users and roles, platforms, constraints; `open-questions.md` (Decision log).
- `.kickoff/project.yaml`: `releases`, `languages.ui`, `proto.ux_spec` (default `<docs_root>/05-design/ux-spec.md`), `proto.forbidden`.
- `templates/ux-spec.md` and `templates/design-system.md` in this skill's folder.
- `references/content-and-craft.md` (copy review, craft rules, locale formats), `references/guidance-library.md` (guidance devices, motion), `references/foundation-rules.md` (density modes, type roles, layout, overlays and consequences, motion, card anatomy, form grid) and `references/data-at-volume.md` (volumes and list functions per entity, stress fixtures) in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can ux-design`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start ux-design`.
2. **Confirm the design inputs** with the lead using the Interview method: product type, audiences, three to five keywords for the visual direction, and which audiences use a calm work tool (the default) and which need a bolder public look.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

3. **Design direction with `ui-ux-pro-max`.** Invoke the `ui-ux-pro-max` skill and run its search with `--design-system` on "<product type> <audience> <keywords>" with `-p "<project name>"`, plus the sliders `--density` per audience (2–3 for public and self-service screens, 4–5 for staff consoles that work through lists all day, the kiosk at 1–2), `--variance` and `--motion` (low values, 2–3, for work tools). Do not pass `--persist`.
4. **Focused queries** as the screens need them: `--domain ux` (forms, tables, navigation, empty states), `--domain typography`, `--domain color` (check contrast in light and dark), `--domain chart` (one query per kind of data shown). If a search returns nothing, retry once with a narrower query. If it is still empty, keep the defaults below and say so. Never write output you have not checked into the files.
5. **Roles and IA per role.** For each product role (an id of lowercase letters and digits, since it appears in prototype URLs), write:
   - **Shell:** `site` for public and self-service audiences (a header with a top menu and an account area, a footer; on phones a compact header and a bottom tab bar of 3–5 screens), `app` for work tools (a sidebar). Pick the shell the product will have: the prototype draws exactly this one.
   - **Home shape,** matched to the role's main job and opening on "what needs me now": an *approval inbox* (one queue, urgent items first) for approvers; a *pipeline* (a to-do card, then items by stage) for people who move work forward; *health and tasks* (one status band, then a short task list) for administrators; a *next-action hero* (one question or one next step) for occasional and self-service users. Homes of different roles do not share one template, and a row of KPI tiles is not a home shape.
   - Its navigation sections with their screens (menu labels of 24 characters or fewer, equal to the page title), and its platforms.

   Every role has its own home screen at every width.
6. **Screen inventory.** Write one row per screen of the full product, across every release and platform. IDs are permanent: `SC-nn` web, `W-nn` Windows, `A-nn` Android (or the prefixes in `project.yaml`). The table is the first table in `ux-spec.md` whose first header cell is `ID`, with exactly these five columns and nothing between the rows:

   ```markdown
   | ID | Screen | Roles | Platform | Release |
   | --- | --- | --- | --- | --- |
   | SC-01 | Home | librarian, admin | web | MVP |
   | A-01 | My loans | member | android | MVP |
   ```

   - Roles are comma-separated role ids. Platform is `web`, `windows` or `android`. Release is a release id from `project.yaml`.
   - List each role's home screen before its other screens: `kickoff proto new` makes the first screen that names a role that role's home.
   - The roles of a screen are its access rule: the prototype's role guard refuses every other role.
   - A device view of a web screen (a kiosk, a full-screen start screen) is not a new row: note it under the screen in the Notes, as a route parameter the prototype will read (`?kiosk=1`).

7. **Link features to screens:** set `screens: [SC-01, …]` on every active feature in `.kickoff/features.yaml` (IDs and releases unchanged). A feature without a screen (a background job, an import) gets a line in the ux-spec Notes saying why.
8. **Concept round,** before the design system. Make 3–4 visual direction options, each applied to the same 2–3 key screens (a public or self-service screen, a work screen, a phone view), on a design canvas or as side-by-side HTML artboards under `<docs_root>/05-design/concept/`, with synthetic data and copy in `languages.ui`. Show them to the lead with one line per option (mood, type, colour, where it fits) and a recommendation. Refine the chosen option with the loop of `../prototype/references/design-review.md` at concept scale:
   - 3–4 reviewer agents in parallel: `kickoff:viewpoint-reviewer` once per audience group, `kickoff:craft-auditor` for the visual details, and `kickoff:ia-reviewer` for the product view;
   - a cross-review round;
   - one integrated concept from `kickoff:integrator`.

   The agents are read-only and return their reports; save each one in the concept folder. Then run the copy review and declutter pass of `references/content-and-craft.md` on the artboard text. Log the direction as `D<n>` in the Decision log of `open-questions.md`, with its date and source.
9. **Write `ux-spec.md`** at `proto.ux_spec` from `templates/ux-spec.md`, sections in this order: Roles and IA per role, Screen inventory, Navigation rules, Behaviour rules (numbered `BR-<n>`), States (empty, loading, error, offline), Copy guide, Accessibility. These rules are defaults; keep them unless the lead decides otherwise:
   - navigation goes to distinct pages; filters stay in-page (never a menu item that reloads a near-identical page with a filter applied);
   - **one primary job per screen:** above the fold, at most the header, one guidance device from `references/guidance-library.md` and the start of the main content;
   - **one main action per screen** (one filled button); a screen offers only the actions possible now;
   - **no repeated look-alike blocks:** two blocks on one screen differ in shape and purpose; no KPI row that repeats counts listed below it; the same text never appears twice on a screen;
   - **the header sentence names the task** or carries live facts (counts, dates, state); with nothing live there is no sentence; rules and detail go into an (i) popover;
   - development infrastructure (VPN names, private IP ranges, internal hosts, tool names) and screen codes never appear in product UI;
   - copy, sample data and fixtures are in `languages.ui`, with invented names only.

   The **Copy guide** holds: voice and tone per audience (form of address, verbs, words to avoid, one example each); the term table, one name per thing; "only what the user needs now" (no text that explains system mechanics, such as "free", "not stored", timers or how checks work; a fact appears when its event happens); punctuation; letter case; number, date and unit formats from the UI locale. Take the values from `references/content-and-craft.md`.
10. **Write `<docs_root>/05-design/design-system.md`** from `templates/design-system.md`, sections: Principles, Tokens (light and dark), Type scale, Spacing, Motion, Status vocabulary, Components, Charts, Scope layer, Density and copy, Craft rules, Accessibility. Use the kit's token names so the prototype can copy the values into its tokens block. Write it from `references/foundation-rules.md`:
   - **Density modes** per audience: compact for staff consoles (32 px controls), comfortable for public desktop (40), touch for phones and coarse pointers (48), kiosk (64 in its layout px); the shell decides, never the component.
   - **Type roles per mode** (display, headline, title-l, title, body, prose, body-s, label, button, meta, caption, figure, figure-l, value, code); weights 400/500/600/700, 700 only for display, never 800; at most 6 sizes per screen. Line height for languages with stacked diacritics (Vietnamese): ≥ 1.2 on any text box, ≥ 1.34 where titles wrap, ≥ 1.5 for paragraphs and clipped text; re-measure when the font changes.
   - **Layout:** window classes, content widths, page types (`data` fluid to 1600 px, `form` to 1200, left-anchored on staff screens; 1200 px centred public container), the one-box rule.
   - **Overlays and consequences:** the overlay decision table (one surface per task) and the consequence matrix (confirm only what destroys, locks out, publishes or overwrites; undo for the rest; a notice to another person held 10 s).
   - **Motion:** tokens (100–300 ms, three curves, shifts per mode) and the patterns (route, master-detail, reveal, toast), reduced motion keeping dissolves.
   - **Data at volume:** each list's expected volume and its functions (total, search, filter, sort, paging, bulk, export, URL state) from `references/data-at-volume.md`.

   **Craft rules** set the type scale per density mode (at most 6 sizes per screen), weights, letter case (`--cap-case: none` for languages with stacked diacritics such as Vietnamese), spacing rhythm, and chip, button and icon rules (`references/content-and-craft.md`). Motion follows `references/guidance-library.md`, with a reduced-motion fallback for every motion. State that the product bundles its fonts and assets; the prototype's CDN use does not relax that.
11. **Regenerate and validate:** `kickoff docs` (it regenerates the feature map; screens are not rendered there, they live in `features.yaml` and the ux-spec inventory), then `kickoff validate`.
12. **Verify** (section below), then `kickoff phase done ux-design` and commit `docs: UX specification and design system`.

## Outputs

- `<docs_root>/05-design/ux-spec.md` (or the path in `proto.ux_spec`)
- `<docs_root>/05-design/design-system.md`
- `<docs_root>/05-design/concept/`: the concept options and the integrated concept
- `<docs_root>/01-discovery/open-questions.md`: the design direction as `D<n>`
- `.kickoff/features.yaml` with `screens` on every active feature (`<docs_root>/02-requirements/feature-map.md` is regenerated but does not list screens)
- `.kickoff/state.yaml`: `ux-design: done`

## Verify

1. Read the Screen inventory of `ux-spec.md`. Its header is exactly `| ID | Screen | Roles | Platform | Release |`, no earlier table starts with `ID`, and every row has five cells: a unique ID, role ids in lowercase letters and digits, a platform of `web`, `windows` or `android`, and a release from `project.yaml`.
2. Every screen named in `features.yaml` `screens` is in the inventory, and every inventory screen serves at least one feature.
3. Every role in "Roles and IA per role" has a shell (`site` or `app`), a home shape and a home screen, and that screen is the role's first row in the inventory. Two roles share a home shape only with a written reason.
4. The Copy guide has voice per audience, a term table, punctuation, letter case and formats for the UI locale; `design-system.md` has Craft rules.
5. The Decision log has the design direction as `D<n>`.
6. `kickoff check-docs <ux-spec.md> <design-system.md>` prints `check-docs passed` (no placeholder, no forbidden phrase).
7. Search both files with each pattern of `proto.forbidden` in `project.yaml`: no match.
8. `kickoff validate` reports `0 errors`, and `kickoff docs --check` prints `documents up to date`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Every role saw the chair's home below 760 px: define a home screen per role here, so the prototype routes each role to its own home at every width.
- A role token in the URL let an admin open meeting content: list the roles of every screen, so the prototype's role guard applies.
- Dense, heavy text overwhelmed the reviewer: density modes per audience and the quiet type rules, one short sentence per header.
- Screens felt heavy and sticky: bold everywhere, a rounded font at 800, touch sizes on desktop: density modes per audience and the quiet type rules (lessons row 22).
- The same task used a drawer, a dialog and a sheet: the overlay decision table (lessons row 23).
- Screens designed for 15 rows could not hold thousands: write each list's volume and functions into the design system and the screen briefs (lessons row 25).
- A sidebar filter that reloaded a near-identical page confused the reviewer: navigation goes to a distinct page; filters stay in-page.
- The product's public pages had a top menu, but the prototype showed a sidebar and the team wrote a "differs from the product" note: give every role its shell here (lessons row 14).
- Every home opened with a look-alike row of KPI tiles, and users did not know what to read or do first: each role gets a home shape matched to its job, and the anti-flooding rules apply to every screen (lessons row 20).
- Text that explained system mechanics ("free", "not stored", timers) crowded a kiosk screen: only what the user needs now; facts appear when their event happens (lessons row 20).
- "+7.1%" sat next to "2.304", and small uppercase labels crowded stacked diacritics: formats come from the UI locale, and letter case is a craft rule (lessons rows 17 and 18).
- The lead could judge a direction only with options side by side: show 3–4 concepts before writing the design system.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:prototype`, which scaffolds the prototype from this screen inventory with `kickoff proto new`. `kickoff status` names it.
