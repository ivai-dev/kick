# Co-design session

The customer chooses the direction in the product itself, not from pictures of it. The published FE v0 shows two or three directions on the same real screens with the same data; the customer switches, adjusts and comments, and the team changes the design while the customer watches. One meeting of 45–60 minutes, or the same flow asynchronously through the Artifact.

## Before the session

- **The bundle:** `kickoff fe bundle`, published as a private Artifact (republish to the same URL for every version). Keep the prototype bar visible: no `?demo=0`. The lead approves sharing it with the customer.
- **Order:** the order agreed with the lead in step 7. Put the boldest direction second, never last: a customer who saw the safe option last tends to settle on it.
- **Scenarios:** one scenario per main audience that walks the three reference screens (home or public page, the list at volume, the form), so each direction is judged on the job, not on a hero.
- **Links per direction:** open each direction once and use "Copy link" in the Tweaks panel to keep a link that opens it directly (`?direction=<id>`). Put them in the invitation for anyone who joins late or reviews remotely.
- **Questions to ask,** written down: which one feels like *your* product; what would your users say on their first day; what would you remove; which one would you be proud to show your own customers.
- **Roles:** the lead runs the meeting, and one person (or you) drives the changes and writes the record.

## In the session

1. **Context, 3 minutes:** what the customer is looking at (the real product screens on sample data), what is being decided today (the look and feel, not the features), and how they can change it themselves (Direction, Tweaks).
2. **Each direction, 5–8 minutes:** play its scenario; name its thesis and its signature in one sentence; let the customer drive. No defending: ask the written questions and write down the answers word for word.
3. **Hands on, 10 minutes:** the customer moves the Tweaks (brand hue, colour strength, corner radius, motion) on the direction they lean to. The panel shows the button-text contrast live; below 4.5:1 it warns, and that setting cannot ship as it is.
4. **Live changes:** when the customer asks for something the Tweaks cannot do ("the headings feel too cold", "less boxy"), change the direction file (type, colour roles, borders, shadows, motion) and republish while they watch. Keep each change inside the floor of `design-system.md`. A request that breaks it (heavier type than the Vietnamese rules allow, a contrast below AA) gets a short explanation and the nearest change that keeps the rule.
5. **Mixing:** "the colours of B with the type of A" is a fair request. Build it as a new direction file with its own id, check it (`kickoff fe check --direction <id>`), and show it before the end of the meeting or in the next version.
6. **Close:** restate the chosen direction, the tweak link and the changes asked, and say when the locked version arrives. Ask who on the customer side approves gate CD and how (an email reply, the signed record, an Artifact comment).

## Remote feedback

- Comments on the Artifact go to `kickoff:feedback` like any other remark. A comment that carries a "Copy link" link shows exactly the direction and tweaks the customer had on screen: open it before answering.
- Collect remote choices in the same record, one row per person, with their role and their link.

## After the session

- Write `<docs_root>/05-design/codesign-YYYY-MM-DD.md` from `../templates/codesign-record.md` the same day.
- Lock the direction (skill step 9). The tweak values of the chosen link are folded into the direction file. A tweak never stays as a URL parameter in the product.
- Send the customer the locked version (republish) and ask for the CD approval in writing.

## Things that go wrong

| Symptom | Do |
| --- | --- |
| The customer likes all of them | Ask which one they would show their own customers, and which one their users would trust on day one. |
| The customer likes none | Ask what each one gets wrong in one word; take those words back to impeccable's re-roll ("safer" or "bolder") and run step 4 again. Do not lock a compromise nobody chose. |
| The decision-maker is absent | Record the reactions, send the links per direction, and ask for the choice in writing. CD waits for the person who can approve it. |
| A direction breaks on a real screen in the meeting | Say so, switch to the next one, and fix it before the next version. Never show a broken direction as the recommended one. |
| The customer asks for a feature change | Note it for `kickoff:feedback`; today decides the look only. |
