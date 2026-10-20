# Data at volume

Screens are designed for the real amount of data, not for the 15 rows of a first draft. Write this per entity into the design system and into every screen brief before the screen is built.

## 1. Volume per entity (state the assumption)

| Entity | Expected count (now · in 3 years) | Growth per day or month | Largest single list a user sees | Source of the assumption |
| --- | --- | --- | --- | --- |
| e.g. vacancies | 3,100 · 9,000 | 40 per day | all open vacancies of the province | customer brief p. 12, or "team assumption, to confirm" |

Every number is either sourced (brief, interview, statistics) or marked as an assumption to confirm in the open questions.

## 2. Functions of every list

| Function | Rule |
| --- | --- |
| Total | the list states its count ("2.340 hồ sơ") in a status region that announces changes |
| Search | a text search over the fields users remember (name, code, phone), folding diacritics |
| Filter | the facets users narrow by; counts per option; applied filters shown as removable chips with "clear" |
| Sort | the orders users need (newest, deadline, name); the sorted column is marked |
| Paging | numbered pages with a page size on staff screens; "show more" on phone and kiosk; a cursor for logs; never one endless list over 25 rows |
| Bulk actions | where the same action repeats on many rows (invite, decline, approve, delete): selection across pages and "select all that match" |
| Export | where the list is reported on (Excel, PDF) |
| History | where the list is audited (who changed what and when) |
| URL state | filters, sort, page and the open row live in the URL, so Back and a shared link return to the same view |
| Status-region counts | result counts and selection counts are announced politely |

## 3. Stress fixtures

The data generator (seeded, deterministic) produces, besides typical rows:

- long names and titles (a 100-character vacancy title, a 90-character employer name), one-word names;
- missing optional fields (no salary, no photo, no description) — they render "—" or keep their slot;
- many tags or facts (12 skills) — the list shows 2–3 and "+n";
- 0, 1 and many results for every search and filter;
- the largest list at its full volume (paging, total, selection across pages work);
- names with stacked diacritics (Ẵ, Ữ, Ỷ) at the start of a wrapped line.

Counts shown anywhere are derived from the data, never typed.

## 4. Screen brief: data inventory

For each screen: the lists it shows, their volume (from section 1), the functions each needs (section 2, with "not needed" and the reason), the layout per width (desktop list, tablet, phone cards), and the states (loading, error, empty first use, no results, permission).
