# Architecture and technology

How the shape step chooses the solution, the architecture and the technology.

## Decide now, decide later

| Decide now (product kick) | Decide after "this is the product" (feature kicks) |
| --- | --- |
| the overall solution (build, buy, extend what exists) | the data model and the database tables |
| the architecture: parts, where they run, how they talk | the final API: every endpoint and its fields |
| the frontend stack (the real screens are built next) | integrations in detail |
| backend language and framework, hosting | performance tuning |
| sign-in approach | |

The left column shapes the estimate and the screens. The right column is cheapest to decide once the screens are agreed, because then it stops changing. When the person wants the database now, say exactly that, ask, and log the answer; if they insist, write it as a draft in `docs/kick/project/data.md` and mark it as such.

## Options that differ in kind

Give the `ecc:architect` agent: the brief, the constraints (budget, team skills, hosting rules, data that must stay inside), the unclear markers, and the question. Ask for 2–3 options that differ in kind (for example "a web app the librarian uses on the desk computer" versus "a web app plus a phone app for members" versus "extend the library system they already have"), each with:

- cost (days to build, licences, running cost);
- risk (what can go wrong, how likely);
- what it makes hard later.

Show them as a decision card. When two stay close, run `ecc:council` and show its verdict with the dissent.

## Writing the decision

In the kick's `design.md`, under Decisions:

```markdown
### One web app for the desk and the members' phones (2026-10-28)
We chose one responsive web app because members only check their loans and the library has no budget for app stores.
We gave up push notifications to a phone app.
Changing it later would cost a second front end.
```

Keep the options that were not chosen under Options considered.

## Diagram

One diagram of the parts and how they talk: drawio when installed, otherwise mermaid in `design.md`. Name the parts in the person's words.

## Technical risks and probes

Each risk gets a probe: the smallest throw-away test that answers it. Write it under Technical risks in `design.md`:

> The old barcode scanner may not work in a browser. Probe: connect one scanner to a test page and read ten barcodes (half a day). Answer: not yet known.

The plan adds each probe as a task marked `(probe)`; its code is deleted once the answer is written down.

## Reviews

For a module or a product, run the `ecc:security-reviewer` and `ecc:database-reviewer` agents on the design, read-only and in parallel. Save their reports under `<kick>/reviews/<date>/` and fix or record every P1.
