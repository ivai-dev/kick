---
name: prototype
description: Use when building or updating the clickable full-product prototype that the customer reviews before scope is locked
---

# Prototype

Builds the clickable prototype of the full product: every role, platform and release, with a scope layer that shows the MVP line and guided demo scenarios for the sign-off workshop. It is built on the kickoff prototype kit (no build step), checked with `kickoff proto check` and `kickoff proto lint`, and published as a private Artifact or a single HTML file.

## When to use

- After `kickoff:ux-design`, to build the first prototype for the customer review.
- Again when the ux-spec changed (new screens, new rules) or before a workshop. Changes the customer asked for go through `kickoff:feedback`, which calls back into the prototype in chain order.

## Preconditions

- `kickoff can prototype` exits 0 (ux-design done, C2 approved).
- `ux-spec.md` exists at `proto.ux_spec` (default `<docs_root>/05-design/ux-spec.md`) with its screen inventory.
- Edge or Chrome is installed for `kickoff proto check` (or `KICKOFF_BROWSER` / `proto.browser` in `project.yaml` points to one).
- The `ui-ux-pro-max` skill is available.

## Inputs

- `ux-spec.md` and `<docs_root>/05-design/design-system.md`.
- `.kickoff/features.yaml` (features per screen, releases) and `.kickoff/project.yaml` (`proto.dir`, default `<docs_root>/05-design/prototype`; `proto.forbidden`; lint thresholds `proto.max_font_sizes`, `proto.max_weight_600`, `proto.max_inline_styles`).
- The kit guide `README.md` inside the prototype folder after `kickoff proto new`: `KIT.register`, `KIT.ui`, `KIT.charts`, hash routes, scenarios.
- `references/screen-checklist.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can prototype`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start prototype`.
2. **Presentation choices** with the lead, using the Interview method: one build with a scope layer (recommended: the customer sees the full product and the MVP line in one place) or a separate MVP build; which roles to show (default: every role in the ux-spec); which demo scenarios (2–5, one per key journey, each naming the features it shows); the workshop date.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

3. **Scaffold:** `kickoff proto new`. It copies the kit into `proto.dir` and writes `js/config.js` (roles, homes, releases, platforms from the ux-spec), `js/data.js`, `js/screens.js` (one `KIT.ui.Placeholder` stub per screen) and `js/scenarios.js`. It refuses when `index.html` already exists. When updating an existing prototype, skip this step and register new screens by hand. Never run `kickoff proto new --force` on a built prototype without the lead's yes: it overwrites the kit files and all four project files.
4. **Queries per screen group with `ui-ux-pro-max`:** invoke the skill and run `--stack react` (the kit is Preact with htm, the nearest stack) and `--domain` queries (`ux`, `chart`, `typography`, `color`) for each group's concerns: tables, forms, dashboards, phone lists. Retry an empty search once; never copy output you have not checked.
5. **Build plan:** save `<docs_root>/plans/YYYY-MM-DD-prototype.md` using the Build plan method and show it to the lead. Tasks, in order:
   1. shell: the design-system tokens copied into `index.html` between `/* kickoff:tokens:begin */` and `/* kickoff:tokens:end */` (keep the token names), the `<title>`, `js/config.js` (role names and homes), and the synthetic data model in `js/data.js`;
   2. one task per screen group: a module `js/<area>.js` that registers the group's screens;
   3. scenarios: `js/scenarios.js`;
   4. a consistency pass: the same status labels, page headers, empty states and spacing on every screen.

> **Build plan:** a checklist of tasks, each with files, inputs, verification command and expected output; every task leaves the project working.

   Every task's verification is `kickoff proto check` (no route arguments), and its expected output is `prototype check passed`.

6. **Run the plan** with the Task run method. After every task, run `kickoff proto check` over **all** routes, not only the new ones. Without route arguments it also runs every scenario and the 390 px check of every screen. A quick `kickoff proto check sc-02` is fine while working inside a task, but explicit routes skip the scenarios and the other screens, so it never counts as the task's verification. Exit 1 lists the failures: `data-err` messages, coverage gaps, horizontal scroll at 390 px. Fix them before the next task. Exit 4 means no browser was found: the check was skipped, so stop and report it.

> **Task run:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.

   How to write the project files:
   - `KIT.register("<id>", { comp, code, name, roles, platforms, rel, nav, icon })`, where the id is the ux-spec code in lower case (`sc-02`), and `code`, `roles`, `platforms` and `rel` equal the ux-spec row. Remove each screen's stub from `js/screens.js` when its module registers it. Delete the file and its script tag once it is empty.
   - List the project scripts in `index.html` between `<!-- kickoff:modules:begin -->` and `<!-- kickoff:modules:end -->`, in the order `config.js`, `data.js`, the screen modules, `scenarios.js`, each with `charset="utf-8"`.
   - Never edit the kit core: `narrow.html` and `js/{route,core,ui,charts,scope,shell,scenario,main}.js`. In `index.html`, change only the title, the tokens block and the modules block.
   - Use `KIT.ui` components, `KIT.charts`, the type-scale classes and token colours. No inline font sizes, no raw hex colours.
   - Wrap the parts of later releases in `Rel({ r: "<release>" })`, so the `-tags` and `-mvp` views show the MVP line.
   - `js/data.js` holds synthetic data only (`KIT.D`), in `languages.ui`: invented names, organisations and addresses, and no development infrastructure.
   - Scenarios: `KIT.SCENARIOS = [{ id, name, role, platform, steps: [{ text, go: ["<screen id>"], expect: "<selector>" }] }]`; each runs at `#scn-<id>`.
   - Write every file with the file tools, never with heredocs.

7. **Lint:** `kickoff proto lint` prints the metrics (font sizes, font-weight 600, inline styles, raw hex) and then the failures: thresholds exceeded, raw hex colours in scripts, and text that matches `proto.forbidden`. Fix the screens with scale classes and tokens; never raise a threshold without the lead's yes.
8. **Pre-delivery review:** walk `references/screen-checklist.md` and the pre-delivery checklist in `ui-ux-pro-max`'s `references/pro-rules.md`, screen group by screen group. For screenshots, run `kickoff proto check --shots <folder>` with a git-ignored folder. Fix what fails and run `kickoff proto check` again.
9. **Publish.** If the Artifact tool is available, publish `index.html` as a private Artifact with every `js/*.js` file passed through `files` at the same relative path (`js/config.js`, …). Republish to the same URL for every new version. Otherwise run `kickoff proto bundle` and share the single file `<proto.dir>/dist/prototype.html` (not committed: add `dist/` to `.gitignore` if it is missing). Sharing beyond the lead is publishing: ask the lead first.
10. **Record** the Artifact link (or the bundle path) and the version in `.kickoff/state.yaml` with the Edit tool, `prototype: { artifact: "<link or path>", version: <n> }`. The version goes up by one with every publish. Change no other key there; phases and gates change only through the CLI.
11. **Verify** (section below), then `kickoff phase done prototype` and commit `feat(prototype): full-product prototype v<n>`. List the rulings from `<docs_root>/plans/<plan>-rulings.md` to the lead and ask which ones to revisit.

## Outputs

- `<proto.dir>/index.html`, `js/config.js`, `js/data.js`, `js/<area>.js` modules, `js/scenarios.js` (kit core files unchanged)
- `<docs_root>/plans/YYYY-MM-DD-prototype.md` (build plan, tasks ticked) and `<docs_root>/plans/YYYY-MM-DD-prototype-rulings.md`
- A private Artifact link or `<proto.dir>/dist/prototype.html`, recorded in `.kickoff/state.yaml` `prototype`
- `.kickoff/state.yaml`: `prototype: done`

## Verify

1. `kickoff proto check` (all routes and scenarios) exits 0 and prints `prototype check passed`. Exit 4 is a skipped check, not a pass, and the phase is not done.
2. `kickoff proto lint` exits 0.
3. Every item of `references/screen-checklist.md` and of the `pro-rules.md` pre-delivery checklist is ticked or has a ruling.
4. `.kickoff/state.yaml` has `prototype.artifact` and `prototype.version` for this publish, and `kickoff validate` reports `0 errors`.
5. Search `js/` with each pattern of `rules.forbidden_phrases` in `project.yaml`: no match.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

Rows 4–11 of the lessons table (`../using-kickoff/references/lessons.md`), plus row 3:

- Render errors did not surface in headless checks: every `data-err` that `kickoff proto check` reports is a failure.
- Headless "narrow" screenshots clamped around 520 px: check phone width only through `kickoff proto check` (the 390 px `narrow.html` iframe), never by resizing a headless window.
- Splitting prototype modules dropped imports, found only tasks later: run `kickoff proto check` over all routes after every task.
- No doctype meant quirks mode, and tables were unreadable in dark mode: never edit the kit core; keep `table{color:inherit}` in `index.html`.
- Every role saw the chair's home below 760 px: check each role's home at 390 px (`references/screen-checklist.md`).
- A role token in the URL let an admin open meeting content: register every screen with its ux-spec `roles`, so the guard in `jump()` refuses other roles.
- A development VPN name and IP range appeared in product UI: keep `js/data.js` synthetic and run `kickoff proto lint`, which flags `proto.forbidden` patterns.
- Dense, heavy text overwhelmed the reviewer: scale classes and tokens only; `kickoff proto lint` counts font sizes, weight 600 and inline styles.
- A sidebar filter that reloaded a near-identical page confused the reviewer: navigation goes to distinct pages, and filters stay in-page.

## Handoff

`kickoff:signoff`: prepare the customer workshop with the demo scenarios and the published link. Feedback that arrives before the workshop goes to `kickoff:feedback`.
