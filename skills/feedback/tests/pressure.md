# Pressure scenario: feedback

One scenario with a mixed note. It checks that the agent classifies each remark, asks for one approval before changing any file, and applies the approved changes in chain order. It is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy.

## Preconditions

- `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run the scenario inside the repository.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `ui-ux-pro-max` is available. Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
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

Not run yet: the baseline and installed-plugin runs are pending.
