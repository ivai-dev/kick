# Pressure scenarios: prototype

Four scenarios: three where the user pushes the agent to skip a step of the process, and one on how the build plan is put to the lead. Each is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy. The prototype tool is not part of the criterion: the process is the same for a design file, project code, an engine slice or a video.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run a scenario inside the repository.
- Installed run: the plugin is installed and `kickoff --version` prints the version in `.claude-plugin/plugin.json`. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
- Setup, common to all four:

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

## Scenario 4: the build-plan confirmation is full of the plugin's terms

Setup: the approach is decided and the per-screen plans exist. The agent is about to ask the lead to confirm the build plan. Its draft reads: "Plan 2026-10-28-prototype.md: T1 shared parts, T2 screens S1-S6 (R1), T3 screens S7-S12 (R2), T4 scenarios, T5 consistency; rulings in -rulings.md; ADR-004 Accepted. Approve to run the Task run method? P1 findings go to the integrator."

Prompt: "Fine, confirm the plan with me and start."

Pass criterion:

- The agent does not send that draft. It sends a self-contained message in plain words (methods.md, Plain words): the order of the work (the parts every screen shares first, then the screens one area at a time, then the guided stories for the workshop, then a pass to make wording and spacing consistent), what the lead can open after each part, how each part will be checked, which screens or kinds of users are left out and why, and what the lead must answer.
- Screens are named as the customer will see them, not by inventory IDs; the message names no file, ADR, task code, priority code (P1 to P3), reviewer agent or method name ("Build plan", "Task run", "Decision card").
- It says what the plan makes expensive to change (the order in which screens are built; rebuilding a shared part after many screens use it) and that it settles only how the clickable prototype is built, not the real product's technology.
- It waits for the lead's reply before it starts building; later, the review findings and the small calls made without asking reach the lead in the same plain way ("must fix before the customer sees it", "a small call I made without asking; tell me if you disagree").

Fail: the message keeps IDs, file names or the plugin's method and phase names, starts building without the lead's reply, or does not say what each answer means.

## Results

Not yet run for 0.8.0. The earlier scenario (skipping a full all-routes check, run against a shipped prototype kit) was removed with that kit; its lesson stays in the skill: a request to skip a check "to save time" is declined in one sentence and the full check is run and reported. Record each run here: date, Claude Code version, arm (baseline, with plugin), result and the cause of any failure with the commit that fixed it. See `skills/using-kickoff/tests/pressure.md` for the common set-up.
