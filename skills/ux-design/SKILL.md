---
name: ux-design
description: Use when defining a project's information architecture, screen inventory, behaviour rules, copy guide or design system before building a prototype
---

# UX design

Turns the approved feature map into the UX specification (roles, IA per role, every screen of every release and platform, behaviour rules, states, copy, accessibility) and the design system the prototype is built with. `kickoff proto new` and `kickoff proto check` read the screen inventory of `ux-spec.md`, so its table format is exact.

## When to use

- After C2, before the first prototype.
- Again when features gain or lose screens, or the lead changes the design direction. Customer feedback on screens goes through `kickoff:feedback`, which updates `ux-spec.md` in chain order.

## Preconditions

- `kickoff can ux-design` exits 0 (feature-map done, C2 approved).
- The `ui-ux-pro-max` skill is available (checked by `kickoff:using-kickoff`).

## Inputs

- `.kickoff/features.yaml` and `<docs_root>/02-requirements/feature-map.md`: epics, features, releases, platforms.
- `<docs_root>/02-requirements/nfr.md`: accessibility, compatibility and localisation targets.
- `<docs_root>/01-discovery/vision-scope.md`: users and roles, platforms, constraints.
- `.kickoff/project.yaml`: `releases`, `languages.ui`, `proto.ux_spec` (default `<docs_root>/05-design/ux-spec.md`), `proto.forbidden`.
- `templates/ux-spec.md` and `templates/design-system.md` in this skill's folder.
- Working methods: `../using-kickoff/references/methods.md`. Conventions: `../using-kickoff/references/conventions.md`.

## Steps

1. Run `kickoff can ux-design`. Exit 1: stop and show the `blocked:` lines. Then `kickoff phase start ux-design`.
2. **Confirm the design inputs** with the lead using the Interview method: product type, audience, three to five keywords for the visual direction, and whether the product is a calm work tool (the default) or needs a bolder look.

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

3. **Design direction with `ui-ux-pro-max`.** Invoke the `ui-ux-pro-max` skill and run its search with `--design-system` on "<product type> <audience> <keywords>" with `-p "<project name>"`, plus the sliders `--density 3` (the default, for calm and spacious UIs; raise it only when the lead asks for a dense console), `--variance` and `--motion` (low values, 2–3, for work tools). Do not pass `--persist`.
4. **Focused queries** as the screens need them: `--domain ux` (forms, tables, navigation, empty states), `--domain typography`, `--domain color` (check contrast in light and dark), `--domain chart` (one query per kind of data shown). If a search returns nothing, retry once with a narrower query. If it is still empty, keep the defaults below and say so. Never write output you have not checked into the files.
5. **Roles and IA per role.** For each product role (an id of lowercase letters and digits, since it appears in prototype URLs), list its home screen, its navigation sections with their screens, and its platforms. Every role has its own home screen at every width.
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

7. **Link features to screens:** set `screens: [SC-01, …]` on every active feature in `.kickoff/features.yaml` (IDs and releases unchanged). A feature without a screen (a background job, an import) gets a line in the ux-spec Notes saying why.
8. **Write `ux-spec.md`** at `proto.ux_spec` from `templates/ux-spec.md`, sections in this order: Roles and IA per role, Screen inventory, Navigation rules, Behaviour rules (numbered `BR-<n>`), States (empty, loading, error, offline), Copy guide, Accessibility. These rules are defaults; keep them unless the lead decides otherwise:
   - navigation goes to distinct pages; filters stay in-page (never a menu item that reloads a near-identical page with a filter applied);
   - one short sentence under each page header; any detail goes into an (i) popover;
   - development infrastructure (VPN names, private IP ranges, internal hosts, tool names) never appears in product UI;
   - copy, sample data and fixtures are in `languages.ui`, with invented names only.
9. **Write `<docs_root>/05-design/design-system.md`** from `templates/design-system.md`, sections: Principles, Tokens (light and dark), Type scale, Spacing, Motion, Status vocabulary, Components, Charts, Scope layer, Density and copy, Accessibility. Use the kit's token names so the prototype can copy the values into its tokens block. The calm-density defaults are a type scale of 12/13/14/16/18/22/28 px, weights 400 body, 500 labels and 600 headings and KPI numbers only, line height 1.6, a 4 px spacing grid and 32 px between sections. State that the product bundles its fonts and assets; the prototype's CDN use does not relax that.
10. **Regenerate and validate:** `kickoff docs` (it regenerates the feature map; screens are not rendered there, they live in `features.yaml` and the ux-spec inventory), then `kickoff validate`.
11. **Verify** (section below), then `kickoff phase done ux-design` and commit `docs: UX specification and design system`.

## Outputs

- `<docs_root>/05-design/ux-spec.md` (or the path in `proto.ux_spec`)
- `<docs_root>/05-design/design-system.md`
- `.kickoff/features.yaml` with `screens` on every active feature (`<docs_root>/02-requirements/feature-map.md` is regenerated but does not list screens)
- `.kickoff/state.yaml`: `ux-design: done`

## Verify

1. Read the Screen inventory of `ux-spec.md`. Its header is exactly `| ID | Screen | Roles | Platform | Release |`, no earlier table starts with `ID`, and every row has five cells: a unique ID, role ids in lowercase letters and digits, a platform of `web`, `windows` or `android`, and a release from `project.yaml`.
2. Every screen named in `features.yaml` `screens` is in the inventory, and every inventory screen serves at least one feature.
3. Every role in the inventory has a home screen in "Roles and IA per role", and that screen is the role's first row in the inventory.
4. Search both files for `{{`: no placeholder is left.
5. Search both files with each pattern of `rules.forbidden_phrases` and `proto.forbidden` in `project.yaml`: no match.
6. `kickoff validate` reports `0 errors`, and `kickoff docs --check` prints `documents up to date`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Every role saw the chair's home below 760 px: define a home screen per role here, so the prototype routes each role to its own home at every width.
- A role token in the URL let an admin open meeting content: list the roles of every screen, so the prototype's role guard applies.
- Dense, heavy text overwhelmed the reviewer: keep the calm-density defaults (density 3, three weights, one short sentence per header).
- A sidebar filter that reloaded a near-identical page confused the reviewer: navigation goes to a distinct page; filters stay in-page.
- Write every file with the file tools, not heredocs (literal `\n` in a Bash heredoc once became real newlines).

## Handoff

`kickoff:prototype`, which scaffolds the prototype from this screen inventory with `kickoff proto new`. `kickoff status` names it.
