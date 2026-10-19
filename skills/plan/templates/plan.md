# {{project_name}} — project plan

- **Status:** {{Draft / Baseline approved on YYYY-MM-DD (C6)}}
- **Updated:** {{YYYY-MM-DD}}
- **Owner:** Project lead
- **Plan start:** {{YYYY-MM-DD}}; estimate workbook: `{{project}}-estimate.xlsx`

The tables between `kickoff:begin` and `kickoff:end` markers are generated from `.kickoff/plan.yaml` by `kickoff docs`. Edit the YAML, not the tables.

## Goal and milestones

{{one paragraph: what the plan delivers, by when, and what decides success}}

<!-- kickoff:begin gates -->
<!-- kickoff:end gates -->

{{hard dates and the spare working days before each, as `kickoff schedule` and the workbook show them}}

## Delivery strategy

{{how the phases build on each other: what comes first and why, how releases are cut, where bounded investigations sit inside real work packages}}

<!-- kickoff:begin phases -->
<!-- kickoff:end phases -->

## Team and focus

One person per role. Effort is estimated in person-days at 100% focus; durations follow each role's focus.

| Role | Focus | Duties |
| --- | --- | --- |
| {{role}} | {{80%}} | {{duties}} |

## Feature sign-off

{{the sign-off workshop date (WBS code), what the customer signs off (the full feature set across all releases and the MVP line), and the effect of a late sign-off on the MVP gate (risk R<n>)}}

## Sprints

<!-- kickoff:begin sprints -->
<!-- kickoff:end sprints -->

{{how sprints map to phases and releases}}

## Scope-cut order

If a hard date slips, these features leave the release first, in this order. A cut is a decision recorded in the Decision log.

| Order | Feature | Effort freed (person-days) | Effect |
| --- | --- | --- | --- |
| 1 | {{F<n>.<n> name}} | {{n}} | {{what the customer loses, and the later release it moves to}} |

## Assumptions

The plan holds while these hold. The full register is in `03-research/assumptions.md`.

| ID | Assumption | Status | If it fails |
| --- | --- | --- | --- |
| {{A<n>}} | {{text}} | {{Pending / Confirmed / Rejected}} | {{effect on dates or scope}} |

## Risks summary

The full register is in `risk-register.md`. Highest scores first.

| ID | Risk | Score (P × I) | Mitigation | Owner (role) |
| --- | --- | --- | --- | --- |
| {{R<n>}} | {{title}} | {{n}} | {{mitigation}} | {{role}} |
