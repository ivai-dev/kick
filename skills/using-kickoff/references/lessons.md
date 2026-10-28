# Lessons encoded as checks

Each row is a mistake made on a real project and where it is now prevented. The projects: AI Minute (a meeting-minutes product), a public employment portal with a Vietnamese UI (job seekers, employers, staff and commune kiosks), a game that came out of `ux-design` as a management console, and running kickoff next to the ECC plugin. Phase skills quote the rows that apply to them in their **Lessons** section.

| # | Lesson | Where it is enforced |
| --- | --- | --- |
| 1 | `chain_after` created a cycle; the schedule ran to 2039 | `validate` cycle detection; `schedule` refuses to run with a cycle |
| 2 | Literal `\n` in a Bash heredoc became real newlines in a code file | skills write files with file tools, not heredocs |
| 3 | A late sign-off moved the MVP gate | the `signoff` workshop date is a package in `plan.yaml` with a risk entry; `schedule` shows its effect |
| 4 | Republishing the prototype link from a new session was refused | `prototype` publish step: read the published link, compare it with the recorded build, ask the lead when it matches none |
| 5 | ECC's GateGuard stopped the first write of every kickoff document | `kickoff ecc setup` exempts `.kickoff/**`, `docs_root` and `AGENTS.md`; `ecc doctor` D5 |
| 6 | ECC handoffs were broken: `plan-orchestrate` emits an unloaded `/orchestrate`, and the `epic-*` commands use a script path relative to the current folder | `kickoff ecc run`; `references/ecc.md` never uses `plan-orchestrate` |
| 7 | The installed plugin lagged the repository and the CLI matched the old one | start-up check 1 compares the CLI with `plugin.json`; install from the marketplace with auto-update |
| 8 | Defects surfaced only at the customer's review: render errors on screens nobody opened, imports dropped in a refactor, a skipped check reported as passed | `prototype-coverage.md` lists every screen and state opened; the verification report separates tool-checked, reviewed and assumed (philosophy principle 11) |
| 9 | A role token in the URL let an admin open meeting content | the ux-spec inventory names the audience of every screen; `prototype-coverage.md` checks each one |
| 10 | A development VPN name and IP range appeared in product UI | synthetic data only (`rules.synthetic_data_only`); `design.forbidden` patterns, applied by `kickoff check-docs`; the craft auditor |
| 11 | Public pages of the product had a top menu but the prototype showed something else, and the team wrote "the prototype differs from the product"; device views could not be opened from a link | fidelity (principle 8): the prototype shows the product's own chrome, wording and language; `prototype-coverage.md` lists how every device view is reached; `signoff` and `feedback` show customers only such material |
| 12 | "No change", "No data yet", "Close" appeared in a Vietnamese product UI; "+7.1%" sat next to "2.304" | `languages.ui`; a `design-rules.md` row for language and locale formats; the craft auditor's language and locale checks |
| 13 | Screen codes in product UI, look-alike blocks on every home, text explaining system mechanics, unclear next actions | principle 9 (one job and one obvious next step); the look-alike lists of the IA reviewer and craft auditor; `feedback` fixes such remarks across the whole product |
| 14 | Screens designed for 15 rows could not hold thousands; cards drifted with content length; a direction judged on a hero image fell apart on real data | principle 6: concepts and screens are shown with realistic content and the extremes (none, too many, the longest name, an error, slow) |
| 15 | Products made with kickoff looked alike: a lookup by product type gave two of four briefs the same palette, and only the lead saw the concepts | `kickoff:design-concept` and gate CD: the customer chooses among concepts that differ in kind (principle 3), drawn from the brief; the art director's category-default test |
| 16 | Structure was decided early, alone and unreviewed: the customer chose only colour, and a game became a management console | `design-concept` comes before the spec and CD covers structure and feel; the IA, viewpoint and art-director reviewers run on the concepts and the ux-spec; `ux-design` ends with the fit test |
| 17 | A confirmation of two bare options hid the cost of the choice and when a mistake would show | the Decision card method for every design confirmation and gate request |
| 18 | One product's rules became the floor of every product | no shipped rules: `design-rules.md` is derived per project, each row with its reason in the brief and its test (principle 4) |
| 19 | Architecture was locked out entirely before C3 and C4, so the estimate after C2 was made blind and feasibility surfaced only after the prototype | commit late, explore early: `research` writes a `Status: Draft` architecture sketch that binds nothing; the hook allows only labelled drafts and `validate` rejects an Accepted ADR before C3 and C4 |
| 20 | Management set-up (roles, calendar for every year, hard dates) was asked before the idea was understood | slim `init` (name, languages, the idea, releases, rules); `scheduling: "off"` in a new project; `plan` asks for team, calendar and hard dates when the lead turns scheduling on |
| 21 | Point estimates hid the uncertainty: one number per package, no confidence, no basis | ranges with confidence and basis on packages and features; `kickoff estimate` and `estimate.md` show min, likely and max and the share of low-confidence items; overhead as a rate |

## Retired with the kit in 0.8.0

Earlier versions held rules for one product shape in the plugin's own kit: type weights and sizes, density per role, overlay kinds, route motion, card presets, forced upper-case, filters and navigation, data tables at volume, home shapes. They are gone with the kit. When a project's brief calls for such a rule, it is a row in that project's own `design-rules.md` (rule, reason, test, where it applies) and is audited against that row.

## Which skill applies each row

| Skill | Rows |
| --- | --- |
| `plan` | 1, 3 (runs `kickoff validate` before `kickoff schedule`; keeps the workshop package and its risk), 20, 21 (asks team and calendar when scheduling is turned on; ranges, confidence, basis) |
| `research` | 19 (the Draft architecture sketch) |
| `solution` | 19 (starts from the draft; commits only after C3 and C4) |
| `feature-map` | 21 (a feature-level estimate range) |
| `signoff` | 3, 11 |
| `design-concept` | 14, 15, 16, 17, 18 (brief, concepts that differ in kind, the co-design session, decision cards) |
| `ux-design` | 9, 12, 13, 16, 18 (inventory audiences, copy guide, the project's rules, fit test, review of the spec) |
| `prototype` | 4, 8, 9, 10, 11, 12, 14 (coverage, fidelity, extremes, verification report, publish check) |
| `feedback` | 13 (fixes across the whole product) |
| every skill | 2 (file tools), 17 (decision cards) |
| `init` | 5, 10, 20 (ECC setup; `design.forbidden` recorded at the start; the slim interview) |
| `using-kickoff` | 5, 6, 7, 19, 20, 21 (GateGuard offer, `kickoff ecc run`, start-up check 1; the Draft rule, the slim init and the range rule as red flags) |
