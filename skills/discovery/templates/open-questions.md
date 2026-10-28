# {{project_name}} — open questions and decisions

- **Updated:** {{date}}
- **Owner:** Project lead

Every question has a priority, an owner and the work it blocks. Questions with priority `now` are listed first. The needed-by date is optional while `project.yaml` has `scheduling: "off"` and required once scheduling is on. IDs are permanent: an answered question keeps its row with status `Answered` and a link to the decision.

| ID | Question | Why it matters | Blocks (phase/WBS) | Priority (now/soon/later) | Needed by (date, optional while scheduling is off) | Owner (role) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | {{question}} | {{what goes wrong or waits without an answer}} | {{e.g. feature-map, 1.2.3}} | {{now / soon / later}} | {{YYYY-MM-DD, or "—" while scheduling is off}} | {{role}} | {{Open / Answered (D<n>) / Dropped}} |

## Decision log

One entry per decision, added the day it is taken, newest last. IDs are permanent; a reversed decision gets a new entry that names the one it replaces.

### D1 — {{YYYY-MM-DD}}

- **Decision:** {{decision}}
- **Taken by:** {{role}}
- **Source:** {{meeting, document or record, with a link}}
- **Answers:** {{Q<n>, or "—"}}
- **Changes:** {{documents, features or plan items affected}}
