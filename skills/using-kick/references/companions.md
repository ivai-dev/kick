# Companions

Optional tools a step can use when they are installed. kick never requires them (ECC is the one required tool). The catalogue lives in the CLI; `kick companions` lists it with what is installed and what the person answered.

## The catalogue

| Companion | Step | Offer it when | What it does for the person | Account |
| --- | --- | --- | --- | --- |
| superpowers | understand | the idea is still vague | an interview that turns a vague idea into a clear brief, one question at a time | no |
| mattpocock-skills | understand | a change in a running project needs a quick, sharp interview | grill-me: a short, sharp interview about a change | no |
| drawio | shape | a diagram is needed | architecture and flow diagrams that open and edit in draw.io | no |
| frontend-design | shape, build | the product has screens | a clear design direction and production-grade screen code | no |
| impeccable | shape, build | the product has screens | design critique and polish: spacing, type, colour, details | no |
| ui-ux-pro-max | shape | the product has screens | a searchable library of styles, palettes, font pairings and UX rules | no |
| figma | shape | the team designs in Figma | reads frames and tokens from Figma, puts directions on the canvas | yes |
| superdesign | shape | many design variants are wanted quickly | design variants to branch and compare | yes |
| playwright | build | the review agents look at the running screens | opens the running app in a browser to click through journeys and take screenshots (ECC's Chrome DevTools counts too) | no |
| context7 | build | the code uses libraries whose current documentation matters | current documentation of libraries while building | no |

**superpowers** brings its own plan and build steps. kick uses only its brainstorming interview; its plan and build steps would compete with ECC. Say so in one line when you offer it.

## How to offer

At the start of a step, run `kick companions --step <step>`. It lists only what that step calls for and is neither installed nor declined for good, with the install commands. When the list is empty, say nothing.

Offer what fits this kick (skip figma when nobody uses Figma), in one message, in plain words:

> For the next part, choosing how the app will look, two optional tools would help:
> - a library of styles and colour sets, so the directions I show you are better grounded (free, no account);
> - Figma, if your team already designs there: I could put the directions on your Figma canvas (needs a Figma account).
>
> Install them now (A), later (B), or don't ask again (C)? You can name just one.

Never ask in the middle of a task: only at the start of a step, or when the person asks.

## How to install

After an explicit yes:

1. Run the printed install commands (`claude plugin marketplace add …` when the marketplace is new, then `claude plugin install …`).
2. Report what was installed and what failed, with the error. Never retry a failed install silently.
3. Say that the tool loads in the next session (the person restarts Claude Code, or you continue without it this session).
4. Record the answer: `kick companions mark <id> installed`, `later` or `never`. "Later" is offered again at a later step; "never" is not offered again.

`kick doctor` shows how many companions are installed. The person can see and change everything with `kick companions`.
