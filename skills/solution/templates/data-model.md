# {{project_name}} — data model

- **Updated:** {{YYYY-MM-DD}}
- **Owner:** Project lead
- **Status:** {{Draft (hypothesis) or Accepted — YYYY-MM-DD}}
- **Scope:** the feature set signed off on {{YYYY-MM-DD}}, all releases; for a Draft, the feature set of `.kickoff/features.yaml` as drafted
- **Store:** {{data store and ADR-<nnn>}}

## Entities

| Entity | Purpose | Key attributes | Features | Release | Personal or customer content |
| --- | --- | --- | --- | --- | --- |
| {{name}} | {{what one record is}} | {{attribute (type), …}} | {{F<n>.<n>, …}} | {{first release that needs it}} | {{none / personal data / customer content}} |

## Relations

| From | Relation | To | Rule |
| --- | --- | --- | --- |
| {{entity}} | {{1–n / n–n / 1–1}} | {{entity}} | {{e.g. deleting the parent archives the children}} |

```mermaid
erDiagram
  {{ENTITY}} ||--o{ {{ENTITY}} : {{relation}}
```

## Retention

| Data | Kept for | Then | Source |
| --- | --- | --- | --- |
| {{entity or attribute}} | {{period}} | {{deleted / anonymised / archived}} | {{NFR-<area><n>, security rule or D<n>}} |

## Access scope

Roles come from the ux-spec. C create, R read, U update, D delete; "own" limits the right to records the user owns or takes part in.

| Entity | {{role}} | {{role}} | {{role}} |
| --- | --- | --- | --- |
| {{entity}} | {{CRUD / R own / —}} | {{rights}} | {{rights}} |
