# {{project_name}} — record of the feature agreement

Written in plain words so the customer can confirm it as it stands. Codes in the Reference columns are for the project team's records only.

- **Workshop document:** `{{YYYY-MM-DD}}-workshop-pack.md`
- **Prototype:** {{prototype link or file}}, version {{n}}
- **Recorded by:** Project lead

## Date and attendees

- **Date and place:** {{YYYY-MM-DD}}, {{place or call link}}

| Role | Organisation | Present |
| --- | --- | --- |
| {{role}} | {{organisation}} | {{yes / no}} |

## Features agreed, by release

Reference: `.kickoff/features.yaml` at commit `{{commit}}`.

| Release | Features agreed (in words) | Count | Notes | Reference |
| --- | --- | --- | --- | --- |
| {{release}} | {{each feature in a few words}} | {{n}} | {{notes}} | {{F<n>.<n>, F<n>.<n>, …}} |

## First release

- **What the first release contains:** {{release}}, with {{features in words}} (Reference: {{F<n>.<n>, …}}).
- **Moved to a later release at this workshop:** {{feature in words → release, with the decision made; or "none"}} (Reference: {{F<n>.<n>, D<n>}})
- **First release agreed:** {{yes / no, and what is still open}}

## Changes requested

Each request is worked through in a feedback session (`01-discovery/feedback/`): the feature list, the screens, the prototype and the plan are updated in that order, and the customer is asked to look again.

| # | Request (as said) | Raised by (role) | What it affects | Reference |
| --- | --- | --- | --- | --- |
| 1 | "{{quote}}" | {{role}} | {{feature or screen, in words}} | {{F<n>.<n> or screen ID; FB-<n>, or "none"}} |

## Decisions

Also recorded in the Decision log of `open-questions.md`.

| Decision | Taken by (role) | Question it answers | Source | Reference |
| --- | --- | --- | --- | --- |
| {{decision in a sentence}} | {{role}} | {{the question in words}} | {{minutes, e-mail or signed document}} | {{D<n>, Q<n>}} |

## Agreement

- **Full list of features:** {{agreed / agreed subject to the changes above / not agreed}}, by {{role}}, evidence: {{signed minutes, e-mail or document link}}
- **First release locked:** {{locked / not locked}}, by {{roles}}, evidence: {{link}}
- **Confirmation after changes:** {{YYYY-MM-DD, how the customer confirmed the changed prototype; or "not needed"}}

## Next steps

| Step | Owner (role) | Due |
| --- | --- | --- |
| {{step}} | {{role}} | {{YYYY-MM-DD}} |
