# Design philosophy

How kickoff designs. It holds **no values**: no palette, type scale, density, spacing, motion timing, component set or page template. Those belong to each project, derived from its brief and written in the project's own `design-rules.md`. This file says how to decide and how to check, for any product: a web tool, a public service, a game, a mobile app, a kiosk.

Read it before `design-concept`, `ux-design` and `prototype`, and when a reviewer agent starts.

## Principles

Each one has a test, so it can be checked and not only admired.

| # | Principle | Test |
| --- | --- | --- |
| 1 | **Structure before skin.** What the product is made of (its flows, navigation, interaction model, pace) is decided before how it looks, and by the customer, not by the template. | The concepts the customer saw differ in structure, not only in colour. |
| 2 | **The product's world decides its form.** The form comes from who uses it, where, how often, on what, under what pressure. Never from a catalogue entry for the product type or from the category's default. | The brief names the category's default and its predictable opposite, and says which the product is and why. |
| 3 | **Concepts differ in kind.** A shortlist of two or three that are variations of one idea is one option. | The shortlist differs on at least three axes: flow and structure, interaction model, navigation and shell, pace and density, tone and voice, material and visual language, motion personality. |
| 4 | **Rules belong to the project.** A rule has a reason in the brief and a way to test it. A rule from another project is a hypothesis to test here, not a floor. | Every line of `design-rules.md` names its reason, its test and where it applies. |
| 5 | **Decisions are visible.** The person deciding sees the options, what each would look like, what it costs to be wrong, and when the error would show. | Every confirmation is a decision card (`methods.md`, Decision card). |
| 6 | **Judge on real content and the worst case.** Concepts and screens are shown with realistic content, in the real language, with the extremes: no data, too much data, the longest name, an error, a slow connection. | The review set contains the extremes, and every concept is shown on the same scenarios. |
| 7 | **Review from the audience's seat, early.** The cheapest moment to find a structural fault is before the spec is expanded. | Reviewers read the concepts and the spec, not only the finished prototype. |
| 8 | **Fidelity.** The prototype shows what the product will show: its chrome, navigation, wording and language. Anything that differs is a defect, not a note. | No "the prototype differs from the product" remark; the only non-product element is the prototype's own control. |
| 9 | **Attention is the budget.** Every screen, scene or state has one job and one obvious next step; what the user does not need now is absent. | A new user can say what to do first on any screen in five seconds. |
| 10 | **Inclusion is part of the brief.** Accessibility, language, locale formats, devices and input methods are targets taken from the NFRs and the audience, written down per project. | `design-rules.md` states each target and how it is verified. |
| 11 | **Evidence, stated honestly.** Report what a tool checked, what a person reviewed and what was only assumed. A check that did not run is skipped, never passed. | The verification report separates the three. |

## The brief decides the form

`design-brief.md` answers these for each audience. The answers, not a template, choose the shape.

- **The job:** what the person is trying to do, and what "done" feels like.
- **The scene:** where, on which device and input, in what light and noise, alone or with others.
- **The rhythm:** minutes or hours; every day or once a year; continuous or in short sessions; calm or under pressure.
- **The feeling:** the words the customer uses for how it should feel, and what must never appear.
- **The references:** two or three products the customer admires and one they dislike, each with the reason.
- **The category default:** what products of this kind usually look and behave like, and its predictable opposite. Both are the rut; say where this product stands and why.
- **Pinned constraints:** brand assets, platform rules and anything the customer owns. A pinned constraint beats every concept.

The same question gets different answers. A back-office tool is used all day by experts and is quiet and dense. A public service is used once, by anyone, and must be plain and reassuring. A game is used for pleasure, in long sessions, and its interface may be part of the world it shows. None of these answers is the default of the plugin.

## The fit test

Run it on the concepts (`design-concept`), on the spec (`ux-design`) and on the prototype (review loop). Write the answers down, one short paragraph each.

1. **Swap the name.** Replace the product's name and content with another product of the same category. Does the design still hold? If yes, it is generic: name what is specific to this product and put it into the design.
2. **Name the default.** Which default of the category does this design follow, and is that a decision or an accident?
3. **Find the signature.** What is the one thing a user would remember or recognise? Does it appear in every screen group?
4. **Wrong shape?** Could this be mistaken for a different kind of product (a management console, a marketing site, a dashboard)? If so, which choice made it so?
5. **Hardest audience.** Walk the audience with the least skill, the worst device or the highest pressure through the main job. Where do they stop?

## Rules the project writes

`design-rules.md` is short. It starts from the brief, and every rule is a row:

| Rule | Why (brief or NFR reference) | Test | Applies to |
| --- | --- | --- | --- |

A rule names a measurable target or an observable behaviour: a size, a count, a timing, a contrast, a naming term, a state that must exist. Examples from different products show the form and are not defaults: "one primary action per work screen: a task done in one pass"; "touch targets at least the size of a thumb pad on the phone shell"; "a turn never takes longer than four seconds to resolve visually"; "all copy is in the UI language, numbers and dates in its locale". A rule that no test can check is advice: keep it in the brief.

## Decision cards

Every confirmation the lead or the customer gives about design uses the Decision card method in `methods.md`. The rule behind it: nobody is asked to choose blind. If the person cannot picture an option, show it (a sketch, a screenshot of a reference, a quick mock) before asking.

## Tools

Tools serve the process and never replace a decision.

- **Never take a look from a lookup.** A tool that maps a product type to a palette and fonts gives every project the same look.
- Design tools (Figma, an engine's UI tooling, a code framework's component library, a web UI skill such as `frontend-design`, `impeccable` or `ui-ux-pro-max`) are chosen by the project and recorded in the prototype ADR. Use their checks where they exist (linters, contrast tools, accessibility audits) and report them as tool-checked evidence.
- Whatever the tool, the philosophy holds: the customer chooses, the brief wins, the fit test passes.

## Lessons behind these principles

- A customer's taste arrived at sign-off, after the whole prototype was built: the customer chooses structure and feel first.
- Products made with kickoff looked alike because the direction came from a lookup by product type: the brief decides, and the category default is named and tested.
- One product's rules became the floor of every product and produced a management console for a game: rules are derived per project.
- A confirmation with two bare options hid the real cost of a choice: decision cards.
- A direction judged on a hero image fell apart on a list of thousands of rows: judge on the extremes.
- Reviews ran after the build, so structural faults cost a rebuild: review the concepts and the spec.
