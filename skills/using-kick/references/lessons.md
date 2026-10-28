# Lessons

Mistakes made on real projects and where kick now prevents them.

| # | Lesson | Prevented by |
| --- | --- | --- |
| 1 | People were asked to approve steps named by codes they did not understand | plain words in every message; agreements named by what they agree |
| 2 | A clickable mock-up of a whole new product took a lot of effort, changed heavily with feedback, and was thrown away | one key screen per direction; then the real screens on mock data, which are kept |
| 3 | Management set-up (roles, calendar, dates) was asked before the idea was understood | no set-up beyond languages; estimates are ranges, not schedules |
| 4 | Point estimates hid the uncertainty | ranges with confidence and basis; `kick estimate` shows the share of low-confidence rows |
| 5 | A dependency cycle in a plan went unnoticed | `kick check` reports tasks that wait for each other in a circle |
| 6 | ECC's GateGuard stopped the first write of every kick document | `kick setup` exempts `docs/kick/**`; `kick doctor` warns when it is missing |
| 7 | The installed plugin lagged the repository and the CLI matched the old one | start-up check 1 compares the CLI with `plugin.json` |
| 8 | Literal `\n` in a shell heredoc became real newlines in a code file | files are written with the file tools |
| 9 | Screens designed for 15 rows could not hold thousands; a look judged on a hero image fell apart on real data | key screens and mock data show the extremes (principle 6) |
| 10 | Products looked alike because the look came from a lookup by product type | directions differ in kind and come from the brief (principles 2 and 3) |
| 11 | English placeholders appeared in a Vietnamese UI; "+7.1%" sat next to "2.304" | the UI language in `project.yaml`; a design rule for language and formats; the craft auditor |
| 12 | A role token in the URL let the wrong role open content | roles and permissions are in the mock contract from the start |
| 13 | A development VPN name appeared in the product | sample data is synthetic; the craft auditor reads every string |
| 14 | A confirmation with two bare options hid the real cost of a choice | the Decision card for every choice |
| 15 | Reviews ran after the build, so structural faults cost a rebuild | reviewers look at the key screens of the directions, before the screens are built |
| 16 | The riskiest work (integrations, migration, performance) surfaced last | probes during the UI stage; Foundation first among the feature kicks |
| 17 | Seeing the product invited endless new requests | feedback classified now / later / no with the extra days; two rounds per screen |
