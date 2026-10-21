# Kickoff and ECC

ECC (the `ecc@ecc` plugin, 2.2.3 or later) is a required companion of kickoff. `kickoff ecc doctor` checks that it is installed, recent enough, and has every component listed here. Every skill that uses ECC names the component in its own step and points to this file.

## Ownership

**Kickoff owns. ECC works.**

- Kickoff alone writes gates, `.kickoff/*`, IDs, the files under `docs_root`, the plan, the schedule and the tickets.
- ECC components produce research, options, verdicts, drafts and reviews. A kickoff skill reads that output and writes it into kickoff files, with kickoff IDs.
- An ECC report or verdict that supports a gate is saved under `docs_root` and cited in `--evidence`.

These ECC skills write their own artefacts in their own places, so they are **never used to write a kickoff artefact**:

| ECC skill | Writes | Use instead |
| --- | --- | --- |
| `architecture-decision-records` | `docs/adr/` | the kickoff ADR template in `<docs_root>/04-architecture/adr/` |
| `plan-prd`, `prp-prd` | `.claude/prds/`, `.claude/PRPs/` | `kickoff:discovery`, `kickoff:feature-map` |
| `blueprint`, `plan-orchestrate` | `plans/`, chain prompts | `kickoff:plan` |
| `product-lens` (as a writer) | `PRODUCT-BRIEF.md` | its diagnostics as a lens in `kickoff:discovery` |
| `product-capability` | `PRODUCT.md` | `kickoff:feature-map` |
| `epic-decompose` | issue bodies | `kickoff tickets push` |

## How to call ECC

- **Skills:** use the Skill tool, for example `ecc:council`.
- **Agents:** use the Agent tool with `subagent_type` set to the agent, for example `ecc:architect`. Give the agent the file paths and IDs it needs, not the whole conversation.
- **ECC scripts:** only through `kickoff ecc run <script> -- <args>`. The ECC `epic-*` commands call `node scripts/github-coordination.js` relative to the current folder, which only works inside the ECC repository.
- **ECC files** (for example a skill an agent must read): get the folder with `kickoff ecc root`, never from a hard-coded plugin cache path.

## Gates do not merge

ECC's own approvals do not approve a kickoff gate. That includes the plan approval and the commit confirmation of the `orch-*` pipeline, and an ADR confirmation. A kickoff gate still needs `kickoff gate approve <id> --by "<role>" --evidence "<link>"` after an explicit yes from the approver.

## GateGuard and the router

- **GateGuard** (ECC's fact-forcing gate) asks for facts before the first write of a file and before the first shell command of a session. Answer its questions.
  - `kickoff ecc setup` exempts `.kickoff/**`, `<docs_root>/**` and `AGENTS.md` in the project's `.claude/settings.json`.
  - Never set `ECC_GATEGUARD=off` or disable the hook on the lead's behalf.
- **ecc-router.** Inside a repository with `.kickoff/`, `kickoff status` decides the next step, and a router hint never overrides it. `kickoff ecc setup --router` adds the kickoff route to the router table. It writes outside the repository, so ask the lead first.

## Delegation table

| Phase, step | ECC component | Given | Returns | Kickoff writes it to |
| --- | --- | --- | --- | --- |
| discovery, before C1 | `ecc:product-lens` (diagnostics only) | the draft `vision-scope.md` | gaps in the why, the user, the wedge, the success measure | `Q<n>` rows in `open-questions.md` |
| research, step 3 | `ecc:search-first` (always), `ecc:deep-research` (when its firecrawl or exa MCP server is connected) | each technical unknown | existing tools, vendors and sources | the validation plan and the ADR Context, with cited sources |
| research, step 3 | `ecc:council` | a decision whose options stay close on cost and risk | a verdict with dissent | the ADR "Alternatives considered" |
| fe-foundation, step 2 | `ecc:search-first`, `ecc:council` | a library choice or a close call | candidates with licence and maintenance; a verdict | the presentation ADR |
| fe-foundation, steps 5–6 | `ecc:contract-first`, `ecc:react-patterns`, `ecc:vite-patterns`, `ecc:react-testing` | the entities, the reference screens | patterns, contract shape, tests | `packages/mocks`, `apps/web` |
| prototype, step 6 | `ecc:react-patterns`, `ecc:react-testing`, `ecc:frontend-a11y`, `ecc:make-interfaces-feel-better`, `ecc:motion-foundations` | each screen group | code patterns, tests, accessibility and polish rules | the screens |
| prototype, step 7 | `ecc:react-reviewer` agent (read-only) | the changed files of a screen group | findings by severity | fixes, or rulings |
| prototype, step 10 | `ecc:ui-demo` | the scenarios | walkthrough videos | the workshop pack |
| ux-design step 8, prototype step 9 | the `kickoff:` review agents; the craft auditor reads `ecc:accessibility` and `ecc:frontend-a11y` | the brief and the screenshots | reports, cross-reviews, an upgrade plan | the review folder |
| solution, steps 2–3 | `ecc:architect` agent | one decision, its forces (F, NFR, A, V IDs) and constraints | 2–3 options with cost, risk, what each blocks | the Option decision table, then the ADR |
| solution, step 3 | `ecc:council` | a tie between options | a verdict with dissent | the ADR |
| solution, before C5 | `ecc:security-reviewer` and `ecc:database-reviewer` agents (read-only, in parallel) | `system-architecture.md`, `data-model.md`, `project.yaml` `security`, `nfr.md` | findings ranked P1–P3 | `<docs_root>/04-architecture/reviews/`, cited in the C5 evidence |
| plan, `kickoff schedule` exit 3 | `ecc:council` | the `cut_order` options | a verdict with dissent | the options shown to the lead |
| plan, before C6 | `ecc:planner` agent (read-only review) | the WBS, the signed-off features, the architecture | missing work | WBS changes or rulings |

## After tickets

Kickoff stops at tickets. Build, review, QA and release are ECC's: the `orch-*` operations work from the ticket text. Never use `plan-orchestrate`: its output calls ECC's `/orchestrate` command, which ECC no longer loads.
