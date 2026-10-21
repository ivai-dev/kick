---
name: init
description: Use when starting a new project with the kickoff plugin and the repository has no .kickoff/ folder yet
---

# Init

Sets up a repository for the kickoff workflow: `.kickoff/project.yaml` filled from an interview with the project lead, the docs folder skeleton, and `AGENTS.md` with the project's rules.

## When to use

- A new project starts and `kickoff status` fails with `no .kickoff/ folder`.
- `kickoff:using-kickoff` routed here.

Not for changing an existing project's settings: edit `.kickoff/project.yaml` and run `kickoff validate` instead. `kickoff init` refuses when `.kickoff/` already exists.

## Preconditions

- No `.kickoff/` folder in the repository root or any parent (`kickoff status` reports `no .kickoff/ folder`). If one exists, stop and invoke `kickoff:using-kickoff`.
- The CLI is installed and its version matches the plugin (checked by `kickoff:using-kickoff`).
- The working directory is the repository root: `kickoff init` creates `.kickoff/` and `docs/` in the current directory.

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
| 3 | Team roles | `roles[]`: `id`, `name`, `focus`, `duties` | One person per role. `id` lowercase letters and digits (`lead`, `dev`, `qa`); `focus` the share of a full day on this project (0 < focus ≤ 1, e.g. 0.8); `name` in the workbook language. |
| 4 | Calendar | `calendar.weekend`, `calendar.holidays` | Weekend as `[sat, sun]`. Ask for the country, then propose its official public holidays for every year the project spans as `{date, name, kind}`: `kind: official` when the date is announced, `kind: expected` for future years not yet announced. The lead confirms or edits the list. |
| 5 | Releases | `releases` | In delivery order; the first one is the MVP. List them all: the prototype covers the full product. |
| 6 | Hard dates | `hard_dates` | See step 3 for where to record them. |
| 7 | Tracker | `tracker` | `kind: github` or `none`. For GitHub: `org`, `repo`, `project` (Projects number), `assignee` (the account every issue is assigned to), `milestone`, `priority: {source: org-field, map: {P0: ..., P1: ..., P2: ..., blocker: ...}}`, and `issue_fields` ids if the organisation uses issue fields. |
| 8 | Security rules | `security[]` | One sentence each, e.g. "Never log, print, or send to analytics any customer content." They are copied into `AGENTS.md`. |
| 9 | Forbidden phrases | `rules.forbidden_phrases[]` | Regular expressions no document may match. Recommend `'\bClaude\b'` and `'AI[- ]assist'`. Keep `owners_by_role: true` and `synthetic_data_only: true`. |
| 10 | Frontend | `fe.dir`, `fe.app`, `fe.ux_spec`, `fe.forbidden[]` | Defaults `.` (the repository root holds the pnpm workspace), `apps/web` and `docs/05-design/ux-spec.md`. `fe.forbidden`: regular expressions for development infrastructure that must never reach the UI (VPN names, private IP ranges such as `10\.8\.\d+\.\d+`, internal hosts). |

Keep `docs_root: docs`: `kickoff init` creates the folders under `docs/`. If the lead wants another root, move the created folders and set `docs_root` to match.

2. **Create the skeleton:** `kickoff init --name "<name>"`. It writes `.kickoff/{project,state,features,plan,tickets}.yaml` and `docs/{01-discovery,02-requirements,03-research,04-architecture/adr,05-design,06-planning,07-task-specs,08-task-plans}/`.

3. **Fill `.kickoff/project.yaml`** with the answers, using the Edit tool (never a shell heredoc). Quote strings that look like numbers or dates. Hard dates: `hard_dates` keys must be gate IDs that exist in `plan.yaml` (`kickoff validate` rejects any other key), and `plan.yaml` has no gates yet. Until the `plan` skill creates the gates, keep the hard dates as comments under `hard_dates: {}`, one per line: `# <gate id> <what must be done>: <YYYY-MM-DD>`.

4. **Write `AGENTS.md`** in the repository root from `templates/AGENTS.md`: replace every `{{...}}` placeholder, copy the `security` rules verbatim, keep the repository map as a placeholder table until the code exists. If an `AGENTS.md` already exists, use the Bounded approval method to merge the kickoff sections into it:

> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.

5. **Validate:** `kickoff validate`. Fix every error and run it again until it reports `0 errors`.
   **ECC setup** (`../using-kickoff/references/ecc.md`):
   - Run `kickoff ecc setup --dry` and show the lead the diff. It exempts `.kickoff/**`, `<docs_root>/**` and `AGENTS.md` from ECC's GateGuard in `.claude/settings.json`.
   - After a yes, run `kickoff ecc setup`.
   - Then offer `kickoff ecc setup --router` separately. It adds the kickoff route to the user's ecc-router table, outside this repository, so it needs its own yes.

6. **Verify** (section below), then `kickoff phase done init` and commit with the message `chore: kickoff init`.

## Outputs

- `.kickoff/project.yaml` (filled), `.kickoff/state.yaml`, `.kickoff/features.yaml`, `.kickoff/plan.yaml`, `.kickoff/tickets.yaml`
- `docs/01-discovery/`, `docs/02-requirements/`, `docs/03-research/`, `docs/04-architecture/adr/`, `docs/05-design/`, `docs/06-planning/`, `docs/07-task-specs/`, `docs/08-task-plans/` (each with `.gitkeep`)
- `AGENTS.md` in the repository root

## Verify

1. `kickoff validate` reports `0 errors`; explain any warning to the lead.
2. `kickoff check-docs AGENTS.md` prints `check-docs passed` (no placeholder, no forbidden phrase).
3. `kickoff ecc doctor` exits 0, and its D5 line is `ok` (or the lead declined the setup, recorded as a ruling).
4. `kickoff status` shows `init` in progress and no error.

> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.

## Lessons

- Literal `\n` in a Bash heredoc became real newlines in JS: write every file with the file tools, not heredocs.
- A development VPN name and IP range appeared in product UI: record such names in `fe.forbidden` now, so `kickoff fe check` flags them later.

## Handoff

`kickoff status` now names `kickoff:discovery`. Ask the lead for the customer inputs (meeting notes, briefs, calls, documents) and invoke `kickoff:discovery`.
