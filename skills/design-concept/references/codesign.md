# Co-design session

The customer chooses the concept by feeling it, not by reading about it. Two or three concepts are shown on the same scenarios, in the cheapest medium that lets the customer feel them (a story, a layout on paper or screen, a clickable mock, a short vertical slice). The customer reacts, mixes and chooses, and the team changes the concept within the brief's rules while they watch. One meeting of 45–60 minutes, or the same flow asynchronously.

The customer decides structure and feel: flows, navigation, interaction model, pace, tone, visual language. Not only colour.

## Before the session

- **The material:** one self-contained set per concept, in the medium the project uses. Keep it free of project-internal words. Sharing it beyond the lead is publishing: ask the lead first.
- **Order:** the order agreed with the lead (skill step 5). Put the boldest concept second, never last: a customer who saw the safe option last tends to settle on it.
- **Scenarios:** the same two or three for every concept: each main audience's main job, a first-time moment, and a worst case (no data, far too much, the longest name, an error, a slow connection). The concepts are judged on the job, not on a hero.
- **Questions to ask,** written down: which one feels like *your* product; what would your users say on their first day; what would you remove; which one would you be proud to show your own customers; where would the hardest audience stop.
- **Decision cards:** one per choice you will ask for, with each option visible (skill step 2 and the Decision card method).
- **Roles:** the lead runs the meeting; one person drives the changes and writes the record.

## In the session

1. **Context, 3 minutes:** what the customer is looking at (sketches of the same product in different shapes, on sample data), what is being decided today (structure and feel, not features), and that nothing here is final.
2. **Each concept, 5–8 minutes:** walk its scenarios; name its thesis and its signature in one sentence; let the customer ask for the next step. No defending: ask the written questions and write the answers down word for word.
3. **The worst case:** show every concept on it, the same way. Say where the concept strains; the honest risk is on its card.
4. **Live changes:** when the customer asks for something ("too cold", "less boxy", "I want to see the list first"), change the material and show it again while they watch. Keep each change inside the brief's rules and the pinned constraints. A request that breaks one gets a short explanation and the nearest change that keeps the rule.
5. **Mixing:** "the structure of B with the tone of A" is a fair request. Build it as a new concept with its own card, run the fit test on it, and show it before the end or in the next round.
6. **Close:** restate the chosen concept and the changes asked, and say when the locked version arrives. Ask who on the customer side approves gate CD and how (an email reply, the signed record, a comment).

## Remote feedback

- Collect remote reactions in the same record, one row per person, with their role.
- A comment that asks for a feature change goes to `kickoff:feedback`; today decides shape and feel only.
- Ask the same written questions in the same order. A remote customer who cannot ask "show me" needs the options visible in the message.

## After the session

- Write `<docs_root>/05-design/codesign-YYYY-MM-DD.md` from `../templates/codesign-record.md` the same day.
- Lock the concept (skill step 7). Mixed and changed ideas are folded into the chosen card, so the spec starts from one concept.
- Send the customer the locked card and ask for the CD approval in writing.

## Things that go wrong

| Symptom | Do |
| --- | --- |
| The customer likes all of them | Ask which one they would show their own customers, and which one their users would trust on day one. |
| The customer likes none | Ask what each one gets wrong in one word; take those words into a new round (step 3 of the skill). Do not lock a compromise nobody chose. |
| The customer only talks about colour | Go back to the scenarios: ask what the user does first and where they stop. If the concepts differ only in colour, they were one concept: re-run the round. |
| The decision-maker is absent | Record the reactions, send the material, and ask for the choice in writing. CD waits for the person who can approve it. |
| A concept breaks on the worst case | Say so, move on to the next one, and fix it before the next round. Never show a broken concept as the recommended one. |
| The customer asks for a feature change | Note it for `kickoff:feedback`; today decides shape and feel only. |
