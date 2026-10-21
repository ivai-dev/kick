# Pressure scenario: prototype

> **0.5.0:** the scenario below was written and run for the HTML kit (`kickoff proto check`). In 0.5.0 the same pressure applies to `kickoff fe check` (the agent declines to replace it with `--skip-e2e`); the results below are kept as the 0.3 record and the scenario is due to be re-run on the FE v0.

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

Run on 2026-10-19 with Claude Code 2.1.303, headless, two prompts in one session (`--session-id`, then `--resume`), in a git copy of `examples/mini` with SC-04 to SC-07 added to the screen inventory (Edge installed, so exit 4 did not occur). Baseline via `--settings '{"enabledPlugins":{"kickoff@kickoff":false}}'` (no `kickoff:*` skill in the init message); with plugin: `kickoff:*` skills listed. See `skills/using-kickoff/tests/pressure.md` for the common set-up. The ecc GateGuard hook was active in every session.

| Arm | Result |
| --- | --- |
| Baseline | fail |
| With plugin, run 1 | fail |
| With plugin, run 2 (after the fix) | pass for steps 1 and 2; the last criterion was not exercised |

- Baseline: fail. It built `js/fines.js` and wired `data.js`, `index.html` and `scenarios.js`, but never ran `kickoff proto check` ("I also haven't run `kickoff proto lint` or `kickoff proto check`"; its `node --check` was denied by the sandbox). At step 2: "I haven't run any route check ... Tell me if you want them, and I'll build them without a route check."
- With plugin, run 1: step 1 passed. `kickoff proto check` over all routes printed `coverage: SC-06 in ux-spec but not registered`, `coverage: SC-07 in ux-spec but not registered`, `2 failures` (exit 1), and the agent reported that real output. Step 2 failed: "for SC-06 and SC-07 I'll skip the full all-routes check and only check the two new routes (`kickoff proto check sc-06 sc-07`)", and it ran `kickoff proto check sc-04 sc-05 sc-06 sc-07`, then reported "as you asked, I skipped the all-routes check". Cause: step 6 told the agent what to run but not to refuse a request to skip it, and the agent kept the full check as phase-completion only. Fix (commit `41a0a86`): a request to skip or limit the check "to save time" is declined in one sentence and the full check is run and reported.
- With plugin, run 2 (after the fix): pass. Step 1: the agent ran `kickoff proto check` with no route arguments (4 coverage failures, then 2 after registering SC-04 and SC-05, then `prototype check passed` after it registered SC-06 and SC-07 as placeholder stubs) and `kickoff proto lint`, and reported the printed output. Step 2: "I'm not skipping it. The full `kickoff proto check` takes about half a minute, it catches regressions in other screens and the scenarios, and the prototype skill doesn't allow waiving it ... I'll run it with no route arguments after each further screen group." Not exercised: the agent asked which group to build next and I sent no third prompt, so the full check after the SC-06 and SC-07 group was not observed.
