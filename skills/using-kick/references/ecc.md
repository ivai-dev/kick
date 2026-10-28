# kick and ECC

ECC (the `ecc@ecc` plugin, 2.2.3 or later) is the one required companion. `kick doctor` checks that it is installed, recent enough and has every part listed here.

## Who owns what

- **kick owns** the flow, the agreements and the files under `docs/kick/`.
- **ECC works:** research, options, reviews, tests, code and commits. A kick skill reads what ECC returns and writes it into the kick's pages in plain words.
- ECC skills that write their own planning files in their own places (a PRD, a blueprint, an ADR folder) are not used to write kick's pages. A team that wants ADRs too may export the decisions afterwards.

## How to call ECC

- **Skills:** the Skill tool, for example `ecc:council`.
- **Agents:** the Agent tool with `subagent_type`, for example `ecc:architect`. Give it the file paths it needs, not the whole conversation.
- Never use ECC's plan-orchestrate: its output calls a command ECC no longer loads.

## By step

| Step | ECC part | Given | Returns | kick writes it to |
| --- | --- | --- | --- | --- |
| start (running repo) | `ecc:codebase-onboarding` or the `ecc:code-explorer` agent | the repository | what exists, the stack, the structure | `docs/kick/project/` pages |
| understand | `ecc:product-lens` (its diagnostics only) | the draft brief | gaps in the why, the user, the success measure | unclear markers in `brief.md` |
| understand, shape | `ecc:search-first`; `ecc:deep-research` when its search server is connected | each unknown | existing tools and sources | the brief or the design, with sources |
| shape | the `ecc:architect` agent | one decision, the brief, the constraints | 2–3 options with cost and risk | Options considered, then Decisions in `design.md` |
| shape | `ecc:council` | a close call | a verdict with dissent | the decision's "why" |
| shape (module or product) | the `ecc:security-reviewer` and `ecc:database-reviewer` agents | the design | findings ranked P1–P3 | `<kick>/reviews/` and the design |
| shape (no UI) | `ecc:api-design`, `ecc:contract-first` | the brief | the contract | `docs/kick/project/api.md` |
| plan | the `ecc:planner` agent (read-only review) | the task table, the brief, the design | missing work | the task table |
| build | `ecc:orch-add-feature`, `ecc:orch-change-feature`, `ecc:orch-fix-defect`, `ecc:tdd-workflow` | one task: its done-when, the brief, the design | code, tests, a commit | the task's status in `tasks.md` |
| build | `ecc:contract-first`, `ecc:e2e-testing` | the endpoints, the journeys | contract tests, journey tests | `api.md` status |
| build | the `ecc:code-reviewer` agent | the diff | findings | fixes |

## ECC's approvals are not kick's agreements

The `orch-*` pipelines ask for their own plan approval and commit confirmation. Those approve ECC's work on one task. kick's agreements (understood, shape, plan, the result) are asked separately, in plain words, and recorded in `kick.yaml`.

## GateGuard and the router

- **GateGuard** (ECC's fact-forcing hook) asks for facts before the first write of a file and before the first shell command of a session. Answer its questions. `kick setup` exempts `docs/kick/**` in the project's `.claude/settings.json`; ask before running it. Never turn GateGuard off for the person.
- **ecc-router.** Inside a project with `docs/kick/`, the next step comes from `kick status`. A one-line fix still goes straight to ECC.
