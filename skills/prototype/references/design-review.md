# Design review loop

A structured review of the whole prototype from several viewpoints, merged into one plan the lead decides on, then built in work packages. Run it once after the first full build (every inventory screen covered, the pre-delivery review done) and before the sign-off workshop; run it again when the lead asks for a deeper pass.

The same agents ran earlier: `kickoff:design-concept` runs this loop at concept scale on the concepts, and `kickoff:ux-design` on the spec. Reviewers read those reports first, so a finding that was already settled is not reopened and a fault that came back is named.

The lead does not need to be a designer: the reviewers bring the expertise, and the lead decides only the conflicts the integrator names. The criteria come from the design brief, the locked concept, the project's `design-rules.md` and `../../using-kickoff/references/design-philosophy.md`, never from values shipped with the plugin.

## 1. Shared shot set

Every reviewer reads the same material, so findings can be compared. The shot set is whatever shows the prototype without running it:

- screenshots or captures of every screen, in every audience that sees it, in each shell or device the product has (and each theme or mode it ships), including the extremes (empty, error, slow, the longest content);
- or short screen recordings of each scenario;
- or, when nothing can be captured (paper, a live tool), a walk-through script: numbered steps, what is on screen at each, in the UI language.

Name each file or step by screen ID and audience (`sc-02-seeker`). The coverage matrix tells the reviewer what to expect. Reviewers produce their own extra views only when the set lacks one, one at a time.

## 2. Brief file

Write `<folder>/BRIEF.md` before starting any reviewer. Every reviewer reads it first.

- **The product:** one paragraph, and a table of audiences: id, who they are, main purpose, where they use it (platforms, devices, inputs).
- **The lead's request,** verbatim in the language it was given, then a short summary in the repository language.
- **Decisions already taken** (`D<n>` from the Decision log): do not reopen; build on them.
- **Where things are:** ux-spec, design brief, locked concept, `design-rules.md`, `prototype-coverage.md`, the shot set, the earlier concept and spec review reports.
- **Rules for every reviewer:**
  - read-only on the repository; return your report as your final answer (the caller saves it in the review folder);
  - research first: learn from best-in-class examples for your viewpoint and cite the URLs;
  - be concrete: screen ID, element, what is wrong, why it matters for that audience, the change (a layout sketch in words or ASCII, the exact wording in the UI language);
  - rank every finding: **P1** blocks or floods the user, **P2** confuses or slows, **P3** polish;
  - name repeated look-alike blocks and texts, and say which go, merge or become different;
  - say what you could not judge from the shot set, and what you assumed;
  - respect the decisions and the project's rules; a decision you think is wrong goes into a short separate section;
  - synthetic data only; no forbidden phrases (`rules.forbidden_phrases`) and none of `design.forbidden` in user-facing text.

## Agents

The reviewers and the integrator are plugin agents with read-only tools. Run them with the Agent tool, the reviewers in parallel in one message. Each agent returns its report as text, and you save it under the file name given below.

| Role in the loop | Agent |
| --- | --- |
| One audience or role group | `kickoff:viewpoint-reviewer` (name the group in the prompt) |
| Craft and micro-detail auditor | `kickoff:craft-auditor` |
| IA and guidance designer | `kickoff:ia-reviewer` |
| Distinctiveness and brand fit | `kickoff:art-director` |
| Integrator | `kickoff:integrator` |

Give every agent:
- the path of `BRIEF.md` and of the shot-set folder;
- the absolute paths of the references it needs (this skill's folder and `../../using-kickoff/references/design-philosophy.md`);
- for the craft auditor, the path of `design-rules.md` (accessibility and inclusion targets, language and formats);
- for the art director, the paths of `design-brief.md` and the locked concept record.

## 3. Viewpoint reviewers

Start 5–6 reviewers in parallel, each with its own viewpoint and its own report `<folder>/r<n>-<viewpoint>.md`:

| Reviewer | Looks at |
| --- | --- |
| One per audience or role group (2–3) | Each audience's journeys, entry point, navigation and wording, from that audience's skills, devices and pressure |
| Craft and micro-detail auditor | Wording, register, terms, characters and punctuation, numbers, dates and units, case, line breaks, type, spacing, controls, icons, colour or contrast in every mode, the targets in `design-rules.md`. Extracts every user-facing string from the prototype (or the walk-through script) and reads them line by line |
| IA and guidance designer | Navigation per audience, naming, entry points, one job per screen, guidance and where it goes, motion or transitions |
| Art director | Whether the screens belong to this product and no other: the fit test (swap the name, name the default, find the signature, wrong shape), the world of the design brief, the signature in every screen group, restraint |

Each report holds: the research with sources; the ten changes that matter most; a findings table per screen (Screen, Element, Problem, Why for this audience, Change, Rank); look-alike blocks and texts; decisions to revisit.

For a deeper pass, add one **screen audit** per screen group, written from a brief with: the job and the user of each screen; its volume and extremes; its states; the gaps against `design-rules.md`; and its per-screen plan (what the fit test changed).

## 4. Cross-review

Run each reviewer agent again, given the other reports; save its answer as `<folder>/x-r<n>.md`. It covers: what it agrees with, what it disagrees with and why, conflicts between reports, what everyone missed, and rank changes. One round is enough.

## 5. Integrator plan

One integrator reads every report and cross-review and writes `<folder>/upgrade-v<n>.md`:

1. **Principles** (5–8): the rules the changes follow, such as "each audience opens on what needs it now", "one job per screen", "no look-alike blocks", "the signature in every group".
2. **Decisions for the lead:** every item that conflicts with an approved rule or decision. One row each: conflict, options, which reviewers support each option, recommendation, what happens if not approved. Then rule additions to `design-rules.md` to settle (proposal, source, reason, test).
3. **Shared parts:** what every package uses (as the tool calls them), each with a way the acceptance check can find it.
4. **Per-screen changes,** grouped by work package.
5. **Navigation per audience:** the menu, the entry point, the small-device pattern.
6. **Craft rules** ready to paste into `design-rules.md` and the ux-spec copy guide.
7. **Data fixes:** derive, don't type. Every count shown next to a sample list is computed from the data; aggregates are labelled as such and agree across screens.
8. **Work packages by file or artboard** (section 7), with acceptance checks per package.
9. **What not to do:** rejected ideas, their source and why.

## 6. The lead decides

Each open decision is a Decision card (`../../using-kickoff/references/methods.md`): the options with what the lead will see, who each serves, its cost and where a wrong choice would surface, the integrator's recommendation, what was assumed, and "none of these" and "show me first". Several small related decisions may share one message. Present the list of approved changes with the Bounded approval method: one table, and nothing changes before an explicit yes or edit. Log each decision as `D<n>` with its date and source. Approved rule changes go into `design-rules.md` and `ux-spec.md` (re-run `kickoff:ux-design` when the IA or the screen inventory changes); a change of scope goes through `kickoff:feature-map`.

## 7. Build in work packages

- **Split by file or artboard, not by channel.** No two packages edit the same one.
- **Shared parts first:** the things every package reuses, and the data. Later packages only use them; a change they need goes back to the first package.
- **Then the screen packages in parallel** (one per screen group), then scenarios and documents last.
- **Acceptance per package:** its own checks, named so a person or a tool can run them (for example "the first block of the staff home is the to-do list and there is no KPI row"), plus the common checks: the package's Verify from the build plan; no change outside the owned files; synthetic data only.
- **Merge order:** shared parts, the screen packages, then scenarios and documents. Walk the integrated result against the coverage matrix.
- Rulings are listed to the lead after every package.

## 8. Close the loop

Take the shot set again and compare it with the P1 and P2 findings. Record anything left open as a ruling (`Ruling: <decision> — <why> — <cost if wrong>`), list the rulings to the lead, then deliver the new version and record it (`kickoff prototype record`).
