# Trials: real people try the real screens

The most valuable feedback comes when people use the product, not when they look at it. The screens are real and the data is not, so a change now costs little.

## Who

Ask the person who will try it, by name: at least one real user of each kind (a librarian, a member), not only the person who ordered the product. Five people find most of the problems.

## How

1. Give each tester a link that runs (a preview deployment with the mock layer) and **tasks, not questions**: "Lend 'Dế Mèn phiêu lưu ký' to Nguyễn Văn An", not "what do you think?".
2. Watch or ask them to say what they think while doing it. Note where they stop, hesitate or go wrong.
3. Before each showing, say what is real and what is not: "The screens are the real product; the data is sample data and nothing is saved. Between 25 and 45 days of work remain after this, most likely about 30, mostly the server side." Use `kick estimate --remaining` for the range; always say it as a range.

## Recording and classifying

Every comment is a row in the kick's `feedback.md`:

| Date | Who | Screen or journey | Comment | Decision | Extra days | Round |
| --- | --- | --- | --- | --- | --- | --- |

Decision is one of:

- **now:** fixed in this kick (a task in `tasks.md`);
- **later:** a row in the roadmap, sized;
- **no:** with the reason.

Give each comment its extra days, then present the set as a Bounded approval: the person weighs the cost and decides. A comment that hits an endpoint marked costly says so.

## Limits

- **Two rounds per screen.** When a screen still changes a lot after the second round, stop changing it and go back to the question it answers: who is this screen for and what must they get done? The cause is usually in the brief, not the design.
- **New features** asked for during trials are "later" by default; moving one into this kick is a change (`kick:change`) with its cost.

## Finishing

When the criteria under "Finished when" hold, ask for "this is the product" (see the build skill).
