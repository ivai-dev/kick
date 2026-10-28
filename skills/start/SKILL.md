---
name: start
description: Use when kick has no project pages in this repository yet, or when the person wants to start a new piece of work (a new product, or a feature, module or app in a running project)
---

# Start

Sets up the project pages once (languages, and what exists when there is already code), then starts a kick. Read `../using-kick/references/plain-words.md` first; every question here follows it.

## 1. Companions

Run `kick companions --step start` and offer what it lists (`../using-kick/references/companions.md`). Usually nothing.

## 2. Project set-up (only when `kick status` says there is no kick project here)

1. **What is already here.** Look at the repository.
   - **Code exists:** read it with `ecc:codebase-onboarding` (or the `ecc:code-explorer` agent for a large repo): the product, the stack, the structure, the main entry points, how the server is called, how data is stored, the conventions, the tests.
   - **A `.kickoff/` folder exists** (a project started with kickoff 0.9): offer in plain words to carry over what it already decided: "This project already has notes on its scope, design and plan from an earlier tool. Shall I carry them over, so we don't ask again what is already decided?" See "Carrying over" below.
   - **Nothing yet:** a new product; the project pages stay empty until the product kick fills them.
2. **Languages.** Propose one set and ask once:

   > I'll use these languages unless you want something else:
   > - talking with you: Vietnamese
   > - the documents: Vietnamese
   > - the code (names and comments): English
   > - the text in the product for its users: Vietnamese. Will people use it in another language too? Supporting two languages from the start costs extra work.
   > - the change notes in the history (commits): English
   >
   > Anything to change?

   Default to the language the person writes in for chat, documents and the product's text, and English for code and commits. In a running project, follow what the code already does (its comments, its screen text, its commit history) and say so.
3. Run `kick init --chat <l> --docs <l> --code <l> --ui <l>[,<l>] --commits <l>` with language tags such as `vi` and `en`.
4. **A running project:** fill the project pages from what you read, in the docs language: `overview.md` (what the product does, for whom), `design.md` (architecture, technology, screen map and design rules as they are), `api.md` (the endpoint table, every row `real`), `data.md` (the main tables). Mark what you could not tell as `[unclear: …]`. Show the person a five-line summary and ask whether it is right.
5. Run `kick doctor`. When it warns that GateGuard does not exempt the kick documents, offer `kick setup`: "A safety check of the coding toolkit asks for extra confirmation before every new document. Shall I let it skip our planning documents (it changes one setting in this project)?"

## 3. What are we kicking off?

Ask in plain words:

> What would you like to start?
> A. A whole new product, from the idea to screens you can try
> B. One feature or part of this app (recommended when the app already exists)
> C. Something small (a fix, a text change): no planning needed, I'll just do it

- **C:** no kick. Hand it to ECC (`ecc:orch-fix-defect` or `ecc:orch-change-feature`).
- **A:** a product kick. In a repository that already holds a product, it can be a new app beside it; say so.
- **B:** a feature kick. When `docs/kick/project/roadmap.md` has rows, offer the next row whose prerequisites are done, by its plain title; Foundation comes first. When the person picks a feature before Foundation (or before its prerequisites), say in plain words what that risks ("the sign-in and the database do not exist yet, so this feature would have to build them or wait"), ask, and log the answer. When the feature has no row yet, add one first (key, title, After, a rough range with low confidence), so the product total counts it.

## 4. Create the kick

1. Propose a short name for the folder and a title in the docs language; the person only sees the title.
2. Run `kick new <name> --title "<title>" --kind product` or `--kind feature` (add `--roadmap <key>` when it implements a roadmap row; `kick new` then fills that row's Kick cell, and warns when the row is missing or already linked).
3. Hand over to `kick:understand`.

## Carrying over a `.kickoff/` project

Read its files and write the project pages in the new form, in the docs language, with no codes:

| From | To |
| --- | --- |
| `.kickoff/project.yaml` languages | the language proposal (step 2) |
| vision and scope, stakeholders | `overview.md` |
| architecture, data model, decision records, UX spec, design rules | `design.md` (decisions by title and date), `data.md` |
| features and the plan's packages with their ranges | `roadmap.md` rows (Foundation first if no groundwork exists yet) |
| open questions | `[unclear: …]` markers where they belong |

Leave `.kickoff/` in place; tell the person it can be deleted once they are happy.

## Verify

Run `kick status` and `kick check`; read the real output and report it honestly.
