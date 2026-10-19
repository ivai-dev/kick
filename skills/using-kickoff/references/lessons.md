# Lessons encoded as checks

Each row is a mistake made on a real project (AI Minute) and the check that now prevents it. Phase skills quote the rows that apply to them in their **Lessons** section.

| Lesson from AI Minute | Where it is enforced |
| --- | --- |
| `chain_after` created a cycle; the schedule ran to 2039 | `validate` cycle detection; `schedule` refuses to run with a cycle |
| Sync matched issues by title and created a duplicate after a rename | hidden body key matching |
| Render errors did not surface in headless checks | `core.js` render-error capture |
| Headless "narrow" screenshots clamped around 520 px | `narrow.html` 390 px iframe |
| Splitting prototype modules dropped imports, found only tasks later | full-route `proto check` after every task |
| No doctype meant quirks mode; tables unreadable in dark mode | `table{color:inherit}` in kit `index.html` |
| Every role saw the chair's home below 760 px | per-role home routing in `shell.js`, covered by check routes per role |
| A role token in the URL let an admin open meeting content | role guard in `jump()` |
| A development VPN name and IP range appeared in product UI | `data.js` rule and `proto lint` pattern list from `project.yaml` |
| Dense, heavy text overwhelmed the reviewer | calm-density token defaults and `proto lint` thresholds |
| A sidebar filter that reloaded a near-identical page confused the reviewer | `ux-design` rule: navigation goes to a distinct page; filters stay in-page |
| Literal `\n` in a Bash heredoc became real newlines in JS | skills write files with file tools, not heredocs |
| A late sign-off moved the MVP gate | `signoff` workshop date is a package in `plan.yaml` with a risk entry; `schedule` shows its effect |

## Which skill applies each row

1. Dependency cycle: `plan` runs `kickoff validate` before `kickoff schedule` and fixes the reported cycle instead of working around it.
2. Title matching: `tickets` syncs only through `kickoff tickets push`, never by creating or renaming issues by hand.
3. Render errors: `prototype` treats any `data-err` reported by `kickoff proto check` as a failure.
4. Narrow screenshots: `prototype` checks phone width only through `kickoff proto check` (390 px iframe), never by resizing a headless window.
5. Dropped imports: `prototype` runs `kickoff proto check` over all routes after every task, not only the new routes.
6. Quirks mode: `prototype` never edits the kit core files (`narrow.html` and `js/{route,core,ui,charts,scope,shell,scenario,main}.js`) and changes `index.html` only in its tokens and modules blocks.
7. Wrong home per role: `ux-design` defines a home screen per role; `prototype` checks every role's home at 390 px.
8. Role token in the URL: `ux-design` lists the roles of every screen; `prototype` registers screens with their `roles` so the guard in `jump()` applies.
9. Development infrastructure in UI: `init` records the patterns in `proto.forbidden`; `prototype` keeps `data.js` synthetic and runs `kickoff proto lint`.
10. Dense text: `ux-design` keeps the calm-density defaults; `prototype` runs `kickoff proto lint`; `feedback` fixes visual items across the whole product, not one screen.
11. Filter as a page: `ux-design` writes the rule into the ux-spec navigation rules; `prototype` follows it.
12. Heredocs: every skill writes files with the file tools (see `conventions.md`, Files).
13. Late sign-off: `signoff` makes the workshop a package in `plan.yaml` with a risk entry and runs `kickoff schedule`; `plan` keeps both.
