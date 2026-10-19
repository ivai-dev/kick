# Screen checklist

Walk this list before every publish, screen group by screen group, after `kickoff proto check` passes and before the `ui-ux-pro-max` pre-delivery checklist. Tick each item in the build plan, or record a ruling (`Ruling: <decision> — <why> — <cost if wrong>`) when an item is knowingly left open.

Routes use the kit's hash format `#<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>]`, tokens in any order, for example `#sc-02-librarian-dark` or `#sc-01-admin-mvp`.

| # | Item | How to check |
| --- | --- | --- |
| 1 | **Role guard.** Every screen is registered with the roles of its ux-spec row; another role sees the access notice, never the content. | Open a screen with a role that is not in its row (`#sc-03-librarian`): the page shows the access notice. Compare `roles` in each `KIT.register` call with the ux-spec. |
| 2 | **Per-role home at 390 px.** Each role starts on its own home at phone width as well as on the desktop. | `kickoff proto check` passes (390 px check of every screen). Then open `narrow.html#<home>-<role>` for every role and confirm the home in `js/config.js` is the ux-spec home of that role. |
| 3 | **Light and dark readable.** Text, tables, charts and status chips are readable in both themes; tables inherit the text colour. | Open each screen group with `-light` and `-dark`, or read the screenshots from `kickoff proto check --shots <folder>`. |
| 4 | **No horizontal scroll at 390 px.** | `kickoff proto check` fails on sideways scroll at 390 px for every screen and scenario; a pass covers it. |
| 5 | **Calm density.** Type-scale classes only (`.t-cap .t-meta .t-ui .t-strong .t-body .t-h1 .t-h2 .t-h3 .t-kpi`), no inline font sizes, weight 600 only for headings and KPI numbers, 32 px between sections, one short sentence per page header. | `kickoff proto lint` passes; read the page headers of every screen. |
| 6 | **Synthetic data only.** Invented names, organisations, addresses and contents in `js/data.js` and in the screen modules; nothing copied from customer material. | Read `js/data.js`; search the modules for real names from the discovery inputs. |
| 7 | **No development infrastructure.** No VPN names, private IP ranges, internal host names or tool accounts in any user-facing string. | `kickoff proto lint` passes with the `proto.forbidden` patterns of `project.yaml`; add any new pattern you find to that list. |
| 8 | **Every ux-spec screen registered,** and no screen registered that is not in the ux-spec. | `kickoff proto check` reports no `coverage:` lines. |
| 9 | **Release tags correct** under `#…-tags`: every part and screen of a later release carries its release tag, and MVP parts carry none. | Open each screen group with `-tags`; compare with the releases in the ux-spec and `features.yaml`. |
| 10 | **MVP view** under `#…-mvp` hides later releases: their parts show as muted placeholders, and whole later screens are dimmed under a note. | Open each screen group with `-mvp`; nothing of a later release reads as part of the MVP. |
| 11 | **Navigation versus filters.** Navigation goes to distinct pages; filters stay in-page. | Click through each role's navigation: no menu item reloads a near-identical page with a filter applied. |
| 12 | **Scenarios.** Every scenario of the build plan runs to its end at `#scn-<id>` and names the features it shows. | `kickoff proto check` (no route arguments) runs every scenario; compare `js/scenarios.js` with the workshop's demo list. |
