# kick

Kick off any piece of work with AI, in plain words: a new product from a vague idea, or a sub-project, module, app or feature inside a running project. kick gives Claude Code a short standard flow, page templates and rules for working with [ECC](https://github.com/affaan-m/ECC):

**understand → shape → plan → build**, plus a change loop.

What kick settles with you early is what is expensive to change later: the solution, the architecture, the technology and the look of the product, chosen from options that differ in kind. Estimates are ranges (min, likely, max) that narrow as the work becomes clearer. ECC does the work: research, options, reviews, tests and commits.

Every question kick asks says what is being decided, what each answer means and costs, and what becomes expensive to change, in everyday words. kick never blocks you: when a step is skipped it says what is missing and the risk, asks, and writes your answer down.

## Two kinds of kick

**A product kick** takes a vague idea to a product you can see and use:

1. **Understand.** One question at a time, then a play-back of what was understood.
2. **Shape.**
   - Solution and architecture options.
   - Technology. The data model waits.
   - A screen map by journey, with a cut line for the first release.
   - 2–3 UI directions, one key screen each.
   - Design rules.
   - A rough estimate for the whole product.
3. **Plan the UI.** Tasks with ranges, small throw-away probes for the technical risks, and the criteria for "this is the product".
4. **Build the real UI on mock data.**
   - Real frontend code in the chosen stack, behind one API layer that returns realistic sample data. Each mock endpoint is the draft contract for the backend.
   - The design reviewers look at the running screens.
   - Real users try it with concrete tasks. Every comment is classified (now, later, no) with its extra days, at most two rounds per screen.
5. **"This is the product."**
   - The decisions, the draft API contract and the draft data model move into the shared project pages.
   - The product kick ends with a roadmap of feature kicks. Foundation comes first: sign-in, database, deployment and one flow running end to end.

There is no throw-away prototype: what people try is the real frontend, and it stays.

**A feature kick** takes one feature, module or app in a running project from understanding to working code: understand → shape (light, reusing the agreed look) → plan → build with ECC. On a product built by a product kick, a feature kick builds the real backend for its part and replaces its mock endpoints, with contract tests so the screens do not change.

A one-line fix or a small change needs no kick: kick sends it straight to ECC.

## Files

```
docs/kick/
  project/            how the product is now; every kick reads it
    project.yaml      languages, overhead, time budget (optional)
    overview.md       problem, users, scope
    design.md         architecture, technology, UI direction and rules, screen map, decisions
    api.md            the API contract: mock → real, endpoint by endpoint
    data.md           the data model: draft → real, feature by feature
    roadmap.md        the feature kicks: order, dependencies, ranges, first-release cut
  <kick>/             one change
    kick.yaml         kind, status, the dates of what was agreed
    brief.md          what we understood; [unclear: …] marks what is not clear yet
    design.md         options, the chosen one, technical risks, decisions
    tasks.md          the task table
    feedback.md       try-outs and classified comments
    log.md            dated agreements and changes, in your words
  done/<kick>/        finished kicks
```

kick reads three Markdown tables and nothing else. Keep their headings and column names; the cells may be in any language:

- `## Tasks` in `tasks.md`: Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status
- `## Features` in `roadmap.md`: Feature | After | Days | Confidence | Basis | Release | Kick
- `## Endpoints` in `api.md`: Endpoint | Used by | Roles | Status (mock or real) | Cost

A task or feature cell starts with a short key and a colon (`lend: lend a book`); `After` lists the keys it waits for. Days is `min–likely–max` or one number.

## Languages

At the first kick in a project, kick proposes one set of languages for you to confirm:

| Used for | Proposed language |
| --- | --- |
| Talking with you | the language you write in |
| Documents | the chat language |
| Code (names and comments) | English |
| The product's own text | asked |
| Commit messages | English |

In a running project the proposal follows what the code already does. The languages are stored in `project.yaml` and repeated at every session start. Two or more product languages are a decision in shape, with their cost.

## Companions

kick works with ECC (required) and offers optional tools at the step that needs them. It explains in one line what the tool does, whether it needs an account, and that it is optional, then asks: install now, later, or don't ask again. After a yes, kick installs the tool itself and remembers your answer (`~/.kick/companions.yaml`).

| Companion | Step | Helps with |
| --- | --- | --- |
| superpowers (brainstorming only) | understand | turning a vague idea into a clear brief |
| mattpocock-skills (`grill-me`) | understand | a quick, sharp interview about a change |
| drawio | shape | architecture and flow diagrams |
| frontend-design, impeccable, ui-ux-pro-max | shape, build | UI direction, styles and polish |
| figma (account) | shape | reading designs and putting concepts on the canvas |
| superdesign (account) | shape | many design variants quickly |
| playwright | build | letting the reviewers click through the running screens |
| context7 | build | current library documentation |

`kick companions` lists them and their state.

## Install

In Claude Code:

```
/plugin marketplace add ivai-dev/kick
/plugin install kick@kick
```

Then install the CLI from the installed plugin copy (under `~/.claude/plugins/cache/kick/kick/<version>/`):

```
uv tool install --force ~/.claude/plugins/cache/kick/kick/<version>/cli
```

Repeat the CLI install after every plugin update; the `kick:using-kick` skill compares the versions and asks you when they differ.

## Requirements

- Python 3.11 or newer and [uv](https://docs.astral.sh/uv/).
- The ECC plugin (`ecc@ecc` 2.2.3 or later). `kick doctor` checks it.

## Quickstart

1. Open a repository in Claude Code: an empty one for a new product, or your running project.
2. Run `/kick`.
   - The first time, kick reads the code (if there is any), proposes the languages and creates `docs/kick/project/`.
   - Then it asks what you want to kick off.
3. Answer its questions. Each step ends with one plain question asking you to agree. `/kick` always picks up where you left off.

## CLI

| Command | Does |
| --- | --- |
| `kick init --chat L [--docs L] [--code L] [--ui L,L] [--commits L] [--update]` | create `docs/kick/project/` with the languages, or change them |
| `kick new <name> --title T --kind product\|feature [--roadmap KEY]` | start a kick from the templates |
| `kick status [<name>]` | the kicks, the roadmap and the API in a few lines; one kick in detail with its unclear points |
| `kick estimate [<name>] [--remaining] [--json]` | range totals of a kick, or of the whole product from the roadmap, with overhead, releases and the time budget |
| `kick check [<name>]` | check the YAML files and the three tables; warnings for skipped agreements; exit 1 on errors |
| `kick done <name>` | mark a kick done and move it to `docs/kick/done/` |
| `kick companions [--step S] [--json]`, `kick companions mark <id> installed\|later\|never` | the optional tools, what a step should offer, the remembered answers |
| `kick doctor` | the CLI, ECC and the companions |
| `kick setup [--dry]` | exempt `docs/kick/**` from ECC's GateGuard in `.claude/settings.json` |

Exit codes: 0 ok, 1 errors found (`check`, `doctor`), 2 bad input or a missing file.

## Examples

- `examples/library-product/` (Vietnamese) shows a finished product kick for a school library, from a one-line idea to the real UI on mock data.
  - It has the project pages and a roadmap with Foundation done.
  - A feature kick ("lending") is part-way through build, with half of its endpoints already real.
- `examples/existing-app/` (English) shows a small running notes app.
  - Its project pages were drafted from the code.
  - One feature kick is finished (tags) and one is being planned (search).

```
cd cli
uv run kick --root ../examples/library-product status
uv run kick --root ../examples/library-product estimate --remaining
```

## Switching from kickoff 0.9

kick 1.0 replaces kickoff. The fixed sequence of phases and approval gates, numbered items, the role-based schedule, the estimate workbook, the tracker export and the customer sign-off workshop are gone.

| kickoff 0.9 | kick 1.0 |
| --- | --- |
| `.kickoff/` with `state.yaml`, `features.yaml`, `plan.yaml` | `docs/kick/project/` and one folder per kick |
| 10 phases, gates C1–C6 and CD | understand, shape, plan, build; plain agreements with dates |
| discovery, research, feature-map | understand |
| solution, design-concept, ux-design | shape |
| prototype | build the real UI on mock data (no throw-away prototype) |
| signoff, feedback | the try-outs inside build; change |
| `kickoff schedule`, `workbook`, `export` | dropped |
| `kickoff clarity` | `[unclear: …]` markers, counted by `kick status` |

kickoff 0.9 stays installable from tag `v0.9.0`. In a repository with a `.kickoff/` folder, the `start` skill offers to set up `docs/kick/project/` and a roadmap from its documents.

## Development

```
cd cli
uv run ruff check .
uv run pytest -q
```

Plans and decisions live in `docs/plans/`.
