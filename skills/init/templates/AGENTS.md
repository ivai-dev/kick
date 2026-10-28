# {{project_name}}

Working rules for everyone who changes this repository. Keep this file short and current; the project lead owns it.

## Product

{{idea: one line from the interview at init: who the product is for and the problem it solves. A seed; discovery refines it into who uses the product, the platforms and what the MVP delivers (docs/01-discovery/vision-scope.md).}}

## Repository map

| Path | Contents | Owner (role) |
| --- | --- | --- |
| `.kickoff/` | Project settings, features, plan and state (source of truth for the plan) | Project lead |
| `docs/` | Discovery, requirements, research, architecture, design and planning documents | Project lead |
| `{{path}}` | {{contents: filled when the code structure exists}} | {{role}} |

## Security rules

{{security: every entry of `security` in .kickoff/project.yaml, one bullet each, verbatim}}

- Use synthetic data only in prototypes, fixtures, tests and examples; never real customer content.
- Never put development infrastructure (VPN names, private IP ranges, internal hosts) in any user-facing string.

## Languages

| Use | Language |
| --- | --- |
| Code, commits, repository documents, work items | {{languages.repo}} |
| Team conversation | {{languages.chat}} |
| Estimate workbook and customer deliverables | {{languages.workbook}} |
| UI strings and fixtures | {{languages.ui}} |

## Team and calendar

Roles, focus, calendar, holidays and hard dates live in `.kickoff/project.yaml` (default roles until changed). They are confirmed when planning, in `kickoff:plan`, if the project lead turns scheduling on (`scheduling` in `project.yaml`). Until then the plan is an estimate without dates.

## Workflow

The project follows the kickoff phases. Run `kickoff status` to see where it stands and what is still unclear (the clarity register, `.kickoff/clarity.yaml`); a phase starts only when `kickoff can <phase>` succeeds.

| # | Phase | Output | Gate to leave | Approver |
| --- | --- | --- | --- | --- |
| 0 | init | `.kickoff/project.yaml`, `.kickoff/clarity.yaml`, this file | — | — |
| 1 | discovery | vision and scope, stakeholders, open questions, decision log | C1 Vision | Project lead |
| 2 | research | validation plan, proposed ADRs, assumptions, architecture sketch (`Status: Draft`) | — | — |
| 3 | feature-map | feature map, non-functional requirements | C2 Draft scope | Project lead |
| 4 | design-concept | design brief, concepts, co-design record, the chosen concept | CD Customer chose the design concept | Customer |
| 5 | ux-design | UX specification with screen inventory, the project's design rules | — | — |
| 6 | prototype | clickable or experienceable full-product prototype, coverage list | — | — |
| 7 | signoff | workshop pack, sign-off record | C3 Features signed off, C4 MVP locked | Customer; project lead and customer |
| 8 | solution | architecture, data model, accepted ADRs | C5 Solution | Project lead |
| 9 | plan | WBS, estimate (ranges), risks; with scheduling on also the schedule and the estimate workbook | C6 Baseline | Project lead |

Rules:

- Commit late, explore early: no database, architecture or technology decision is committed (no accepted ADR, no final architecture document) before C3 and C4 are approved. An architecture sketch may be explored earlier if it carries `Status: Draft`; it binds nothing and no implementation starts from it.
- Estimates are ranges with a confidence and a basis, never a single number.
- Customer feedback is classified first, then applied in order: features → UX specification → prototype → plan → schedule (when scheduling is on); it reopens C3.
- With scheduling on, plan dates come from `kickoff schedule`, never from manual edits; the WBS handed to the team comes from `kickoff export`.
- Merges, branch deletions, publishing and pushes to shared branches are confirmed with the project lead first.
- Tickets and documents name the owning role, never a person.

## Design

The project's design rules live in `<docs_root>/05-design/design-rules.md`: each rule has its reason in the design brief and a test. Change a design rule there, with its reason, never in passing. Concepts, structure and look are chosen by the customer; design choices and gate requests are shown as decision cards (options visible, the cost of a wrong choice, "none of these", "show me first").

## Toolkit

The project uses two Claude Code plugins: kickoff, and ECC (`ecc@ecc`).

- **Kickoff owns** the gates, `.kickoff/`, the IDs, the documents under `docs_root`, the plan, the schedule and the WBS export.
- **ECC does the work it is given:** research, options, reviews, and after the baselined plan the build, review, QA and release (`orch-*`).
- **ECC output becomes evidence:** its reports are saved under `docs_root` and cited when a gate is approved; they never approve a gate themselves.
- **The CLI owns `.kickoff/state.yaml`:** a hook refuses hand edits; use `kickoff phase`, `kickoff gate` and `kickoff prototype record`.

## Definition of Done

A change is done when:

- [ ] it meets the acceptance criteria of its work item (the `item` block of its WBS package);
- [ ] tests for the new behaviour exist and the full test suite passes;
- [ ] `kickoff validate` reports 0 errors when `.kickoff/` files changed, and `kickoff docs --check` passes;
- [ ] documents affected by the change are updated in the same pull request;
- [ ] the security rules above hold and no test or fixture contains real customer data;
- [ ] the commit messages follow Conventional Commits and reference the WBS code or the tracker issue;
- [ ] the pull request was reviewed and approved by a team member other than its author.
