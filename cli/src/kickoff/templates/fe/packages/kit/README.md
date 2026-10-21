# @kickoff/kit

Runtime for a kickoff **FE v0**: the real frontend built before customer sign-off.
It owns routing, role shells, the prototype bar, release scope and the generated checks,
so a project only writes screens.

> **Plugin-owned.** `packages/kit` is replaced wholesale when the kickoff plugin updates.
> Do not edit it in a project — change `packages/ui`, `packages/mocks` or `apps/web` instead.

## How a project uses it

`kickoff fe new` writes four things from the UX spec; everything else is hand-written:

| File | Content |
| --- | --- |
| `apps/web/src/kickoff/config.ts` | `config: KickoffConfig` — product, lang, locale, releases, roles |
| `apps/web/src/kickoff/screens.ts` | `screens: ScreenDef[]` — one line per screen |
| `apps/web/src/kickoff/scenarios.ts` | `scenarios: Scenario[]` — walkthroughs for the demo |
| `apps/web/src/screens/<id>.tsx` | one module per screen, default export (starts as `<Placeholder />`) |

Adding a screen = a row in `screens.ts` + `screens/<id>.tsx`. Keep the three registry files
plain data with `import type` only: `scripts/manifest.ts` loads them with Node's type stripping.

```tsx
// apps/web/src/main.tsx
const { App } = createKickoffApp({
  config, screens, scenarios,
  screenModules: import.meta.glob("./screens/*.tsx"), // lazy, keyed by file name = screen id
});
```

## Types

```ts
type KickoffConfig = { product; lang: "vi" | "en" | …; locale: "vi-VN"; releases: string[]; defaultRole; roles: RoleDef[] };
type RoleDef      = { id; name; shell: "app" | "site"; home: screenId; density?: "compact" | "comfortable" | "touch" };
type ScreenDef    = { id; code; name; roles: string[]; platforms: string[]; rel; nav: string | null; page: "data" | "form" };
type Scenario     = { id; name; role; steps: { text; screen; params?: Record<string, string> }[] };
```

## Routes (hash history)

| URL | Result |
| --- | --- |
| `#/` | redirects to the default role's home |
| `#/<role>` | redirects to that role's home |
| `#/<role>/<screen>?a=1` | the screen inside the role's shell; search params go to the screen |
| screen not in `screen.roles` | "Not available for this role" page — never the content |
| anything else | 404 page |

Hash routing makes the single-file build work from `file://` and inside sandboxed iframes
(hrefs are absolute and only the fragment changes; if the host forbids history writes the
app falls back to in-memory history).

On every navigation the kit sets `document.title` to the screen name, moves focus to the
`h1` (after the first screen), restores scroll on back/forward, and sets
`<html data-kickoff-ready="1" data-kickoff-screen="<id>">` once the screen has rendered.
Render errors are caught per screen and set `data-kickoff-error`.

## API

| Export | Use |
| --- | --- |
| `go(screenId, params?, { replace?, role? })` | navigate; params become URL search params |
| `useScreenParams()` | the screen's search params as `Record<string, string>` (demo keys removed) |
| `useRole()` / `useScreen()` | current `RoleDef` / `ScreenDef` |
| `screenHref(role, id, params?)` | `#/role/id?…` for plain links |
| `<Placeholder />` | h1 = screen name, code, roles, release, platforms, "to be built", a sketch by `page` kind |
| `<Rel r="R2">…</Rel>` | marks a block as a later release (see scope below) |
| `AppShell`, `SiteShell`, `DemoBar` | used by `createKickoffApp`; exported for custom layouts |
| `validateKickoff(registry)` | consistency problems of config/screens/scenarios/modules (run in `apps/web` tests) |
| `useDemo(selector)`, `demoStore` | the prototype bar state |

Loading convention: put `aria-busy="true"` on a region while it loads (the `DataTable` does).
The checks wait until no element is `aria-busy`.

## Shells

- **AppShell** (`shell: "app"`): sidebar with the role's screens that have a `nav` label,
  grouped by label (a group of one screen named like the label shows no heading); below
  768px the sidebar becomes a Sheet behind a menu button.
- **SiteShell** (`shell: "site"`): header with brand and top menu (a group with several
  screens becomes a dropdown), footer, and a bottom tab bar on phones (first 5 groups).

Both have a skip link and exactly one `<main id="main">`.

## Prototype bar (DemoBar)

A thin, collapsible bar above the shell — not product chrome. Hide it with `?demo=0`
(customer links, screenshots, tests; `?demo=1` shows it again).

- **Role** — switch role, lands on its home.
- **Screens** — index of all screens, filter is diacritic-insensitive ("don hang" finds "Đơn hàng").
- **Direction** — shown while `config.directions` offers two or more and `config.direction` locks none → `<html data-direction>`. Each direction is `apps/web/src/styles/directions/<id>.css` with a light block `:root[data-direction="<id>"]` and a dark block `:root[data-direction="<id>"][data-theme="dark"]` (repeat every variable), imported by `directions.css`. Once `config.direction` is set, that direction applies everywhere and the switch is hidden.
- **Tweaks** — brand hue (`--brand-h`, 0–360), colour strength (`--brand-c`, 0–0.3), corner radius (`--radius`, 0–1.5 rem) and motion (off / calm / lively: the `--duration-*` tokens), set inline on `<html>`; a live contrast reading of the primary button's text (warns below 4.5:1); Reset; and a link that carries the look (`?look=<id>&tweak=h:24,c:0.12,r:0.75,m:calm`) for the customer to send back. Write brand-coloured tokens in terms of `--brand-h` and `--brand-c` so the panel can move them.
- **Theme** light/dark → `<html data-theme>`.
- **Density** compact/comfortable/touch → `<html data-density>` (defaults to the role's density) and the `--control-h*` tokens.
- **Scope** → `<html data-scope>`: *all releases*; *MVP only* (`<Rel>` blocks and nav items of later releases are hidden); *tag later releases* (outlined and labelled).
- **Scenario player** — pick a scenario, then previous/next walks its steps (each step navigates to its screen with its params, as the scenario's role).

Theme, density, scope, direction, tweaks and collapsed state persist in `localStorage` (failures are ignored,
e.g. in sandboxed iframes). URL overrides for one visit: `?theme=dark&density=touch&scope=mvp&scenario=<id>&step=<n>&look=<id>&tweak=<…>`.

## Styles

`@kickoff/kit/foundation.css` (import after `@app/ui/styles.css`, before `tokens.css`):

- type roles `text-display | text-title | text-body | text-label | text-meta | text-caption` (line-height ≥ 1.2, body 1.5);
- density tokens `--control-h`, `--control-h-sm`, `--control-h-lg`, `--density-gap`;
- motion tokens `--duration-fast|base|slow`, `--ease-standard|emphasized|exit`; `prefers-reduced-motion` collapses them;
- no forced upper-case when `<html lang="vi">`.

The kit's components use the shadcn token classes (`bg-background`, `text-muted-foreground`,
`bg-sidebar` …) defined by `@app/ui/styles.css`; keep those token names when restyling.
Add `@source "<path>/packages/kit/src"` to the Tailwind entry so its classes are generated.

## Checks

```ts
// apps/web/e2e/sweep.spec.ts
sweep(test, { config, screens, scenarios, artifact: "<abs path>/dist-artifact/index.html" });
```

For every screen × role in `screen.roles` × viewport (1440×900, 390×844) × theme (light, dark):
open `#/<role>/<id>?demo=0&theme=<t>`, wait for `data-kickoff-ready`, then fail on any console
error, page error or `data-kickoff-error`; require exactly one `h1` and one `main`; at 390px
require no horizontal scroll; in light theme require no axe violations of impact serious or
critical. Plus one test per scenario (walks every step with the prototype bar's *next* button)
and, with `artifact`, two tests that open the single-file build from `file://` and inside a
`sandbox="allow-scripts"` iframe.

`node --experimental-strip-types packages/kit/scripts/manifest.ts` prints
`{"screens":[{"id","code","roles","platforms","rel"}],"scenarios":["id"]}` from `apps/web/src/kickoff`.

`@kickoff/kit/eslint` is a flat-config array: no raw hex colours in `className` or Tailwind
arbitrary values (`[#…]`), no inline `fontSize`/`fontWeight`, no `font-extrabold`/`font-black`,
and no `radix-ui`/`@radix-ui/*` imports under `apps/` (use `@app/ui`).
