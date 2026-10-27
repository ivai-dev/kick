# {{project_name}} — UX specification

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Inputs:** `.kickoff/features.yaml` at commit {{commit}}, `nfr.md`, `concepts.md` (chosen concept: {{name}}), `design-brief.md`, `design-rules.md`

`kickoff validate` reads the Screen inventory below: it stays the first table in this file whose first header cell is "ID", with exactly its five columns.

## Audiences and structure

Written in the chosen concept's own vocabulary. A "screen" is any unit of experience: a screen, a scene, a level, a flow state.

| Audience id | Audience | Entry (what it opens on, and why) | Structure and navigation | Platforms |
| --- | --- | --- | --- | --- |
| {{id}} | {{audience name}} | {{what the product opens on for them, from their job in the brief}} | {{the parts they move between and how, in the concept's model}} | {{platforms and devices}} |

## Screen inventory

| ID | Screen | Roles | Platform | Release |
| --- | --- | --- | --- | --- |
| {{ID}} | {{screen name}} | {{audience id}}, {{audience id}} | {{platform}} | {{release}} |

- One row per screen of the full product, every release and platform. IDs are permanent; prefixes are free (those in `.kickoff/project.yaml`, or `SC-`, `W-`, `A-`, `S-` and the like).
- Roles: comma-separated audience ids that may open the screen (free text). Each audience's entry is its first row.
- Platform: free text, the platforms the project uses. Release: a release id from `.kickoff/project.yaml`.
- A device or mode view of a screen is a note below, not a row.

### Notes

- {{features without a screen and why, e.g. a nightly import; device or mode views of a screen; or "None"}}

## Navigation rules

1. {{rule that follows from the concept, e.g. "The hub is always one action away"}}
2. Each audience starts on its own entry on every platform it uses.
3. {{who may open what, and what anyone else sees}}
4. {{project-specific rule, e.g. "Back from a detail returns to the list with its filters kept"}}

Every rule names its reason (the concept or the brief) when it is not obvious.

## Behaviour rules

| # | Rule | Screens | Features |
| --- | --- | --- | --- |
| BR-1 | {{rule, e.g. "A loan is due 14 days after it starts; the due date cannot be in the past"}} | {{screen IDs}} | {{feature IDs}} |

## States

| Screen or group | Empty | Loading | Error | Offline or interrupted |
| --- | --- | --- | --- | --- |
| {{screen IDs}} | {{what the user sees and the next action}} | {{what shows while waiting}} | {{message and recovery}} | {{what still works}} |

### Data at its real volume

For every screen that shows lists, entities or state:

| Screen | Typical | Maximum | Longest or worst value | What the screen does at each |
| --- | --- | --- | --- | --- |
| {{screen ID}} | {{e.g. 40 rows}} | {{e.g. 12,000 rows}} | {{e.g. a 60-character name}} | {{search, paging, truncation, summary}} |

## Copy guide

- **Language and locale:** {{languages.ui}}, locale {{e.g. vi-VN}}; sample data uses invented names, organisations and addresses only.
- **Only what the user needs now:** no text that explains system mechanics or policy; a fact appears when its event happens.
- **Never in the UI:** development infrastructure (internal hosts, tool names), screen codes, prototype words, internal IDs the user does not need.
- **Terms:** one name per thing, in `design-rules.md` (Terms).

### Voice and tone

Voice in one sentence: {{e.g. "a helpful clerk who speaks plainly: warm, respectful, simple"}}.

| Audience | Address | Tone | Words to use | Avoid | Example |
| --- | --- | --- | --- | --- | --- |
| {{audience}} | {{form of address}} | {{e.g. plain, warm, no pressure}} | {{e.g. buttons start with a verb}} | {{slang, marketing, officialese}} | {{one real string}} |

### Formats

Derived from the UI locale; write only what this product shows.

| Thing | Format | Example |
| --- | --- | --- |
| Numbers | {{locale rule}} | {{example}} |
| Money | {{rule}} | {{example}} |
| Dates and times | {{rule}} | {{example}} |
| Units | {{rule}} | {{example}} |
| Letter case | {{rule, e.g. sentence case in titles}} | {{example}} |

## Accessibility and inclusion

Targets come from `nfr.md`; `design-rules.md` turns each into a testable rule.

| Target | Source | How it is verified |
| --- | --- | --- |
| {{e.g. WCAG 2.2 AA}} | {{NFR-ACC<n>}} | {{tool check / reviewed by a person}} |
| {{input methods, e.g. keyboard only, touch, controller}} | {{NFR or brief}} | {{…}} |
| {{languages and locales}} | {{NFR or brief}} | {{…}} |

## Fit test

Written at the end of `ux-design`, on this spec, one short paragraph each (philosophy, "The fit test").

1. **Swap the name:** {{would it still hold for another product of the category? what is specific here?}}
2. **The default it follows:** {{decision or accident?}}
3. **The signature:** {{what a user would remember; does it appear in every screen group?}}
4. **Wrong shape?** {{could it be mistaken for another kind of product? which choice makes it so?}}
5. **Hardest audience:** {{where do they stop?}}
