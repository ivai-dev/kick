---
name: using-kick
description: Use when starting or resuming any piece of work with kick (a new product from a vague idea, or a feature, module or app in a running project), or when the person asks where things stand or what comes next
---

# Using kick

The router of kick. It checks the tools, reads where the work stands with the `kick` CLI and hands over to the skill of the next step. It never blocks anything: it says what is missing and what that risks, and the person decides.

## What kick is

kick starts a piece of work with AI in a short, standard way: understand, shape, plan, build, and a change loop. ECC does the work (research, options, reviews, tests, commits); kick owns the flow, the documents and the questions to the person.

There are two kinds of kick:

| Kind | From | To |
| --- | --- | --- |
| **product** | a vague idea | the real screens running on mock data, the decisions written down, a draft API contract and data model, and the list of feature kicks that come next (Foundation first). Its result is agreed as "this is the product". |
| **feature** | one feature, module or app in a running project | working code, built by ECC, with the shared project pages updated. Its result is agreed as "it works as agreed". |

Files: `docs/kick/project/` holds how the product is now (languages, overview, design, API, data, roadmap); each kick is a folder `docs/kick/<name>/` (brief, design, tasks, feedback, log, `kick.yaml`); finished kicks move to `docs/kick/done/`.

## Rules that every kick skill follows

1. **Plain words.** Read `references/plain-words.md` before you say anything to the person. They have never seen kick: no step names used as jargon, no file names, no codes, no commands in what you say to them.
2. **Advice only.** Nothing is blocked. When something is not agreed yet, say what is missing and what it risks, ask, and write the answer as a dated line in the kick's `log.md`.
3. **Languages.** `docs/kick/project/project.yaml` sets the chat, docs, code, UI and commit languages. Talk in the chat language; write documents, code, the product's own text and commits in theirs. The session-start hook prints them in one line.
4. **Companions.** Each step skill starts with `kick companions --step <step>` and offers what is missing, in plain words (`references/companions.md`). Install only after an explicit yes.
5. **ECC does the work.** Use the ECC parts listed in `references/ecc.md`. ECC's own approvals do not replace kick's agreements.
6. **Write files with the file tools**, never with shell heredocs.

## Start-up checks

Run these in order at the start of every session:

1. **CLI version.** Run `kick --version` (prints `kick <version>`). The plugin root is two levels above this skill's base directory; read `"version"` in `<plugin root>/.claude-plugin/plugin.json`. If the command is missing or the versions differ, run `uv tool install --force "<plugin root>/cli"` and check again. If they still differ, stop and show both outputs.
2. **ECC.** Run `kick doctor`. When it says `doctor failed`, tell the person in plain words that kick needs the ECC plugin (version 2.2.3 or later) and how to install it, then stop. When it warns that GateGuard does not exempt the kick documents, offer `kick setup` (it edits the project's `.claude/settings.json`; ask first).
3. **Where things stand.** Run `kick status`. When it says there is no kick project here, invoke `kick:start`.

## Route

Report `kick status` in two or three plain lines: what is in progress, what is still unclear, what comes next. Then:

| Situation | Do |
| --- | --- |
| No kick yet, or the person wants to start something new | `kick:start` |
| A one-line fix, a small change, a bug | No kick: send it straight to ECC (`ecc:orch-fix-defect`, `ecc:orch-change-feature`) |
| Several kicks in progress and the person did not say which | Ask which one, naming each by its title and what it is for |
| The kick's step is `understand` | `kick:understand` |
| `shape` | `kick:shape` |
| `plan` | `kick:plan` |
| `build` or `finish` | `kick:build` |
| Something already agreed must change | `kick:change` |

`kick status <name>` shows one kick in detail: its agreements, its tasks, its unclear points and the next step. The step is derived from the agreements in `kick.yaml`; never edit the step, record agreements.

When the person asks for a later step than the current one, do not refuse. Say in plain words what is not agreed yet and what that risks ("we have not agreed how it should look, so screens built now may be redone"), ask, log the answer, and go on if they say so.

## Agreements

Every step ends with one plain question (`references/methods.md`, Agreement). On an explicit yes:

1. Write the date into `agreed` in the kick's `kick.yaml` (`understand`, `shape`, `plan` or `result`).
2. Add a dated line to `log.md` saying, in the person's words, what was agreed.
3. Run `kick check <name>` and read its output.

A later change to an agreed page clears that agreement and the later ones (`kick:change`).

## Red flags

| Thought | Do instead |
| --- | --- |
| "I'll tell them the shape step is done and ask for the plan agreement" | Say what they are agreeing to: "This is how we'll build it and how it will look. Anything wrong before I break it into tasks?" |
| "The idea is clear enough, let's just start coding" | Ask whether to skip the step, say what that risks, log the answer. Then go on if they want. |
| "Let's design the database now, it saves time later" | In a product kick the data model waits until people have used the real screens; say why and what an early schema risks, then ask. |
| "Let me build a quick clickable mock-up of every screen first" | No throw-away prototype: show one key screen per direction, then build the real screens on mock data. |
| "A single number is enough for the estimate" | Give a range with how sure we are and what it rests on. |
| "The companion would help, I'll install it" | Offer it in plain words and install only after an explicit yes. |
| "ECC asked for plan approval, so the plan is agreed" | ECC's approvals are ECC's. kick's agreement is its own plain question. |
| "GateGuard is in the way; turn it off" | Answer its facts. Offer `kick setup` for the kick documents; never disable it for the person. |
| "I'll explain kick's steps so they can decide" | They decide about their product, not about kick. Explain the consequence of the choice. |

## References

- `references/plain-words.md`: how to talk to the person; read first.
- `references/methods.md`: Interview, Option decision, Decision card, Agreement, Bounded approval, Classifying feedback, Honest checks.
- `references/design-philosophy.md`: how kick designs, with no values of its own.
- `references/ecc.md`: which ECC part each step uses.
- `references/companions.md`: the optional tools, how to offer and install them.
- `references/practices.md`: the professional practices behind the flow.
- `references/lessons.md`: mistakes from real projects and where they are prevented.
