# Estimation

How kickoff plans are estimated and scheduled, and what to do when a hard date slips. The CLI implements the formulas; this file is what to tell the lead when they ask why a number or a date is what it is. Estimate first: the estimate (ranges, confidence, basis) exists without a schedule; the formulas and the slip procedure below apply when `project.yaml` has scheduling on.

## The rule (design spec §9, Estimates)

By role and focus percentage; person-days at 100% focus; every plan has a scope-cut order; with scheduling on, a slipped hard date always ends in an explicit decision. When `rules.forbidden_phrases` lists a phrase such as "AI assistance", estimates may assume it but no document, work item or report states it; `kickoff validate` warns when one does.

In practice: an estimate may count on the team's tooling making them faster; the plan, the workbook, the WBS export and the reports only show the resulting effort, never the reason in those words.

## Estimating

An estimate says how much, how sure, and why.

- **Range:** `effort` in `plan.yaml` is the likely value; `min` and `max` are the best and worst realistic cases, with `min <= effort <= max` (`kickoff validate` errors otherwise). A package without `min` and `max` counts as `min = max = effort` and is reported as a point estimate. A feature in `features.yaml` takes `estimate: {min, likely, max, confidence, basis}` in person-days (`min` and `max` default to `likely`).
- **Features and packages:** a feature with `wbs` packages is estimated by them; a feature without uses its own `estimate`, so an estimate exists right after C2, before any WBS. A feature with neither raises the warning "active feature without a WBS package or an estimate". A draft plan may be feature-level only and is refined into packages as the design settles; the baseline needs packages.
- **Confidence:** `low`, `medium` or `high`, per item. `low` is honest when the item rests on a guess, an unanswered question or an unvalidated assumption; do not raise it to look better.
- **Basis:** what the number rests on: a comparison with similar work, a spike or investigation result `V<n>`, an assumption `A<n>`, or "gut feel, no comparison". A number without a basis is a guess; say so.
- **Overhead:** management, coordination and similar continuous work is a share of the work total, set once in `project.yaml` as `estimate: {overhead: 0.10}`. It is added to the total by `kickoff estimate`; plain project management is not a package. Old plans with `effort_rate` packages keep working.
- **Reading it:** `kickoff estimate` prints min, likely and max by release and by role, the overhead and a Basis line (point estimates, low-confidence items, unsized features); `kickoff docs` writes it to `<docs_root>/06-planning/estimate.md`. The spread is `(max - min) / likely`: a wide spread means the number is not yet reliable.
- **Telling the lead:** say it in plain words: a range, what it depends on, which parts you are least sure of; "point estimate", "overhead rate" and "basis" are file terms (`../../using-kickoff/references/methods.md`, Plain words).

## Role and focus model

- One person per role (`project.yaml` `roles`). Each role has a `focus`: the share of a working day spent on this project (0.8 = 80%). Focus matters for the schedule; with scheduling off the estimate is in person-days at 100% focus.
- `effort` is person-days at 100% focus. Estimate the work, not the calendar: "4 days of focused work", not "a week".
- With scheduling on, every `seq` package joins its role's queue in plan order; `order_after` moves a package right after another one in the same role's queue (applied in file order).
- Two packages of the same role never overlap. Work that runs in parallel for one role is either an old-style level-of-effort package (`effort_rate`) or a sign that the role needs a second person (a new role id).

## Estimating a package

- Break work down until each package is at most about 10 person-days and has one owning role and one output.
- Include the review, testing and fixing a package needs to be done, in the package of the role that does it (a QA package for test work).
- Customer cooperation (`coop: Customer`) does not add effort for the team, but its waiting time is real: with scheduling on, give it a `fixed` date when booked, or a dependency on the package that delivers the answer.
- Uncertainty is stated in the range and the confidence, not in silent padding. A big spread becomes a risk or a validation item (a `V<n>` that would narrow it). A package that depends on an unanswered question names the question in `note`, and the question names the package in "Blocks". The cut order stays the lead's tool for giving up scope.

## Formulas

With scheduling on, the scheduler and the estimate workbook use the same model (working days skip the weekend in `calendar.weekend` and every date in `calendar.holidays`):

- `duration = max(1, round(effort * (1 - done) / focus))` working days, rounded half up. Example: effort 4, focus 0.8 → 5 working days.
- `start = WORKDAY(max(plan_start - 1, previous package end of the same role, end of every dependency), 1, holidays)`.
- `end = WORKDAY(start, duration - 1, holidays)`.
- `fixed` keeps its dates; `span` runs from the start of one package to the end of another; `period` starts the working day after a package ends and lasts N months (`EDATE(start, N) - 1`); `tail` ends with a package and covers its last N working days.
- Level of effort (old plans): `effort = round(workdays / 5 * effort_rate, 1)`.
- Groups and phases take the earliest start, the latest end and the summed effort of their leaves. A gate's date is the end date of the code in its `at`.
- The schedule uses `effort` (the likely value); `min` and `max` do not move dates. The plan is the estimate and the baseline; actual dates live in the team's tracker, not in kickoff. `done` (the finished share of a package) shortens the forecast in `kickoff schedule`; the estimate workbook ignores it: it is the baseline.

## Turning scheduling on

`scheduling: "off"` (the default of a new project) means no schedule, no workbook and no slip procedure: `kickoff schedule` and `kickoff workbook` print "scheduling is off" and exit 0. Turn it on with one edit of `project.yaml` after the lead has confirmed:

1. the team: each role and the focus it can give;
2. the calendar: weekend and the holidays of the project's years;
3. the hard dates: dates that cannot move, and who set them.

Then `scheduling: "on"` (or remove the key: absent means on), `kickoff validate`, `kickoff schedule`. Never type a date into `plan.yaml`.

## Slip decision procedure

Scheduling on only. `kickoff schedule` exits 3 when a gate in `project.yaml` `hard_dates` falls after its hard date. It prints, per slipping gate:

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
3. **Ask the lead to decide,** in plain words. Nothing changes before an explicit choice.
4. **Record** the decision as `D<n>` in the Decision log of `open-questions.md` (date, source, taken by role, what it changes).
5. **Apply** it through the data, never through dates: a cut feature moves to a later release or gets `status: removed` with `removed_by: D<n>` in `features.yaml`; its packages leave the late phase (a moved package gets a new code in its new phase, and the feature's `wbs` follows it); a focus change goes into `project.yaml`; a new hard date into `hard_dates`.
6. **Re-run** `kickoff validate` and `kickoff schedule`. Exit 0 closes the slip. When the lead accepted the slip, exit 3 stays: say so in `plan.md` (Scope-cut order) and in the risk.
