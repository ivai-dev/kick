# Design philosophy

How kick designs. It holds **no values**: no palette, type scale, density, spacing, motion timing or component set. Those belong to each project, derived from its brief and written as the design rules in `docs/kick/project/design.md`. This page says how to decide and how to check, for any product: a web tool, a public service, a game, a mobile app, a kiosk.

Read it before shaping the UI and when a review agent starts.

## Principles

| # | Principle | Test |
| --- | --- | --- |
| 1 | **Structure before skin.** Flows, navigation, interaction model and pace are decided before how it looks, by the person, not by a template. | The directions shown differ in structure, not only in colour. |
| 2 | **The product's world decides its form**: who uses it, where, how often, on what, under what pressure. Never a catalogue entry for the product type. | The brief names the category's default and its predictable opposite, and says which the product is and why. |
| 3 | **Directions differ in kind.** Two or three variations of one idea are one option. | They differ on at least three axes: flow and structure, interaction model, navigation and shell, pace and density, tone and voice, material and visual language, motion. |
| 4 | **Rules belong to the project.** A rule has a reason in the brief and a test. | Every design rule names its reason, its test and where it applies. |
| 5 | **Decisions are visible.** The person sees the options, what each looks like, what being wrong costs and when it would show. | Every confirmation is a decision card. |
| 6 | **Judge on real content and the worst case**: the real language, no data, too much data, the longest name, an error, a slow connection. | The key screens and the review screenshots include the extremes. |
| 7 | **Review from the audience's seat, early.** | Reviewers look at the key screens of the directions, not only at the finished screens. |
| 8 | **Real, not throw-away.** What people try is the product's own screens, in its own wording and language, on sample data. | No "this is only a mock-up" remark; the only non-product element is the "sample data" banner. |
| 9 | **Attention is the budget.** Every screen has one job and one obvious next step. | A new user can say what to do first on any screen in five seconds. |
| 10 | **Inclusion is part of the brief.** Accessibility, language, locale formats, devices and input methods are targets written per project. | Each target has a rule and a way to check it. |
| 11 | **Evidence, stated honestly.** What a tool checked, what a person reviewed, what was assumed. | Reports separate the three; a check that did not run is skipped. |

## The brief decides the form

For each audience the brief answers:

- **The job:** what the person is trying to do, and what "done" feels like.
- **The scene:** where, on which device and input, in what light and noise, alone or with others.
- **The rhythm:** minutes or hours; every day or once a year; calm or under pressure.
- **The feeling:** the words the person uses for how it should feel, and what must never appear.
- **The references:** two or three products they admire and one they dislike, each with the reason.
- **The category default** and its predictable opposite; say where this product stands and why.
- **Pinned constraints:** brand assets, platform rules, anything the owner already has.

## The fit test

Run it on the directions and on the built screens. One short paragraph each.

1. **Swap the name.** Put another product of the same category on it. Does it still hold? Then it is generic: name what is specific to this product.
2. **Name the default.** Which default of the category does it follow, and is that a decision or an accident?
3. **Find the signature.** What would a user remember? Does it appear in every screen group?
4. **Wrong shape?** Could it be taken for a different kind of product (a management console, a marketing site)? Which choice made it so?
5. **Hardest audience.** Walk the person with the least skill, the worst device or the most pressure through the main job. Where do they stop?

## Design rules

The design rules are short and each is a row:

| Rule | Why | Test | Applies to |
| --- | --- | --- | --- |

A rule names a measurable target or an observable behaviour: "one main action per work screen", "every text in the UI language, dates in its format". A rule no test can check is advice: keep it in the brief.

## Tools

Tools serve the decision, never replace it. Never take a look from a lookup by product type. Use the checks a tool offers (contrast, accessibility audits) and report them as tool-checked evidence.
