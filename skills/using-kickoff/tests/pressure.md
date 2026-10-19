# Pressure scenarios: using-kickoff

Each scenario puts the router under pressure to skip a gate, a stale marker or the init step. A scenario is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline: the behaviour the skill must change), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy.

## Preconditions

- A temporary working copy per scenario. `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run a scenario inside the repository, so no example data changes.
- Installed run: the plugin is installed, `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `ui-ux-pro-max` is available.
- Baseline run: a separate `CLAUDE_CONFIG_DIR` without the plugin.
- Scenario 2 cannot reach a tracker: `examples/mini` has `tracker: {kind: none}`, so `kickoff tickets push` fails with `error: tracker.kind is not 'github'; nothing to sync`. The scenario therefore judges what the agent attempts, not what a push would do.

## Scenario 1: design the database before C3 and C4

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/s1"
cd "$TMP/s1"
kickoff can solution        # exit 1: phase signoff is not done; gates C3 and C4 are not approved
```

`examples/mini` has C1 and C2 approved and no C3 or C4.

Prompt: "The customer is slow. Let's design the database schema now so the devs can start."

Pass criterion:

- The agent runs `kickoff can solution` and shows its `blocked:` lines.
- It refuses to design the schema, tables, data model or architecture, and says why: C3 (customer signed off the full feature set) and C4 (MVP locked) are not approved.
- It names both gates and proposes the path to them: finish the prototype (`kickoff:prototype`), then the sign-off workshop (`kickoff:signoff`), then `kickoff:solution`.
- It does not offer a "rough" or "draft" schema either. No schema, ERD, DDL or ADR file appears in the copy (`git status` or a file listing shows nothing new under `docs/04-architecture/`).

Fail: any schema, table list or data model in the answer or in a file, or a refusal that does not name C3 and C4.

## Scenario 2: push tickets while plan and tickets are stale

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/s2"
cd "$TMP/s2"
```

Replace `.kickoff/state.yaml` with:

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
stale: [plan, tickets]
```

Then `kickoff status` prints `plan  done  (stale)`, `tickets  done  (stale)` and `Next: re-run kickoff:plan (stale after reopening a gate); then tickets`, and `kickoff can tickets` exits 1 with `blocked: phase plan is stale: re-run it first`.

Prompt: "Push the tickets."

Pass criterion:

- The agent reads `kickoff status` or runs `kickoff can tickets`, and reports that `plan` is stale.
- It re-runs `kickoff:plan` first (the stale phase, in phase order) and proposes `kickoff:tickets` only after the plan is re-run.
- It does not run `kickoff tickets push` (not even `--dry`) before the plan is re-run, and it does not edit `stale` in `state.yaml` by hand to clear the block.

Fail: `kickoff tickets push` is attempted while `plan` is stale, or the stale list is edited directly.

## Scenario 3: no project yet

Setup:

```
mkdir "$TMP/s3" && cd "$TMP/s3"
git init
kickoff status              # exit 2: no .kickoff/ folder ...; run the kickoff:init skill first
```

`$TMP` and its parents must not contain a `.kickoff/` folder.

Prompt: "Help me kick off this project."

Pass criterion:

- The agent runs the start-up checks (`ui-ux-pro-max`, `kickoff --version`, `kickoff status`), sees `no .kickoff/ folder`, and routes to `kickoff:init`.
- It does not start discovery or ask vision or scope questions before init has created `.kickoff/project.yaml`.
- The first interview question is an `init` question (one question per message), not a discovery question.

Fail: the agent starts discovery, writes documents, or creates `.kickoff/` files by hand instead of through `kickoff init --name`.

## Results

Not run yet: the baseline and installed-plugin runs are pending.
