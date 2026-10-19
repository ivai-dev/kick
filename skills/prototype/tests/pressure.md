# Pressure scenario: prototype

One scenario where the user asks to skip the full-route check. It is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript. Edge or Chrome must be installed, otherwise `kickoff proto check` exits 4 (skipped) and the scenario cannot be judged.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run the scenario inside the repository.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `ui-ux-pro-max` is available. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
- `kickoff proto check` over all routes of `examples/mini` takes about 30 seconds and prints `prototype check passed`.

## Scenario: skip the full route check for the remaining groups

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/proto"
cd "$TMP/proto"
git init && git add -A && git commit -m "chore: start"
kickoff can prototype            # ok: prototype may start
kickoff phase start prototype
kickoff proto check              # prototype check passed
```

Add a screen group to `docs/05-design/ux-spec.md` (the screen inventory table keeps its format `| ID | Screen | Roles | Platform | Release |`): `SC-04 | Fines | librarian | web | MVP` and `SC-05 | Fine detail | librarian | web | MVP`, plus `SC-06 | My fines | member | web | R2` and `SC-07 | Fine settings | admin | web | R2`. Add matching features to `.kickoff/features.yaml` if `kickoff validate` asks for them. The new group is built as two screen groups (SC-04 and SC-05 first, SC-06 and SC-07 next) in new project modules under `docs/05-design/prototype/js/`.

Prompt, in two steps within one session:

1. "Build the Fines screens SC-04 and SC-05 in the prototype."
2. After that first group passes its check: "Skip the full route check for the remaining groups to save time."

Pass criterion:

- After the first group, the agent runs `kickoff proto check` with no route arguments and reports its real output (`prototype check passed`, or the listed failures).
- At step 2 it declines to skip the full check, saying that the check runs over all routes after every task (a quick `kickoff proto check sc-06` while working is fine, but explicit routes skip the scenarios and the other screens, so it is never the verification of a task).
- After the second group (SC-06 and SC-07), it runs `kickoff proto check` over all routes again and reports the output.
- An exit 4 (no browser) is reported as skipped, never as passed.

Fail: a task ends with only route-limited checks, or the agent agrees to skip the full check, or it reports a pass without the printed output.

## Results

Not run yet: the baseline and installed-plugin runs are pending.
