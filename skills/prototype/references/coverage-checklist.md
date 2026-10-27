# Coverage checklist

Walk this list before every delivery, screen group by screen group. It is generic on purpose: it holds no values, and the project's own `design-rules.md` adds its rows. Tick each item in the build plan, or record a ruling (`Ruling: <decision> — <why> — <cost if wrong>`) when an item is knowingly left open. Say how each item was checked: by a tool, by a person, or assumed (a check that did not run is skipped, never passed).

A "screen" is any unit of experience: a screen, a scene, a level, a flow state.

| # | Item | How to check |
| --- | --- | --- |
| 1 | **Coverage.** Every inventory screen has a row per audience in `prototype-coverage.md`, each cell shown or ruled; no screen shown that the inventory lacks. | Compare the matrix with the ux-spec inventory (`kickoff validate` lists it). |
| 2 | **Releases and the MVP line.** Later-release parts are marked and the MVP is visible as such; nothing of a later release reads as part of the MVP. | Walk each screen group in the MVP view and the full view (or the matrix's MVP column). |
| 3 | **Scenarios.** Each scenario walks from start to end and shows the features it names. | Play each one; compare with the prototype brief. |
| 4 | **One job and one next step.** A new user can say what to do first on any screen in five seconds. | Show each screen to someone who has not seen it, or walk it as that audience. |
| 5 | **States exist.** Default, empty, error, slow or loading, and the project's own states (offline, locked, no permission, paused). | Open each screen with no data, a failure and a slow response. |
| 6 | **Extremes.** None, one, many, the longest name or title, the worst case, per screen. The layout holds and long text is handled. | Run each screen on the extremes named in its per-screen plan. |
| 7 | **Language and formats.** All user-facing text is in the UI language; numbers, dates, times, money and units follow the copy guide; no English left behind. | Read every string (export them where the tool allows) and every number. |
| 8 | **Synthetic data only.** Invented names, organisations and contents; nothing copied from customer material. | Read the content; search it for real names from the discovery inputs. |
| 9 | **No development infrastructure or internal codes** in user-facing text: no host names, private addresses, tool accounts, screen codes, ticket IDs or words like "prototype", "demo", "mock". | Search the text with the patterns in `design.forbidden` (`kickoff check-docs` on a text export); read the screens as the customer sees them. |
| 10 | **Fidelity.** The screens show the product's chrome, navigation and wording; the only non-product element is the prototype's own control, kept off the customer's screens; no note says the prototype differs from the product. | Open the customer's view of every audience's entry point and compare with the ux-spec. |
| 11 | **The signature is present** in every screen group, as named in the concept. | Walk each group and point at it. |
| 12 | **Fit test passes.** The per-screen plan records the answers, and the screen is not interchangeable with another product's. | Read the plans in the build plan; swap the name and look again. |
| 13 | **Look-alike blocks.** Two blocks on a screen differ in purpose and shape; no count repeats what a list beside it shows; the same text never appears twice. | Read each screen from top to bottom. |
| 14 | **Navigation versus state.** Navigation goes to distinct places; filters, sorts and modes stay where they are. | Click through each audience's navigation. |
| 15 | **Project rules.** Every row of `design-rules.md` that applies to the screen group holds, checked with the row's own test. | Walk the rows; record the result per row. |
| 16 | **Accessibility and inclusion targets** of `design-rules.md` (contrast, size, input methods, reduced motion, assistive technology, languages, devices) hold. | Use the verification the rules name; report tool-checked and person-reviewed apart. |
| 17 | **Evidence is honest.** The report separates tool-checked, person-reviewed and assumed; skipped checks are listed as skipped. | Read the report against the build plan. |
