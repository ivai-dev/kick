# Working methods

The methods every kick skill uses by name. All of them are worded by `plain-words.md`.

## Interview

**Rule:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the page you are filling has what it needs.

1. Open the page the interview fills (for example the brief) and list its empty sections. That list is the interview; do not ask anything that fills nothing.
2. Confirm what you already know instead of asking again: "You said the first version is web only. Correct?"
3. One question per message. When a choice exists, offer 2–4 options labelled A–D, mark one as recommended and say why in one line. When none exists, ask an open question with an example answer.
4. Restate each answer ("Noted: …") before the next question.
5. An answer the person does not know becomes an `[unclear: …]` marker where it belongs, never a guess.
6. Stop when the page has what it needs. Play back a short summary and ask whether it is right.

## Option decision

**Rule:** for each technical decision, 2–3 real options that differ in kind, each with cost, risk and what it makes hard later; a recommendation; the result written as a titled, dated decision.

1. State the decision in one sentence and what it depends on (the brief, the risks, the unclear points).
2. List 2–3 real options. A straw man nobody would choose does not count.
3. For each: cost (days, licences, running cost), risk (what can go wrong, how likely), and what it blocks or makes hard to undo.
4. Recommend one and say why in one or two sentences. Use `ecc:council` when two options stay close.
5. Ask with a Decision card. Record the result in the kick's `design.md` under Decisions:

```markdown
### Store recordings on our own server (2026-10-28)
We chose our own server because the school does not allow recordings to leave its network.
We gave up a ready-made service that would take 2 days instead of 8.
Changing it later would cost moving every stored recording.
```

## Decision card

**Rule:** a design or technical choice is a card, never a bare list: what it decides and makes expensive to change; 2–3 options, each with what the person will see, who it serves, what it costs and when a wrong choice would show; a recommendation; what you assumed; and always "none of these" and "show me first".

1. If the options cannot be pictured from words, make them visible first: a sketch, an ASCII layout, a key screen, a reference screenshot.
2. Parts, in order:
   - **What we decide** and what it makes expensive to change.
   - **Options (2–3):** what you will see or do; who it serves and who it fails; cost; when a wrong choice would show ("when the first users try it"), never the name of a step.
   - **Recommendation** and its reason, tied to the brief.
   - **Assumed:** what you decided or guessed on their behalf, as a list they can strike.
   - **Also:** none of these (they describe what they want), show me first.
3. One decision per card; small related ones may share a message.
4. Restate the choice ("Noted: …") and what it now makes expensive to change.

## Agreement

**Rule:** each step ends with one plain question about the product, never about kick. Record only an explicit yes.

1. Say what is being agreed in the person's words, what becomes expensive to change afterwards, the calls you made without them, and what you are least sure of.
2. Ask one question. "Looks good" counts as yes; silence or "interesting" does not.
3. On yes: the date into `agreed` in `kick.yaml`, a dated line in `log.md`, then `kick check <name>`.
4. When the person wants to skip an agreement, say what that risks, ask, and log the answer.

## Bounded approval

**Rule:** a set of changes is one table; nothing changes before an explicit yes or an edit of named rows.

| # | What changes | What it means for you | Extra days |
| --- | --- | --- | --- |
| 1 | The export moves into the first release | Your team gets it from day one; the first release grows | 2–3–5 |

Ask: "Approve all, change some rows, or reject?" Apply exactly the approved rows.

## Classifying feedback

**Rule:** every comment from people who tried the product gets one of three answers, with its cost: **now** (fix in this kick), **later** (a row in the roadmap), **no** (with the reason). The person weighs the cost. At most two rounds per screen; after the second, go back to who the screen serves and why. Details: the `trials.md` reference of `kick:build`.

## Honest checks

**Rule:** run the checks, read the real output, report failures as failures and skipped checks as skipped.

- Read the real output and exit code of every command; never infer a result.
- Separate what a tool checked, what a person or reviewer looked at, and what was only assumed.
- A check that did not run is "skipped", never "passed".
