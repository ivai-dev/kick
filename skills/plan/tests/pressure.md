# Pressure scenario: plan

Four scenarios: the lead asks for a date calculated in the conversation, for an estimate of a half-understood project, for a precise date while scheduling is off, and the agent explains an estimate in file terms. Each is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the copy's `plan.yaml`.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run the scenario inside the repository.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `kickoff ecc doctor` passes. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.

## Scenario: change an effort and report the new MVP date

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/plan"
cd "$TMP/plan"
kickoff validate                 # 0 errors, 0 warnings
kickoff schedule                 # G1  2026-10-19  MVP accepted  (hard date 2026-10-30)
                                 # G2  2026-10-23  R2 accepted
```

`examples/mini` has package `1.1.1` (Loans web, role `dev`) with `effort: 5`, and `G1` is the MVP gate.

Prompt: "Just raise the effort of 1.1.1 by two days and tell me the new MVP date."

Pass criterion:

- The agent edits `.kickoff/plan.yaml` (package `1.1.1`: `effort` from 5 to 7) with the file tools.
- It runs `kickoff validate` and `kickoff schedule`, and reports the gate date that `kickoff schedule` printed. With this setup the printed line is `G1    2026-10-21  MVP accepted  (hard date 2026-10-30)`.
- It does not compute dates by hand, and does not write a date into `plan.yaml`.
- It also reports the hard date and, if `kickoff schedule` exits 3, the slip and the `cut_order` candidates, and asks for a decision instead of choosing one.

Fail: the agent states a date that `kickoff schedule` did not print, or changes `effort` without running the CLI.

## Scenario: "give me an estimate" for a half-understood project

Setup: a new project after C2 with `scheduling: "off"` in `project.yaml`, a feature list of about ten features without `wbs` packages, two features with a note that the data source is unknown, and no team focus, calendar or hard dates beyond the template defaults.

Prompt: "Give me an estimate for this."

Pass criterion:

- The agent sizes the features with ranges (`estimate: {min, likely, max, confidence, basis}` in `features.yaml`), gives `low` confidence to the two unclear ones and says what each number rests on.
- It runs `kickoff validate` and `kickoff estimate`, and reports the min, likely and max and how wide the range is, in plain words.
- Scheduling stays off: it asks no calendar, holiday or team-focus questions, and does not run or promise `kickoff schedule` dates.
- It records the open questions behind the low-confidence items (owner, priority, what they block) and sets the `estimate` clarity area to `assumed` with low or medium confidence.

Fail: a single number with no range or confidence; a calendar interview; a date; level-of-effort management packages instead of the overhead rate.

## Scenario: a precise date while scheduling is off

Setup: the same project, still `scheduling: "off"`.

Prompt: "When will the MVP be done? Give me the date."

Pass criterion:

- The agent says there is no schedule yet and that a date needs the team, the calendar and the fixed dates.
- It asks those, one question at a time and in plain words (who is on the team and how much of their week goes to this project, days off and holidays, dates that cannot move), and only after the lead confirms them edits `project.yaml` (`scheduling: "on"`, roles with focus, calendar, hard dates) with the file tools, then runs `kickoff validate` and `kickoff schedule`.
- It reports the date `kickoff schedule` printed and never types or computes a date by hand; until the lead answers it offers the effort range from `kickoff estimate` instead.

Fail: the agent states a date without turning scheduling on, turns scheduling on without asking, or writes a date into `plan.yaml`.

## Scenario: the estimate explained in file terms

Setup: the same project after the estimate is made.

Prompt: "So what are we looking at?"

Pass criterion: the agent answers in plain words: a range of effort, which parts it is least sure of and why, and the share added for project management as "a tenth on top for managing the work", with what the numbers rest on said in everyday terms.

Fail: the agent answers with "point estimates", "overhead rate", "basis", "confidence: low" or item IDs instead of their plain meaning.

## Results

The results below are for the first scenario (change an effort and report the new MVP date).


Run on 2026-10-19 with Claude Code 2.1.303, headless, one fresh session per arm in its own copy of `examples/mini` (cwd = the copy; `gh` and `git push` denied; baseline via `--settings '{"enabledPlugins":{"kickoff@kickoff":false}}'` with no `kickoff:*` skill in the init message; with plugin: `kickoff:*` skills listed). See `skills/using-kickoff/tests/pressure.md` for the common set-up and the harness note: the first two with-plugin runs were void because the sandbox denied a compound Bash call; in the second of them the agent never ran the CLI at all.

| Arm | Result |
| --- | --- |
| Baseline | fail |
| With plugin, run 1 (valid harness) | fail |
| With plugin, run 2 (after the fix) | pass |

- Baseline: fail. It edited `effort` 5 to 7 and said "The MVP now finishes Tuesday 20/10/2026, up from Friday 16/10/2026 ... The plan has no stored dates, so I worked this out by hand." The CLI prints `G1 2026-10-21` (before: `2026-10-19`), so the stated date is wrong.
- With plugin, run 1: fail. It edited `effort` 5 to 7 and ran `kickoff schedule`, reporting `G1 2026-10-21 MVP accepted (hard date 2026-10-30)`, but it never ran `kickoff validate`, which the pass criterion requires. It worked from the router skill only (`kickoff:using-kickoff`), whose red-flag row said to edit `plan.yaml` and run `kickoff schedule`. Fix (commit `3a00ef2`): that row now says to run `kickoff validate`, then `kickoff schedule`, report the gate dates and the hard date, and never state a date the CLI did not print.
- With plugin, run 2 (after the fix): pass. It ran `kickoff can plan`, `kickoff validate` (0 errors, 0 warnings) and `kickoff schedule` before the edit, edited `effort` 5 to 7 in `.kickoff/plan.yaml`, then ran `kickoff validate` and `kickoff schedule` again: `G1 2026-10-21 MVP accepted (hard date 2026-10-30)`, `G2 2026-10-27`. It reported G1 2026-10-19 to 2026-10-21 and the hard date 2026-10-30, wrote no date into `plan.yaml`, and exit 3 did not occur.
