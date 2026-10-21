---
name: using-kickoff
description: Use when starting or resuming project-kickoff work in a repository — discovery, scope, prototype, customer sign-off, plan, tickets — or when the user asks where the project stands or what comes next
---

# Using kickoff

The router of the kickoff workflow. It checks the tools, reads the project state with the `kickoff` CLI, enforces the gates and hands over to the phase skill that comes next. The CLI decides what may start; the conversation does not.

## Core principle

> Lock the MVP scope, but lock the **full** feature set with the customer first, using a clickable prototype of the final product, built as the real frontend (FE v0) on a mock data layer. Only then design the database, backend technology, architecture and design patterns. Features built after that rarely expand in scope or need refactoring because of late customer feedback.

**One exception:** the presentation stack (frontend framework, UI and CSS libraries, frontend tooling) is decided in `kickoff:fe-foundation`, recorded as *Accepted* ADRs and approved with gate CF, because the FE v0 is built on it. The mock data layer stands in for every backend decision.

**Hard gate:** never design the database, system architecture, backend technology, hosting, integrations or design patterns before C3 (customer signed off the full feature set) and C4 (MVP locked) are approved. Before any such work, run `kickoff can solution`. Exit 1 means stop: name the missing gates and propose the path to them (prototype, then the sign-off workshop). No deadline, customer delay or "rough draft" framing changes this.

## Start-up checks

Run these in order at the start of every session:

1. **CLI version.** Run `kickoff --version` (it prints `kickoff <version>`). The plugin root is two levels above this skill's base directory; read `"version"` in `<plugin root>/.claude-plugin/plugin.json`. If the command is missing or the versions differ, run `uv tool install --force "<plugin root>/cli"` and check again. The CLI must be reinstalled after every plugin update. If the versions still differ, stop and show both outputs.
2. **ECC.** Run `kickoff ecc doctor`. Exit 1: stop, show its `fail:` lines and tell the user: "Install or update the ECC plugin (`ecc@ecc` 2.2.3 or later), then start a new session." ECC is required: kickoff delegates research, decisions and reviews to it (`references/ecc.md`). Read its `warn:` lines: D5 means `kickoff ecc setup` has not run in this project; offer it.
3. **Project.** Run `kickoff status`. If it fails with `no .kickoff/ folder`, the repository is not set up: invoke `kickoff:init`. `kickoff init` is the only command that works without `.kickoff/`.

## Route

Report `kickoff status` to the user in two or three lines: stale phases first, then phases done, then open gates. Then act on its `Next:` line:

| `Next:` says | Do |
| --- | --- |
| `continue kickoff:<phase>`, `run kickoff:<phase>` or `re-run kickoff:<phase>` | Invoke that skill. |
| `approve gate <id> ...` | Ask the approver (table below) for the decision and the evidence (a commit or record link). Run `kickoff gate approve <id> --by "<role>" --evidence "<link>"` only after an explicit yes. Never approve a gate on anyone's behalf. |
| `tracking: ...` | Invoke `kickoff:tickets` in sync mode, or `kickoff:feedback` when customer feedback has arrived. |

When the user asks for a specific phase instead of the next one:

1. Run `kickoff can <phase>` (`kickoff can plan --baseline` for a baseline plan).
2. Exit 0: invoke `kickoff:<phase>`.
3. Exit 1: show the `blocked:` lines, do not start the phase or do its work informally, and propose the path that clears the blockers.

Customer feedback is handled by `kickoff:feedback` (check it with `kickoff can feedback`). It is not a phase in `kickoff status`: it reopens C3 and marks later phases stale.

**Stale phases first.** After a gate is reopened, `kickoff status` marks later phases `(stale)`. Re-run them in phase order before any work that depends on them. With `plan` and `tickets` stale, "push the tickets" means: re-run `kickoff:plan`, then `kickoff:tickets`.

## Phases and gates

| # | Phase (skill) | May start when | Outputs | Gate to leave | Approver |
| --- | --- | --- | --- | --- | --- |
| 0 | `kickoff:init` | no `.kickoff/` yet | `project.yaml`, folder skeleton, `AGENTS.md` | — | — |
| 1 | `kickoff:discovery` | init done | `vision-scope.md`, `stakeholders.md`, `open-questions.md`, decision log | C1 Vision | Project lead |
| 2 | `kickoff:research` | discovery done, C1 | validation plan, ADRs *Proposed*, assumptions and constraints | — (runs alongside 3) | — |
| 3 | `kickoff:feature-map` | discovery done, C1 | `features.yaml` → `feature-map.md`, `nfr.md` | C2 Draft scope | Project lead |
| 4 | `kickoff:ux-design` | feature-map done, C2 | `ux-spec.md`, `design-system.md` | — | — |
| 5 | `kickoff:fe-foundation` | ux-design done, C2 | presentation-stack ADRs *Accepted*, the FE v0 monorepo (`kickoff fe new`), tokens, shells, mock contract, reference screens | CF Frontend foundation | Project lead |
| 6 | `kickoff:prototype` | fe-foundation done, CF | every screen built in the FE v0, scenarios, clean `kickoff fe check`, link in `state.yaml` | `fe check` passes | — |
| 7 | `kickoff:signoff` | prototype done | workshop pack, sign-off record | C3 Features signed off; C4 MVP locked | Customer; lead and customer |
| ↺ | `kickoff:feedback` | prototype done | classified feedback, updates along the chain | reopens C3 | Project lead approves the classification |
| 8 | `kickoff:solution` | signoff done, C3 and C4 | architecture, data model, technology, patterns; ADRs *Accepted* | C5 Solution | Project lead |
| 9 | `kickoff:plan` | draft: feature-map done, C2; baseline: solution done, C5 | `plan.yaml` → schedule, estimate workbook, `wbs.md`, `plan.md`, `risk-register.md` | C6 Baseline | Project lead |
| 10 | `kickoff:tickets` | plan done | issues in the tracker, pulled state in `tickets.yaml` | — (repeats) | — |

Gate rules:

- `kickoff can <phase>` is checked before any phase starts; exit 1 lists the blocking phases and gates.
- A gate is approved only with `--by` (the approving role) and `--evidence` (a link to the record or commit). C4 needs C3; C6 needs C5.
- Reopening a gate (`kickoff gate reopen <id> --reason "<why>"`) marks every later phase that was done as stale. A stale phase blocks the phases that depend on it until it is re-run; re-running it (`kickoff phase done <phase>`) removes the gates that follow it, so they are approved again.
- Every phase ends with the Verify method: the commands in the skill's Verify section, then `kickoff phase done <phase>` and a Conventional Commit.

## Working methods and references

- `references/methods.md`: the six working methods every phase skill uses by name: Interview, Bounded approval, Option decision, Build plan, Task run, Verify.
- `references/conventions.md`: languages, estimates, role-based owners, forbidden phrases, synthetic data, actions to confirm first, rulings, IDs, files, CLI exit codes, commits.
- `references/lessons.md`: the lessons from earlier projects and which skill applies each one.
- `references/ecc.md`: how kickoff uses ECC. Kickoff owns gates, state, IDs and files; ECC components do research, options and reviews. It also covers which ECC writers are never used, GateGuard, the router, and the delegation table.

Read `conventions.md` before writing any project file. Write files with the file tools, never with shell heredocs.

## Red flags

| Thought or request | Do instead |
| --- | --- |
| "The customer is busy, let's design the DB now" | C3 and C4 first: run `kickoff can solution`, name the missing gates, propose the sign-off path. |
| "I'll just tweak the plan dates by hand" | Edit `plan.yaml` (effort, dependencies, schedule mode), run `kickoff validate`, then `kickoff schedule`; report the gate dates it prints and the hard date. Never state a date `kickoff schedule` did not print. |
| "I'll create the issues manually" | `kickoff tickets push` (after `kickoff tickets push --dry` and the lead's yes). |
| "Small change, no need to re-run the chain" | Use `kickoff:feedback`: `features.yaml` → `ux-spec.md` → prototype → `plan.yaml` → `kickoff schedule`, in that order. |
| "The lead said OK in chat, I'll approve the gate" | Ask for the evidence link and the role, then `kickoff gate approve <id> --by "<role>" --evidence "<link>"`; no evidence, no gate. |
| "The phase is stale but this is urgent" | Re-run the stale phase first; `kickoff can <phase>` blocks the dependent phase anyway. |
| "I'll note that the prototype differs from the product" | Follow the fidelity rule of `kickoff:prototype`: the FE v0 is the product's UI code; build what the product shows (site shell, bare screens, route parameters); customers see only the real product chrome in their language. |
| "No browser here, the prototype check is fine" | Exit 4 means skipped: report it as skipped, never as passed. |
| "Just a rough architecture sketch to unblock the devs" | That is solution work: `kickoff can solution` first. |
| "ECC has `/plan-prd`, `blueprint` or an ADR skill for this" | The kickoff phase writes the artefact; use ECC only as `references/ecc.md` lists. |
| "The router hint says to route this to another skill" | Inside a kickoff project, `kickoff status` decides the next step. |
| "GateGuard is in the way; turn it off" | Answer its facts. `kickoff ecc setup` exempts kickoff documents; never disable the gate on the lead's behalf. |
| "The hook refused my edit of `state.yaml`" | Use the CLI: `kickoff phase`, `kickoff gate` or `kickoff fe record`. |
