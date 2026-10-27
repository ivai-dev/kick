# {{project_name}} — system architecture

- **Updated:** {{YYYY-MM-DD}}
- **Owner:** Project lead
- **Scope:** the feature set signed off on {{YYYY-MM-DD}} (`.kickoff/features.yaml` at commit `{{commit}}`), all releases
- **Decisions:** ADRs in `adr/`; this document names them, it does not repeat them

## Context

{{one paragraph: what the system does, for whom, and where it runs}}

| Actor or system | Kind | Interacts with | Through |
| --- | --- | --- | --- |
| {{role from the ux-spec, or external system}} | {{user role / external system / data source}} | {{container}} | {{web, desktop, mobile app, API, file drop}} |

```mermaid
flowchart LR
  {{actor}} --> {{container}}
```

## Containers

| Container | Responsibility | Technology (ADR) | Design patterns | Features served |
| --- | --- | --- | --- | --- |
| {{name}} | {{what it owns}} | {{technology}} ({{ADR-<nnn>}}) | {{patterns and where they apply}} | {{F<n>.<n>, …}} |

```mermaid
flowchart TB
  {{container}} --> {{container}}
```

## Deployment

| Environment | Hosting | Containers | Access | Data |
| --- | --- | --- | --- | --- |
| {{development / staging / production}} | {{where it runs}} | {{containers}} | {{who reaches it, from where}} | {{synthetic / customer data}} |

- **Release and rollback:** {{how a version is deployed and rolled back}}
- **Network boundaries:** {{what is exposed, what stays internal}}

## Data flow

### {{journey name}} ({{F<n>.<n>}})

1. {{step: actor or container, action, data, where it is stored}}

## Security

- **Project security rules** (from `project.yaml`):
  - {{rule}}
- **Identity and access:** {{how users sign in; access per role, see data-model.md}}
- **Secrets:** {{where secrets live, how they rotate}}
- **Data protection:** {{encryption in transit and at rest, customer content handling}}
- **Assets:** the product bundles its fonts, scripts and other assets; a prototype's use of hosted libraries or assets does not carry over to the product.

## Observability

| Signal | What is recorded | Where | Alert when | Customer content |
| --- | --- | --- | --- | --- |
| {{logs / metrics / traces}} | {{events or measures}} | {{tool or store}} | {{threshold}} | never recorded |

## NFR mapping

| NFR | Requirement | Mechanism | Container | Verified by |
| --- | --- | --- | --- | --- |
| {{NFR-<area><n>}} | {{requirement from nfr.md}} | {{how the design meets it}} | {{container}} | {{test, measurement or review, with its WBS code}} |

## Open decisions

Decisions whose ADR stays *Proposed* because a validation item is still pending, or "none".

| ADR | Decision | Waiting for | Due | Fallback if it fails |
| --- | --- | --- | --- | --- |
| {{ADR-<nnn>}} | {{decision}} | {{V<n>}} | {{YYYY-MM-DD}} | {{option}} |
