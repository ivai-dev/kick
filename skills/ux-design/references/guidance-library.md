# Guidance library

Reusable devices that show users where they are and what to do next. Pick from this list instead of adding explanatory text.

Rules for every device:

- **One guidance device per screen**, in addition to the main content. Above the fold a screen holds at most the header, one device and the start of the main content.
- A device is attached to an item or a moment, and leaves when the user no longer needs it.
- The device is the explanation: no paragraph beside it that says the same thing, no tours, no coach marks.
- Every device has a text label; colour and motion are never the only carriers of meaning.
- Write the usage matrix (below) into the ux-spec so each screen group names its device.

## Next-action card ("To do")

A short list of what needs the user now. Each row: a count, the object, the oldest item or its name, and one verb button ("5 new applicants · Shrimp processing worker [Review]"). Rows the user cannot act on are grey "waiting" lines without a button.

- **Use:** the first block of work-tool homes (pipeline, health and tasks shapes). At most three rows, ordered by urgency: returned or failed first, then new, then due soon. On phones it is the first block.
- **Not:** on list screens; with KPIs or charts inside it; on an approver home that already is a queue (the queue is the device).
- **Nothing to do:** a positive empty state ("Nothing waits for you") without a button.

## Next-action hero

One question or one next step for occasional and self-service users ("What job are you looking for?", "Your interview is on Friday at 09:00").

- **Use:** public and self-service homes; the start screen of a shared device.
- **Not:** in work tools; with a second sentence that explains anything.

## Process map

A chain of 3–5 nodes for an item that passes several actors (submitted → reviewed → approved → published). Each node has a short label; the current node is marked ("Current step"); finished nodes show a check; a returned branch is a dashed arrow ("Returned for changes"). Vertical on phones.

- **Use:** in the context of one item, where the user waits on someone else or hands over to someone else: an approval panel, the detail of a submitted item, the last step of a registration that needs confirmation.
- **Not:** as a decorative page banner; more than one per screen; for an audience that must not see internal steps (show them their own shorter track instead).
- It replaces header sentences of the form "X happens only after Y approves".

## Step groups

A step bar for multi-step forms. Long flows group screens into named parts: "Part 2 of 3 · About you", with the current part in bold and a dot per screen inside it. Short flows: "Step 1 of 3 · Email".

- **Use:** every multi-step form, the same component on every surface.
- **Not:** single-page forms; "N steps left" counters; a state shown as a step ("Waiting for confirmation" is a state on the final screen, not a step).

## Status timeline

A vertical list of dated events of one item ("20/10 07:31 · Returned: the vacancy is hidden").

- **Use:** where someone must judge the item: approval panels, detail panels, items returned at least once.
- **Not:** on cards, lists or homes. The process map answers "where is it now"; the timeline answers "what happened".

## Empty states

An illustration, one sentence that says what will appear here, and the page's main action ("No vacancies yet" [Post a vacancy]). Size the illustration per surface (about 64 px in work tools, 96 px on public pages, 120 px on devices).

- **Positive empty state:** a cleared queue says so ("Nothing to approve") with no button.
- **Not:** while loading (use a skeleton); for zero search results without the active filters and a "Clear filters" action; on content pages, forms, tables inside a populated page, or dialogs.

## First-run task list

For a new account that must be set up before the product works: 3–5 tasks with the statuses *Done*, *Not started*, *Waiting* (the task-list pattern of public-service design systems). Only the next task has a button.

- **Use:** the first block of the home while setup is incomplete. It disappears for good when setup is done and is replaced once by a notice ("Your organisation is confirmed").
- **Not:** for staff accounts an administrator creates; on shared devices without a lasting session; as a tour or coach marks.

## Inline help popover (i)

One to three sentences on rules and consequences, opened from an (i) next to the page title.

- **Use:** work-tool screens whose rules matter but are not needed for every action (what approval changes, who is notified). The header sentence then names the task.
- **Not:** for anything the user needs in order to act: that belongs on the screen.

## Next-action highlight and landing

- The row or card that needs action gets the accent rule on its left edge; use it on that row only.
- Arriving from a notice or a to-do link, the target row gets a soft tint that fades once. In the prototype the link carries the row in a route parameter the screen reads (`#sc-31-employer?hl=uv7`).
- **Not:** an accent rule, a "new" chip and a coloured status on the same row: pick one.

## Motion

Motion explains a change; nothing moves on its own. Durations are the motion tokens of `foundation-rules.md` (100 · 150 · 200 · 250 · 300 ms, 300 the cap) with three curves (standard, enter, exit); only the changed region moves.

| What | Motion | Duration | Reduced motion | Not |
| --- | --- | --- | --- | --- |
| A status is reached (track or map node) | The new node fills once, on the first view after the change | 250 ms | Static node | On revisits, on lists |
| Decide and advance (approval queues) | The decided row collapses; the next panel slides in 8 px | 200 + 200 ms | Instant swap; the toast carries the message | — |
| Landing from a notice | The target row's tint fades out | 1.6 s, once | A static left rule for 5 s | More than one row |
| Step bar | The segment fills | 200 ms | Instant | — |
| Side panel, sheet, menu, toast | Slide or fade in, faster out | 200–250 in · 150–200 out | Dissolve ≤ 150 ms | Spring or overshoot |
| Page change in a work tool | Fade of the content region only | 150 ms | Dissolve 100 ms | Rising or sliding pages on every click |
| Charts | Grow once per chart per session; morph on data change | 300 ms / 200 ms | Static | Replaying on every visit |
| Attract loop on a shared device's start screen | A slow hint that stops at the first touch | loop | Static | Any other screen |

Never: count-up numbers, skeleton shimmer, pulsing badges, bouncing icons, confetti, carousels, or anything that moves for more than 5 s without a way to pause it (WCAG 2.2.2). With the reduced-motion setting every transition is instant and every cue is static.

## Usage matrix

Write one row per screen group into the ux-spec (✓ used, – not used):

| Screen group | To do | Hero | Process map | Step groups | Timeline | Empty | First run | (i) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| {{group, e.g. approver homes}} | – | – | – | – | – | ✓ positive | – | ✓ |
