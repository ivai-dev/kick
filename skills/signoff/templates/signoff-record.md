# {{project_name}} — feature sign-off record

- **Workshop pack:** `{{YYYY-MM-DD}}-workshop-pack.md`
- **Prototype:** {{prototype link or file}}, version {{n}}
- **Recorded by:** Project lead

## Date and attendees

- **Date and place:** {{YYYY-MM-DD}}, {{place or call link}}

| Role | Organisation | Present |
| --- | --- | --- |
| {{role}} | {{organisation}} | {{yes / no}} |

## Features signed off by release

Reference: `.kickoff/features.yaml` at commit `{{commit}}`.

| Release | Features signed off | Count | Notes |
| --- | --- | --- | --- |
| {{release}} | {{F<n>.<n>, F<n>.<n>, …}} | {{n}} | {{notes}} |

## MVP scope

- **First release:** {{release}}, with features {{F<n>.<n>, …}}.
- **Moved out of the first release at this workshop:** {{F<n>.<n> → release, with decision D<n>; or "none"}}
- **MVP locked:** {{yes / no, and what is still open}}

## Changes requested

Each request goes to the feedback session (`01-discovery/feedback/`), which updates the feature map, the UX specification, the prototype and the plan in that order.

| # | Request (as said) | Raised by (role) | Feature or screen | Feedback item |
| --- | --- | --- | --- | --- |
| 1 | "{{quote}}" | {{role}} | {{F<n>.<n> or screen ID}} | {{FB-<n>, or "none"}} |

## Decisions

Also recorded in the Decision log of `open-questions.md`.

| ID | Decision | Taken by (role) | Answers | Source |
| --- | --- | --- | --- | --- |
| {{D<n>}} | {{decision}} | {{role}} | {{Q<n>}} | {{minutes, e-mail or signed document}} |

## Sign-off

- **Full feature set:** {{signed off / signed off subject to the changes above / not signed off}}, by {{role}}, evidence: {{signed minutes, e-mail or document link}}
- **MVP lock:** {{locked / not locked}}, by {{roles}}, evidence: {{link}}
- **Confirmation after changes:** {{YYYY-MM-DD, how the customer confirmed the changed prototype; or "not needed"}}

## Next steps

| Step | Owner (role) | Due |
| --- | --- | --- |
| {{step}} | {{role}} | {{YYYY-MM-DD}} |
