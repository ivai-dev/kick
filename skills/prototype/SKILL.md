---
name: prototype
description: Use when building or updating the clickable full-product prototype that the customer reviews before scope is locked
---

# Prototype

Builds the clickable prototype of the full product: every role, platform and release, with a scope layer that shows the MVP line and guided demo scenarios for the sign-off workshop. It is built on the kickoff prototype kit (no build step), checked with `kickoff proto check` and `kickoff proto lint`, reviewed from several viewpoints, and published as a private Artifact or a single HTML file.

**Fidelity rule:** the prototype shows exactly what the product will show: its chrome, navigation and wording, in the customer's language. Customer feedback on anything else has no value. When the kit cannot show something, use the site shell, a bare screen or route parameters, or extend the kit in project files; never ship a note that says the prototype differs from the product.

## When to use

- After `kickoff:ux-design`, to build the first prototype for the customer review.
- Again when the ux-spec changed (new screens, new rules), when the plugin ships a newer kit, or before a workshop. Changes the customer asked for go through `kickoff:feedback`, which calls back into the prototype in chain order.

## Preconditions

- `kickoff can prototype` exits 0 (ux-design done, C2 approved).
- `ux-spec.md` exists at `proto.ux_spec` (default `<docs_root>/05-design/ux-spec.md`) with its screen inventory and a shell per role.
- Edge or Chrome is installed for `kickoff proto check` (or `KICKOFF_BROWSER` / `proto.browser` in `project.yaml` points to one).
- The `ui-ux-pro-max` skill is available.

## Inputs

- `ux-spec.md` (Roles and IA with shell and home shape, Copy guide) and `<docs_root>/05-design/design-system.md` (Craft rules).
- `.kickoff/features.yaml` (features per screen, releases) and `.kickoff/project.yaml` (`languages.ui`; `proto.dir`, default `<docs_root>/05-design/prototype`; `proto.forbidden`; lint thresholds `proto.max_font_sizes`, `proto.max_weight_600`, `proto.max_inline_styles`).
- The kit guide `README.md` inside the prototype folder after `kickoff proto new`: `KIT.register`, `KIT.ui`, `KIT.charts`, `KIT.t`, shells, density modes, type roles, overlays, motion, hash routes and parameters, scenarios, checks.
- `references/screen-checklist.md` and `references/design-review.md` in this skill's folder; `../ux-design/references/content-and-craft.md`, `../ux-design/references/guidance-library.md`, `../ux-design/references/foundation-rules.md` and `../ux-design/references/data-at-volume.md`.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can prototype`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start prototype`.
2. **Presentation choices** with the lead, using the Interview method: one build with a scope layer (recommended: the customer sees the full product and the MVP line in one place) or a separate MVP build; which roles to show (default: every role in the ux-spec); which demo scenarios (2–5, one per key journey, each naming the features it shows); the workshop date.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

3. **Scaffold:** `kickoff proto new`. It copies the kit into `proto.dir` and writes `js/config.js` (roles with `shell: "app"`, homes, releases, platforms from the ux-spec; `locale` and `lang` from `languages.ui`), `js/data.js`, `js/screens.js` (one `KIT.ui.Placeholder` stub per screen) and `js/scenarios.js`; the kit sets the letter case for Vietnamese itself. It refuses when `index.html` already exists. When updating an existing prototype, skip this step and register new screens by hand. When the plugin ships a newer kit, run `kickoff proto update --dry` (it lists what would change and prints `migration:` lines for what the project must change), then `kickoff proto update`: it copies the kit core over the project's copies and refreshes `index.html` outside the title, tokens and modules blocks, and never touches project modules. Fix the migration notes in the first work package. Never run `kickoff proto new --force` on a built prototype: it overwrites the kit files and all four project files.
4. **Required per screen, before it is built: a `ui-ux-pro-max` brainstorm and a data-at-volume audit.** For every screen, load `ui-ux-pro-max` and brainstorm: 2–4 queries (`--domain ux` always; `product`, `chart`, `typography` as the screen needs; `--stack react` for code patterns: the kit is Preact with htm), retry an empty search once, and record the queries with what was taken or rejected and why in the screen brief or the build plan. Then audit the screen's data at volume with `../ux-design/references/data-at-volume.md`: each list's volume, the functions it needs (total, search, filter, sort, paging or "show more", bulk, export, history, URL state), the layout per width and the states. A screen without a recorded brainstorm and data audit is not done; never copy search output you have not checked.
5. **Build plan:** save `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` using the Build plan method and show it to the lead. Tasks, in order:
   1. WP0: the design-system tokens copied into `index.html` between `/* kickoff:tokens:begin */` and `/* kickoff:tokens:end */` (only the values that differ from the kit's Foundation tokens; keep the names), the `<title>`, `js/config.js` (role names, homes, shells, density, fonts, `site`, `tabs`, `locale`, `lang`), the shared library on `KIT.ui` in a project module (for example `js/common.js`: presets such as a vacancy card on `EntityCard`, guidance devices, format helpers), and the data generator in `js/data.js` at realistic volume;
   2. one task per screen group: a module `js/<area>.js` that registers the group's screens and their device views, each screen built from its brief (brainstorm and data audit of step 4);
   3. scenarios: `js/scenarios.js`;
   4. a consistency pass: the same status labels, page headers, empty states, terms and spacing on every screen.

> **Build plan:** a checklist of tasks, each with files, inputs, verification command and expected output; every task leaves the project working.

   Every task's verification is `kickoff proto check` (no route arguments), and its expected output is `prototype check passed`. Tasks that run in parallel are split by file: no two tasks edit the same file, and each owns a marker section `/* == s<N>-<name> (<task>) == */ … /* == end s<N> == */` inside the tokens block, created by the shell task.

6. **Run the plan** with the Task run method. After every task, run `kickoff proto check` over **all** routes, not only the new ones. Without route arguments it also runs every scenario and the 390 px check of every screen. A quick `kickoff proto check sc-02` is fine while working inside a task, but explicit routes skip the scenarios and the other screens, so it never counts as the task's verification. Exit 1 lists the failures: `data-err` messages, coverage gaps, horizontal scroll at 390 px. Fix them before the next task. Exit 4 means no browser was found: the check was skipped, so stop and report it. A request to skip the full check or to limit it to the new routes "to save time" is declined in one sentence: it takes about half a minute, a regression it would have caught surfaces tasks later, and nobody can waive it. Run `kickoff proto check` with no route arguments and report its output.

> **Task run:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.

   How to write the project files:
   - `KIT.register("<id>", { comp, code, name, roles, platforms, rel, nav, icon, menu, bare, frame, page })`, where the id is the ux-spec code in lower case (`sc-02`), and `code`, `roles`, `platforms` and `rel` equal the ux-spec row. Remove each screen's stub from `js/screens.js` when its module registers it. Delete the file and its script tag once it is empty.
   - **Shell per role,** from the ux-spec Shell column: `shell: "app"` (sidebar) or `shell: "site"` on the role in `js/config.js`. A site role gets a header (brand, organisation line, top menu, account area), the page and a footer, and on phones a compact header with a menu sheet and the bottom bar of `tabs: [screen ids]`. Configure `KIT_CONFIG.site = { org, account: "<nav label of the account menu>", signIn: [{ label, go }], footer: ["…"] }`. The top menu lists the screens with `nav` outside the account group; `menu` on a screen overrides its label. Replace the header or footer with `KIT.site.Header` / `KIT.site.Footer` only when the product's differs.
   - **Bare screens and frames:** `bare: true` or `bare: (params, role) => boolean` renders the screen on the stage without any shell; a device frame (a kiosk) is a project component registered once with `KIT.frame("kiosk", KioskFrame)` and named on the screen with `frame`, so it stays mounted across steps and overlays inside it anchor to its box.
   - **Pages and density:** `page: "data"` (lists, queues, dashboards; the default) or `page: "form"` on `register`; the density comes from the shell (compact staff, comfortable public desktop, touch phones, kiosk frame): never per-screen control sizes.
   - **Overlays:** never write `<wa-*>` tags, hand-made dialogs, scrims or Escape handlers; use `KIT.ui` overlays kept mounted with `open=`, one surface per task from the overlay decision table of `../ux-design/references/foundation-rules.md`, consequences from its matrix (undo before confirm).
   - **Lists at volume:** `DataTable` (with `rowLink`, sorting, selection, paging), `FilterBar` or `FilterRail`, `BulkBar`, `Pager`; filters, sort and page in the route params (`go(id, params, { replace: true })`); `data-kit-key` on openers so Back returns to them.
   - **Data generator:** `js/data.js` builds the records from a seeded random generator (the same data every load), derives every count from the records, and includes the stress fixtures of `../ux-design/references/data-at-volume.md` (long names and titles, missing fields, many tags, 0/1/many results).
   - **Route parameters:** `#<screen>[-tokens][?key=value&…]`; integers become numbers, `true`/`false` booleans. A screen reads them from `useApp().params` and links with `KIT.go(id, params)`. Device views (`#sc-08-guest?kiosk=1`), records (`?id=tt03`) and flow steps use them, so every view opens from a link, appears in the screen index and can be checked.
   - **Language:** `locale` (number and date formats) and `lang` (`en` or `vi`: the kit's own words in the product area and the prototype chrome, through `KIT.t(key, vars)`) in `js/config.js`; `KIT_CONFIG.strings = { "<key>": "<text>" }` overrides single kit strings. Format numbers with `KIT.util.nf` and dates and units with one shared helper, never by hand. All copy follows the ux-spec Copy guide.
   - List the project scripts in `index.html` between `<!-- kickoff:modules:begin -->` and `<!-- kickoff:modules:end -->`, in the order `config.js`, `data.js`, shared modules, the screen modules, `scenarios.js`, each with `charset="utf-8"`.
   - Never edit the kit core: `narrow.html`, `test/` and `js/{route,logic,core,ui,ui-form,ui-data,charts,scope,shell,scenario,audit,main}.js`. In `index.html`, change only the title, the tokens block and the modules block. A kit gap is reported to the plugin maintainers and arrives through `kickoff proto update`; until then, extend in project files.
   - Use `KIT.ui` components, `KIT.charts`, the type-role classes and token colours. No inline font sizes, no raw hex colours, no weight above 700, no `line-height` below 1.2.
   - Wrap the parts of later releases in `Rel({ r: "<release>" })`, so the `-tags` and `-mvp` views show the MVP line.
   - `js/data.js` holds synthetic data only (`KIT.D`), in `languages.ui`: invented names, organisations and addresses, and no development infrastructure. Derive every count from the data; never type a number that a list beside it contradicts.
   - Scenarios: `KIT.SCENARIOS = [{ id, name, role, platform, steps: [{ text, go: ["<screen id>"], expect: "<selector>" }] }]`; each runs at `#scn-<id>`.
   - Write every file with the file tools, never with heredocs.

7. **Lint:** `kickoff proto lint` prints the metrics (font sizes, font-weight 600, inline styles, raw hex, off-scale spacing), the `warn:` lines and then the failures: thresholds exceeded, raw hex colours in scripts, text that matches `proto.forbidden`, a non-English `languages.ui` without a `locale`, and the foundation rules (L1–L3 type, L5 library tags, L6 button titles, L7 pinned CDN URLs, L11–L13 overlays, L14 motion, L15 clickable rows; warnings L8–L10 sizes and spacing, L12, L17 audit thresholds, L18 deprecated 0.2 APIs). A line marked `kit:allow <rule>` is exempt, with a reason. Fix the screens with role classes and tokens; never raise a threshold or change `KIT_CONFIG.audit` without the lead's yes.
8. **Pre-delivery review:** walk `references/screen-checklist.md` and the pre-delivery checklist in `ui-ux-pro-max`'s `references/pro-rules.md`, screen group by screen group. For screenshots, run `kickoff proto check --shots <folder>` with a git-ignored folder (light, dark and 390 px per screen). Fix what fails and run `kickoff proto check` again.
9. **Design review loop,** after the first full build and before the sign-off workshop, following `references/design-review.md`: a shared screenshot set (with parameter routes for device views), a brief file, the lens set (layout and cards, type for the UI language, density and sizing, interaction and overlays, motion, foundation) with per-group screen audits (volumes and functions), or 4–5 viewpoint reviewers (one per audience or role group, a craft and micro-detail auditor, an IA and guidance designer) who research with cited sources and rank findings per screen P1–P3, a cross-review round, and one integrator plan (principles, decisions for the lead with recommendations, shared library, per-screen changes, navigation per role, craft rules, data fixes, work packages by file). The lead decides the open decisions; log each as `D<n>`. Then build in work packages, the shared library first, each package ending with `kickoff proto check` over all routes.
10. **Publish.** If the Artifact tool is available, publish `index.html` as a private Artifact with every `js/*.js` file passed through `files` at the same relative path (`js/config.js`, …). Republish to the same URL for every new version. In a new session, a publish to that URL is refused until the session has read it: read the artifact and its published files, compare each file's hash with the committed file of the recorded version (`git hash-object <saved file>` against `git rev-parse <commit>:<path>`), and stop and ask the lead when a published file matches no commit; then republish. Otherwise run `kickoff proto bundle` and share the single file `<proto.dir>/dist/prototype.html` (not committed: add `dist/` to `.gitignore` if it is missing). Sharing beyond the lead is publishing: ask the lead first.
11. **Record** the Artifact link (or the bundle path) and the version in `.kickoff/state.yaml` with the Edit tool, `prototype: { artifact: "<link or path>", version: <n> }`. The version goes up by one with every publish. Change no other key there; phases and gates change only through the CLI.
12. **Verify** (section below), then `kickoff phase done prototype` and commit `feat(prototype): full-product prototype v<n>`. List the rulings from `<docs_root>/08-task-plans/<plan>-rulings.md` to the lead and ask which ones to revisit.

## Outputs

- `<proto.dir>/index.html`, `js/config.js`, `js/data.js`, shared and `js/<area>.js` modules, `js/scenarios.js` (kit core files unchanged)
- `<docs_root>/08-task-plans/YYYY-MM-DD-prototype.md` (build plan, tasks ticked) and `<docs_root>/08-task-plans/YYYY-MM-DD-prototype-rulings.md`
- The design review folder (brief, reports, cross-reviews, integrator plan; git-ignored or in the task plans as the lead prefers) and the lead's decisions as `D<n>`
- A private Artifact link or `<proto.dir>/dist/prototype.html`, recorded in `.kickoff/state.yaml` `prototype`
- `.kickoff/state.yaml`: `phases.prototype: done`, set by `kickoff phase done prototype` (not by hand); the top-level `prototype` object (artifact, version) is a different key

## Verify

1. `kickoff proto check` (all routes, scenarios, the kit self-test and the runtime audit of every dump) exits 0 and prints `prototype check passed`; read its `warn:` lines. Exit 4 is a skipped check, not a pass, and the phase is not done.
2. `kickoff proto lint` exits 0.
3. Every item of `references/screen-checklist.md` and of the `pro-rules.md` pre-delivery checklist is ticked or has a ruling.
4. The design review's P1 findings are fixed or carry a lead decision.
5. `.kickoff/state.yaml` has `prototype.artifact` and `prototype.version` for this publish, and `kickoff validate` reports `0 errors`.
6. Search `js/` with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

Rows 3–11 and 14–27 of the lessons table (`../using-kickoff/references/lessons.md`):

- Render errors did not surface in headless checks: every `data-err` that `kickoff proto check` reports is a failure.
- Headless "narrow" screenshots clamped around 520 px: check phone width only through `kickoff proto check` (the 390 px `narrow.html` iframe), never by resizing a headless window.
- Splitting prototype modules dropped imports, found only tasks later: run `kickoff proto check` over all routes after every task.
- No doctype meant quirks mode, and tables were unreadable in dark mode: never edit the kit core; keep `table{color:inherit}` in `index.html`.
- Every role saw the chair's home below 760 px: check each role's home at 390 px (`references/screen-checklist.md`).
- A role token in the URL let an admin open meeting content: register every screen with its ux-spec `roles`, so the guard in `jump()` refuses other roles.
- A development VPN name and IP range appeared in product UI: keep `js/data.js` synthetic and run `kickoff proto lint`, which flags `proto.forbidden` patterns.
- Dense, heavy text overwhelmed the reviewer: scale classes and tokens only; `kickoff proto lint` counts font sizes, weight 600 and inline styles.
- A sidebar filter that reloaded a near-identical page confused the reviewer: navigation goes to distinct pages, and filters stay in-page.
- The team wrote "the prototype differs from the product" because the kit had only a sidebar: use the site shell and bare screens; follow the fidelity rule.
- Kiosk views could not be opened from a link or checked: device views are route parameters, checked with `kickoff proto check "sc-08-guest?kiosk=1"`.
- English kit strings and en-US numbers ("+7.1%" next to "2.304") appeared in a Vietnamese UI, and uppercase labels crowded diacritics: set `locale` and `lang` (the kit then keeps Vietnamese labels in their letter case).
- A kit fix could reach an existing prototype only through `proto new --force`: use `kickoff proto update`.
- Screen codes, look-alike KPI rows and text explaining system mechanics reached the customer: walk the screen checklist and run the design review loop.
- Republishing from a new session was refused: read the published files and compare their hashes with git before overwriting.
- Screens felt heavy and sticky (bold everywhere, 800 weights, touch sizes on desktop): density from the shell, type roles, `kickoff proto lint` L1–L3 and the audit (rows 22 and 26).
- One task opened a drawer, a dialog or a sheet: `KIT.ui` overlays from the decision table, kept mounted (row 23).
- Screens built for 15 rows could not hold thousands: a data audit per screen and the DataTable family on a seeded generator (row 25).
- Card slots moved with content length: `EntityCard` and the stress fixtures (row 27).

## Handoff

`kickoff:signoff`: prepare the customer workshop with the demo scenarios and the published link. Feedback that arrives before the workshop goes to `kickoff:feedback`.
