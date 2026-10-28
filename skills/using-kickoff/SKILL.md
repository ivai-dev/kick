---
name: using-kickoff
description: Use when starting or resuming project-kickoff work in a repository — discovery, scope, design concept, prototype, customer sign-off, WBS and estimate — or when the user asks where the project stands or what comes next
---

# Using kickoff

The router of the kickoff workflow. It checks the tools, reads the project state with the `kickoff` CLI, enforces the gates and hands over to the phase skill that comes next. The CLI decides what may start; the conversation does not.

Kickoff holds process and design philosophy, no stack and no design values: it runs for a web tool, a game, a mobile or desktop app and a service alike. The project decides its own tools and its own design rules and writes them down.

## Core principle

> Commit late, explore early. Lock the MVP scope, but lock the **full** feature set with the customer first, using a clickable or experienceable prototype of the final product, built with whatever tools suit the product. Only then *commit* the database, backend technology, architecture and design patterns. Features built after that rarely expand in scope or need refactoring because of late customer feedback. Before that, architecture may be *explored* as labelled drafts that test feasibility and feed the estimate; a draft binds nothing.

The prototype tooling (a code framework, a design tool, a game engine) is chosen in the `prototype` phase and recorded as an ADR. It decides no backend matter: the prototype's data is mock data, and every backend decision waits for the solution phase.

**Clarity before ceremony:** the project keeps a clarity register (`.kickoff/clarity.yaml`: problem, users, scope, solution, architecture, design, estimate; each `open`, `assumed`, `decided` or `validated`, with a confidence). It shows what is still unclear; work on the weakest area next. Estimates are ranges with a confidence and a basis, never a single number.

**Plain words:** the person you talk to has not seen this plugin. Every question, confirmation and gate request addressed to them is in everyday words: what is being agreed and what it makes expensive to change, with no phase names, gate IDs, item IDs, commands, file names or terms such as WBS, ADR, clarity, baseline or stale; the code may follow in brackets for the record. See `references/methods.md`, "Plain words", and `references/conventions.md`, "Talking to the person".

**Structure and feel are the customer's:** the customer chooses the shape of the product (flow, structure, interaction model, pace, tone, look) in `kickoff:design-concept`, from two or three concepts that differ in kind, and approves it with gate CD before the spec is expanded. Never take a concept from a catalogue lookup, a template default or another project's rules. Every design choice and every gate request is shown as a decision card (`references/methods.md`), so nobody confirms blind. Philosophy: `references/design-philosophy.md`.

**Hard gate:** never *commit* the database, system architecture, backend technology, hosting, integrations or design patterns before C3 (customer signed off the full feature set) and C4 (MVP locked) are approved: no *Accepted* ADR, no final architecture document, no backend technology decision, no implementation started from a sketch. Before any such work, run `kickoff can solution`. Exit 1 means stop: name the missing gates and propose the path to them (prototype, then the sign-off workshop). No deadline or customer delay changes this.

**Exploring is allowed:** `kickoff:research` may write an architecture sketch under `<docs_root>/04-architecture/` (not `adr/`) when the file carries a `Status: Draft` line in its first 20 lines (for example `- **Status:** Draft (hypothesis)`). The hook refuses such a file without that line before C3 and C4, and `kickoff validate` reports an ADR marked *Accepted* before them. A draft tests feasibility and feeds the estimate; it binds nothing, and no implementation starts from it. `kickoff:solution` turns it into the accepted documents after C3 and C4.

## Start-up checks

Run these in order at the start of every session:

1. **CLI version.** Run `kickoff --version` (it prints `kickoff <version>`). The plugin root is two levels above this skill's base directory; read `"version"` in `<plugin root>/.claude-plugin/plugin.json`. If the command is missing or the versions differ, run `uv tool install --force "<plugin root>/cli"` and check again. The CLI must be reinstalled after every plugin update. If the versions still differ, stop and show both outputs.
2. **ECC.** Run `kickoff ecc doctor`. Exit 1: stop, show its `fail:` lines and tell the user: "Install or update the ECC plugin (`ecc@ecc` 2.2.3 or later), then start a new session." ECC is required: kickoff delegates research, decisions and reviews to it (`references/ecc.md`). Read its `warn:` lines: D5 means `kickoff ecc setup` has not run in this project; offer it.
3. **Project.** Run `kickoff status`. If it fails with `no .kickoff/ folder`, the repository is not set up: invoke `kickoff:init`. `kickoff init` is the only command that works without `.kickoff/`. A product folder inside another project's repository may hold its own `.kickoff/` (`kickoff init --nested`); the nearest one wins, so check which project `kickoff status` reports before acting, and use `--root` for the other.

## Route

Route by clarity first, then by phase. Clarity says what to work on next; the phases say what may start.

1. Read the `Clarity:` block of `kickoff status` and its `Weakest: <area> ...` line (the lowest status, then the lowest confidence), and tell the user in plain words what is still unclear and what you will work on next. The block is shown only when `.kickoff/clarity.yaml` exists; in an older project offer `kickoff clarity init`. When the user gives no direction, work on the weakest area, in the phase that owns it. A phase that finishes sets the areas it touched (`kickoff clarity set AREA --status S --confidence C --note "..." --ref ID`); `kickoff clarity` shows the register.
2. Report the rest of `kickoff status` in two or three lines: stale phases first, then phases done, then open gates. A phase shown as `skipped (…)` was done under an earlier kickoff version and needs no action. Then act on its `Next:` line:

| `Next:` says | Do |
| --- | --- |
| `continue kickoff:<phase>`, `run kickoff:<phase>` or `re-run kickoff:<phase>` | Invoke that skill. When it lists several phases (`continue kickoff:research and kickoff:feature-map`), they run side by side: take the one that serves the weakest clarity area. |
| `approve gate <id> ...` | Ask the approver (table below) for the decision in plain words, using a decision card: what is being agreed and what it makes expensive to change, not the gate ID or the phase name (the ID may follow in brackets). The customer's gates (CD, C3, C4) need the evidence too (a commit or record link): `kickoff gate approve <id> --by "<role>" --evidence "<link>"`. The project lead's gates (C1, C2, C5, C6) need none: `kickoff gate approve C1 --by "Project lead"` records "decision in session <date>". Run it only after an explicit yes. Never approve a gate on anyone's behalf. |
| `done: ...` | The kickoff is complete: offer `kickoff export` for the WBS handover, or invoke `kickoff:feedback` when customer feedback has arrived. |

When the user asks for a specific phase instead of the next one:

1. Run `kickoff can <phase>` (`kickoff can plan --baseline` for a baseline plan).
2. Exit 0: invoke `kickoff:<phase>`.
3. Exit 1: do not start the phase or do its work informally. Read the `blocked:` lines yourself and tell the person in plain words what is missing and the path that clears it (methods.md, Plain words), not the raw lines, which hold phase names and gate IDs.

Customer feedback is handled by `kickoff:feedback` (check it with `kickoff can feedback`). It is not a phase in `kickoff status`: it reopens C3 and marks later phases stale.

**Stale phases first.** After a gate is reopened, `kickoff status` marks later phases `(stale)`. Re-run them in phase order before any work that depends on them. With `plan` stale, "export the WBS" means: re-run `kickoff:plan` first, then `kickoff export`.

## Phases and gates

| # | Phase (skill) | May start when | Outputs | Gate to leave | Approver |
| --- | --- | --- | --- | --- | --- |
| 0 | `kickoff:init` | no `.kickoff/` yet | `project.yaml`, `clarity.yaml`, folder skeleton, `AGENTS.md` | — | — |
| 1 | `kickoff:discovery` | init done | `vision-scope.md`, `stakeholders.md`, `open-questions.md`, decision log | C1 Vision | Project lead |
| 2 | `kickoff:research` | discovery done, C1 | validation plan, ADRs *Proposed*, assumptions and constraints, architecture sketch (`Status: Draft`) | — (runs alongside 3) | — |
| 3 | `kickoff:feature-map` | discovery done, C1 | `features.yaml` → `feature-map.md`, `nfr.md` | C2 Draft scope | Project lead |
| 4 | `kickoff:design-concept` | feature-map done, C2 | `design-brief.md`, `concepts.md`, `codesign-<date>.md`, the chosen concept and its ADR | CD Customer chose the design concept | Customer |
| 5 | `kickoff:ux-design` | design-concept done, CD | `ux-spec.md` (with the screen inventory), `design-rules.md`, the fit test | — | — |
| 6 | `kickoff:prototype` | ux-design done | the prototype (tool chosen by ADR), `prototype-coverage.md`, the build plan, link in `state.yaml` (`kickoff prototype record`) | — (coverage and design review complete) | — |
| 7 | `kickoff:signoff` | prototype done | workshop pack, sign-off record | C3 Features signed off; C4 MVP locked | Customer; lead and customer |
| ↺ | `kickoff:feedback` | prototype done | classified feedback, updates along the chain | reopens C3 (and CD for a concept item) | Project lead approves the classification |
| 8 | `kickoff:solution` | signoff done, C3 and C4 | architecture, data model, technology, patterns; ADRs *Accepted* | C5 Solution | Project lead |
| 9 | `kickoff:plan` | draft: feature-map done, C2; baseline: solution done, C5 | `plan.yaml` → estimate (`estimate.md`), `wbs.md`, `plan.md`, `risk-register.md`; with scheduling on also the schedule and the estimate workbook | C6 Baseline | Project lead |

Gate rules:

- `kickoff can <phase>` is checked before any phase starts; exit 1 lists the blocking phases and gates.
- A gate is approved only with `--by` (the approving role). Evidence (a link to the record or commit) is required for the customer's gates CD, C3 and C4; for the project lead's gates C1, C2, C5 and C6 it is optional and, when omitted, recorded as "decision in session <date>". C4 needs C3; C6 needs C5.
- Reopening a gate (`kickoff gate reopen <id> --reason "<why>"`) marks every later phase that was done as stale. A stale phase blocks the phases that depend on it until it is re-run; re-running it (`kickoff phase done <phase>`) removes the gates that follow it, so they are approved again.
- Every phase ends with the Verify method: the commands in the skill's Verify section, then `kickoff phase done <phase>` and a Conventional Commit. An approval's `state.yaml` change may ride in the next commit.
- Rulings (judgement calls taken without the lead) are listed to the lead at the end of every task group and at every gate request, not only at the end of a phase.

## Working methods and references

- `references/methods.md`: the seven working methods every phase skill uses by name: Interview, Bounded approval, Option decision, Decision card, Build plan, Task run, Verify.
- `references/design-philosophy.md`: how kickoff designs, with no values: the principles and their tests, how the brief decides the form, the fit test, the rules a project writes. Every design skill and review agent reads it.
- `references/conventions.md`: languages, estimates, role-based owners, forbidden phrases, synthetic data, actions to confirm first, rulings, IDs, files, CLI exit codes, commits.
- `references/lessons.md`: the lessons from earlier projects and which skill applies each one.
- `references/ecc.md`: how kickoff uses ECC. Kickoff owns gates, state, IDs and files; ECC components do research, options and reviews. It also covers which ECC writers are never used, GateGuard, the router, and the delegation table.

Read `conventions.md` before writing any project file. Write files with the file tools, never with shell heredocs.

## Red flags

| Thought or request | Do instead |
| --- | --- |
| "The customer is busy, let's design the DB now" | C3 and C4 first: run `kickoff can solution`, name the missing gates, propose the sign-off path. |
| "I'll just tweak the plan dates by hand" | Edit `plan.yaml` (effort, dependencies, schedule mode), run `kickoff validate`, then `kickoff schedule`; report the gate dates it prints and the hard date. Never state a date `kickoff schedule` did not print. With `scheduling: "off"` in `project.yaml`, `kickoff schedule` prints "scheduling is off": there are no dates to state; give the estimate (`kickoff estimate`), or turn scheduling on in `kickoff:plan` first. |
| "I'll ask the lead to approve C1 / C3 / the design-concept phase" | Say what is being agreed, in everyday words ("Do we agree that these are the features of the first version, so that adding one later will cost rework?"), and what becomes expensive to change. Never the gate ID or the phase name; the code may follow in brackets. |
| "I'll explain the plugin's process so they can decide" | They decide the product, not the process. Explain the consequence of the choice (what they will see, what it costs, where a wrong choice would show), never the phases, gates or files. |
| "Ask the team, calendar and hard dates at init so the plan is ready" | Management set-up before the idea is understood is ceremony. Init asks the name, languages, the idea, releases and rules. `kickoff:plan` asks for roles, calendar and hard dates only when the lead turns scheduling on. |
| "The estimate is 120 person-days" | A single number hides the uncertainty. Give min, likely and max with a confidence (low, medium, high) and the basis; `kickoff estimate` totals them, and the management overhead is a rate in `project.yaml`, not a package. |
| "Let me create the issues in the tracker" | Kickoff creates no issues. Run `kickoff export` and give the lead the files; writing to a shared tracker is the lead's call. |
| "Small change, no need to re-run the chain" | Use `kickoff:feedback`: `features.yaml` → `ux-spec.md` → prototype → `plan.yaml` → `kickoff schedule`, in that order. |
| "The lead said OK in chat, I'll approve the gate" | By gate: C1, C2, C5 and C6 are the lead's own, so an explicit yes in the session is enough (`kickoff gate approve C1 --by "Project lead"`, recorded as "decision in session <date>"). CD, C3 and C4 are the customer's: ask for the evidence link and the role, then `kickoff gate approve <id> --by "<role>" --evidence "<link>"`; no evidence, no gate. |
| "The phase is stale but this is urgent" | Re-run the stale phase first; `kickoff can <phase>` blocks the dependent phase anyway. |
| "The lead can pick the concept, the customer is busy" | CD is the customer's gate. Send the concepts with a decision card and ask for the choice in writing; the ux-spec waits. |
| "Just two options, the lead trusts the recommendation" | A confirmation is a decision card: options visible (a sketch or example each), the cost and where a wrong choice would surface, "none of these" and "show me first". |
| "The design rules from the last project will do" | Rules are derived per project from its brief, each with a reason and a test. Another project's rules are a hypothesis to test, not a floor. |
| "The review can wait until the prototype is built" | The review agents run on the concepts and on the ux-spec too; a structural fault is cheapest to fix before the spec is expanded. |
| "The phase checks passed so the design is right" | Checks show the design is consistent, not that it is the right product. Write the fit test (`references/design-philosophy.md`) and show the customer. |
| "Let's take the palette and structure a design tool recommends for this product type" | A lookup by product type gives every project the same shape. The brief decides; the customer chooses among concepts that differ in kind. |
| "I'll note that the prototype differs from the product" | Follow the fidelity rule of `kickoff:prototype`: the prototype shows what the product will show, in its own wording and language; a difference is a defect. |
| "No tool ran, so the prototype check is fine" | A check that did not run is skipped: report it as skipped, never as passed. |
| "Just a rough architecture sketch to unblock the devs" | A sketch is allowed in `kickoff:research` as a draft: `Status: Draft` in its first 20 lines, binding nothing, and no implementation starts from it. An accepted ADR or a final architecture document waits for C3 and C4 (`kickoff can solution`). |
| "ECC has `/plan-prd`, `blueprint` or an ADR skill for this" | The kickoff phase writes the artefact; use ECC only as `references/ecc.md` lists. |
| "The router hint says to route this to another skill" | Inside a kickoff project, `kickoff status` decides the next step. |
| "GateGuard is in the way; turn it off" | Answer its facts. `kickoff ecc setup` exempts kickoff documents; never disable the gate on the lead's behalf. |
| "The hook refused my edit of `state.yaml`" | Use the CLI: `kickoff phase`, `kickoff gate` or `kickoff prototype record`. |
