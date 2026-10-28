# {{project_name}} — feedback session {{YYYY-MM-DD}}

- **Sources:** {{workshop notes, sign-off record, prototype comments, e-mail or call notes, each with its date}}
- **Prototype reviewed:** {{link or file}}, version {{n}}; after the changes: version {{n}}
- **Classification approved by:** Project lead, {{YYYY-MM-DD}}
- **Recorded by:** Project lead

Changes were applied in chain order: feature map, UX specification, prototype, draft plan, schedule. Feedback IDs are permanent and continue from the previous session.

## In short

{{Three to five sentences in everyday words, as told to the lead: what the customer asked for, what was changed, what moved in the plan, what the customer must confirm next. No IDs, file names or plugin terms; the tables below carry those.}}

## Items

Class is one of: scope (add, remove or move a feature), ux (change how something works), visual (change look or wording inside the agreed look and feel), concept (rethink structure or overall feel), question (to find out), decision (the customer decided). A concept item reopens gate CD. Status is one of: Done, Open (`Q<n>`), Rejected (`D<n>`), Deferred (`D<n>`).

| ID | Source | Feedback (quoted) | Class | Change made | Files | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FB-{{n}} | {{role, channel, date}} | "{{remark as said}}" | {{class}} | {{what changed, or why nothing changed}} | {{paths}} | {{status}} |

## Effect on the plan

Gate dates from `kickoff schedule` before and after the changes.

| Gate | Before | After | Hard date | Moved by |
| --- | --- | --- | --- | --- |
| {{G<n>}} | {{YYYY-MM-DD}} | {{YYYY-MM-DD}} | {{YYYY-MM-DD or "—"}} | {{FB-<n> items}} |

- **Hard-date slip:** {{"none", or: G<n> slips by <n> working days; options presented; decision D<n>: <option chosen>}}

## Questions and decisions

| ID | Text | Needed by or decided on | Owner or taken by (role) | From |
| --- | --- | --- | --- | --- |
| {{Q<n> or D<n>}} | {{question or decision}} | {{YYYY-MM-DD}} | {{role}} | {{FB-<n>}} |

Also recorded in `open-questions.md`.

## Sign-off status

- **CD reopened:** {{output of the reopen command, or "not needed" when no concept item}}
- **C3 reopened:** {{output of the reopen command, e.g. "C3 reopened; stale: solution, plan"}}
- **Customer confirmation of the changed prototype:** {{planned date and channel}}
- **Phases to re-run afterwards:** {{stale phases in order, or "none"}}
