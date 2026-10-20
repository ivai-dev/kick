// shell.js — everything around the screens (KIT.shell):
//   - ProtoBar: the prototype controls (start page, role, platform, release scope, theme,
//     screen index). Not part of the product.
//   - RolePicker: the start page (no hash): product name, one card per role with its home,
//     the guided scenarios, the theme toggle.
//   - DesktopShell (sidebar, top bar, content); below 760 px the sidebar is a drawer. The app
//     shell of work tools (roles with shell "app", the default).
//   - SiteShell (header with the top menu and the account area, page, footer; below 760 px a
//     compact header with a menu sheet and an optional bottom tab bar). The public-site shell of
//     roles with shell "site". A project may replace the header or footer with KIT.site.Header /
//     KIT.site.Footer (components that read KIT.useApp()).
//   - Bare stage: a screen registered with bare (true or (params, role) => boolean) renders on
//     the stage without any shell (a device frame such as a kiosk, a full-screen start screen).
//   - WinFrame: the Windows app frame (title bar, taskbar, tray) around the desktop shell.
//   - PhoneStage (390 x 844 phone frame, scaled to fit) and MobileApp (top bar, content,
//     bottom tab bar), used full screen below 760 px for screens with an android platform.
//   - ScreenBody: the role guard (KIT.ui.Denied instead of a screen the role may not open),
//     the release lens on the whole screen, and the screen itself.
// Which layout shows is decided in main.js (layoutOf) and Stage below. Every word goes through
// KIT.t. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp, t } = KIT;
  const { useState, useRef, useLayoutEffect, useEffect } = hooks;
  const { cx } = KIT.util;
  const { Icon, Button, Menu, RelBadge, ScreenRel, Denied, NotFound, Placeholder } = KIT.ui;
  KIT.site = KIT.site || {};

  const PLATFORM = { web: ["Web", "globe"], windows: ["Windows", "windows"], android: ["Android", "phone"] };
  const LENSES = () => [
    ["full", t("lens.full"), "layers"],
    ["tags", t("lens.tags"), "tag"],
    ["mvp", t("lens.mvp", { r: KIT.config().releases[0] }), "target"],
  ];
  const THEMES = () => [["light", t("theme.light"), "sun"], ["dark", t("theme.dark"), "moon"], ["system", t("theme.system"), "monitor"]];

  // Screens a role reaches from navigation: desk (web and Windows shell) or phone (tab bar).
  function navItems(role, kind) {
    return Object.values(KIT.screens).filter((s) => s.nav && s.roles.includes(role) &&
      (kind === "phone" ? s.platforms.includes("android") : s.platforms.some((p) => p !== "android")));
  }
  const platformsOf = (role) => KIT.config().platforms.filter((p) => Object.values(KIT.screens).some((s) => s.roles.includes(role) && s.platforms.includes(p)));
  const isSite = (role) => KIT.roleDef(role).shell === "site";

  function ThemeButton() {
    const A = useApp();
    const dark = A.resolved === "dark";
    return html`<${Button} kind="ghost" icon=${dark ? "sun" : "moon"} label=${dark ? t("theme.toLight") : t("theme.toDark")} onClick=${() => A.setTheme(dark ? "light" : "dark")} />`;
  }

  /* ---------------- Prototype bar ---------------- */
  function Seg({ label, items, value, onPick, cls, iconsOnly }) {
    return html`<div class=${cx("seg", cls)} role="group" aria-label=${label}>
      ${items.map(([k, l, ic]) => html`<button type="button" key=${k} aria-pressed=${value === k} aria-label=${l} title=${l} onClick=${() => onPick(k)}><${Icon} n=${ic} s=${16} />${!iconsOnly && html`<span class="pb-l">${l}</span>`}</button>`)}
    </div>`;
  }

  function ProtoBar() {
    const A = useApp();
    const cfg = A.config;
    const [menu, setMenu] = useState(null);
    const idxRef = useRef(null);
    const cur = KIT.screens[A.screen];
    const list = Object.values(KIT.screens);
    return html`<div class="proto" role="region" aria-label=${t("proto.controls")}>
      <span class="proto-tag hide-sm"><b>${t("proto.tag")}</b></span>
      <${Button} kind="ghost" size="sm" icon="home" label=${t("proto.start")} onClick=${A.openPicker} />
      <label class="proto-role"><span class="pb-lbl t-meta">${t("proto.role")}</span>
        <select class="select sm" aria-label=${t("proto.role")} value=${A.role} onChange=${(e) => A.setRole(e.currentTarget.value)}>
          ${cfg.roles.map((r) => html`<option key=${r.id} value=${r.id}>${r.name}</option>`)}
        </select></label>
      ${cfg.platforms.length > 1 && html`<${Seg} label=${t("proto.platform")} cls="hide-sm" value=${A.platform} onPick=${A.setPlatform}
        items=${cfg.platforms.map((p) => [p, PLATFORM[p][0], PLATFORM[p][1]])} />`}
      <${Seg} label=${t("proto.scope")} value=${A.lens} onPick=${A.setLens} items=${LENSES()} />
      <${Seg} label=${t("proto.theme")} cls="hide-sm" value=${A.theme} onPick=${A.setTheme} items=${THEMES()} iconsOnly />
      <span class="spacer"></span>
      <button type="button" ref=${idxRef} class="btn sm proto-idx" aria-haspopup="menu" aria-expanded=${!!menu} aria-label=${t("proto.screens") + (cur ? ": " + cur.name : "")} onClick=${() => setMenu(menu ? null : idxRef.current)}>
        <${Icon} n="grid" s=${16} /><span class="clamp1 hide-sm">${cur ? cur.code + " · " + cur.name : t("proto.screens")}</span><${Icon} n="down" s=${14} cls="hide-sm" />
      </button>
      ${menu && html`<${Menu} anchor=${menu} onClose=${() => setMenu(null)} width=${360}>
        ${list.length ? list.map((s) => html`<button type="button" key=${s.id} role="menuitem" aria-current=${s.id === A.screen ? "true" : "false"} onClick=${() => { setMenu(null); A.jump({ screen: s.id }); }}>
          <span class="code">${s.code}</span><span class="grow clamp1">${s.name}</span><${RelBadge} r=${s.rel} /></button>`)
          : html`<span class="t-meta mh">${t("proto.noScreens")}</span>`}
      <//>`}
    </div>`;
  }

  /* ---------------- Start page: roles and scenarios ---------------- */
  function RolePicker() {
    const A = useApp();
    const cfg = A.config;
    const scenarios = KIT.SCENARIOS || [];
    return html`<div class="launch"><div class="launch-in">
      <header class="launch-hero">
        <div class="lh-brand"><span class="mark"><${Icon} n="layers" s=${18} /></span><span class="t-h2">${cfg.product}</span><span class="proto-tag"><b>${t("proto.tag")}</b></span></div>
        <h1 class="t-h1">${t("start.title")}</h1>
        <p class="t-body">${t("start.lead")}</p>
        <div class="row wrap gap-12"><span class="t-meta">${t("proto.theme")}</span><${Seg} label=${t("proto.theme")} value=${A.theme} onPick=${A.setTheme} items=${THEMES()} /></div>
      </header>

      <section class="col gap-16" aria-labelledby="kit-roles-h">
        <h2 id="kit-roles-h" class="t-h2">${t("start.roles")}</h2>
        <div class="launch-roles">${cfg.roles.map((r) => {
          const home = KIT.homeOf(r.id);
          const hs = home && KIT.screens[home];
          return html`<button type="button" key=${r.id} class="lr-card" data-role=${r.id} aria-disabled=${hs ? undefined : "true"} onClick=${() => A.setRole(r.id)}>
            <span class="row gap-12"><span class="lr-ic"><${Icon} n="user" s=${20} /></span><b class="t-h3 clamp1">${r.name}</b></span>
            <span class="t-meta">${hs ? t("start.startsOn", { name: hs.name, code: hs.code }) : t("start.noRoleScreens")}</span>
            <span class="lr-plat">${platformsOf(r.id).map((p) => html`<span key=${p} class="lr-chip">${PLATFORM[p][0]}</span>`)}</span>
            <span class="lr-go">${hs ? t("start.open") : t("start.unavailable")}<${Icon} n="right" s=${15} /></span>
          </button>`;
        })}</div>
      </section>

      <section class="col gap-16" aria-labelledby="kit-scn-h">
        <h2 id="kit-scn-h" class="t-h2">${t("start.scenarios")}</h2>
        ${scenarios.length ? html`<div class="launch-scen">${scenarios.map((s, i) => html`<article key=${s.id} class="sc-card" data-scenario-id=${s.id}>
            <span class="sc-n" aria-hidden="true">${i + 1}</span>
            <b class="t-h3">${s.name}</b>
            <span class="t-meta">${KIT.roleName(s.role)} · ${(PLATFORM[s.platform] || PLATFORM.web)[0]} · ${t("scn.steps", { n: s.steps.length })}</span>
            <${Button} size="sm" icon="play" onClick=${() => KIT.scenario.run(KIT._api, s.id)}>${t("scn.play")}<//>
          </article>`)}</div>`
          : html`<p class="t-meta">${t("start.noScenarios")}</p>`}
      </section>

      <footer class="t-meta launch-foot"><${Icon} n="shield" s=${14} /><span>${t("start.footer")}</span></footer>
    </div></div>`;
  }

  /* ---------------- Desktop (app) shell ---------------- */
  function Sidebar() {
    const A = useApp();
    const items = navItems(A.role, "desk");
    const groups = [];
    for (const s of items) {
      let g = groups.find((x) => x.label === s.nav);
      if (!g) groups.push((g = { label: s.nav, items: [] }));
      g.items.push(s);
    }
    return html`<nav class="side" id="kit-side" aria-label=${t("nav.main")}>
      <div class="brand">
        <span class="mark"><${Icon} n="layers" s=${18} /></span>
        <div class="col hide-rail grow minw0"><span class="brand-name clamp1">${A.config.product}</span><span class="t-meta clamp1">${KIT.roleName(A.role)}</span></div>
        ${A.narrow && html`<${Button} kind="ghost" icon="x" label=${t("nav.closeMenu")} onClick=${() => A.setDrawer(false)} />`}
      </div>
      <div class="nav">${groups.map((g) => [
        html`<span key=${"h-" + g.label} class="t-cap nav-sec hide-rail">${g.label}</span>`,
        ...g.items.map((s) => {
          const later = KIT.scope.isLater(s.rel);
          const dim = later && A.lens === "mvp";
          return html`<a href=${"#" + s.id} key=${s.id} class=${dim ? "rel-dim-nav" : undefined} aria-disabled=${dim ? "true" : undefined}
            aria-current=${A.screen === s.id ? "page" : undefined} title=${dim ? t("nav.arrives", { name: s.name, r: s.rel }) : s.name}
            onClick=${(e) => { e.preventDefault(); if (!dim) A.go(s.id); }}>
            <${Icon} n=${s.icon || "file"} s=${19} /><span class="hide-rail lbl">${s.name}</span>
            ${later && A.lens !== "full" && html`<${RelBadge} r=${s.rel} cls="hide-rail nav-rel" />`}
          </a>`;
        }),
      ])}</div>
      <div class="side-foot">
        <button type="button" class="me" onClick=${A.openPicker} aria-label=${t("nav.roleSwitch", { role: KIT.roleName(A.role) })}>
          <span class="avatar"><${Icon} n="user" s=${16} /></span>
          <span class="col hide-rail minw0"><b class="t-strong clamp1">${KIT.roleName(A.role)}</b><span class="t-meta clamp1">${t("nav.switchRole")}</span></span>
        </button>
      </div>
    </nav>`;
  }

  function Topbar() {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    return html`<header class="topbar">
      ${A.narrow
        ? html`<${Button} kind="ghost" icon="menu" label=${t("nav.openMenu")} aria-expanded=${!!A.drawer} aria-controls="kit-side" onClick=${() => A.setDrawer(true)} />`
        : html`<${Button} kind="ghost" icon="panel" label=${A.sidebar ? t("nav.collapse") : t("nav.expand")} onClick=${A.toggleSidebar} />`}
      ${A.canBack && html`<${Button} kind="ghost" icon="back" label=${t("back")} onClick=${A.back} />`}
      <span class="t-strong clamp1 grow">${reg ? reg.name : ""}</span>
      <${ThemeButton} />
    </header>`;
  }

  // The current screen, behind the role guard and the release lens.
  function ScreenBody({ wrap }) {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    let body;
    if (!reg) body = html`<${NotFound} />`;
    else if (!reg.roles.includes(A.role)) body = html`<${Denied} />`;
    else {
      const Comp = typeof reg.comp === "function" ? reg.comp : Placeholder;
      body = html`<${ScreenRel} r=${reg.rel}><${Comp} key=${A.screen + JSON.stringify(A.params)} /><//>`;
    }
    return html`<div class=${wrap} data-screen=${A.screen}>${body}</div>`;
  }

  function DesktopShell() {
    const A = useApp();
    const drawer = A.narrow && A.drawer;
    useEffect(() => {
      if (!drawer) return undefined;
      const key = (e) => e.key === "Escape" && A.setDrawer(false);
      document.addEventListener("keydown", key);
      return () => document.removeEventListener("keydown", key);
    }, [drawer]);
    return html`<div class=${cx("shell", !A.sidebar && "collapsed", drawer && "drawer")}>
      <${Sidebar} />
      ${drawer && html`<div class="drawer-scrim" aria-hidden="true" onClick=${() => A.setDrawer(false)}></div>`}
      <div class="main">
        <${Topbar} />
        <div class="content" id="kit-content"><${ScreenBody} wrap="page" /></div>
      </div>
    </div>`;
  }

  /* ---------------- Site shell ---------------- */
  // KIT_CONFIG.site = { org, menu, account, accountLabel, signIn: [{ label, go }], signOut, footer: [lines] }
  //   menu: screen ids of the top menu, in order (default: the role's nav screens outside the account group);
  //   org: the organisation line under the product name;
  //   account: the nav label whose screens form the account menu (not the top menu);
  //   accountLabel: the account button's text (default: the role name);
  //   signIn: buttons shown when the role has no account screens (a visitor);
  //   signOut: the role a "sign out" switches to (the visitor role), shown in the account menu;
  //   footer: lines of the default footer.
  // Top menu: screens with nav outside the account group, labelled by `menu` or their name;
  // `menu: false` keeps a screen out of the site menus (it stays in the app sidebar of other roles).
  function siteMenus(role) {
    const site = KIT.config().site || {};
    const all = navItems(role, "desk").filter((s) => s.menu !== false);
    const account = all.filter((s) => site.account && s.nav === site.account);
    // site.menu lists the top-menu screens explicitly (screens the role may open, in that order).
    const top = Array.isArray(site.menu)
      ? site.menu.filter((id) => KIT.canOpen(id, role)).map((id) => KIT.screens[id])
      : all.filter((s) => !(site.account && s.nav === site.account));
    return { site, top, account };
  }
  const label = (s) => (typeof s.menu === "string" && s.menu) || s.name;

  function SiteHeader() {
    const A = useApp();
    const { site, top, account } = siteMenus(A.role);
    const [menu, setMenu] = useState(null);
    const [sheet, setSheet] = useState(false);
    const accRef = useRef(null);
    const home = KIT.homeOf(A.role);
    const signOut = site.signOut && site.signOut !== A.role ? () => A.setRole(site.signOut) : null;
    const go = (id) => { setMenu(null); setSheet(false); A.go(id); };
    const signIn = site.signIn || [];
    const accountArea = account.length
      ? html`<button type="button" ref=${accRef} class="site-me" aria-haspopup="menu" aria-expanded=${!!menu} onClick=${() => setMenu(menu ? null : accRef.current)}>
          <span class="avatar"><${Icon} n="user" s=${16} /></span><span class="clamp1 hide-sm">${site.accountLabel || KIT.roleName(A.role)}</span><${Icon} n="down" s=${14} /></button>`
      : html`${signIn.map((b, i) => html`<${Button} key=${b.go} kind=${i === signIn.length - 1 ? "primary" : "ghost"} size="sm" cls="hide-sm" onClick=${() => go(b.go)}>${b.label}<//>`)}`;
    return html`<header class="site-h" data-site-header="1">
      <div class="site-h-in">
        <a class="site-brand" href=${"#" + (home || "")} onClick=${(e) => { e.preventDefault(); home && go(home); }}>
          <span class="mark"><${Icon} n="layers" s=${18} /></span>
          <span class="col minw0"><b class="site-name clamp1">${A.config.product}</b>${site.org && html`<span class="site-org clamp1">${site.org}</span>`}</span>
        </a>
        ${!A.narrow && html`<nav class="site-nav" aria-label=${t("nav.main")}>${top.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined}
          onClick=${(e) => { e.preventDefault(); go(s.id); }}>${label(s)}</a>`)}</nav>`}
        <span class="spacer"></span>
        <div class="site-acc">${accountArea}</div>
        <${ThemeButton} />
        ${A.narrow && (top.length > 0 || account.length > 0 || signIn.length > 0) && html`<${Button} kind="ghost" icon="menu" label=${t("site.menu")} aria-expanded=${sheet} onClick=${() => setSheet(true)} />`}
      </div>
      ${menu && html`<${Menu} anchor=${menu} onClose=${() => setMenu(null)} width=${280}>
        ${account.map((s) => html`<button type="button" key=${s.id} role="menuitem" aria-current=${A.screen === s.id ? "true" : "false"} onClick=${() => go(s.id)}><${Icon} n=${s.icon || "file"} s=${16} />${label(s)}</button>`)}
        ${signOut && html`<button type="button" role="menuitem" onClick=${() => { setMenu(null); signOut(); }}><${Icon} n="logout" s=${16} />${t("site.signOut")}</button>`}
      <//>`}
      ${sheet && html`<div class="scrim drawer-host" onMouseDown=${(e) => e.target === e.currentTarget && setSheet(false)}>
        <aside class="sheet site-sheet" role="dialog" aria-modal="true" aria-label=${t("site.menu")}>
          <div class="sheet-h"><b class="t-h2 grow">${t("site.menu")}</b><${Button} kind="ghost" size="sm" icon="x" label=${t("close")} onClick=${() => setSheet(false)} /></div>
          <nav class="sheet-b site-sheet-nav" aria-label=${t("nav.main")}>
            ${top.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${(e) => { e.preventDefault(); go(s.id); }}><${Icon} n=${s.icon || "file"} s=${18} />${label(s)}</a>`)}
            ${account.length > 0 && html`<span class="t-meta site-sheet-sec">${site.account}</span>`}
            ${account.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${(e) => { e.preventDefault(); go(s.id); }}><${Icon} n=${s.icon || "file"} s=${18} />${label(s)}</a>`)}
            ${!account.length && signIn.map((b) => html`<a key=${b.go} href=${"#" + b.go} onClick=${(e) => { e.preventDefault(); go(b.go); }}><${Icon} n="user" s=${18} />${b.label}</a>`)}
            ${signOut && account.length > 0 && html`<a href="#" onClick=${(e) => { e.preventDefault(); setSheet(false); signOut(); }}><${Icon} n="logout" s=${18} />${t("site.signOut")}</a>`}
          </nav>
        </aside>
      </div>`}
    </header>`;
  }

  function SiteFooter() {
    const A = useApp();
    const site = A.config.site || {};
    return html`<footer class="site-f"><div class="site-f-in">
      <b class="site-name">${A.config.product}</b>
      ${site.org && html`<span>${site.org}</span>`}
      ${(site.footer || []).map((line, i) => html`<span key=${i}>${line}</span>`)}
    </div></footer>`;
  }

  // Phone bottom tab bar of a site role: KIT_CONFIG.roles[].tabs (screen ids). A screen's `tab`
  // overrides its label there.
  function SiteTabs() {
    const A = useApp();
    const ids = (KIT.roleDef(A.role).tabs || []).filter((id) => KIT.canOpen(id, A.role));
    if (!A.narrow || ids.length < 2) return null;
    return html`<nav class="site-tabs" aria-label=${t("nav.main")}>${ids.map((id) => {
      const s = KIT.screens[id];
      return html`<button type="button" key=${id} aria-current=${A.screen === id ? "page" : undefined} onClick=${() => A.go(id)}>
        <${Icon} n=${s.icon || "file"} s=${22} /><span class="clamp1">${s.tab || label(s)}</span></button>`;
    })}</nav>`;
  }

  function SiteShell() {
    const A = useApp();
    const ref = useRef(null);
    // Each screen opens at the top of the page, like a page load.
    useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [A.screen, JSON.stringify(A.params)]);
    const Header = KIT.site.Header || SiteHeader;
    const Footer = KIT.site.Footer || SiteFooter;
    const tabs = A.narrow && (KIT.roleDef(A.role).tabs || []).length > 1;
    return html`<div class=${cx("site", tabs && "has-tabs")} data-shell="site">
      <div class="site-scroll" ref=${ref} id="kit-content">
        <${Header} />
        <main class="site-main"><${ScreenBody} wrap="site-page" /></main>
        <${Footer} />
      </div>
      <${SiteTabs} />
    </div>`;
  }

  /* ---------------- Windows app frame ---------------- */
  // Title bar with minimise, maximise and close; a taskbar with the app button, a tray icon
  // (its menu opens or exits the app) and a clock. The frame keeps its own window state.
  function WinFrame({ children }) {
    const A = useApp();
    const [win, setWin] = useState({ state: "open", max: true, tray: false });
    const product = A.config.product;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const set = (p) => setWin((w) => ({ ...w, ...p }));
    return html`<div class="win-desk">
      <div class=${cx("win-area", !win.max && "windowed")}>
        ${win.state === "open" ? html`<div class="win" aria-label=${t("win.window", { p: product })}>
          <div class="win-title">
            <span class="mark xs" aria-hidden="true"><${Icon} n="layers" s=${12} /></span><span class="win-name">${product}</span>
            <span class="t-meta clamp1 hide-narrow">${KIT.roleName(A.role)}</span>
            <span class="spacer"></span>
            <button type="button" class="win-btn" aria-label=${t("win.minimise")} title=${t("win.minimise")} onClick=${() => set({ state: "min", tray: false })}><${Icon} n="minus" s=${16} /></button>
            <button type="button" class="win-btn" aria-label=${win.max ? t("win.restore") : t("win.maximise")} title=${win.max ? t("win.restore") : t("win.maximise")} onClick=${() => set({ max: !win.max })}><${Icon} n=${win.max ? "restore" : "square"} s=${14} /></button>
            <button type="button" class="win-btn close" aria-label=${t("close")} title=${t("close")} onClick=${() => set({ state: "closed", tray: false })}><${Icon} n="x" s=${16} /></button>
          </div>
          <div class="win-body">${children}</div>
        </div>` : html`<div class="win-empty">
          ${win.state === "closed"
            ? html`<button type="button" class="win-shortcut" onClick=${() => set({ state: "open" })} aria-label=${t("win.open", { p: product })}><span class="mark"><${Icon} n="layers" s=${22} /></span>${product}</button>`
            : html`<p class="win-hint t-meta">${t("win.minimised", { p: product })}</p>`}
        </div>`}
      </div>
      <div class="taskbar" role="toolbar" aria-label=${t("win.taskbar")}>
        <span class="tb-btn deco" aria-hidden="true"><${Icon} n="windows" s=${18} /></span>
        ${win.state !== "closed" && html`<button type="button" class=${cx("tb-btn", "on", win.state === "open" && "focus")} aria-label=${win.state === "open" ? t("win.minimise") + " " + product : t("win.open", { p: product })} onClick=${() => set({ state: win.state === "open" ? "min" : "open", tray: false })}><span class="mark xs"><${Icon} n="layers" s=${12} /></span></button>`}
        <span class="spacer"></span>
        <div class="tray">
          ${win.state !== "closed" && html`<button type="button" class="tb-btn" aria-label=${t("win.tray", { p: product })} aria-haspopup="dialog" aria-expanded=${win.tray} onClick=${() => set({ tray: !win.tray })}><${Icon} n="layers" s=${16} /></button>`}
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="wifi" s=${16} /></span>
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="volume" s=${16} /></span>
          <span class="tb-clock tnum" aria-hidden="true"><span>${pad(now.getHours())}:${pad(now.getMinutes())}</span><span>${now.toLocaleDateString(A.config.locale)}</span></span>
        </div>
      </div>
      ${win.tray && win.state !== "closed" && html`<div class="tray-menu" role="dialog" aria-label=${t("win.trayMenu", { p: product })}>
        <button type="button" class="tm-item" onClick=${() => set({ state: "open", tray: false })}><${Icon} n="appwindow" s=${16} />${t("win.open", { p: product })}</button>
        <button type="button" class="tm-item" onClick=${() => set({ state: "closed", tray: false })}><${Icon} n="logout" s=${16} />${t("win.exit")}</button>
      </div>`}
    </div>`;
  }

  /* ---------------- Phone ---------------- */
  function MobileApp() {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    const tabs = navItems(A.role, "phone");
    return html`<div class="m-app">
      <div class="m-status" aria-hidden="true"></div>
      <header class="m-top">
        ${A.canBack ? html`<${Button} kind="ghost" icon="back" label=${t("back")} onClick=${A.back} />` : html`<span class="m-top-sp"></span>`}
        <h1 class="t-h2 clamp1 grow">${reg ? reg.name : A.config.product}</h1>
        <${ThemeButton} />
      </header>
      <${ScreenBody} wrap="m-content" />
      ${tabs.length > 1 && html`<nav class="m-nav" aria-label=${t("nav.main")}>${tabs.map((s) => html`<button type="button" key=${s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${() => A.go(s.id)}>
        <${Icon} n=${s.icon || "file"} s=${20} /><span class="clamp1">${s.name}</span></button>`)}</nav>`}
    </div>`;
  }

  // The phone frame (390 x 844 screen in a device bezel), scaled down to fit short windows.
  function PhoneStage() {
    const ref = useRef(null);
    const [scale, setScale] = useState(1);
    useLayoutEffect(() => {
      const fit = () => {
        const el = ref.current;
        if (el) setScale(Math.min(1, (el.clientHeight - 32) / 868, (el.clientWidth - 32) / 414));
      };
      fit();
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }, []);
    return html`<div class="stage phone-stage" ref=${ref}>
      <div style=${{ width: 414 * scale + "px", height: 868 * scale + "px" }}>
        <div class="phone" style=${{ transform: `scale(${scale})` }}><div class="phone-screen"><${MobileApp} /></div></div>
      </div>
    </div>`;
  }

  /* ---------------- Stage ---------------- */
  function Stage() {
    const A = useApp();
    if (A.screen == null) return html`<div class="stage"><${RolePicker} /></div>`;
    if (A.layout === "phone-native") return html`<div class="stage"><div class="phone-screen native"><${MobileApp} /></div></div>`;
    if (A.layout === "phone-frame") return html`<${PhoneStage} />`;
    if (KIT.isBare(A.screen, A.params, A.role) && KIT.canOpen(A.screen, A.role)) {
      return html`<div class="stage bare-stage" data-shell="bare"><div class="bare-scroll" id="kit-content"><${ScreenBody} wrap="bare-page" /></div></div>`;
    }
    if (A.layout === "windows") return html`<div class="stage"><${WinFrame}><${DesktopShell} /><//></div>`;
    if (isSite(A.role)) return html`<div class="stage"><${SiteShell} /></div>`;
    return html`<div class="stage"><${DesktopShell} /></div>`;
  }

  KIT.shell = { Stage, ProtoBar, RolePicker, DesktopShell, Sidebar, Topbar, ScreenBody, WinFrame, PhoneStage, MobileApp, SiteShell, SiteHeader, SiteFooter, navItems };
})();
