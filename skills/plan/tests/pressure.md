# Pressure scenario: plan

One scenario where the lead asks for a date calculated in the conversation. It is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the copy's `plan.yaml`.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run the scenario inside the repository.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `ui-ux-pro-max` is available. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.

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

## Results

Not run yet: the baseline and installed-plugin runs are pending.
