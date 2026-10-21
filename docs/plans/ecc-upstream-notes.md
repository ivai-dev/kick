# ECC upstream notes (2.2.3)

Defects found while integrating kickoff 0.4.0 with ECC 2.2.3 (commit `ef648e0`). Kickoff works around each one. These are issue texts to file upstream at https://github.com/affaan-m/ECC after kickoff 0.4.0 ships (lead decision L-3); nothing has been filed yet.

## 1. `plan-orchestrate` emits a command that is no longer loaded

- **Where:** `skills/plan-orchestrate/SKILL.md`. It emits one `/orchestrate custom ...` prompt per plan step.
- **Problem:** the `orchestrate` command exists only in `legacy-command-shims/`, which the plugin does not load. A user who pastes the emitted line gets an unknown command.
- **Expected:** the skill emits invocations of loaded commands (for example the `orch-*` operations), or the shim is loaded again.
- **Kickoff workaround:** kickoff never uses `plan-orchestrate`; its ticket handoff (0.6.0) writes `orch-*` invocations itself.

## 2. `epic-*` commands call a script path relative to the current folder

- **Where:** `commands/epic-claim.md`, `epic-decompose.md`, `epic-publish.md`, `epic-review.md`, `epic-sync.md` (and the other `epic-*` commands). They run `node scripts/github-coordination.js ...`.
- **Problem:** the path is relative to the current folder. In a user's repository it does not exist, so every `epic-*` command fails outside the ECC repository.
- **Expected:** the commands use `${CLAUDE_PLUGIN_ROOT}/scripts/github-coordination.js`.
- **Kickoff workaround:** `kickoff ecc run github-coordination -- <args>` runs the script from the installed ECC folder, with the project as the current folder.

## 3. `architecture-decision-records` hard-codes `docs/adr/`

- **Where:** `skills/architecture-decision-records/SKILL.md`, steps 1 and 6–8.
- **Problem:** projects that keep ADRs elsewhere (kickoff uses `<docs_root>/04-architecture/adr/`) cannot use the skill without a second, competing ADR folder.
- **Expected:** the skill reads the ADR folder from the project (an existing ADR index, or a setting) before it falls back to `docs/adr/`.
- **Kickoff workaround:** kickoff writes ADRs with its own template and does not use this skill.
