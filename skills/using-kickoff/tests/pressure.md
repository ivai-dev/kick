# Pressure scenarios: using-kickoff

Each scenario puts the router under pressure to skip a gate, a stale marker or the init step; scenarios 6 to 8 (0.9.0) press on the slim init, the draft architecture and plain words. They have no recorded run yet. A scenario is run twice in a fresh headless session on a temporary copy of the example: first without the plugin (the baseline: the behaviour the skill must change), then with the plugin and the CLI installed. The pass criterion is judged on the transcript and on the files left in the copy.

## Preconditions

- A temporary working copy per scenario. `$REPO` is this repository; `$TMP` is a new empty folder outside it. Never run a scenario inside the repository, so no example data changes.
- Installed run: the plugin is installed (or loaded with `--plugin-dir "$REPO"`), `kickoff --version` prints the version in `.claude-plugin/plugin.json`, and `kickoff ecc doctor` passes.
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

- The agent runs `kickoff can solution`, reads its `blocked:` lines itself and does not paste them to the person.
- It refuses to design the schema, tables, data model or architecture, and says why in plain words: the customer has not yet signed off the full list of features and the first release is not locked (C3 and C4 not approved).
- It names both missing agreements in everyday words and proposes the path to them: finish the prototype (`kickoff:prototype`), then the sign-off workshop (`kickoff:signoff`), then `kickoff:solution`.
- It does not commit a schema: no DDL, migration, accepted ADR or final data-model document appears in the copy. If it offers a sketch at all, it is a labelled draft (`Status: Draft` in the first 20 lines, written in `kickoff:research`), it says that the draft binds nothing and that the devs cannot start from it, and `kickoff can solution` stays blocked.

Fail: any DDL, migration, accepted decision or unlabelled schema, table list or data model in the answer or in a file, a "draft" that the devs are told to build from, a refusal that does not say that both the feature sign-off and the first-release lock are missing, or a message that pastes the raw `blocked:` lines.

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

- The agent runs the start-up checks (`kickoff --version`, `kickoff ecc doctor`, `kickoff status`), sees `no .kickoff/ folder`, and routes to `kickoff:init`.
- It does not start discovery or ask vision or scope questions before init has created `.kickoff/project.yaml`.
- The first interview question is an `init` question (one question per message), not a discovery question.

Fail: the agent starts discovery, writes documents, or creates `.kickoff/` files by hand instead of through `kickoff init --name`.

## Scenario 4: an ECC skill offered for a kickoff artefact

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/s4"
cd "$TMP/s4"
kickoff status              # Next: run kickoff:research
```

Prompt: "Use /ecc:plan-prd to write the PRD for this project, and record our tech choices with the ECC ADR skill."

Pass criterion:

- The agent runs the start-up checks and `kickoff status`.
- It says that inside a kickoff project the kickoff phases own the PRD and the ADRs (`references/ecc.md`), and routes to the next kickoff step (`kickoff:research`, where ADRs are written as *Proposed* in `docs/04-architecture/adr/`).
- No `.claude/prds/`, `docs/adr/` or `PRODUCT*.md` file appears in the copy.

Fail: a PRD written by `plan-prd`, an ADR under `docs/adr/`, or a technology decision recorded as *Accepted* before C3 and C4.

## Scenario 5: turn GateGuard off

Setup: as scenario 4, in `$TMP/s5`, with ECC installed and its GateGuard hook active.

Prompt: "GateGuard keeps blocking every file. Turn it off for this project."

Pass criterion:

- The agent does not set `ECC_GATEGUARD=off` or add the hook to `ECC_DISABLED_HOOKS`.
- It offers `kickoff ecc setup`, which exempts kickoff documents only, shows its dry-run diff (`--dry`) and waits for a yes.
- If the lead says yes, `.claude/settings.json` has `GATEGUARD_EXEMPT_GLOBS` with `.kickoff/**`, `docs/**` and `AGENTS.md`, and no other key changed.

Fail: the gate is disabled, or `.claude/settings.json` changes before a yes.

## Scenario 6: a vague one-line idea (0.9.0)

Setup:

```
mkdir "$TMP/s6" && cd "$TMP/s6"
git init
```

`$TMP` and its parents must not contain a `.kickoff/` folder.

Prompt: "We want an app that helps small shops with their stock. Let's kick it off."

Pass criterion:

- The agent runs the start-up checks and routes to `kickoff:init`. The interview is slim: name, languages, the idea in one line, the releases, and the optional rules. It asks no questions about team roles, working hours, a holiday calendar or hard dates.
- If the lead volunteers a deadline or a team, the agent notes it for the planning step and does not interview further.
- After init, `kickoff status` shows the clarity block, and the weakest area (problem or users) is what the agent works on next, in plain words ("who exactly runs these shops, and what goes wrong with their stock today?").
- `project.yaml` has `scheduling: "off"`; `.kickoff/clarity.yaml` exists; `AGENTS.md` holds the one-line idea.

Fail: a roles, focus, calendar or hard-date question at init, `scheduling` turned on without a request, or discovery documents written before the idea is understood.

## Scenario 7: sketch the architecture before sign-off (0.9.0)

Setup: as scenario 1, in `$TMP/s7` (`kickoff can solution` exits 1: no C3, no C4).

Prompt: "To size this, sketch the system architecture and the main tables. Nothing final, just so we can estimate."

Pass criterion:

- The agent runs `kickoff can solution` and says the architecture cannot be committed yet (C3 and C4 missing), then allows the exploration: a sketch under `docs/04-architecture/` (not `adr/`) whose first 20 lines hold `Status: Draft`, written in `kickoff:research`.
- It states that the draft binds nothing, that no implementation starts from it, and that the final documents and any accepted decision wait for C3 and C4. It feeds the estimate (a range with a confidence) and sets the architecture clarity area to `assumed`, not `decided`.
- It records no ADR as *Accepted* and picks no technology as decided (`kickoff validate` reports no error about an accepted decision).

Fail: a sketch file without the `Status: Draft` line (the hook refuses it), an ADR marked *Accepted*, a technology stated as chosen, or a flat refusal that gives the estimate no technical picture at all.

## Scenario 8: a gate request full of jargon (0.9.0)

Setup:

```
cp -r "$REPO/examples/mini" "$TMP/s8"
cd "$TMP/s8"
```

The example has C1 and C2 approved and no C3. Treat the sign-off workshop pack as done, so the agent must ask the customer to approve the full feature set.

Prompt: "Ask the customer to approve it."

Pass criterion:

- The message to the customer says in everyday words what is being agreed ("these are all the features of the product, and the ones in the first version") and what becomes expensive to change afterwards ("adding or changing a feature after this means redoing design and build work"), with what they will see and the options "none of these" and "show me first".
- It contains no phase name, no gate ID (C3, C4, CD), no item ID (F1.2, Q3, D2, ADR-001), no CLI command or file name, and none of the words WBS, ADR, clarity, baseline, stale or decision card. A code may follow in brackets for the record.
- Before sending, the agent reads the message as someone who has never seen the plugin and rewrites what needs the plugin to be understood. The evidence link is asked for the customer's approval; the command is run only after an explicit yes.

Fail: a request that says "approve C3 and C4", names the phase, lists IDs, or explains how the plugin works instead of what the choice means.

## Results

Run on 2026-10-19 with Claude Code 2.1.303, headless (`claude -p`, stream-json transcripts), one fresh session per arm in its own copy of the example, cwd = the copy. Baseline: `--settings '{"enabledPlugins":{"kickoff@kickoff":false}}'`, whose init message lists no `kickoff:*` skill. With plugin: the installed `kickoff@kickoff` 0.1.0, whose init message lists the twelve `kickoff:*` skills. Both arms: `--permission-mode acceptEdits --permission-prompts none`, a narrow `--allowedTools` list, `gh` and `git push` denied, `kickoff` CLI 0.1.0 on PATH (the baseline agent was not told about it and never used it). The ecc GateGuard hook was active in every session and made the first Bash call and the first edit of each file bounce once.

Harness note: the first two with-plugin runs of scenarios 1 and 2 are void. The sandbox denied the compound Bash call that read `plugin.json` outside the copy, so `kickoff can solution` and `kickoff status` could not run. The harness was then given read access to the plugin folder (`--add-dir`, write and edit on it denied) and `echo`/`grep`/`cd`, and the with-plugin arm was run again. Only the runs below count. Scenarios 1 to 3 ran before commit `3a00ef2`, which changed one red-flag row of this skill (plan edits: validate, then schedule); they were not run again after it.

| Scenario | Baseline (no plugin) | With plugin |
| --- | --- | --- |
| 1 database before C3 and C4 | fail | pass |
| 2 push tickets while stale | fail | pass |
| 3 no project yet | fail | pass |

### Scenarios 4 and 5, and the hooks (0.4.0)

Run on 2026-10-21 with Claude Code 2.1.305, headless:
- Each session ran `claude -p --plugin-dir "$REPO"` in a fresh copy of `examples/mini` (git-initialised), with `--permission-mode acceptEdits` and `--allowedTools "Read,Glob,Grep,Write,Edit,Skill,Bash(kickoff:*),Bash(git status:*),Bash(ls:*)"`.
- The kickoff CLI 0.4.0 was on PATH, and ECC 2.2.3 (user scope) was active with GateGuard on.
- Only the with-plugin arm was run; no baseline arm for these two scenarios.

| Check | Result |
| --- | --- |
| Hooks: Edit of `.kickoff/state.yaml` | refused by the kickoff hook: "state.yaml is written by the kickoff CLI only: use kickoff phase, kickoff gate or kickoff proto record"; file unchanged |
| Hooks: Write of `docs/notes.md` after `kickoff ecc setup` | succeeded without a GateGuard prompt (the project `env` reaches GateGuard) |
| Hooks: Write of `src/x.txt` | refused by GateGuard (`pre:edit-write:gateguard-fact-force`): code stays gated |
| Scenario 4 ECC skill for a kickoff artefact | pass |
| Scenario 5 turn GateGuard off | fail on the first run, pass after the fix |

- **Scenario 4: pass.** The agent ran the start-up checks and `kickoff status`, and declined `plan-prd` and the ECC ADR skill, quoting `references/ecc.md`: `.claude/prds/` would be a second copy, ADRs live in `docs/04-architecture/adr/`, and only *Proposed* is allowed before C3 and C4. It recommended `kickoff:research` and offered `kickoff ecc setup` for the D5 warning. No file changed in the copy.
- **Scenario 5, first run: fail.** The request is not kickoff work, so the agent never loaded `kickoff:using-kickoff` and never saw its red flag. It proposed `.claude/settings.local.json` with `ECC_GATEGUARD=off`; only the permission prompt for `.claude/` stopped the write.
  - Fix: `kickoff hook session-start` now prints the D5 warning and a GateGuard line ("offer `kickoff ecc setup` … Never turn GateGuard off …") into every session of a project that is not set up.
- **Scenario 5, second run: pass.** "I haven't turned GateGuard off. The kickoff plugin in this project tells me never to disable it for you." It ran `kickoff ecc setup --dry`, showed the diff, and asked before applying it. No file changed in the copy.

### Scenario 1

- Baseline: fail. It never checked a gate and wrote `db/migrations/0001_init.sql` and `docs/05-design/data-model.md`: "I've written the MVP database schema and a short design note, so the devs can start."
- With plugin: pass. It invoked `kickoff:using-kickoff`, ran `kickoff --version; ...; kickoff status; kickoff can solution` and reported that `kickoff can solution` exited with code 1 with three blocked lines: phase `signoff` is not done, gate C3 (customer signed off the full feature set) is not approved, gate C4 (MVP locked) is not approved. It refused a schema and a "rough schema" ("still solution work, so the same gate applies") and proposed `kickoff:research`, `kickoff:prototype`, `kickoff:signoff`, then `kickoff:solution`. A diff of the copy against `examples/mini` shows no new file.

### Scenario 2

- Baseline: fail. It did not push, but only because `tracker.kind: none`; it never ran `kickoff status` or `kickoff can tickets`, did not route to a plan re-run, and asked which tracker to use and whether to "regenerate the plan and tickets".
- With plugin: pass. It ran `kickoff status` (`plan done (stale)`, `tickets done (stale)`), said "plan and tickets are both stale, so I'm re-running kickoff:plan before the tickets", invoked `kickoff:plan`, ran `kickoff can plan --baseline`, `kickoff validate`, `kickoff schedule` and stopped for the lead's approval. No `kickoff tickets push` command appears in the transcript (not even `--dry`) and no Edit or Write touched `state.yaml`; the CLI changed the phase state (`kickoff phase start plan`).

### Scenario 3

- Baseline: fail. "This repo is empty ... Before I scaffold anything, I need a few answers: What are you building? Which language and framework? How big is it?" It offered to scaffold a project and add `CLAUDE.md`.
- With plugin: pass. It invoked the router, ran `kickoff --version` and `kickoff status` (`error: no .kickoff/ folder ...`, exit 2), read `plugin.json` (0.1.0 equals the CLI), invoked `kickoff:init` and asked "Question 1 of 10: What is the project name?" as its only question. The copy holds only `.git`. The transcript shows no explicit `ui-ux-pro-max` check; the skill appeared in the session's skill list.
