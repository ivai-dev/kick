// shell.js — everything around the screens (KIT.shell):
//   - ProtoBar: the prototype controls (start page, role, platform, release scope, density, theme, and the
//     screen index: a popover with a search field and a list). Not part of the product; compact density.
//   - RolePicker: the start page (no hash): product name, one card per role with its home,
//     the guided scenarios, the theme toggle.
//   - DesktopShell (sidebar, top bar, content); below 760 px the sidebar is a navigation drawer (a modal
//     side panel). The app shell of work tools (roles with shell "app", the default). Staff pages start next
//     to the sidebar: data pages are fluid to 1600 px, form pages stop at 1200 (register with page: "form").
//   - SiteShell (header with the top menu and the account area, page, footer; below 760 px a
//     compact header with a menu panel and an optional bottom tab bar). The public-site shell of
//     roles with shell "site". A project may replace the header or footer with KIT.site.Header /
//     KIT.site.Footer (components that read KIT.useApp()).
//   - Bare stage: a screen registered with bare (true or (params, role) => boolean) renders on
//     the stage without any shell; with frame ("kiosk" or (params, role) => name) it renders inside the
//     project's frame component (KIT.frame(name, Component)), kept mounted across routes.
//   - WinFrame: the Windows app frame (title bar, taskbar, tray) around the desktop shell.
//   - PhoneStage (390 x 844 phone frame, zoomed to fit) and MobileApp (top bar, content,
//     bottom tab bar), used full screen below 760 px for screens with an android platform.
//   - ScreenBody: the role guard (KIT.ui.Denied instead of a screen the role may not open),
//     the release lens on the whole screen, the screen itself, scroll and focus after routes.
// Which layout shows is decided in main.js (layoutOf) and Stage below. Every word goes through
// KIT.t. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp, t } = KIT;
  const { useState, useRef, useLayoutEffect, useEffect, useMemo } = hooks;
  const { cx } = KIT.util;
  const L = KIT.logic;
  const U = KIT.ui;
  const { Icon, Button, IconButton, Tip, RelBadge, ScreenRel, Denied, NotFound, Placeholder, Popover, SidePanel, SegmentedControl } = U;
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
    return Object.values(KIT.screens).filter((s) => s.nav && !s.internal && s.roles.includes(role) &&
      (kind === "phone" ? s.platforms.includes("android") : s.platforms.some((p) => p !== "android")));
  }
  const platformsOf = (role) => KIT.config().platforms.filter((p) => Object.values(KIT.screens).some((s) => !s.internal && s.roles.includes(role) && s.platforms.includes(p)));
  const isSite = (role) => KIT.roleDef(role).shell === "site";
  // A navigation link: href for new tabs and the URL, A.go on a plain click.
  const navClick = (A, id) => (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    A.go(id);
  };

  function ThemeButton() {
    const A = useApp();
    const dark = A.resolved === "dark";
    return html`<${IconButton} icon=${dark ? "sun" : "moon"} label=${dark ? t("theme.toLight") : t("theme.toDark")} onClick=${() => A.setTheme(dark ? "light" : "dark")} />`;
  }

  /* ---------------- Prototype bar ---------------- */
  // The screen index: a popover with a search field (folded: "tim viec" finds "Tìm việc") and a list of
  // screens with their release; arrows move, Enter jumps.
  function ScreenIndex() {
    const A = useApp();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [act, setAct] = useState(0);
    const inputRef = useRef(null);
    const cur = KIT.screens[A.screen];
    const all = useMemo(() => Object.values(KIT.screens).filter((s) => !s.internal).map((s) => ({ ...s, label: s.code + " " + s.name })), [Object.keys(KIT.screens).length]);
    const shown = L.matchOptions(q, all);
    useEffect(() => {
      if (open) { setQ(""); setAct(Math.max(0, all.findIndex((s) => s.id === A.screen))); setTimeout(() => inputRef.current && inputRef.current.focus(), 50); }
    }, [open]);
    useEffect(() => {
      const el = document.getElementById("kit-idx-o" + act);
      el && el.scrollIntoView && el.scrollIntoView({ block: "nearest" });
    }, [act, open]);
    const jump = (s) => { setOpen(false); A.jump({ screen: s.id }); };
    const key = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setAct(Math.min(shown.length - 1, act + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAct(Math.max(0, act - 1)); }
      else if (e.key === "Enter" && shown[act]) { e.preventDefault(); jump(shown[act]); }
    };
    return html`<button type="button" id="kit-idx" class="btn sm proto-idx" aria-haspopup="dialog" aria-expanded=${open ? "true" : "false"}
        aria-label=${t("proto.screens") + (cur && !cur.internal ? ": " + cur.code + " · " + cur.name : "")} onClick=${() => setOpen(!open)}>
        <${Icon} n="grid" s=${16} /><span class="clamp1 hide-sm">${cur ? cur.code + " · " + cur.name : t("proto.screens")}</span><${Icon} n="down" s=${14} cls="hide-sm" /></button>
      <${Popover} open=${open} anchor="kit-idx" placement="bottom-end" title=${t("proto.screens")} onClose=${() => setOpen(false)} cls="pb-idx">
        <input ref=${inputRef} class="input" type="search" role="combobox" aria-expanded="true" aria-controls="kit-idx-list" aria-autocomplete="list"
          aria-activedescendant=${shown[act] ? "kit-idx-o" + act : undefined} aria-label=${t("proto.search")} placeholder=${t("proto.search")}
          value=${q} onInput=${(e) => { setQ(e.currentTarget.value); setAct(0); }} onKeyDown=${key} />
        <div class="pb-idx-list" role="listbox" id="kit-idx-list" aria-label=${t("proto.screens")}>${shown.length
          ? shown.map((s, i) => html`<div key=${s.id} id=${"kit-idx-o" + i} role="option" class="pb-idx-opt" aria-selected=${i === act ? "true" : "false"}
              aria-current=${s.id === A.screen ? "true" : undefined} onMouseDown=${(e) => e.preventDefault()} onClick=${() => jump(s)}>
              <span class="code">${s.code}</span><span class="grow clamp1">${s.name}</span><${RelBadge} r=${s.rel} /></div>`)
          : html`<span class="t-meta">${all.length ? t("proto.noMatch") : t("proto.noScreens")}</span>`}</div>
      <//>`;
  }

  function ProtoBar() {
    const A = useApp();
    const cfg = A.config;
    const appRole = !isSite(A.role);
    return html`<div class="proto" role="region" aria-label=${t("proto.controls")} data-density="compact">
      <span class="proto-tag hide-sm"><b>${t("proto.tag")}</b></span>
      <${IconButton} size="sm" icon="home" label=${t("proto.start")} onClick=${A.openPicker} />
      <label class="proto-role"><span class="pb-lbl t-meta">${t("proto.role")}</span>
        <select class="select sm" aria-label=${t("proto.role")} value=${A.role} onChange=${(e) => A.setRole(e.currentTarget.value)}>
          ${cfg.roles.map((r) => html`<option key=${r.id} value=${r.id}>${r.name}</option>`)}
        </select></label>
      ${cfg.platforms.length > 1 && html`<${SegmentedControl} label=${t("proto.platform")} size="sm" cls="hide-sm" value=${A.platform} onPick=${A.setPlatform}
        items=${cfg.platforms.map((p) => [p, PLATFORM[p][0], PLATFORM[p][1]])} />`}
      <${SegmentedControl} label=${t("proto.scope")} size="sm" value=${A.lens} onPick=${A.setLens} items=${LENSES()} />
      ${appRole && A.screen != null && html`<${SegmentedControl} label=${t("proto.density")} size="sm" cls="hide-sm pb-dens" value=${A.density === "comfortable" ? "comfortable" : "compact"}
        onPick=${A.setDensity} items=${[["compact", t("density.compact"), "list"], ["comfortable", t("density.comfortable"), "grid"]]} />`}
      <${SegmentedControl} label=${t("proto.theme")} size="sm" cls="hide-sm" value=${A.theme} onPick=${A.setTheme} items=${THEMES()} iconsOnly />
      <span class="spacer"></span>
      <${ScreenIndex} />
    </div>`;
  }

  /* ---------------- Start page: roles and scenarios ---------------- */
  function RolePicker() {
    const A = useApp();
    const cfg = A.config;
    const scenarios = KIT.SCENARIOS || [];
    return html`<div class="launch" data-density="compact"><div class="launch-in">
      <header class="launch-hero">
        <div class="lh-brand"><span class="mark"><${Icon} n="layers" s=${18} /></span><span class="t-title-l">${cfg.product}</span><span class="proto-tag"><b>${t("proto.tag")}</b></span></div>
        <h1 class="t-headline" tabindex="-1" data-kit-h1="">${t("start.title")}</h1>
        <p class="t-body">${t("start.lead")}</p>
        <div class="row wrap gap-12"><span class="t-meta">${t("proto.theme")}</span><${SegmentedControl} label=${t("proto.theme")} value=${A.theme} onPick=${A.setTheme} items=${THEMES()} /></div>
      </header>

      <section class="col gap-16" aria-labelledby="kit-roles-h">
        <h2 id="kit-roles-h" class="t-title-l">${t("start.roles")}</h2>
        <div class="launch-roles">${cfg.roles.map((r) => {
          const home = KIT.homeOf(r.id);
          const hs = home && KIT.screens[home];
          return html`<button type="button" key=${r.id} class="lr-card" data-role=${r.id} aria-disabled=${hs ? undefined : "true"} onClick=${() => hs && A.setRole(r.id)}>
            <span class="row gap-12"><span class="lr-ic"><${Icon} n="user" s=${20} /></span><b class="t-title clamp1">${r.name}</b></span>
            <span class="t-meta">${hs ? t("start.startsOn", { name: hs.name, code: hs.code }) : t("start.noRoleScreens")}</span>
            <span class="lr-plat">${platformsOf(r.id).map((p) => html`<span key=${p} class="lr-chip">${PLATFORM[p][0]}</span>`)}</span>
            <span class="lr-go">${hs ? t("start.open") : t("start.unavailable")}<${Icon} n="right" s=${15} /></span>
          </button>`;
        })}</div>
      </section>

      <section class="col gap-16" aria-labelledby="kit-scn-h">
        <h2 id="kit-scn-h" class="t-title-l">${t("start.scenarios")}</h2>
        ${scenarios.length ? html`<div class="launch-scen">${scenarios.map((s, i) => html`<article key=${s.id} class="sc-card" data-scenario-id=${s.id}>
            <span class="sc-n" aria-hidden="true">${i + 1}</span>
            <b class="t-title">${s.name}</b>
            <span class="t-meta">${KIT.roleName(s.role)} · ${(PLATFORM[s.platform] || PLATFORM.web)[0]} · ${t("scn.steps", { n: s.steps.length })}</span>
            <${Button} size="sm" icon="play" onClick=${() => KIT.scenario.run(KIT._api, s.id)}>${t("scn.play")}<//>
          </article>`)}</div>`
          : html`<p class="t-meta">${t("start.noScenarios")}</p>`}
      </section>

      <footer class="t-meta launch-foot"><${Icon} n="shield" s=${14} /><span>${t("start.footer")}</span></footer>
    </div></div>`;
  }

  /* ---------------- Desktop (app) shell ---------------- */
  function Sidebar({ inDrawer }) {
    const A = useApp();
    const items = navItems(A.role, "desk");
    const groups = [];
    for (const s of items) {
      let g = groups.find((x) => x.label === s.nav);
      if (!g) groups.push((g = { label: s.nav, items: [] }));
      g.items.push(s);
    }
    const rail = !inDrawer && !A.sidebar;
    return html`<nav class=${cx("side", inDrawer && "in-drawer")} id=${inDrawer ? "kit-side-drawer" : "kit-side"} aria-label=${t("nav.main")}>
      ${!inDrawer && html`<div class="brand">
        <span class="mark"><${Icon} n="layers" s=${18} /></span>
        <div class="col hide-rail grow minw0"><span class="brand-name clamp1">${A.config.product}</span><span class="t-meta clamp1">${KIT.roleName(A.role)}</span></div>
      </div>`}
      <div class="nav">${groups.map((g) => [
        html`<span key=${"h-" + g.label} class="t-cap nav-sec hide-rail">${g.label}</span>`,
        ...g.items.map((s) => {
          const later = KIT.scope.isLater(s.rel);
          const dim = later && A.lens === "mvp";
          const link = html`<a href=${"#" + s.id} key=${s.id} class=${dim ? "rel-dim-nav" : undefined} aria-disabled=${dim ? "true" : undefined}
            aria-current=${A.screen === s.id ? "page" : undefined} aria-label=${rail ? (dim ? t("nav.arrives", { name: s.name, r: s.rel }) : s.name) : undefined}
            onClick=${(e) => { if (dim) { e.preventDefault(); return; } navClick(A, s.id)(e); if (inDrawer) A.setDrawer(false); }}>
            <${Icon} n=${s.icon || "file"} s=${18} /><span class="hide-rail lbl">${s.name}</span>
            ${later && A.lens !== "full" && html`<${RelBadge} r=${s.rel} cls="hide-rail nav-rel" />`}
          </a>`;
          return rail ? html`<${Tip} key=${s.id} text=${s.name} placement="right">${link}<//>` : link;
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
        ? html`<${IconButton} icon="menu" label=${t("nav.openMenu")} aria-expanded=${A.drawer ? "true" : "false"} aria-controls="kit-side-drawer" onClick=${() => A.setDrawer(true)} />`
        : html`<${IconButton} icon="panel" label=${A.sidebar ? t("nav.collapse") : t("nav.expand")} aria-expanded=${A.sidebar ? "true" : "false"} aria-controls="kit-side" onClick=${A.toggleSidebar} />`}
      ${A.canBack && html`<${IconButton} icon="back" label=${t("back")} onClick=${A.back} />`}
      <span class="tb-name clamp1 grow">${reg ? reg.name : ""}</span>
      <${ThemeButton} />
    </header>`;
  }

  // Every shell's screen region: role guard, release lens, the screen; after each route the scroll goes to
  // the top (forward, lateral) or back to where the screen was left (back), focus goes to the page h1 (or,
  // on Back, to the element that opened the detail) and document.title names the screen. Without View
  // Transitions (or with reduced motion) the region plays a short CSS entrance instead.
  let firstScreen = true;
  function ScreenBody({ wrap, density, id }) {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    const navKey = A.S._navKey || 0;
    const dir = A.S._dir;
    useLayoutEffect(() => {
      document.title = t("app.screenTitle", { screen: reg ? reg.name : "", product: A.config.product });
      if (dir === "replace") return;
      const sc = document.getElementById("kit-content");
      const back = dir === "back";
      if (sc) sc.scrollTop = back ? A.S._restore || 0 : 0;
      const first = firstScreen;
      firstScreen = false;
      if (first && !/^#[a-z0-9]/i.test(location.hash)) return;
      let target = back && A.S._from ? document.querySelector(`[data-kit-key="${CSS.escape(A.S._from)}"]`) : null;
      if (!target) {
        target = document.querySelector("[data-kit-h1]") || document.querySelector("#kit-content h1, main h1, .m-content h1");
        if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      }
      if (target && !document.querySelector("wa-dialog[open], wa-drawer[open]")) target.focus({ preventScroll: true });
    }, [A.screen, navKey]);
    let body;
    if (!reg) body = html`<${NotFound} />`;
    else if (!reg.roles.includes(A.role)) body = html`<${Denied} />`;
    else {
      const Comp = typeof reg.comp === "function" ? reg.comp : Placeholder;
      body = html`<${ScreenRel} r=${reg.rel}><${Comp} key=${A.screen + ":" + navKey} /><//>`;
    }
    const fallback = navKey > 0 && dir !== "replace" && (!document.startViewTransition || KIT.util.reduced() || !KIT._frames);
    const anim = fallback ? (dir === "forward" ? "nav-f" : dir === "back" ? "nav-b" : "nav-l") : null;
    return html`<div key=${fallback ? "k" + navKey : "k"} id=${id} class=${cx(wrap, anim)} data-screen=${A.screen} data-page=${reg && wrap === "page" ? reg.page || "data" : undefined} data-density=${density}>${body}</div>`;
  }

  function DesktopShell() {
    const A = useApp();
    return html`<div class=${cx("shell", !A.sidebar && "collapsed")} data-density=${A.density}>
      ${!A.narrow && html`<${Sidebar} />`}
      <div class="main">
        <${Topbar} />
        <div class="content" id="kit-content"><${ScreenBody} wrap="page" /></div>
      </div>
      ${A.narrow && html`<${SidePanel} open=${!!A.drawer} side="start" title=${A.config.product} onClose=${() => A.setDrawer(false)}><${Sidebar} inDrawer=${true} /><//>`}
    </div>`;
  }

  /* ---------------- Site shell ---------------- */
  // KIT_CONFIG.site = { org, menu, account, accountLabel, signIn: [{ label, go }], signOut, footer: [lines] }
  //   menu: screen ids of the top menu, in order (default: the role's nav screens outside the account group);
  //   org: the organisation line under the product name;
  //   account: the nav label whose screens form the account menu (not the top menu);
  //   accountLabel: the account button's text (default: the role name);
  //   signIn: buttons shown when the role has no account screens (a visitor); no filled button in the header
  //     (the last is secondary, the others ghost); below 600 px only the first stays in the header;
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
    const [acc, setAcc] = useState(false);
    const [sheet, setSheet] = useState(false);
    const home = KIT.homeOf(A.role);
    const signOut = site.signOut && site.signOut !== A.role ? () => A.setRole(site.signOut) : null;
    const go = (id) => { setAcc(false); setSheet(false); A.go(id); };
    const linkTo = (id) => (e) => { if (e.button !== 0 || e.ctrlKey || e.metaKey) return; e.preventDefault(); go(id); };
    const signIn = site.signIn || [];
    const xs = A.wc === "compact";
    const shownSignIn = xs ? signIn.slice(0, 1) : signIn;
    // Account: disclosure navigation (a button and a list of links), not a menu.
    const accountArea = account.length
      ? html`<button type="button" id="kit-acc" class="site-me" aria-expanded=${acc ? "true" : "false"} aria-controls="kit-acc-nav" onClick=${() => setAcc(!acc)}>
          <span class="avatar"><${Icon} n="user" s=${16} /></span><span class="clamp1 hide-sm">${site.accountLabel || KIT.roleName(A.role)}</span><${Icon} n="down" s=${14} cls="chev" /></button>
        <${Popover} open=${acc} anchor="kit-acc" placement="bottom-end" onClose=${() => setAcc(false)}>
          <nav class="site-acc-nav" id="kit-acc-nav" aria-label=${site.account || t("site.account")}><ul>
            ${account.map((s) => html`<li key=${s.id}><a href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${linkTo(s.id)}><${Icon} n=${s.icon || "file"} s=${16} />${label(s)}</a></li>`)}
            ${signOut && html`<li><a href=${"#" + (KIT.homeOf(site.signOut) || "")} onClick=${(e) => { e.preventDefault(); setAcc(false); signOut(); }}><${Icon} n="logout" s=${16} />${t("site.signOut")}</a></li>`}
          </ul></nav><//>`
      : html`${shownSignIn.map((b, i) => html`<${Button} key=${b.go} kind=${i === signIn.length - 1 ? "secondary" : "ghost"} size="sm" onClick=${() => go(b.go)}>${b.label}<//>`)}`;
    const menuNeeded = A.narrow && (top.length > 0 || account.length > 0 || signIn.length > 1);
    return html`<header class="site-h" data-site-header="1">
      <div class="site-h-in">
        <a class="site-brand" href=${"#" + (home || "")} onClick=${(e) => { e.preventDefault(); home && go(home); }}>
          <span class="mark"><${Icon} n="layers" s=${18} /></span>
          <span class="col minw0"><b class="site-name clamp1">${A.config.product}</b>${site.org && html`<span class="site-org clamp1">${site.org}</span>`}</span>
        </a>
        ${!A.narrow && html`<nav class="site-nav" aria-label=${t("nav.main")}>${top.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined}
          onClick=${linkTo(s.id)}>${label(s)}</a>`)}</nav>`}
        <span class="spacer"></span>
        <div class="site-acc">${accountArea}</div>
        ${!xs && html`<${ThemeButton} />`}
        ${menuNeeded && html`<${IconButton} icon="menu" label=${t("site.menu")} aria-expanded=${sheet ? "true" : "false"} onClick=${() => setSheet(true)} />`}
      </div>
      ${menuNeeded && html`<${SidePanel} open=${sheet} side="end" title=${t("site.menu")} onClose=${() => setSheet(false)}>
        <nav class="site-sheet-nav" aria-label=${t("nav.main")}>
          ${top.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${linkTo(s.id)}><${Icon} n=${s.icon || "file"} s=${18} />${label(s)}</a>`)}
          ${account.length > 0 && html`<span class="t-meta site-sheet-sec">${site.account}</span>`}
          ${account.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${linkTo(s.id)}><${Icon} n=${s.icon || "file"} s=${18} />${label(s)}</a>`)}
          ${!account.length && signIn.slice(xs ? 1 : signIn.length).map((b) => html`<a key=${b.go} href=${"#" + b.go} onClick=${linkTo(b.go)}><${Icon} n="user" s=${18} />${b.label}</a>`)}
          ${signOut && account.length > 0 && html`<a href="#" onClick=${(e) => { e.preventDefault(); setSheet(false); signOut(); }}><${Icon} n="logout" s=${18} />${t("site.signOut")}</a>`}
        </nav>
        ${xs && html`<div class="row gap-8"><span class="t-meta">${t("proto.theme")}</span><${ThemeButton} /></div>`}
      <//>`}
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
  // overrides its label there. Links with aria-current.
  function SiteTabs() {
    const A = useApp();
    const ids = (KIT.roleDef(A.role).tabs || []).filter((id) => KIT.canOpen(id, A.role));
    if (!A.narrow || ids.length < 2) return null;
    return html`<nav class="site-tabs" aria-label=${t("nav.main")}>${ids.map((id) => {
      const s = KIT.screens[id];
      return html`<a key=${id} href=${"#" + id} aria-current=${A.screen === id ? "page" : undefined} onClick=${navClick(A, id)}>
        <${Icon} n=${s.icon || "file"} s=${22} /><span class="clamp1">${s.tab || label(s)}</span></a>`;
    })}</nav>`;
  }

  function SiteShell() {
    const A = useApp();
    const Header = KIT.site.Header || SiteHeader;
    const Footer = KIT.site.Footer || SiteFooter;
    const tabs = A.narrow && (KIT.roleDef(A.role).tabs || []).length > 1;
    return html`<div class=${cx("site", tabs && "has-tabs")} data-shell="site" data-density=${A.density}>
      <div class="site-scroll" id="kit-content">
        <${Header} />
        <main class="site-main"><${ScreenBody} wrap="site-page" /></main>
        <${Footer} />
      </div>
      <${SiteTabs} />
    </div>`;
  }

  /* ---------------- Windows app frame ---------------- */
  // Title bar with minimise, maximise and close; a taskbar with the app button, a tray icon
  // (its popover opens or exits the app) and a clock. The frame keeps its own window state.
  function WinFrame({ children }) {
    const A = useApp();
    const [win, setWin] = useState({ state: "open", max: true, tray: false });
    const product = A.config.product;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const set = (p) => setWin((w) => ({ ...w, ...p }));
    const winBtn = (lbl, icon, onClick, cls) => html`<${Tip} text=${lbl}><button type="button" class=${cx("win-btn", cls)} aria-label=${lbl} onClick=${onClick}><${Icon} n=${icon} s=${16} /></button><//>`;
    return html`<div class="win-desk" data-density="compact">
      <div class=${cx("win-area", !win.max && "windowed")}>
        ${win.state === "open" ? html`<div class="win" aria-label=${t("win.window", { p: product })}>
          <div class="win-title">
            <span class="mark xs" aria-hidden="true"><${Icon} n="layers" s=${12} /></span><span class="win-name">${product}</span>
            <span class="t-meta clamp1 hide-narrow">${KIT.roleName(A.role)}</span>
            <span class="spacer"></span>
            ${winBtn(t("win.minimise"), "minus", () => set({ state: "min", tray: false }))}
            ${winBtn(win.max ? t("win.restore") : t("win.maximise"), win.max ? "restore" : "square", () => set({ max: !win.max }))}
            ${winBtn(t("close"), "x", () => set({ state: "closed", tray: false }), "close")}
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
          ${win.state !== "closed" && html`<button type="button" id="kit-tray" class="tb-btn" aria-label=${t("win.tray", { p: product })} aria-haspopup="dialog" aria-expanded=${win.tray ? "true" : "false"} onClick=${() => set({ tray: !win.tray })}><${Icon} n="layers" s=${16} /></button>`}
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="wifi" s=${16} /></span>
          <span class="tb-btn deco" aria-hidden="true"><${Icon} n="volume" s=${16} /></span>
          <span class="tb-clock tnum" aria-hidden="true"><span>${pad(now.getHours())}:${pad(now.getMinutes())}</span><span>${now.toLocaleDateString(A.config.locale)}</span></span>
        </div>
      </div>
      ${win.state !== "closed" && html`<${Popover} open=${win.tray} anchor="kit-tray" placement="top-end" onClose=${() => set({ tray: false })}>
        <div class="col gap-4" role="group" aria-label=${t("win.trayMenu", { p: product })}>
          <button type="button" class="tm-item" onClick=${() => set({ state: "open", tray: false })}><${Icon} n="appwindow" s=${16} />${t("win.open", { p: product })}</button>
          <button type="button" class="tm-item" onClick=${() => set({ state: "closed", tray: false })}><${Icon} n="logout" s=${16} />${t("win.exit")}</button>
        </div><//>`}
    </div>`;
  }

  /* ---------------- Phone ---------------- */
  function MobileApp() {
    const A = useApp();
    const reg = KIT.screens[A.screen];
    const tabs = navItems(A.role, "phone");
    return html`<div class="m-app" data-density=${A.density}>
      <div class="m-status" aria-hidden="true"></div>
      <header class="m-top">
        ${A.canBack ? html`<${IconButton} icon="back" label=${t("back")} onClick=${A.back} />` : html`<span class="m-top-sp"></span>`}
        <h1 class="m-top-t clamp1 grow" tabindex="-1" data-kit-h1="">${reg ? reg.name : A.config.product}</h1>
        <${ThemeButton} />
      </header>
      <${ScreenBody} wrap="m-content" id="kit-content" />
      ${tabs.length > 1 && html`<nav class="m-nav" aria-label=${t("nav.main")}>${tabs.map((s) => html`<a key=${s.id} href=${"#" + s.id} aria-current=${A.screen === s.id ? "page" : undefined} onClick=${navClick(A, s.id)}>
        <${Icon} n=${s.icon || "file"} s=${20} /><span class="clamp1">${s.name}</span></a>`)}</nav>`}
    </div>`;
  }

  // The phone frame (390 x 844 screen in a device bezel), zoomed down to fit short windows. Zoom (not a
  // transform) so top-layer overlays inside the frame are scaled with it.
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
        <div class="phone" style=${{ zoom: scale }}><div class="phone-screen" data-frame="phone" data-density="touch"><${MobileApp} /></div></div>
      </div>
    </div>`;
  }

  /* ---------------- Stage ---------------- */
  // A bare screen's frame: reg.frame is a name or (params, role) => name; KIT.frame(name, Component) registers it.
  function frameName(reg, A) {
    if (!reg || !reg.frame) return null;
    try {
      return typeof reg.frame === "function" ? reg.frame(A.params || {}, A.role) : reg.frame;
    } catch (e) {
      return null;
    }
  }
  function Stage() {
    const A = useApp();
    if (A.screen == null) return html`<div class="stage"><${RolePicker} /></div>`;
    if (A.layout === "phone-native") return html`<div class="stage"><div class="phone-screen native"><${MobileApp} /></div></div>`;
    if (A.layout === "phone-frame") return html`<${PhoneStage} />`;
    const reg = KIT.screens[A.screen];
    if (KIT.isBare(A.screen, A.params, A.role) && KIT.canOpen(A.screen, A.role)) {
      const name = frameName(reg, A);
      const Frame = name && KIT.frames && KIT.frames[name];
      if (Frame) {
        return html`<div class="stage bare-stage" data-shell="bare"><${Frame} key=${name}><${ScreenBody} wrap="frame-body" /><//></div>`;
      }
      return html`<div class="stage bare-stage" data-shell="bare"><div class="bare-scroll" id="kit-content"><${ScreenBody} wrap="bare-page" density=${A.density} /></div></div>`;
    }
    if (A.layout === "windows") return html`<div class="stage"><${WinFrame}><${DesktopShell} /><//></div>`;
    if (isSite(A.role)) return html`<div class="stage"><${SiteShell} /></div>`;
    return html`<div class="stage"><${DesktopShell} /></div>`;
  }

  KIT.shell = { Stage, ProtoBar, RolePicker, DesktopShell, Sidebar, Topbar, ScreenBody, WinFrame, PhoneStage, MobileApp, SiteShell, SiteHeader, SiteFooter, navItems };
})();
