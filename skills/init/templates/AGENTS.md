# {{project_name}}

Working rules for everyone who changes this repository. Keep this file short and current; the project lead owns it.

## Product

{{one_paragraph: who uses the product, the problem it solves, the platforms, and what the MVP delivers. Filled from the brief at init and refined after discovery (docs/01-discovery/vision-scope.md).}}

## Repository map

| Path | Contents | Owner (role) |
| --- | --- | --- |
| `.kickoff/` | Project settings, features, plan, state and ticket map (source of truth for the plan) | Project lead |
| `docs/` | Discovery, requirements, research, architecture, design and planning documents | Project lead |
| `{{path}}` | {{contents: filled when the code structure exists}} | {{role}} |

## Security rules

{{security: every entry of `security` in .kickoff/project.yaml, one bullet each, verbatim}}

- Use synthetic data only in prototypes, fixtures, tests and examples; never real customer content.
- Never put development infrastructure (VPN names, private IP ranges, internal hosts) in any user-facing string.

## Languages

| Use | Language |
| --- | --- |
| Code, commits, repository documents, tracker issues | {{languages.repo}} |
| Team conversation | {{languages.chat}} |
| Estimate workbook and customer deliverables | {{languages.workbook}} |
| UI strings and fixtures | {{languages.ui}} |

## Workflow

The project follows the kickoff phases. Run `kickoff status` to see where it stands; a phase starts only when `kickoff can <phase>` succeeds.

| # | Phase | Output | Gate to leave | Approver |
| --- | --- | --- | --- | --- |
| 0 | init | `.kickoff/project.yaml`, this file | — | — |
| 1 | discovery | vision and scope, stakeholders, open questions, decision log | C1 Vision | Project lead |
| 2 | research | validation plan, proposed ADRs, assumptions | — | — |
| 3 | feature-map | feature map, non-functional requirements | C2 Draft scope | Project lead |
| 4 | ux-design | UX specification, design system | — | — |
| 5 | prototype | clickable full-product prototype | prototype checks pass | — |
| 6 | signoff | workshop pack, sign-off record | C3 Features signed off, C4 MVP locked | Customer; project lead and customer |
| 7 | solution | architecture, data model, accepted ADRs | C5 Solution | Project lead |
| 8 | plan | WBS, schedule, estimate workbook, risks | C6 Baseline | Project lead |
| 9 | tickets | tracker issues synced with the plan | — | — |

Rules:

- No database, architecture or technology decision before C3 and C4 are approved.
- Customer feedback is classified first, then applied in order: features → UX specification → prototype → plan → schedule; it reopens C3.
- Plan dates come from `kickoff schedule`, never from manual edits; tracker issues come from `kickoff tickets push`.
- Merges, branch deletions, publishing and pushes to shared branches are confirmed with the project lead first.
- Tickets and documents name the owning role, never a person.

## Definition of Done

A change is done when:

- [ ] it meets the acceptance criteria of its ticket;
- [ ] tests for the new behaviour exist and the full test suite passes;
- [ ] `kickoff validate` reports 0 errors when `.kickoff/` files changed, and `kickoff docs --check` passes;
- [ ] documents affected by the change are updated in the same pull request;
- [ ] the security rules above hold and no test or fixture contains real customer data;
- [ ] the commit messages follow Conventional Commits and reference the ticket;
- [ ] the pull request was reviewed and approved by a team member other than its author.
