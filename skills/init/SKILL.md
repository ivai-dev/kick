---
name: init
description: Use when starting a new project with the kickoff plugin and the repository has no .kickoff/ folder yet
---

# Init

Sets up a repository for the kickoff workflow: `.kickoff/project.yaml` filled from a short interview with the project lead, the clarity register, the docs folder skeleton, and `AGENTS.md` with the project's rules. The interview is slim: it asks only what the first phases need. Team, calendar and hard dates wait until the lead turns scheduling on in `kickoff:plan`.

## When to use

- A new project starts and `kickoff status` fails with `no .kickoff/ folder`.
- `kickoff:using-kickoff` routed here.

Not for changing an existing project's settings: edit `.kickoff/project.yaml` and run `kickoff validate` instead. `kickoff init` refuses when `.kickoff/` already exists.

## Preconditions

- No `.kickoff/` folder in the working directory (`kickoff status` reports `no .kickoff/ folder`). If one exists there, stop and invoke `kickoff:using-kickoff`.
- A `.kickoff/` folder in a **parent** is a different case: a product that lives inside another project's repository but is built and sold on its own (a module with its own customers) is a nested project. Ask the lead whether it is one; if yes, run it from the product's folder and pass `--nested` in step 2. If it is only a part of the parent product, add it to the parent's `features.yaml` as an epic instead. Never nest silently: from inside the nested folder every kickoff command, hook and file guard uses the nested project (the nearest `.kickoff/`), and the parent project is reached with `--root`.
- The CLI is installed and its version matches the plugin (checked by `kickoff:using-kickoff`).
- The working directory is the project's root folder (the repository root, or the product's folder for a nested project): `kickoff init` creates `.kickoff/` and `docs/` in the current directory.

## Inputs

- The project lead's answers to the interview below.
- Any brief or contract the lead points to (read it first, then confirm its facts instead of asking for them).
- `templates/AGENTS.md` in this skill's folder.

## Steps

> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.

1. **Interview the lead**, using the Interview method, multiple choice wherever possible. Each answer fills a field of `.kickoff/project.yaml`:

| # | Topic | Field(s) | Notes |
| --- | --- | --- | --- |
| 1 | Project name | `name` | Also used in `AGENTS.md`. |
| 2 | Languages | `languages.repo`, `chat`, `workbook`, `ui` | `repo` and `workbook` accept `en` or `vi` in v1; `chat` and `ui` are free language codes. |
| 3 | The idea in one line | the Product line of `AGENTS.md` | One sentence: who it is for and the problem. It is a seed, not a vision: `kickoff:discovery` refines it. If it is too vague to write, keep what the lead said and say so; clarity (`problem`, `users`) starts `open`. |
| 4 | Releases | `releases` | In delivery order; the first one is the MVP. Default `[MVP, R2]`: confirm or change. List them all: the prototype covers the full product. |
| 5 | Security rules | `security[]` | May be skipped. One sentence each, e.g. "Never log, print, or send to analytics any customer content." They are copied into `AGENTS.md`. |
| 6 | Forbidden phrases | `rules.forbidden_phrases[]` | May be skipped. Regular expressions no document may match. Recommend `'\bClaude\b'` and `'AI[- ]assist'`. Keep `owners_by_role: true` and `synthetic_data_only: true`. |
| 7 | Design | `design.forbidden[]` | May be skipped. Regular expressions for patterns that must never reach the product's user-facing text (VPN names, private IP ranges such as `10\.8\.\d+\.\d+`, internal hosts); `kickoff check-docs` applies them. Keep `design.ux_spec` at its default `docs/05-design/ux-spec.md`. No stack or tool question here: the prototype tooling is decided in `kickoff:prototype`, the design rules in `kickoff:ux-design`. |

Word every question in everyday words (`../using-kickoff/references/methods.md`, Plain words): the lead has not seen the plugin. For releases ask "what must the first version do, and what can come later?", not "which releases"; the field names above are for the file, not for the question.

Not asked here: roles and focus, the calendar and holidays, hard dates. The template `project.yaml` keeps default roles (`lead`, `dev`, `qa`) so it stays valid, and `scheduling: "off"`. `kickoff:plan` asks for the team, the calendar and the hard dates when the lead turns scheduling on. Do not ask for them now, even when the lead offers them: note them for `kickoff:plan`.

Keep `docs_root: docs`: `kickoff init` creates the folders under `docs/`. If the lead wants another root, move the created folders and set `docs_root` to match.

2. **Create the skeleton:** `kickoff init --name "<name>"` (`kickoff init --nested --name "<name>"` for a nested project; without `--nested` it refuses when a parent folder has `.kickoff/`). It writes `.kickoff/{project,state,features,plan,clarity}.yaml` and `docs/{01-discovery,02-requirements,03-research,04-architecture/adr,05-design,06-planning,07-task-specs,08-task-plans}/`. `clarity.yaml` is the clarity register; `kickoff status` shows it from the first session.

3. **Fill `.kickoff/project.yaml`** with the answers (name, languages, releases, security, forbidden phrases, `design.forbidden`), using the Edit tool (never a shell heredoc). Quote strings that look like numbers or dates. Leave `roles`, `calendar`, `hard_dates`, `scheduling: "off"` and `estimate.overhead` as the template has them. Set the clarity areas that the idea already answers: `kickoff clarity set problem --status assumed --confidence low --note "<the idea>"`; leave the others `open`.

4. **Write `AGENTS.md`** in the repository root from `templates/AGENTS.md`: replace every `{{...}}` placeholder (the idea line goes into the Product section), copy the `security` rules verbatim, keep the repository map as a placeholder table until the code exists. Roles and calendar are not filled: the file points to `project.yaml`. If an `AGENTS.md` already exists, use the Bounded approval method to merge the kickoff sections into it, and put the merge to the lead in plain words (methods.md, Plain words): "your project's instructions file already exists; I would add a short section on how this project is run and keep everything you have written. Add it, change it, or leave the file as it is?", with each added section named by what it says, not by heading or file name:

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

5. **Validate:** `kickoff validate`. Fix every error and run it again until it reports `0 errors`.
   **ECC setup** (`../using-kickoff/references/ecc.md`):
   - Run `kickoff ecc setup --dry`, read the diff yourself and tell the lead in plain words (methods.md, Plain words) what would change: "the safety check that asks for a reason before each first edit would skip this project's planning documents, so the work is not interrupted on every file. Nothing else changes. Go ahead?" (the file names stay out of the question). The command exempts `.kickoff/**`, `<docs_root>/**` and `AGENTS.md` from ECC's GateGuard in `.claude/settings.json`.
   - After a yes, run `kickoff ecc setup`.
   - Then offer `kickoff ecc setup --router` separately, in plain words: "I can also teach your assistant's request router that this project's work goes through the kickoff steps. That changes your personal setup, outside this project, so I ask on its own." It needs its own yes.

6. **Verify** (section below), then `kickoff phase done init` and commit with the message `chore: kickoff init`.

## Outputs

- `.kickoff/project.yaml` (filled), `.kickoff/state.yaml`, `.kickoff/features.yaml`, `.kickoff/plan.yaml`, `.kickoff/clarity.yaml` (the clarity register)
- `docs/01-discovery/`, `docs/02-requirements/`, `docs/03-research/`, `docs/04-architecture/adr/`, `docs/05-design/`, `docs/06-planning/`, `docs/07-task-specs/`, `docs/08-task-plans/` (each with `.gitkeep`)
- `AGENTS.md` in the repository root

## Verify

1. `kickoff validate` reports `0 errors`; explain any warning to the lead.
2. `kickoff check-docs AGENTS.md` prints `check-docs passed` (no placeholder, no forbidden phrase).
3. `kickoff ecc doctor` exits 0, and its D5 line is `ok` (or the lead declined the setup, recorded as a ruling).
4. `kickoff status` shows `init` in progress, a `Clarity:` block and no error.
5. `kickoff clarity` lists the areas; `problem` is `assumed` or `open`, never `decided`.
6. `AGENTS.md` names the idea in its Product section, and `project.yaml` still has `scheduling: "off"`.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Literal `\n` in a Bash heredoc became real newlines in JS: write every file with the file tools, not heredocs.
- A development VPN name and IP range appeared in product UI: record such names in `design.forbidden` now, so `kickoff check-docs` flags them later.

## Handoff

`kickoff status` now names `kickoff:discovery` and shows the clarity register. Ask the lead for the customer inputs (meeting notes, briefs, calls, documents) and invoke `kickoff:discovery`. Tell the lead that the team, calendar and hard dates are asked by `kickoff:plan` when scheduling is turned on; until then the plan is an estimate.
