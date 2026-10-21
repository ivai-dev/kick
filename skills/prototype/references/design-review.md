# Design review loop

A structured review of the whole prototype from several viewpoints, merged into one plan the lead decides on, then built in work packages. Run it once after the first full build (every screen registered, `kickoff proto check` and `kickoff proto lint` pass) and before the sign-off workshop; run it again when the lead asks for a deeper pass. `kickoff:ux-design` runs the same loop at concept scale on the concept artboards.

The lead does not need to be a designer: the reviewers bring the expertise, and the lead decides only the conflicts the integrator names.

## 1. Shared screenshot set

Every reviewer reads the same pictures, so findings can be compared.

- Run `kickoff proto check --shots <folder>` into a git-ignored folder. It writes a light, a dark and a narrow (390 px) screenshot of every screen.
- Device views of web screens (a kiosk, a full-screen start screen) are route parameters: add them as explicit routes in a second run, quoted for the shell, for example `kickoff proto check --shots <folder> "sc-08-guest?kiosk=1" "sc-17-seeker?kiosk=1&step=3"`.
- Each screen is shot in the role that owns it; add a role token (`sc-02-seeker`) where several roles share a screen.
- Reviewers render their own extra views only when the set lacks one, one at a time, with their own browser profile folder.

## 2. Brief file

Write `<folder>/BRIEF.md` before starting any reviewer. Every reviewer reads it first.

- **The product:** one paragraph, and a table of roles: id, who they are, main purpose, where they use it (platforms, devices).
- **The lead's request,** verbatim in the language it was given, then a short summary in the repository language.
- **Decisions already taken** (`D<n>` from the Decision log): do not reopen; build on them.
- **Where things are:** ux-spec, design-system, Decision log, prototype files (shared pieces, screen modules, data, scenarios), screenshot folders.
- **Rules for every reviewer:**
  - read-only on the repository; return your report as your final answer (the caller saves it in the review folder);
  - research first: learn from best-in-class examples for your viewpoint and cite the URLs;
  - be concrete: screen ID, element, what is wrong, why it matters for that role, the change (a layout sketch in words or ASCII, the exact wording in the UI language);
  - rank every finding: **P1** blocks or floods the user, **P2** confuses or slows, **P3** polish;
  - name repeated look-alike blocks and texts, and say which go, merge or become different;
  - propose guidance devices from `../../ux-design/references/guidance-library.md` where they help, and say where not to add them;
  - respect the decisions and the kit; a decision you think is wrong goes into a short separate section;
  - synthetic data only; no forbidden phrases (`rules.forbidden_phrases`).

## Agents

The reviewers and the integrator are plugin agents with read-only tools. Run them with the Agent tool, the reviewers in parallel in one message. Each agent returns its report as text, and you save it under the file name given below.

| Role in the loop | Agent |
| --- | --- |
| One audience or role group | `kickoff:viewpoint-reviewer` (name the group in the prompt) |
| Craft and micro-detail auditor | `kickoff:craft-auditor` |
| IA and guidance designer | `kickoff:ia-reviewer` |
| Lens reviewer (foundation pass) | `kickoff:viewpoint-reviewer` with the lens named in the prompt |
| Integrator | `kickoff:integrator` |

Give every agent:
- the path of `BRIEF.md` and of the screenshot folder;
- the absolute paths of the references it needs (this skill's folder and `../../ux-design/references/`);
- for the craft auditor, also the paths of ECC's `accessibility` and `frontend-a11y` skills, from `kickoff ecc root` (`<root>/skills/<name>/SKILL.md`).

## 3. Viewpoint reviewers

Start 4–5 reviewers in parallel, each with its own viewpoint and its own report `<folder>/r<n>-<viewpoint>.md`:

| Reviewer | Looks at |
| --- | --- |
| One per audience or role group (2–3) | Each role's journeys, home, navigation and wording, from that audience's skills and devices (for example: public and self-service users; business users; staff and approvers) |
| Craft and micro-detail auditor | Wording, register, term table, characters and punctuation, numbers, dates and units, letter case, line breaks, type sizes and weights, spacing, buttons, chips, icons, colour in light and dark (`../../ux-design/references/content-and-craft.md`). Extracts every UI string from `js/*.js` with a read-only script and reads them line by line |
| IA and guidance designer | Navigation map per role, naming, home shapes, one job per screen, guidance devices and where they go, motion and illustrations |

Each report holds: the research with sources; the ten changes that matter most; a findings table per screen (Screen, Element, Problem, Why for this role, Change, Rank); look-alike blocks and texts; decisions to revisit.

### Lenses and screen audits

For a foundation pass (fonts, density, overlays, motion), run lens reviewers in place of or next to the audience reviewers, each over the whole screenshot set:

| Lens | Looks at |
| --- | --- |
| Layout and cards | page anchoring and widths, grids, the one-box rule, card anatomy and slot drift |
| Type for the UI language | sizes per screen, weights, line heights for stacked diacritics, letter case, the font |
| Density and sizing | control, row and chip sizes per audience, touch sizes leaking onto desktop |
| Interaction and overlays | one surface per task, the overlay contract, consequences, buttons, links versus clickable rows, selection controls |
| Motion | route, overlay and list motion, interruptions, reduced motion, layout shift |
| Foundation | the kit and its gaps: what the kit should own versus the project |

Then one **screen audit** per screen group, written from a brief with: the job and the user of each screen; the data inventory with volumes (`../../ux-design/references/data-at-volume.md`); the functions each list needs; the layout per width; the states; the gaps against the foundation rules; and each screen's `ui-ux-pro-max` log (queries, what was taken, what was rejected and why).

## 4. Cross-review

Run each reviewer agent again, given the other reports; save its answer as `<folder>/x-r<n>.md`. It covers: what it agrees with, what it disagrees with and why, conflicts between reports, what everyone missed, and rank changes. One round is enough.

## 5. Integrator plan

One integrator reads every report and cross-review and writes `<folder>/upgrade-v<n>.md`:

1. **Principles** (5–8): the rules the changes follow, such as "each role opens on what needs it now", "one job per screen", "no look-alike blocks", "one guidance device per screen", "small things are rules".
2. **Decisions for the lead:** every item that conflicts with an approved rule or decision. One row each: conflict, options, which reviewers support each option, recommendation, what happens if not approved. Then rule additions to settle (proposal, source, recommendation, whether the next build shows it).
3. **Shared library:** the components every package uses (component, props, use, not), each with a `data-*` hook that acceptance checks can find. It extends the kit through project files; it never edits the kit core.
4. **Per-screen changes,** grouped by work package.
5. **Navigation per role:** the menu, the home shape, the phone tab bar of site roles.
6. **Craft rules** ready to paste into `design-system.md` and the ux-spec Copy guide.
7. **Data fixes:** derive, don't type. Every count shown next to a sample list is computed from the data; aggregates are labelled as such and agree across screens.
8. **Work packages by file** (section 7 below), with acceptance checks per package.
9. **What not to do:** rejected ideas, their source and why.

## 6. The lead decides

Present section 2 with the Bounded approval method: one table, and nothing changes before an explicit yes or edit. Log each approved conflict decision as `D<n>` with its date and source. Approved rule changes go into `ux-spec.md` and `design-system.md` (re-run `kickoff:ux-design` when the IA or the screen inventory changes); a change of scope goes through `kickoff:feature-map`.

## 7. Build in work packages

- **Split by file, not by channel.** No two packages edit the same file. Device variants live in the module of the web screen, so they belong to that module's package.
- **WP0 first:** the shared library, tokens, data and craft rules. In the `/* kickoff:tokens:begin */ … /* kickoff:tokens:end */` block, WP0 creates marker sections, one per package: `/* == s<N>-<name> (WP<x>) == */ … /* == end s<N> == */`. Each later package edits only its own sections.
- **Then the screen packages in parallel** (one per module or module group), then scenarios and documents last.
- **Acceptance per package:** its own checks written against the data hooks (for example "the first block of the employer home is `[data-todo]` and there is no `[data-kpi]`"), plus the common checks: `kickoff proto check` with no route arguments prints `prototype check passed`; `kickoff proto lint` exits 0 and adds no font size beyond the craft rules; `narrow.html#<route>` works for every owned screen; no change outside the owned files and sections; synthetic data only.
- **Merge order:** WP0, the screen packages, then scenarios and documents. Run the full `kickoff proto check` on the integrated result.

## 8. Close the loop

Take the screenshot set again and compare it with the P1 and P2 findings. Record anything left open as a ruling (`Ruling: <decision> — <why> — <cost if wrong>`), list the rulings to the lead, then publish the new version.
