# Look and feel

How the shape step chooses how the product is organised and how it looks, without a throw-away prototype. Read `../../using-kick/references/design-philosophy.md` first.

## 1. The design brief

Add a short "For whom and how it should feel" part to the kick's `design.md`, answering for each kind of user: the job, the scene (device, place, pressure), the rhythm, the feeling (and what must never appear), two or three references they like and one they dislike, the category default and its opposite, and pinned constraints (logo, brand colours, platform rules). Ask only what the brief does not already say.

## 2. The screen map

The journeys of each kind of user, left to right; under each, its screens; a line marks the first release. Example:

```text
Librarian:  Find member → Lend → Return → Overdue list
Member:     Sign in → My loans → Renew
----------- first release above, later below -----------
Librarian:  Monthly report
```

Agree it before the look, because adding or removing screens changes the estimate more than any colour.

## 3. Directions that differ in kind

Prepare 2–3 directions. They differ on at least three of: flow and structure, interaction model, navigation and shell, pace and density, tone and voice, material and visual language, motion. Two that a person would call "the same in another colour" are one direction.

Each direction is shown as **one key screen**: the screen that says most about the product (for a library desk, the lending screen), with real content in the product's language and its extremes (an empty list, a very long name, an error). Build it with the companions that are installed (frontend-design, impeccable, ui-ux-pro-max; superdesign for quick variants; Figma when the team works there), as a static page in the chosen frontend stack. Never draw every screen.

Before showing them, run the `kick:art-director` and `kick:ia-reviewer` agents on the key screens (screenshots, taken with playwright or ECC's Chrome DevTools, and a short note per direction under `<kick>/reviews/<date>/`, with a `BRIEF.md`). Each agent prompt names the absolute paths of the review folder, the `BRIEF.md`, the kick's `brief.md` and `design.md`, and the design philosophy (`skills/using-kick/references/design-philosophy.md` under the plugin root, two levels above this skill's folder); ask for the report in the docs language. Fix every P1, then show the directions as a decision card. The person chooses one, or "none of these", or "show me first".

## 4. Design rules

From the chosen direction, write the project's design rules into `docs/kick/project/design.md` at the end of the product kick (keep them in the kick's `design.md` until then). Each is a row: rule, why, test, applies to. Include the product languages and their formats (dates, numbers, currency) and the accessibility targets.

## 5. Fit test

Write the five answers of the fit test (swap the name, name the default, find the signature, wrong shape, hardest audience) under the chosen direction. A failing answer is fixed before the shape is agreed.

## A feature in a running project

No new direction: the feature follows the project's design rules. A screen with a pattern the product does not have yet gets one key screen to agree, built in the real code.
