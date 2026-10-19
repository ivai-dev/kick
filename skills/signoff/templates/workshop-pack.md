# {{project_name}} — feature sign-off workshop

- **Date and place:** {{YYYY-MM-DD HH:MM}}, {{place or call link}}
- **Prototype:** {{prototype link or file}}, version {{n}}
- **Feature set:** `.kickoff/features.yaml` at commit {{commit}}; feature map in `02-requirements/feature-map.md`
- **Prepared by:** Project lead
- **Attendees:** {{roles and organisations, e.g. "Customer: product owner, department head; Supplier: project lead"}}

## Goal

The customer signs off the full feature set of the product, across every release, and the customer and the project lead lock the scope of the first release ({{MVP release}}). Architecture and data design start only after this sign-off.

## Agenda

| Time | Item | Led by (role) | Output |
| --- | --- | --- | --- |
| {{HH:MM}} | Goal, scope by release, how to read the prototype (full, tags and MVP views) | Project lead | shared picture of the scope |
| {{HH:MM}} | Demo scenarios (below) | Project lead | comments per feature |
| {{HH:MM}} | Decisions the customer must take | Customer | decisions with dates |
| {{HH:MM}} | Open questions due | Project lead | answers or new dates |
| {{HH:MM}} | Feature sign-off and MVP lock | Customer and project lead | sign-off or list of changes |

## Demo script

Each link opens the prototype and plays the scenario; the viewer can stop it and step through by hand.

| # | Scenario | Link | Role | Features shown | What to ask |
| --- | --- | --- | --- | --- | --- |
| 1 | {{scenario name}} | {{prototype link}}#scn-{{id}} | {{role}} | {{F<n>.<n>, F<n>.<n>}} | {{question for the customer}} |

Features shown without a scenario (walk-through):

| Feature | Screen | Release | Note |
| --- | --- | --- | --- |
| {{F<n>.<n>}} | {{screen ID}} | {{release}} | {{note}} |

## Decisions the customer must take

| ID | Decision | Options | Recommended | Deadline |
| --- | --- | --- | --- | --- |
| {{Q<n>}} | {{decision}} | {{A: …; B: …}} | {{option and why, in one line}} | {{YYYY-MM-DD}} |

## Open questions due

| ID | Question | Needed by | Blocks | Owner (role) |
| --- | --- | --- | --- | --- |
| {{Q<n>}} | {{question}} | {{YYYY-MM-DD}} | {{phase or WBS code}} | {{role}} |

## Scope-cut order if dates are fixed

If the fixed dates cannot hold with the full first release, features move to a later release in this order:

| Order | Feature | Release now | Effort freed (person-days) | Effect on the first release |
| --- | --- | --- | --- | --- |
| 1 | {{F<n>.<n> name}} | {{release}} | {{effort}} | {{what users lose until the later release}} |
