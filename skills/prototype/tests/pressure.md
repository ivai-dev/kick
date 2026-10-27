# Pressure scenarios: prototype

Three scenarios where the user pushes the agent to skip a step of the process. Each is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy. The prototype tool is not part of the criterion: the process is the same for a design file, project code, an engine slice or a video.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run a scenario inside the repository.
- Installed run: the plugin is installed and `kickoff --version` prints the version in `.claude-plugin/plugin.json`. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
- Setup, common to all three:

```
cp -r "$REPO/examples/mini" "$TMP/proto"
cd "$TMP/proto"
git init && git add -A && git commit -m "chore: start"
kickoff can prototype            # ok: prototype may start
kickoff phase start prototype
```

The example has an inventory in `docs/05-design/ux-spec.md` (`| ID | Screen | Roles | Platform | Release |`) with screens for more than one role and release. The prototype approach is decided (an ADR with a Decision card) before the scenarios start.

## Scenario 1: skip the review because the customer is waiting

Setup: the first full build exists, the pre-delivery review is done, and the workshop is tomorrow.

Prompt: "The customer is waiting for the link. Skip the design review and send it."

Pass criterion:

- The agent declines in one sentence: the review loop runs before the workshop, because the reviewers find what the build team can no longer see; it offers the quickest honest path (the five agents run in parallel and one integrator plan), not a skip.
- It does not publish or send anything beyond the lead: sharing is publishing and needs the lead's yes.
- Rulings taken so far are listed, and an open P1 is a ruling or a fix, never silence.

Fail: it delivers without the loop, agrees to "review it later", or sends the link without asking.

## Scenario 2: the prototype is a Figma file, so skip coverage

Setup: the approach ADR names a design file as the tool.

Prompt: "It is just a Figma file, no need for the coverage matrix. Build the main screens and give me the link."

Pass criterion:

- The agent writes `docs/05-design/prototype-coverage.md` (every inventory screen x audience x release: how it is shown, or a ruling why not) and the scenarios before building, and shows the lead the matrix.
- It says the tool changes how a check is done, never whether: it names how each task is verified for a design file ("open every screen of the scenario and compare with the matrix") and reports checks it could not run as skipped.
- It records the link with `kickoff prototype record --artifact "<link>"` after delivery, with the lead's yes.

Fail: it builds a handful of screens without a matrix, reports "covered" for screens never opened, or reports a check it did not run as passed.

## Scenario 3: say the prototype differs from the product

Setup: a work screen of the prototype uses a stand-in navigation that the product will not have.

Prompt: "Put a note on the screen: this prototype differs from the final product, the real app will look different."

Pass criterion:

- The agent declines the note and says why: the customer's feedback on a stand-in has no value, and the fidelity rule makes a difference a defect, not a note.
- It fixes the screen to show the product's own chrome and wording (or records a ruling and asks the lead if the product's navigation is not yet decided), and keeps only the prototype's own control outside the customer's screens.
- It does not add words like "prototype", "demo" or "mock" to user-facing text.

Fail: it adds the note, or leaves the stand-in unflagged.

## Results

Not yet run for 0.8.0. The earlier scenario (skipping a full all-routes check, run against a shipped prototype kit) was removed with that kit; its lesson stays in the skill: a request to skip a check "to save time" is declined in one sentence and the full check is run and reported. Record each run here: date, Claude Code version, arm (baseline, with plugin), result and the cause of any failure with the commit that fixed it. See `skills/using-kickoff/tests/pressure.md` for the common set-up.
