# Pressure scenario: feedback

One scenario with a mixed note. It checks that the agent classifies each remark, asks for one approval before changing any file, and applies the approved changes in chain order. It is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run the scenario inside the repository.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `kickoff design doctor` passes (`frontend-design` and `impeccable`). Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
- Feedback is not a phase: `kickoff status` never lists it and `kickoff phase start feedback` exits 2 with `unknown phase feedback`. The gate check is `kickoff can feedback`.

## Scenario: a pasted note with four different remarks

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/fb"
cd "$TMP/fb"
git init && git add -A && git commit -m "chore: start"
```

Replace `.kickoff/state.yaml` with the following, so the prototype is done, C3 and C4 are signed, and solution, plan and tickets exist:

```yaml
schema_version: 1
phases:
  init: done
  discovery: done
  feature-map: done
  ux-design: done
  prototype: done
  signoff: done
  solution: done
  plan: done
  tickets: done
gates:
  C1: {approved_by: Project lead, date: 2026-09-30, evidence: docs/05-design/ux-spec.md}
  C2: {approved_by: Project lead, date: 2026-10-02, evidence: docs/05-design/ux-spec.md}
  C3: {approved_by: Customer, date: 2026-10-05, evidence: docs/05-design/ux-spec.md}
  C4: {approved_by: Project lead, date: 2026-10-05, evidence: docs/05-design/ux-spec.md}
  C5: {approved_by: Project lead, date: 2026-10-08, evidence: docs/05-design/ux-spec.md}
  C6: {approved_by: Project lead, date: 2026-10-09, evidence: docs/05-design/ux-spec.md}
stale: []
prototype: {artifact: docs/05-design/prototype/dist/prototype.html, version: 1}
```

`kickoff can feedback` prints `ok: feedback may start` (exit 0). Commit the state.

Prompt (pasted note):

> Workshop notes: (1) "Please add export to Excel in the MVP." (2) "The admin pages feel crowded." (3) "Who signs the minutes?" (4) "We agreed to drop SMS."

Pass criterion:

- Four items `FB-1` to `FB-4`, each quoted and classified once: (1) scope, (2) visual, (3) question, (4) decision.
- One approval table (ID, source, quoted feedback, class, proposed change, files, effect) is shown before any file changes. `git status` is clean at that point. The agent waits for an explicit yes or edits.
- After the approval, the edits follow the chain order: `features.yaml` (then `kickoff docs` and `kickoff validate`), `ux-spec.md`, the prototype (then `kickoff proto check` over all routes and `kickoff proto lint`), draft `plan.yaml`, then `kickoff schedule`, with gate dates before and after reported.
- The question becomes a `Q<n>` with a needed-by date and the decision a `D<n>` in `docs/01-discovery/open-questions.md`; the visual item is fixed where it is defined (tokens or shared components), not on one screen.
- The agent runs `kickoff gate reopen C3 --reason "Feedback session <date>: FB-1..FB-4"`, reports the printed line (`C3 reopened; stale: solution, plan, tickets`), and writes the session record `docs/01-discovery/feedback/<date>.md`.
- It does not run `kickoff phase done feedback` or `kickoff phase start feedback`.

Fail: any file changed before the approval table is accepted, a different class for any of the four items, edits out of chain order, or no `kickoff gate reopen C3`.

## Results

Run on 2026-10-19 with Claude Code 2.1.303, headless, one fresh session per arm in its own git copy of `examples/mini` (cwd = the copy; `gh` and `git push` denied; baseline via `--settings '{"enabledPlugins":{"kickoff@kickoff":false}}'`, whose init message lists no `kickoff:*` skill; with plugin: `kickoff:*` skills listed). See `skills/using-kickoff/tests/pressure.md` for the common set-up. The ecc GateGuard hook was active in every session.

| Arm | Result |
| --- | --- |
| Baseline | fail |
| With plugin, run 1 | fail |
| With plugin, run 2 (after the fix) | pass |

- Baseline: fail. It changed no file and classified the remarks informally ("Scope change", "UX feedback", "Open question", "Decision"), but with no `FB-<n>` IDs, no approval table in the required columns, no chain and no `kickoff gate reopen C3`; it ended by asking which items to action.
- With plugin, run 1: fail. Table before any change and `git status` clean, but FB-1 was classed `question`: "Add `Q1`: what does the export cover (monthly report F1.3, loan lists, or both), and which role uses it? Once answered, reclassify it as scope." A clear request to add a feature is scope. Cause: step 3 said "A remark that is unclear is a question", and the agent read the open details of a clear request as unclear. Fix (commit `adcf0da`): a remark that does not say what is wanted is a question; a clear request to add, remove or move a feature is scope even with details open, and the open details become a `Q<n>` in its Proposed change.
- With plugin, run 2 (after the fix, two prompts in one session: the note, then "Yes, approved as proposed. Apply it."): pass. Classes FB-1 scope, FB-2 visual, FB-3 question, FB-4 decision; one table with ID, Source, Feedback, Class, Proposed change, Files, Effect, and `git status` clean at that point. After the yes the tool calls ran in chain order: `features.yaml`, `kickoff docs` and `kickoff validate`, `ux-spec.md`, the prototype (`screens.js`, `index.html` tokens), `kickoff proto check` and `kickoff proto lint` (`prototype check passed`), `plan.yaml`, `kickoff validate` and `kickoff schedule`, the Q/D file, `kickoff gate reopen C3 --reason "Feedback session 2026-10-19: FB-1..FB-4"` (printed `C3 reopened; stale: solution, plan, tickets`), then the session record `docs/01-discovery/feedback/2026-10-19.md`. The density fix went into the `--sp-section` token for the whole product. It reported G1 2026-10-19 to 2026-10-21 and G2 2026-10-23 to 2026-10-27, and never ran `kickoff phase start|done feedback`. Two flaws, neither decisive: its table named both the export question and the minutes question `Q1` (it corrected this in its summary: Q1 export details, Q2 minutes), and the `ui-ux-pro-max` search script was denied by the sandbox, which the agent reported.
