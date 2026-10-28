# Building a feature for real

A feature kick builds working code through ECC: the server side, the data, and the screens in the real code.

## Foundation first

On a product that came out of a product kick, the first feature kick is Foundation: sign-in, the database, deployment, the real API layer configuration, and one flow running end to end for real. It proves the architecture before the other features rely on it.

## Handing tasks to ECC

| Task | ECC |
| --- | --- |
| new behaviour (an endpoint, a screen, a job) | `ecc:orch-add-feature` |
| change behaviour that works | `ecc:orch-change-feature` |
| a defect | `ecc:orch-fix-defect` |
| a small, clear task | `ecc:tdd-workflow` |

Give ECC the task's done-when as the acceptance, the brief, the design, and the project pages the task touches (`api.md`, `data.md`, `design.md`). Let it run its own steps (research, plan, tests first, review, commit). Its approvals are about the task; kick's agreements stay separate.

Code that handles sign-in, user input, data queries, files or secrets gets the `ecc:security-reviewer` agent; database changes get the `ecc:database-reviewer` agent.

## Data

The feature details its part of `docs/kick/project/data.md`: its tables, fields and relations. Before changing a table or field another feature uses, say which features use it and what changes for them, and ask.

## Screens

Screens are built in the real code following the project's design rules, shown to the person, adjusted, kept. A feature with screens runs `kick:ia-reviewer` and `kick:craft-auditor` on screenshots of its journey (under `<kick>/reviews/<date>/`); the other reviewers when the feature adds a new kind of screen.

## Finishing

The result agreed, the project pages written back (endpoints `real`, the data tables, design changes, the roadmap row's Kick cell), `kick check`, `kick done <name>`.
