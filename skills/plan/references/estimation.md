# Estimation

How kickoff plans are estimated and scheduled, and what to do when a hard date slips. The CLI implements the formulas; this file is what to tell the lead when they ask why a date is what it is.

## The rule (design spec §9, Estimates)

By role and focus percentage; person-days at 100% focus; every plan has a scope-cut order; a slipped hard date always ends in an explicit decision. When `rules.forbidden_phrases` lists a phrase such as "AI assistance", estimates may assume it but no document, ticket or report states it; `kickoff validate` warns when one does.

In practice: an estimate may count on the team's tooling making them faster; the plan, the workbook, the tickets and the reports only show the resulting effort, never the reason in those words.

## Role and focus model

- One person per role (`project.yaml` `roles`). Each role has a `focus`: the share of a working day spent on this project (0.8 = 80%).
- `effort` is person-days at 100% focus. Estimate the work, not the calendar: "4 days of focused work", not "a week".
- Every `seq` package joins its role's queue in plan order; `order_after` moves a package right after another one in the same role's queue (applied in file order).
- Two packages of the same role never overlap. Work that runs in parallel for one role is either a level-of-effort package (`effort_rate`) or a sign that the role needs a second person (a new role id).

## Estimating a package

- Break work down until each package is at most about 10 person-days and has one owning role and one output.
- Include the review, testing and fixing a package needs to be done, in the package of the role that does it (a QA package for test work).
- Customer cooperation (`coop: Customer`) does not add effort for the team, but its waiting time is real: give it a `fixed` date when booked, or a dependency on the package that delivers the answer.
- Management, coordination and similar continuous work is level-of-effort: `effort_rate` (person-days per week) with a `span`, `period` or `tail` schedule.
- Uncertainty goes into risks and the cut order, not into silent padding. A package that depends on an unanswered question names the question in `note`, and the question names the package in "Blocks".

## Formulas

The scheduler and the estimate workbook use the same model (working days skip the weekend in `calendar.weekend` and every date in `calendar.holidays`):

- `duration = max(1, round(effort * (1 - done) / focus))` working days, rounded half up. Example: effort 4, focus 0.8 → 5 working days.
- `start = WORKDAY(max(plan_start - 1, previous package end of the same role, end of every dependency), 1, holidays)`.
- `end = WORKDAY(start, duration - 1, holidays)`.
- `fixed` keeps its dates; `span` runs from the start of one package to the end of another; `period` starts the working day after a package ends and lasts N months (`EDATE(start, N) - 1`); `tail` ends with a package and covers its last N working days.
- Level of effort: `effort = round(workdays / 5 * effort_rate, 1)`.
- Groups and phases take the earliest start, the latest end and the summed effort of their leaves. A gate's date is the end date of the code in its `at`.
- Actuals pulled from the tracker override the plan: a done package uses its real dates; a started package keeps its real start. The estimate workbook ignores `done` and actuals: it is the baseline.

## Slip decision procedure

`kickoff schedule` exits 3 when a gate in `project.yaml` `hard_dates` falls after its hard date. It prints, per slipping gate:

```text
G5 slips: planned 2026-12-03, hard date 2026-11-27 (4 working days late)
  cut candidate F6.13 Export minutes to Word: frees up to 3 person-days in 2.3.9
```

1. **Report** the slip as printed: the gate, the planned and hard dates, the working days late.
2. **Present the options** as one table, each with its effect on the gate and what it costs:
   - **Cut or move scope:** the cut candidates in `cut_order`, first ones first, with the effort each frees. The days gained are about the freed effort divided by the role's focus, and only on the role whose queue sets the gate date.
   - **Add capacity:** a higher focus for the role that sets the date, or a second person as a new role; say who and from when.
   - **Move the hard date:** only the customer can agree to it.
   - **Accept the slip:** the gate stays late; it becomes a risk with an owner role and a trigger.
3. **Ask the lead to decide.** Nothing changes before an explicit choice.
4. **Record** the decision as `D<n>` in the Decision log of `open-questions.md` (date, source, taken by role, what it changes).
5. **Apply** it through the data, never through dates: a cut feature moves to a later release or gets `status: removed` with `removed_by: D<n>` in `features.yaml`; its packages leave the late phase (a moved package gets a new code in its new phase, and the feature's `wbs` follows it); a focus change goes into `project.yaml`; a new hard date into `hard_dates`.
6. **Re-run** `kickoff validate` and `kickoff schedule`. Exit 0 closes the slip. When the lead accepted the slip, exit 3 stays: say so in `plan.md` (Scope-cut order) and in the risk.
