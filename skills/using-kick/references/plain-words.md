# Plain words

The person you talk to has never seen kick. They know their product, not our process. Every question, option list, request for agreement and report you say to them must be understandable on its own, in everyday words.

## The rule

No step names used as jargon, no file names, no codes, no commands, no plugin terms in what you say to the person. Keys, file names and commands belong in the files and in commits.

## Seven steps for every message

1. **Where we are and why you ask**, in one or two sentences: what we are doing, and what the answer unlocks or changes.
2. **Options by what they mean** for the person's product, money or time, each with a concrete example. Never by how kick works.
3. **Translate every kick term** (table below) before it reaches the person.
4. **What each answer leads to**: yes, no, "not sure". Say what becomes expensive to change once they answer, and what you assumed on their behalf.
5. **What the person has to do**: pick a letter, answer in a sentence, or ask to see something first.
6. **Their chat language** (`languages.chat` in `project.yaml`), short sentences, one decision per message unless they belong together.
7. **Read it back** as someone who has never seen kick. If a word needs kick to be understood, rewrite it.

## Translation table

| In kick | Say to the person |
| --- | --- |
| a kick | "this piece of work", "the new product", "the reminder feature" |
| product kick | "working out the product until you can see and try it" |
| feature kick | "building this feature for real" |
| understand (agreement) | "Is this what you want, for whom, and what is out of scope?" |
| shape (agreement) | "This is how we'll build it and how it will look. Anything wrong before I break it into tasks?" |
| plan (agreement) | "These are the tasks, about X to Y days. Shall we start?" |
| this is the product | "These screens and features are the product. After this we design the data and build the server side, and changes cost more." |
| it works as agreed | "Does it work the way we agreed? If yes, I'll close this piece of work." |
| mock API, mock data | "The screens run on sample data for now; nothing is saved yet." |
| API contract | "The list of what the screens ask the server for and what they get back." |
| data model | "How the information is stored: what things exist and how they connect." |
| probe | "A small throw-away test to find out whether X works, before we rely on it." |
| Foundation | "The groundwork: sign-in, the database, putting it online, and one flow working end to end." |
| roadmap | "The list of features we build next, in order, with rough sizes." |
| range, confidence, basis | "Between 8 and 15 days, most likely 10; we are not very sure because we have not built anything like it." |
| overhead | "Time for coordinating the work, added on top." |
| unclear marker | "Something we still don't know: …" |
| agreement cleared | "This changed something we agreed, so I'll check it with you again." |
| companion | the tool's job: "a tool that draws diagrams you can edit" |
| ECC | "the toolkit that writes, tests and reviews the code" |

## Example

Not this: "Shape agreed. Running kick:plan; the tasks table will have probes and the finished-when criteria."

This:

> We've agreed how to build the library app and how it will look. Next I'll split the work of building the real screens into tasks with a rough number of days each, and add two small tests to check that the old barcode scanner works in a browser. Then I'll show you the total. Shall I go ahead?
