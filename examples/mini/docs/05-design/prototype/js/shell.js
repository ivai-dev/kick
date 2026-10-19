// shell.js — everything around the screens (KIT.shell):
//   - ProtoBar: the prototype controls (start page, role, platform, release scope, theme,
//     screen index). Not part of the product.
//   - RolePicker: the start page (no hash): product name, one card per role with its home,
//     the guided scenarios, the theme toggle.
//   - DesktopShell (sidebar, top bar, content); below 760 px the sidebar is a drawer.
//   - WinFrame: the Windows app frame (title bar, taskbar, tray) around the desktop shell.
//   - PhoneStage (390 x 844 phone frame, scaled to fit) and MobileApp (top bar, content,
//     bottom tab bar), used full screen below 760 px for screens with an android platform.
//   - ScreenBody: the role guard (KIT.ui.Denied instead of a screen the role may not open),
//     the release lens on the whole screen, and the screen itself.
// Which layout shows is decided in main.js (layoutOf). Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useState, useRef, useLayoutEffect, useEffect } = hooks;
  const { cx } = KIT.util;
  const { Icon, Button, Menu, RelBadge, ScreenRel, Denied, NotFound, Placeholder } = KIT.ui;

  const PLATFORM = { web: ["Web", "globe"], windows: ["Windows", "windows"], android: ["Android", "phone"] };
  const LENSES = () => [
    ["full", "Full product", "layers"],
    ["tags", "Release tags", "tag"],
    ["mvp", KIT.config().releases[0] + " only", "target"],
  ];
  const THEMES = [["light", "Light", "sun"], ["dark", "Dark", "moon"], ["system", "System", "monitor"]];

  // Screens a role reaches from navigation: desk (web and Windows shell) or phone (tab bar).
  function navItems(role, kind) {
    return Object.values(KIT.screens).filter((s) => s.nav && s.roles.includes(role) &&
      (kind === "phone" ? s.platforms.includes("android") : s.platforms.some((p) => p !== "android")));
  }
  const platformsOf = (role) => KIT.config().platforms.filter((p) => Object.values(KIT.screens).some((s) => s.roles.includes(role) && s.platforms.includes(p)));

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
    return html`<div class="proto" role="region" aria-label="Prototype controls">
      <span class="proto-tag hide-sm"><b>Prototype</b></span>
      <${Button} kind="ghost" size="sm" icon="home" label="Roles and scenarios" onClick=${A.openPicker} />
      <label class="proto-role"><span class="pb-lbl t-meta">Role</span>
        <select class="select sm" aria-label="Role" value=${A.role} onChange=${(e) => A.setRole(e.currentTarget.value)}>
          ${cfg.roles.map((r) => html`<option key=${r.id} value=${r.id}>${r.name}</option>`)}
        </select></label>
      ${cfg.platforms.length > 1 && html`<${Seg} label="Platform" cls="hide-sm" value=${A.platform} onPick=${A.setPlatform}
        items=${cfg.platforms.map((p) => [p, PLATFORM[p][0], PLATFORM[p][1]])} />`}
      <${Seg} label="Release scope" value=${A.lens} onPick=${A.setLens} items=${LENSES()} />
      <${Seg} label="Theme" cls="hide-sm" value=${A.theme} onPick=${A.setTheme} items=${THEMES} iconsOnly />
      <span class="spacer"></span>
      <button type="button" ref=${idxRef} class="btn sm proto-idx" aria-haspopup="menu" aria-expanded=${!!menu} aria-label=${"Screens" + (cur ? ": " + cur.name : "")} onClick=${() => setMenu(menu ? null : idxRef.current)}>
        <${Icon} n="grid" s=${16} /><span class="clamp1 hide-sm">${cur ? cur.code + " · " + cur.name : "Screens"}</span><${Icon} n="down" s=${14} cls="hide-sm" />
      </button>
      ${menu && html`<${Menu} anchor=${menu} onClose=${() => setMenu(null)} width=${360}>
        ${list.length ? list.map((s) => html`<button type="button" key=${s.id} role="menuitem" aria-current=${s.id === A.screen ? "true" : "false"} onClick=${() => { setMenu(null); A.jump({ screen: s.id }); }}>
          <span class="code">${s.code}</span><span class="grow clamp1">${s.name}</span><${RelBadge} r=${s.rel} /></button>`)
          : html`<span class="t-meta mh">No screens registered yet.</span>`}
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
        <div class="lh-brand"><span class="mark"><${Icon} n="layers" s=${18} /></span><span class="t-h2">${cfg.product}</span><span class="proto-tag"><b>Prototype</b></span></div>
        <h1 class="t-h1">Choose a role to explore the product</h1>
        <p class="t-body">Clickable prototype of the full product, every role and release. Sample data only.</p>
        <div class="row wrap gap-12"><span class="t-meta">Theme</span><${Seg} label="Theme" value=${A.theme} onPick=${A.setTheme} items=${THEMES} /></div>
      </header>

      <section class="col gap-16" aria-labelledby="kit-roles-h">
        <h2 id="kit-roles-h" class="t-h2">Roles</h2>
        <div class="launch-roles">${cfg.roles.map((r) => {
          const home = KIT.homeOf(r.id);
          const hs = home && KIT.screens[home];
          return html`<button type="button" key=${r.id} class="lr-card" data-role=${r.id} aria-disabled=${hs ? undefined : "true"} onClick=${() => A.setRole(r.id)}>
            <span class="row gap-12"><span class="lr-ic"><${Icon} n="user" s=${20} /></span><b class="t-h3 clamp1">${r.name}</b></span>
            <span class="t-meta">${hs ? `Starts on ${hs.name} (${hs.code})` : "No screens for this role yet"}</span>
            <span class="lr-plat">${platformsOf(r.id).map((p) => html`<span key=${p} class="lr-chip">${PLATFORM[p][0]}</span>`)}</span>
            <span class="lr-go">${hs ? "Open" : "Not available"}<${Icon} n="right" s=${15} /></span>
          </button>`;
        })}</div>
      </section>

      <section class="col gap-16" aria-labelledby="kit-scn-h">
        <h2 id="kit-scn-h" class="t-h2">Guided scenarios</h2>
        ${scenarios.length ? html`<div class="launch-scen">${scenarios.map((s, i) => html`<article key=${s.id} class="sc-card" data-scenario-id=${s.id}>
            <span class="sc-n" aria-hidden="true">${i + 1}</span>
            <b class="t-h3">${s.name}</b>
            <span class="t-meta">${KIT.roleName(s.role)} · ${(PLATFORM[s.platform] || PLATFORM.web)[0]} · ${s.steps.length} steps</span>
            <${Button} size="sm" icon="play" onClick=${() => KIT.scenario.run(KIT._api, s.id)}>Play<//>
          </article>`)}</div>`
          : html`<p class="t-meta">No guided scenarios yet.</p>`}
      </section>

      <footer class="t-meta launch-foot"><${Icon} n="shield" s=${14} /><span>Synthetic sample data. Nothing you enter leaves this page.</span></footer>
    </div></div>`;
  }

  /* ---------------- Desktop shell ---------------- */
  function Sidebar() {
    const A = useApp();
    const items = navItems(A.role, "desk");
    const groups = [];
    for (const s of items) {
      let g = groups.find((x) => x.label === s.nav);
      if (!g) groups.push((g = { label: s.nav, items: [] }));
      g.items.push(s);
    }
    return html`<nav class="side" id="kit-side" aria-label="Main navigation">
      <div class="brand">
        <span class="mark"><${Icon} n="layers" s=${18} /></span>
        <div class="col hide-rail grow minw0"><span class="brand-name clamp1">${A.config.product}</span><span class="t-meta clamp1">${KIT.roleName(A.role)}</span></div>
        ${A.narrow && html`<${Button} kind="ghost" icon="x" label="Close menu" onClick=${() => A.setDrawer(false)} />`}
      </div>
      <div class="nav">${groups.map((g) => [
        html`<span key=${"h-" + g.label} class="t-cap nav-sec hide-rail">${g.label}</span>`,
        ...g.items.map((s) => {
          const later = KIT.scope.isLater(s.rel);
          const dim = later && A.lens === "mvp";
          return html`<a href=${"#" + s.id} key=${s.id} class=${dim ? "rel-dim-nav" : undefined} aria-disabled=${dim ? "true" : undefined}
            aria-current=${A.screen === s.id ? "page" : undefined} title=${dim ? `${s.name} · arrives in ${s.rel}` : s.name}
            onClick=${(e) => { e.preventDefault(); if (!dim) A.go(s.id); }}>
            <${Icon} n=${s.icon || "file"} s=${19} /><span class="hide-rail lbl">${s.name}</span>
            ${later && A.lens !== "full" && html`<${RelBadge} r=${s.rel} cls="hide-rail nav-rel" />`}
          </a>`;
        }),
      ])}</div>
      <div class="side-foot">
        <button type="button" class="me" onClick=${A.openPicker} aria-label=${"Role: " + KIT.roleName(A.role) + ". Switch role"}>
          <span class="avatar"><${Icon} n="user" s=${16} /></span>
          <span class="col hide-rail minw0"><b class="t-strong clamp1">${KIT.roleName(A.role)}</b><span class="t-meta clamp1">Switch role</span></span>
        </button>
      </div>
    </nav>`;
  }

  function Topbar() {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    return html`<header class="topbar">
      ${A.narrow
        ? html`<${Button} kind="ghost" icon="menu" label="Open navigation" aria-expanded=${!!A.drawer} aria-controls="kit-side" onClick=${() => A.setDrawer(true)} />`
        : html`<${Button} kind="ghost" icon="panel" label=${A.sidebar ? "Collapse sidebar" : "Expand sidebar"} onClick=${A.toggleSidebar} />`}
      ${A.canBack && html`<${Button} kind="ghost" icon="back" label="Back" onClick=${A.back} />`}
      <span class="t-strong clamp1 grow">${reg ? reg.name : ""}</span>
      <${Button} kind="ghost" icon=${A.resolved === "dark" ? "sun" : "moon"} label=${A.resolved === "dark" ? "Light theme" : "Dark theme"} onClick=${() => A.setTheme(A.resolved === "dark" ? "light" : "dark")} />
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
        ${win.state === "open" ? html`<div class="win" aria-label=${product + " window"}>
          <div class="win-title">
            <span class="mark xs" aria-hidden="true"><${Icon} n="layers" s=${12} /></span><span class="win-name">${product}</span>
            <span class="t-meta clamp1 hide-narrow">${KIT.roleName(A.role)}</span>
            <span class="spacer"></span>
            <button type="button" class="win-btn" aria-label="Minimise" title="Minimise" onClick=${() => set({ state: "min", tray: false })}><${Icon} n="minus" s=${16} /></button>
            <button type="button" class="win-btn" aria-label=${win.max ? "Restore down" : "Maximise"} title=${win.max ? "Restore down" : "Maximise"} onClick=${() => set({ max: !win.max })}><${Icon} n=${win.max ? "restore" : "square"} s=${14} /></button>
            <button type="button" class="win-btn close" aria-label="Close" title="Close" onClick=${() => set({ state: "closed", tray: false })}><${Icon} n="x" s=${16} /></button>
          </div>
          <div class="win-body">${children}</div>
        </div>` : html`<div class="win-empty">
          ${win.state === "closed"
            ? html`<button type="button" class="win-shortcut" onClick=${() => set({ state: "open" })} aria-label=${"Open " + product}><span class="mark"><${Icon} n="layers" s=${22} /></span>${product}</button>`
            : html`<p class="win-hint t-meta">${product} is minimised. Open it again from the taskbar.</p>`}
        </div>`}
      </div>
      <div class="taskbar" role="toolbar" aria-label="Windows taskbar (simulated)">
        <span class="tb-btn deco" aria-hidden="true"><${Icon} n="windows" s=${18} /></span>
        ${win.state !== "closed" && html`<button type="button" class=${cx("tb-btn", "on", win.state === "open" && "focus")} aria-label=${win.state === "open" ? "Minimise " + product : "Open " + product} onClick=${() => set({ state: win.state === "open" ? "min" : "open", tray: false })}><span class="mark xs"><${Icon} n="layers" s=${12} /></span></button>`}
        <span class="spacer"></span>
        <div class="tray">
          ${win.state !== "closed" && html`<button type="button" class="tb-btn" aria-label=${product + " in the tray"} aria-haspopup="dialog" aria-expanded=${win.tray} onClick=${() => set({ tray: !win.tray })}><${Icon} n="layers" s=${16} /></button>`}
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="wifi" s=${16} /></span>
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="volume" s=${16} /></span>
          <span class="tb-clock tnum" aria-hidden="true"><span>${pad(now.getHours())}:${pad(now.getMinutes())}</span><span>${now.toLocaleDateString(A.config.locale)}</span></span>
        </div>
      </div>
      ${win.tray && win.state !== "closed" && html`<div class="tray-menu" role="dialog" aria-label=${product + " tray menu"}>
        <button type="button" class="tm-item" onClick=${() => set({ state: "open", tray: false })}><${Icon} n="appwindow" s=${16} />Open ${product}</button>
        <button type="button" class="tm-item" onClick=${() => set({ state: "closed", tray: false })}><${Icon} n="logout" s=${16} />Exit</button>
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
        ${A.canBack ? html`<${Button} kind="ghost" icon="back" label="Back" onClick=${A.back} />` : html`<span class="m-top-sp"></span>`}
        <h1 class="t-h2 clamp1 grow">${reg ? reg.name : A.config.product}</h1>
        <${Button} kind="ghost" icon=${A.resolved === "dark" ? "sun" : "moon"} label=${A.resolved === "dark" ? "Light theme" : "Dark theme"} onClick=${() => A.setTheme(A.resolved === "dark" ? "light" : "dark")} />
      </header>
      <${ScreenBody} wrap="m-content" />
      ${tabs.length > 1 && html`<nav class="m-nav" aria-label="Main navigation">${tabs.map((s) => html`<button type="button" key=${s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${() => A.go(s.id)}>
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
    if (A.layout === "windows") return html`<div class="stage"><${WinFrame}><${DesktopShell} /><//></div>`;
    return html`<div class="stage"><${DesktopShell} /></div>`;
  }

  KIT.shell = { Stage, ProtoBar, RolePicker, DesktopShell, Sidebar, Topbar, ScreenBody, WinFrame, PhoneStage, MobileApp, navItems };
})();
