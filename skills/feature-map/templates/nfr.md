# {{project_name}} — non-functional requirements

- **Version:** {{version}} ({{date}})
- **Owner:** Project lead
- **Sources:** {{vision-scope.md sections, security rules, research items (V<n>) and decisions (D<n>) used}}

Each requirement has a measurable target, the release from which it applies, and the way it is verified. IDs are permanent: `NFR-<area><n>`, where the area is one of `PERF` performance, `AVAIL` availability, `SEC` security, `PRIV` privacy, `ACC` accessibility, `COMP` compatibility, `OPS` operations, `DATA` data and retention, `LOC` localisation. A requirement that is dropped keeps its row with the target `Dropped (D<n>)`.

| ID | Requirement | Measure | Target | Release | Verified by |
| --- | --- | --- | --- | --- | --- |
| NFR-PERF1 | {{requirement, e.g. "Pages open quickly on the office network"}} | {{metric and method, e.g. "time to interactive, 95th percentile, synthetic data"}} | {{target, e.g. "≤ 2 s"}} | {{release}} | {{test or review, and the role that runs it}} |
| NFR-SEC1 | {{requirement}} | {{metric and method}} | {{target, or "TBD (Q<n>)"}} | {{release}} | {{test or review, and the role that runs it}} |

## Notes

- {{assumptions behind the targets (A<n>), and targets that wait on an open question (Q<n>)}}
