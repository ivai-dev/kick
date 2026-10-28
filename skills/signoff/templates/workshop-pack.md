# {{project_name}} — workshop to agree the features

Written for people who have not seen the project's working documents. Everything you need to decide is on this page; the codes in the Reference columns are only for the project team's records.

- **Date and place:** {{YYYY-MM-DD HH:MM}}, {{place or call link}}
- **What you will look at:** {{prototype link or file}} (a clickable model of the whole product), version {{n}}
- **Prepared by:** Project lead
- **Who attends:** {{roles and organisations, e.g. "Customer: product owner, department head; Supplier: project lead"}}

## What we ask you to agree

1. **That the full list of features is right,** for every release, so nothing is missing and nothing is there that you do not want. After you agree, the technical design and the plan are built from this list. Adding or removing a feature later means redoing that design work, so this is the moment to say so.
2. **Which features are in the first release** ({{first release name and what it is for}}). The rest come in later releases. The first release is what we plan and build first.

If you agree with changes, we update the prototype and ask you to look again; nothing is designed before then.

## Agenda

| Time | Item | Led by (role) | What comes out of it |
| --- | --- | --- | --- |
| {{HH:MM}} | Goal, what is in each release, how to read the prototype (where the first release ends) | Project lead | a shared picture of the scope |
| {{HH:MM}} | Walk through the prototype (below) | Project lead | your comments per feature |
| {{HH:MM}} | Decisions we need from you | Customer | decisions, with a date where one is needed |
| {{HH:MM}} | Questions we still need answered | Project lead | answers or new dates |
| {{HH:MM}} | Agree the features and the first release | Customer and project lead | agreement, or a list of changes |

## Walk through the prototype

Each row says how to open the prototype at the start of that walk-through (the link and where to begin, or a video). You can stop and click through by hand at any point.

| # | What we show | How to open it | Who is using it | What it lets them do (features) | What we would like to hear from you | Reference |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | {{scenario name}} | {{prototype link and start point, or video}} | {{role}} | {{each feature in a few words}} | {{question for the customer}} | {{F<n>.<n>, F<n>.<n>}} |

Features we will not click through but want you to see (a short look at each):

| What it lets people do | Where to find it | Release | Note | Reference |
| --- | --- | --- | --- | --- |
| {{feature in a few words}} | {{screen name}} | {{release}} | {{note}} | {{F<n>.<n>, screen ID}} |

## Decisions we need from you

For each decision: what each answer means for you, what we recommend, and what happens if you want none of the options (say so and we will show you more first).

| Decision | Your options and what each means for you | Our recommendation and why | Needed by (when a date is set) | Reference |
| --- | --- | --- | --- | --- |
| {{what is to be decided, in a sentence}} | {{A: what you will see or get, who it suits, what it costs; B: …}} | {{option and why, in one line}} | {{YYYY-MM-DD, or "as soon as you can" when no date is set}} | {{Q<n>}} |

## Small calls we made without you

While building the prototype we made these choices ourselves so the work could go on. Tell us if you disagree; each row says what changing it would cost.

| What we chose | Why | What it costs to change | Where you will see it | Reference |
| --- | --- | --- | --- | --- |
| {{what was chosen}} | {{why}} | {{cost}} | {{screen names or features, in words}} | {{screen IDs or F<n>.<n>}} |

## Questions we still need answered

| Question | How soon (and the date, when one is set) | What waits for the answer | Who answers (role) | Reference |
| --- | --- | --- | --- | --- |
| {{question in one plain sentence}} | {{now / soon / later; YYYY-MM-DD when a date is set}} | {{what we cannot finish without it, in words}} | {{role}} | {{Q<n>}} |

## What moves to a later release if the work must be cut back

If everything planned for the first release does not fit the time or the budget (or a fixed date, when there is one), features move to a later release in this order. This section names no date unless one is fixed.

| Order | Feature | Planned for | Effort freed (person-days) | What users lose until the later release | Reference |
| --- | --- | --- | --- | --- | --- |
| 1 | {{feature in a few words}} | {{release}} | {{effort as a range, e.g. "4 to 7"}} | {{what users lose until the later release}} | {{F<n>.<n>}} |

## For the project team only

Not part of what the customer reads: delete this section from the copy that is sent or shown to the customer.

- **Feature list version:** `.kickoff/features.yaml` at commit {{commit}}; feature map in `02-requirements/feature-map.md`.
