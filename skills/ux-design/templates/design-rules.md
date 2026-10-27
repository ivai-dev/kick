# {{project_name}} — design rules

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Derived from:** `design-brief.md`, `concepts.md` (chosen concept: {{name}}), `nfr.md`

These are this project's rules. None is a default: each has a reason in the brief or the NFRs, a test, and a place where it applies. A rule no test can check is advice and stays in the brief. A rule borrowed from another project is a hypothesis: keep it only when its reason holds here.

## Rules

| # | Rule | Why (brief / NFR reference) | Test | Applies to |
| --- | --- | --- | --- | --- |
| DR-1 | {{a measurable target or an observable behaviour, e.g. "a turn resolves visually in 4 seconds or less"}} | {{brief section or NFR ID}} | {{how to check: a measurement, a scenario, a review question}} | {{screen groups, audiences, platforms}} |

## Targets

| Target | Value | Source | Verified by |
| --- | --- | --- | --- |
| Accessibility | {{e.g. WCAG 2.2 AA}} | {{NFR-ACC<n>}} | {{tool / person}} |
| Language and locale | {{UI languages, number, date and currency formats}} | {{project.yaml, NFR}} | {{…}} |
| Devices and input | {{devices, screen sizes, input methods}} | {{brief, NFR}} | {{…}} |
| Performance the user feels | {{e.g. response or load time}} | {{NFR-PERF<n>}} | {{…}} |

## Terms

One name per thing. A term in "Do not use" never appears in the product.

| Term | Use | Do not use |
| --- | --- | --- |
| {{term}} | {{meaning and where it appears}} | {{synonyms to avoid}} |

## Tool checks

Which tool checks which rule. Report each as tool-checked evidence; a check that did not run is skipped, never passed.

| Rule or target | Tool | Command or way to run it |
| --- | --- | --- |
| {{DR-n}} | {{tool}} | {{command}} |

{{or: "None: reviewed by people (the design review loop)."}}

## Retired and ruled-out ideas

| Idea | Why it was ruled out | Decided in |
| --- | --- | --- |
| {{an idea or rule considered and dropped}} | {{reason}} | {{D<n> or review}} |
