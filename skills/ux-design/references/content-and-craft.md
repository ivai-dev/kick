# Content and craft

Small things annoy users more than the overall layout: a wrong decimal mark, a split word, a label in capitals, two names for one thing, a sentence that explains how the system works. This file holds the copy review procedure and the craft rules. `kickoff:ux-design` writes the project's values into the ux-spec **Copy guide** and the design-system **Craft rules**; the prototype screen checklist and the design review check against them.

## 1. Copy review

Run it on the concept artboards (ux-design), on each screen group before a publish, and as the craft auditor's part of the design review.

1. **Collect the strings.** Every heading, button, label, hint, placeholder, empty state, toast, dialog, `aria-label`, `title` and `alt`, per screen. In a prototype, extract them from `js/*.js` with a read-only script into one file and read it line by line.
2. **Research the register.** Read 3–5 sources in the UI language: public services and leading products for the same audience. Record one line per source (what it teaches) with its link.
3. **Fix the voice** in one sentence ("a helpful clerk who speaks plainly to workers"), then one row per audience: form of address, greeting, verbs on buttons, the interaction verb per device ("tap" on touch screens, "click" or "select" on the web), words to avoid (slang, marketing, heavy officialese, English where a native word exists).
4. **Walk every string** with the checklist below. Record each change as a row: Screen, Current, Problem, Proposed. Problem codes: *casual*, *formal*, *unclear*, *inconsistent*, *misleading*, *wrong term*, *grammar*, *mechanics*.
5. **Declutter pass.** Ask of every string and block: "Does this user need this, now, to decide or act?"

   | Kind | Action | Example |
   | --- | --- | --- |
   | Explains system mechanics or policy | Remove | "Free of charge", "Your data is not stored", "Signs out after 2 minutes", "Updated 09:40", how accounts are checked |
   | Repeats something on the same screen | Keep the copy where the user looks when they need it | A title and a banner that say the same thing |
   | Instruction the layout already gives | Remove | "Tap a picture" above large picture tiles |
   | Needed only when something happens | Make it a state that appears with the event; write the rule in the ux-spec | The sign-out warning appears when time runs out |
   | Number that does not help the next step | Remove or shorten | "Showing 6 of 58" |
   | Label that never changes | Remove | "Upcoming" on every event card; a status chip on every row of a list filtered to that status |

   Always keep: what it is, the key fact (price, salary, date, place), one main action, the way to get help, navigation, the user's own status, and safety facts at the moment they matter. Keep at most one trust cue per channel, with a reason.
6. **Update the term table and the copy guide**, apply the changes, take screenshots and read them.

### Copy checklist

- [ ] One name per thing: the term-table term, never a synonym; the same action has the same label everywhere.
- [ ] Buttons start with a verb, 1–3 words, and say what happens ("Send invitation", not "OK").
- [ ] No text that explains system mechanics or policy; a fact appears when its event happens.
- [ ] No text appears twice on one screen; no label that never changes.
- [ ] Page header: a title plus one sentence that names the task or carries live facts (counts, dates, state), or no sentence.
- [ ] Errors say what happened and how to fix it, without blame or codes, and offer a way out.
- [ ] No exclamation marks, no urgency or marketing words.
- [ ] The register fits the audience, and the form of address is the same on every screen.
- [ ] No screen codes, prototype words ("prototype", "demo", "mock"), English leftovers in a non-English UI, or development infrastructure.
- [ ] Numbers, dates and units in the formats of the UI locale (section 2.5).
- [ ] Sentence case (section 2.3) and the punctuation list (section 2.6).
- [ ] No orphaned number or unit at a line end, no compound split across lines (section 2.7).
- [ ] `aria-label`, `title` and `alt` follow the same rules.

## 2. Craft rules

Copy these sections into the design-system **Craft rules** with the project's values. The values below are working defaults.

### 2.1 Type scale per surface

Name sizes by role, not by pixel, and give each surface its own column:

| Role | Work tool | Public web | Phone | Device read from a distance (kiosk) |
| --- | --- | --- | --- | --- |
| Display (one per screen) | — | 48 / 800 | 32 / 800 | 96 / 800 |
| Headline (page title, hero) | 22 / 600 | 32 / 800 | 26 / 800 | 52 / 800 |
| Figure (count, price) | 28 / 600 | 22 card, 36 detail | 22 card, 32 detail | 32 card, 52 detail |
| Title (card, section) | 16 card, 18 section / 600 | 19 / 700 | 19 / 700 | 24 / 700 |
| Body | 14 tables, 16 text / 400 | 16 / 400 | 16 / 400 | 21 / 400 |
| Label (field, chip, button) | 14 / 500 | 15 / 700 | 16 / 700 | 19 / 700 |
| Meta (the minimum) | 13 / 400 | 14 / 600 | 14 / 600 | 18 / 600 |

- At most **5 sizes per screen** and 3 per component; one display size per screen.
- No words below the meta minimum. Languages with stacked diacritics (Vietnamese) need 13 px or more.
- Line height 1.5–1.6 for body, 1.25 for headings, at least 1.15 wherever stacked marks can occur; 1 only for single-line numerals.

### 2.2 Weights

- At most three weights per surface: body (400), labels (500 or 600), headings and figures (600 or 700).
- The heaviest weight (700–800) only at 19 px and above, and only where the surface is meant to be bold (public pages, devices). Work tools stay at 600 for headings.
- Inline emphasis uses the label or heading weight, never a fourth one.

### 2.3 Letter case

- Sentence case everywhere: page titles, buttons, labels, table headers, menu items.
- Small uppercase labels are allowed only for short eyebrows in languages without stacked diacritics. The `--cap-case` token in the prototype tokens block drives `.t-cap` and table headers: `uppercase` (kit default) or `none`. `kickoff proto new` sets `none` for Vietnamese; set it for any language whose capitals carry stacked marks.
- Follow the locale's rules for names of organisations and places. Vietnamese (Decree 30/2020): the generic noun stays lower case inside a line ("xã Hòa Mỹ"), the type of body is capitalised in an agency name ("Sở Tài chính").

### 2.4 Spacing rhythm

- One base unit: 4 px. Steps 4, 8, 12, 16, 24, 32, 48; no 6, 10, 14 or 20 in new work.
- Inside a component: 8 between label and control, 12 between rows, 16 card padding (24 on spacious public pages).
- 16 between components, 32 between page sections, 48 from a hero to the first section.
- Devices read from a distance scale every step by 1.25 and keep at least 12 px between touch targets.

### 2.5 Locale formats

Format every number, date and unit with the locale in `KIT_CONFIG.locale` through the kit helpers; never build these strings by hand in a screen module. The copy guide names one format per thing.

| Thing | en (en-US) | vi (vi-VN) |
| --- | --- | --- |
| Integer | 2,304 | 2.304 |
| Decimal, percent | 7.1% | 7,1% |
| Signed change | +23 · −4 (minus sign U+2212) | +23 · −4 |
| Money | $1,250.00 | 1.250.000 đ; "8–11 triệu đồng/tháng" |
| Range of numbers or times | 8–11 · 07:00–11:00 (en dash, no spaces) | 8–11 · 07:00–11:00 |
| Range of dates or words | Oct 20 – Nov 5, 2026 (spaced en dash) | 20/10/2026 – 05/11/2026 |
| Date | Oct 20, 2026 | 20/10/2026; in lists of the current year 20/10 |
| Date with weekday and time | Tue, Oct 20, 9:00 AM | Thứ Ba, 20/10, 09:00 |
| Relative | Today, 6:30 AM · Yesterday · 2 days left | Hôm nay, 06:30 · Hôm qua · Còn 2 ngày |
| Month on a chart axis | Nov … Oct | T11 … T10 |
| Unit (non-breaking space) | 60 people · 4 min · 2.4 GB | 60 người · 4 phút · 2,4 GB |
| Fraction, page | 1 of 4 · Page 1 of 11 | 1/4 · Trang 1/11 |

A missing value in a table cell is "—"; an empty action cell stays blank.

### 2.6 Punctuation

| Character | Rule |
| --- | --- |
| “ ” | Quote names of options, buttons and items; never straight `"` in UI text |
| … | Menu items that open a further step (en convention) and CSS truncation only; never stored in data |
| – | Ranges (2.5) |
| — | Missing data in a table cell only |
| · | Joins at most two short facts on one line; never at a line end |
| : | A label before a value |
| / | Units, dates and fractions only; never for "or" |
| ! | Never |
| . | After sentences, toasts and page sentences; not after labels, buttons, chips or card subtitles |

### 2.7 Line breaks

- `text-wrap: balance` on headings, tile names and card titles.
- A non-breaking space between a number and its unit, and inside compounds that must not split.
- No single orphaned word, number or middle dot on the last line.

### 2.8 Chips, buttons, icons, colour

- **Chips: three variants only.** *Status* (status vocabulary only; soft fill of its tone), *fact* (neutral fill with an icon; at most two per card), *choice* (filters and toggles; outline, pressed state in the primary soft colour). Two chips that look alike never mean different kinds of things.
- **Buttons:** a size table per surface (small, default, large × work tool, public web, phone, device). One filled main action per screen; secondary as outline; tertiary as a link. The icon goes before the label; only a "go on" chevron goes after. Icon-only buttons only in dense work tables, with a tooltip, never on touch devices for the public.
- **Icons:** one style (outline), one meaning per icon, written as a table (icon → meaning). Sizes 16 inline, 18 in buttons, 20 in notices, 24 on tiles.
- **Colour:** one colour, one meaning. The main-action colour appears only on the main action. Red is for errors and destructive actions; a decision such as "returned" uses the warning tone with a label.

## 3. Where each rule is checked

| Rule | Written in | Checked by |
| --- | --- | --- |
| Voice, terms, formats, punctuation, letter case | ux-spec Copy guide | copy review; prototype screen checklist |
| Type per surface, weights, spacing, chips, buttons, icons | design-system Craft rules | `kickoff proto lint` (font sizes, weight 600, inline styles, raw colours); craft auditor in the design review |
| Locale set for a non-English UI | `js/config.js` `locale` and `lang` | `kickoff proto lint` |
| Forbidden words (screen codes, prototype words, infrastructure) | `proto.forbidden` in `project.yaml` | `kickoff proto lint` |
