# Feature Map

Status: v3 — 2026-09-26. Scope source: `docs/01-discovery/vision-scope.md`. Dates and effort: `docs/06-planning/ke-hoach-tong-the-ai-minute.xlsx` (sheet "Phạm vi tính năng" uses the same IDs).

**Releases:** **MVP** (web first, accepted before December 2026) · **Pilot** · **Apps** (Windows and Android apps — the recommended way to record in the final product) · **R2** · **R3** · **Rollout** · **Warranty**.
**Priority:** **P0** must have for the release, **P1** should have, **P2** nice to have (first to drop).
**Platforms:** **W** web (MVP; Chrome/Edge on Windows laptops), **M (web)** web on phones for viewing and approving, **D** Windows app, **M** Android app.
**WBS:** the work package that delivers the feature.

## E0 — Project inception

| ID   | Item                                                       | Release | Prio | WBS   |
| ---- | ---------------------------------------------------------- | ------- | ---- | ----- |
| F0.1 | Send open questions to the customer and track answers      | MVP     | P0   | 1.2.1 |
| F0.2 | Agree MVP scope and NFRs with the customer                 | MVP     | P0   | 1.2.4 |
| F0.3 | System architecture document                               | MVP     | P0   | 1.2.2 |
| F0.4 | Gate G1: ASR model, GPU sizing, MVP scope                  | MVP     | P0   | 1.4.1 |
| F0.5 | Design direction and web wireframes                        | MVP     | P0   | 1.2.3 |
| F0.6 | Hi-fi web mockups and prototype review                     | MVP     | P0   | 1.2.3 |
| F0.7 | WBS, estimate and plan (done)                              | MVP     | P0   | 0.1.6 |
| F0.8 | Stories and acceptance criteria per batch                  | MVP     | P0   | 1.2.5 |
| F0.9 | Customer sign-off of the full feature set on the prototype | MVP     | P0   | 1.2.7 |

## E1 — Foundation and developer experience

| ID   | Feature                                                            | Release | Prio | Platforms | WBS   |
| ---- | ------------------------------------------------------------------ | ------- | ---- | --------- | ----- |
| F1.1 | Monorepo tooling: TypeScript, ESLint, Prettier, Vitest, Playwright | MVP     | P0   | all       | 1.3.1 |
| F1.2 | CI: checks and web build                                           | MVP     | P0   | W         | 1.3.1 |
| F1.3 | Web app shell and composition root                                 | MVP     | P0   | W         | 1.3.1 |
| F1.4 | Design system base (tokens, core components, bundled fonts)        | MVP     | P0   | W         | 1.3.2 |
| F1.5 | Logger with meeting-content redaction; error handling              | MVP     | P0   | all       | 1.3.2 |
| F1.6 | i18n (Vietnamese)                                                  | MVP     | P0   | W         | 1.3.2 |
| F1.7 | Dark theme                                                         | R2      | P2   | W D M     | 6.2.3 |

## E2 — Identity and access

| ID    | Feature                                                                                                                                        | Release | Prio | Platforms | WBS   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---- | --------- | ----- |
| F2.1  | Sign in / sign out, session refresh                                                                                                            | MVP     | P0   | W         | 2.1.5 |
| F2.2  | Fixed roles: system admin, unit admin, secretary, chairperson, reader; several roles per user; admins cannot read meeting content              | MVP     | P0   | server    | 2.1.5 |
| F2.3  | Independent units on one server: every record belongs to one unit, strict isolation, no hierarchy between units                                | MVP     | P0   | server    | 2.1.5 |
| F2.10 | Account and unit scripts: create a unit with its minutes header, create users and roles, reset a password, unlock, load the built-in templates | MVP     | P0   | server    | 2.3.2 |
| F2.11 | First sign-in password change and lockout after 5 failures                                                                                     | MVP     | P0   | W         | 2.1.5 |
| F2.4  | User management screens (unit admin)                                                                                                           | R2      | P0   | W         | 6.5.1 |
| F2.5  | Unit management screens (system admin)                                                                                                         | R2      | P0   | W         | 6.5.2 |
| F2.7  | Classification level per meeting and access rules by level                                                                                     | R2      | P0   | server    | 6.2.2 |
| F2.8  | Unit profile screen (the minutes header comes from the unit profile, set by script in the MVP)                                                 | R2      | P0   | W         | 6.5.1 |
| F2.9  | Activity log screens: unit log for the unit admin, server log for the system admin (no meeting content)                                        | R2      | P0   | W         | 6.5.1 |
| F2.6  | Single sign-on with the agency identity system                                                                                                 | R3      | P1   | W D M     | 7.2.1 |

Deployment model (D4): units are independent, with no province → commune hierarchy; "province", "commune" and "ward" are only names. In production each unit has its own server. During the MVP and pilot, several trial units share one server, so the product supports several isolated units per server from the MVP; in production the same features manage the one unit on its server.

## E3 — Meetings

| ID   | Feature                                                         | Release | Prio | Platforms | WBS   |
| ---- | --------------------------------------------------------------- | ------- | ---- | --------- | ----- |
| F3.1 | Create/edit meeting: title, time, location, chairperson, agenda | MVP     | P0   | W         | 2.1.7 |
| F3.2 | Participants                                                    | MVP     | P1   | W         | 2.2.9 |
| F3.3 | Context notes and glossary (names, places, terms)               | MVP     | P0   | W         | 2.2.9 |
| F3.5 | Choose the minutes template per meeting                         | MVP     | P0   | W         | 2.1.7 |
| F3.6 | Quick record (details filled in later)                          | MVP     | P0   | W         | 2.1.7 |
| F3.4 | Reference documents as LLM context                              | R2      | P2   | W D       | 6.4.3 |
| F3.7 | Scheduling, invitations, reminders                              | R2      | P1   | W D M     | 6.4.1 |
| F3.8 | Meeting rooms catalog and booking                               | R2      | P2   | W D       | 6.4.2 |
| F3.9 | Recurring meetings and series                                   | R3      | P2   | W D       | 7.2.2 |

## E4 — Recording

| ID    | Feature                                                                                    | Release | Prio | Platforms | WBS   |
| ----- | ------------------------------------------------------------------------------------------ | ------- | ---- | --------- | ----- |
| F4.1  | Recording state machine and upload queue (`packages/core`)                                 | MVP     | P0   | all       | 2.1.1 |
| F4.2  | Recording protocol spec and contract test suite                                            | MVP     | P0   | all       | 1.3.5 |
| F4.5  | Web recorder — the MVP recorder (AudioWorklet, OPFS buffer, Wake Lock, condition warnings) | MVP     | P0   | W         | 2.1.2 |
| F4.6  | Automatic recovery after network loss or tab reload, complete upload                       | MVP     | P0   | W         | 2.2.1 |
| F4.7  | Recording controls (start, pause, stop)                                                    | MVP     | P1   | W         | 2.1.6 |
| F4.8  | Input level, microphone selection, pre-flight check                                        | MVP     | P1   | W         | 2.1.6 |
| F4.9  | Time markers                                                                               | R2      | P2   | W D M     | 6.4.3 |
| F4.10 | Several recording devices per meeting, joined by QR code                                   | R2      | P1   | D M       | 6.3.1 |
| F4.11 | External USB / conference microphones                                                      | R2      | P2   | D         | 6.3.3 |

Apps: background recording is specified in E12 (Windows) and E13 (Android); F12.5 covers recording without a server connection at start.

## E5 — Transcription (ASR)

| ID    | Feature                                                      | Release | Prio | Platforms | WBS   |
| ----- | ------------------------------------------------------------ | ------- | ---- | --------- | ----- |
| F5.1  | Streaming ASR service on GPU (partial and final text)        | MVP     | P0   | server    | 2.1.4 |
| F5.2  | Glossary biasing                                             | MVP     | P1   | server    | 2.2.2 |
| F5.3  | Second, more accurate recognition pass                       | MVP     | P1   | server    | 2.2.2 |
| F5.4  | Batch transcription of audio uploaded after an interruption  | MVP     | P0   | server    | 2.2.2 |
| F5.5  | Vietnamese punctuation, capitalization, number normalization | MVP     | P1   | server    | 2.2.2 |
| F5.6  | Live transcript view                                         | MVP     | P0   | W         | 2.1.6 |
| F5.7  | Transcript review: play a segment, edit text                 | MVP     | P0   | W         | 2.2.6 |
| F5.8  | ASR quality harness: syllable error rate, latency            | MVP     | P0   | QA        | 1.1.2 |
| F5.11 | ASR model selection and GPU sizing (ADR-009)                 | MVP     | P0   | server    | 1.1.3 |
| F5.12 | Vietnamese test data set (≥ 2 hours)                         | MVP     | P0   | QA        | 1.1.1 |
| F5.9  | Speaker identification (voice enrollment)                    | R2      | P0   | server    | 6.2.1 |
| F5.13 | Voice profiles and enrollment                                | R2      | P0   | W server  | 6.5.1 |
| F5.10 | Khmer, language identification, translation                  | R3      | P1   | server    | 7.3.1 |

## E6 — Minutes

| ID    | Feature                                                            | Release | Prio | Platforms | WBS   |
| ----- | ------------------------------------------------------------------ | ------- | ---- | --------- | ----- |
| F6.1  | LLM service and job queue (never starves ASR)                      | MVP     | P0   | server    | 2.2.3 |
| F6.2  | Draft minutes from transcript, meeting info and template           | MVP     | P0   | server    | 2.2.4 |
| F6.3  | Built-in templates in the official format, loaded by script        | MVP     | P0   | server    | 2.2.4 |
| F6.4  | Minutes editor beside the transcript, with source links            | MVP     | P0   | W         | 2.2.7 |
| F6.6  | Simple approval: draft → submitted → approved or changes requested | MVP     | P1   | W         | 2.3.1 |
| F6.7  | Export DOCX and PDF from the template                              | MVP     | P0   | W         | 2.2.5 |
| F6.8  | Print                                                              | MVP     | P0   | W         | 2.2.8 |
| F6.13 | View, approve and share minutes on a phone (web)                   | MVP     | P1   | M (web)   | 2.3.3 |
| F6.5  | Regenerate one section, keep manual edits                          | R2      | P2   | W D       | 6.4.3 |
| F6.14 | Template management screen (upload, preview, set a default)        | R2      | P0   | W         | 6.5.1 |

Removed: F6.9, F6.10, F6.11, F6.12 (see decision D2).

## E7 — History and search

| ID   | Feature                                          | Release | Prio | Platforms | WBS   |
| ---- | ------------------------------------------------ | ------- | ---- | --------- | ----- |
| F7.1 | Meeting list with filters                        | MVP     | P0   | W         | 2.1.7 |
| F7.2 | Basic search: title, date, participants          | MVP     | P1   | W         | 2.2.8 |
| F7.3 | Meeting detail: info, audio, transcript, minutes | MVP     | P0   | W         | 2.2.8 |
| F7.5 | Retention policies and archival                  | R2      | P1   | server    | 6.5.3 |
| F7.7 | Vietnamese full-text search (accent-insensitive) | R2      | P1   | W D M     | 6.4.4 |
| F7.4 | Semantic search and Q&A over the archive         | R3      | P1   | W D       | 7.4.2 |

F7.6 moves into E14.

## E8 — Backend platform

| ID   | Feature                                                                 | Release | Prio | WBS   |
| ---- | ----------------------------------------------------------------------- | ------- | ---- | ----- |
| F8.1 | API, OpenAPI, authentication, authorization (ADR-008)                   | MVP     | P0   | 1.3.3 |
| F8.2 | Database schema and migrations (PostgreSQL)                             | MVP     | P0   | 1.3.3 |
| F8.3 | Audio ingest: WebSocket gateway, chunk storage, idempotent acks, resume | MVP     | P0   | 2.1.3 |
| F8.4 | Job queue and workers (batch ASR, minutes, export)                      | MVP     | P0   | 2.2.3 |
| F8.5 | Audit log; server-side encryption at rest                               | MVP     | P1   | 2.3.4 |
| F8.6 | Admin API: users, templates, settings                                   | R2      | P1   | 6.5.1 |

## E9 — Deployment and operations

| ID    | Feature                                                    | Release  | Prio | WBS   |
| ----- | ---------------------------------------------------------- | -------- | ---- | ----- |
| F9.1  | Docker Compose profiles (dev, gpu, prod)                   | MVP      | P0   | 1.3.4 |
| F9.2  | Staging on the customer's trial server                     | MVP      | P0   | 1.3.4 |
| F9.3  | Offline install bundle, pinned versions, install rehearsal | MVP      | P0   | 2.3.5 |
| F9.4  | TLS with the internal CA, reverse proxy                    | MVP      | P0   | 2.3.5 |
| F9.5  | Backups and tested restore                                 | MVP      | P0   | 2.3.5 |
| F9.6  | Basic monitoring and health checks (full monitoring in R2) | MVP      | P1   | 2.3.6 |
| F9.8  | Operator guide and secretary quick guide                   | MVP      | P0   | 3.1.1 |
| F9.9  | Warranty support, patches, periodic model updates          | Warranty | P0   | 9.1.1 |
| F9.11 | Models and offline updates screen                          | R2       | P0   | 6.5.2 |
| F9.12 | Backup and restore screen                                  | R2       | P0   | 6.5.2 |
| F9.13 | Server settings screen (certificate, address, time)        | R2       | P0   | 6.5.2 |
| F9.10 | Multi-server deployment, high availability                 | R3       | P2   | 7.5.2 |

## E14 — Statistics and reports

| ID    | Feature                                                       | Release | Prio | Platforms | WBS   |
| ----- | ------------------------------------------------------------- | ------- | ---- | --------- | ----- |
| F14.1 | Unit overview                                                 | R2      | P1   | W         | 6.5.5 |
| F14.2 | Recognition quality                                           | R2      | P1   | W         | 6.5.5 |
| F14.3 | Server monitoring                                             | R2      | P1   | W         | 6.5.5 |
| F14.4 | Periodic reports (month, quarter, year), exported as PDF/XLSX | R2      | P1   | W         | 6.5.6 |
| F14.5 | Scheduled monthly report delivered in the app                 | R2      | P1   | W D M     | 6.5.6 |

## E15 — Notifications

| ID    | Feature                                                                                                                     | Release | Prio | Platforms | WBS   |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ------- | ---- | --------- | ----- |
| F15.1 | In-app notification center: submitted, approved, changes requested, invitations, reminders, upload problems, account alerts | R2      | P1   | W D M     | 6.5.7 |

## E10 — Quality and acceptance

| ID    | Feature                                                 | Release | Prio | WBS   |
| ----- | ------------------------------------------------------- | ------- | ---- | ----- |
| F10.1 | Test strategy, browser and device matrix                | MVP     | P0   | 1.2.6 |
| F10.2 | Web recording reliability matrix (browsers × scenarios) | MVP     | P0   | 2.4.1 |
| F10.3 | Automated end-to-end tests (Playwright)                 | MVP     | P1   | 2.4.3 |
| F10.4 | Performance test: concurrent meetings                   | MVP     | P0   | 2.4.2 |
| F10.5 | UAT plan, UAT session, acceptance report                | MVP     | P0   | 3.2.1 |
| F10.6 | Security testing (internal penetration test)            | R3      | P0   | 7.6.1 |

## E11 — Pilot, rollout and handover

| ID    | Feature                                  | Release | Prio | WBS   |
| ----- | ---------------------------------------- | ------- | ---- | ----- |
| F11.1 | Pilot in 2–3 units, metrics, release 1.1 | Pilot   | P0   | 4.2.1 |
| F11.2 | Rollout in waves                         | Rollout | P0   | 8.2.1 |
| F11.3 | Training and handover                    | Rollout | P0   | 8.3.2 |

## E12 — Windows app (recommended recording client)

| ID    | Feature                                                                  | Release | Prio | WBS   |
| ----- | ------------------------------------------------------------------------ | ------- | ---- | ----- |
| F12.1 | Hardened Electron shell and desktop app UX (tray, close while recording) | Apps    | P0   | 5.2.1 |
| F12.2 | Recorder in the main process, SQLite, crash recovery                     | Apps    | P0   | 5.2.2 |
| F12.3 | Local encryption at rest (`safeStorage`)                                 | Apps    | P0   | 5.2.3 |
| F12.4 | Signed installer, auto-update from the internal server                   | Apps    | P0   | 5.2.4 |
| F12.5 | Recording without a server connection at start (desktop and Android)     | Apps    | P0   | 5.2.2 |
| F12.6 | Desktop reliability test                                                 | Apps    | P0   | 5.2.5 |

## E13 — Android app (recommended recording client on phones)

| ID    | Feature                                                                    | Release | Prio | WBS   |
| ----- | -------------------------------------------------------------------------- | ------- | ---- | ----- |
| F13.1 | Capacitor shell and platform adapters                                      | Apps    | P0   | 5.3.1 |
| F13.2 | Kotlin recorder plugin with a foreground service (screen lock, app switch) | Apps    | P0   | 5.3.2 |
| F13.3 | Android Keystore encryption; trust the internal CA only                    | Apps    | P0   | 5.3.3 |
| F13.4 | APK distribution, battery-optimization guide                               | Apps    | P0   | 5.3.4 |
| F13.5 | Android device matrix (2–3 vendors)                                        | Apps    | P0   | 5.3.5 |

## MVP critical journey

The MVP is accepted only if this journey works end to end in Chrome/Edge on a Windows laptop:

1. The secretary signs in (accounts are created by script).
2. The live Vietnamese transcript appears while people speak.
3. The network drops for several minutes, or the tab is reloaded; recording resumes from the local buffer and the transcript catches up.
4. The secretary stops; draft minutes are generated from the chosen template.
5. The secretary corrects the transcript and minutes and submits; the chairperson approves on a laptop or a phone.
6. The minutes are exported to DOCX/PDF and printed; the meeting is found later in the history.
