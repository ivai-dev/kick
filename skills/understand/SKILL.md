---
name: understand
description: Use when a kick's first step is open - turning a vague idea, a request or a change in a running project into a brief the person agrees with, before any solution is chosen
---

# Understand

Turns what the person wants into a brief they recognise as theirs: the problem, who it is for, what is in and out, what success looks like, what we assume, what must not break, and what is still unclear. No solution yet.

Read `../using-kick/references/plain-words.md` first. Every question follows it and the Interview method (`../using-kick/references/methods.md`).

## 1. Companions

Run `kick companions --step understand` and offer what it lists that fits (`../using-kick/references/companions.md`):

- superpowers when the idea is still vague (only its brainstorming interview is used, never its plan or build steps);
- mattpocock-skills when a change in a running project needs a quick, sharp interview.

## 2. Read what exists

- `docs/kick/project/` (overview, design, API, data, roadmap) and the languages in `project.yaml`.
- In a running project: the code around the change (`ecc:code-explorer` agent for anything non-trivial). Note what this work touches and what must keep working.
- A feature kick linked to a roadmap row: that row and the decisions behind it.

## 3. Interview

Fill the kick's `brief.md`, section by section:

| Section | Ask about |
| --- | --- |
| Problem | what hurts today, for whom, how often; what they do instead |
| Who it is for | each kind of user, what they need to get done, where and on what device |
| In / Out | what the first version must do; what it explicitly will not |
| What success looks like | how they will know it worked, in numbers or observable facts |
| We assume | what you are taking for granted; each as a sentence they can strike |
| Must not break | (running project) what exists that this must keep working |
| Rough feature list | (product kick) the features, roughly, in the person's words |

Rules:

- One question per message, options with a recommendation when a choice exists.
- When the interview companion is installed, you may run it (`superpowers:brainstorming`), then write its result into `brief.md` in kick's form.
- An answer nobody knows yet becomes `[unclear: …]` where it belongs, never a guess.
- A technical unknown ("can the old scanner talk to a browser?") gets `ecc:search-first` now when it changes the brief; otherwise it stays unclear for the shape step.
- For a product kick, `ecc:product-lens` (its diagnostics only) may point out gaps in the why, the user or the success measure. Turn each gap into a question or an unclear marker.
- Write in the docs language; quote the person's own words where they matter.

## 4. Play back and agree

Show a short summary (five to eight lines) of the brief in the chat language, then ask:

> This is what I understood: … Is anything wrong or missing before I work out how to build it?

- On a yes: the date into `agreed: understand` in `kick.yaml`, a dated line in `log.md` with what was agreed, then `kick check <name>`.
- On corrections: fix the brief and play back again.
- For a small feature, the brief and the shape may be agreed in one question; say both parts clearly.
- When the person wants to skip this, say what that risks (building the wrong thing), ask, and log the answer.

## Verify

`kick check <name>` and `kick status <name>`: read the real output; the unclear points it lists are the ones the person has seen.

Then hand over to `kick:shape`.
