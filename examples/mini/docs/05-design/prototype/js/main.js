// main.js — the application root: state, navigation (go, jump, back, role and platform
// switches), the hash route (with ?parameters as the screen's params), theme handling, toasts,
// the scenario hooks, the layout choice,
// and the <html> attributes the headless check reads. Loaded last, after every project
// module has registered its screens. Core file.
//
// After the first render <html> carries:
//   data-ready="1"
//   data-screens="<id>|<code>|<role>+<role>;..."   every registered screen
//   data-scenarios="<id>,<id>"                     every guided scenario
// and, when something went wrong, data-err="<message>" (see core.js).
(function () {
  "use strict";
  const { html, hooks, render, Ctx } = KIT;
  const { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } = hooks;
  const { store } = KIT.util;
  const { Stage, ProtoBar } = KIT.shell;
  const { Toasts } = KIT.ui;
  const { GuidePanel } = KIT.scenario;
  const root = document.documentElement;

  const cfg = KIT.config();
  KIT.applyDocConfig(); // <html lang data-lang data-density>, KIT_CONFIG.fonts
  const L = KIT.logic;
  const parse =KIT.makeParser({ roles: cfg.roles.map((r) => r.id), platforms: cfg.platforms });
  // A hash of one token (#dark, #mvp) opens the start page with that theme or lens.
  function readHash() {
    const r = parse(location.hash);
    if (r.screen === "light" || r.screen === "dark") return { ...r, screen: null, theme: r.screen };
    if (r.screen === "full" || r.screen === "tags" || r.screen === "mvp") return { ...r, screen: null, lens: r.screen };
    return r;
  }
  const NARROW = 760;
  const isNarrow = () => window.innerWidth < NARROW;

  /* ---------------- Navigation helpers (pure) ---------------- */
  // Where a screen opens: the role (forced, kept, or the screen's first role for a deep link)
  // and the platform (forced when the screen has it, else kept when it has it, else its first).
  function place(s, id, o = {}) {
    const reg = KIT.screens[id];
    let role = o.role || s.role;
    if (!o.role && o.pickRole && reg && !reg.roles.includes(role)) role = reg.roles[0];
    let platform = s.platform;
    if (reg) {
      if (o.platform && reg.platforms.includes(o.platform)) platform = o.platform;
      else if (!reg.platforms.includes(platform)) platform = reg.platforms[0];
    }
    return { screen: id, role, platform };
  }
  // History entries keep the scroll position and the opener (data-kit-key) of the screen that was left.
  const pushHist = (s, at) => (s.screen == null ? [] : [...s.hist, { screen: s.screen, params: s.params, platform: s.platform, scroll: at ? at.leave : 0, from: at ? at.from : null }].slice(-20));
  const defaultPlatform = () => (cfg.platforms.includes("web") ? "web" : cfg.platforms[0]);

  // Below 760 px a screen with an android platform shows as the phone app, others in the
  // responsive web shell; on wider windows android screens show in the phone frame and
  // windows screens in the Windows frame.
  function layoutOf(s, narrow) {
    const reg = KIT.screens[s.screen];
    if (!reg) return "web";
    if (narrow) return reg.platforms.includes("android") ? "phone-native" : "web";
    if (s.platform === "android") return "phone-frame";
    if (s.platform === "windows") return "windows";
    return "web";
  }

  // The state a hash route opens (the scenario, if any, starts after the first render).
  function fromRoute(s, r) {
    const patch = { lens: r.lens, scenario: null };
    if (r.theme) patch.theme = r.theme;
    if (r.scenario || !r.screen) return { ...patch, screen: r.scenario ? s.screen : null, params: {}, hist: [] };
    return { ...patch, ...place(s, r.screen, { role: r.role, platform: r.platform, pickRole: true }), params: r.params || {}, hist: [] };
  }

  function initialState() {
    const saved = store.get("theme", null);
    const base = {
      screen: null, params: {}, role: cfg.defaultRole, platform: defaultPlatform(),
      theme: saved === "light" || saved === "dark" ? saved : "system", lens: "full",
      hist: [], toasts: [], scenario: null, drawer: false, sidebar: window.innerWidth >= 1180,
    };
    return { ...base, ...fromRoute(base, readHash()) };
  }

  function App() {
    const [S, setS] = useState(initialState);
    const set = useCallback((patch) => setS((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);
    const [narrow, setNarrow] = useState(isNarrow);
    const [wc, setWc] = useState(() => L.windowClass(window.innerWidth));
    const coarseMq = useMemo(() => { try { return matchMedia("(pointer: coarse)"); } catch (e) { return null; } }, []);
    const [coarse, setCoarse] = useState(() => !!(coarseMq && coarseMq.matches));
    const [densUser, setDensUser] = useState({}); // role -> "compact" | "comfortable" | null (this session)
    const [resolved, setResolved] = useState("light");
    const sRef = useRef(S);
    sRef.current = S;

    // Window size: the 760 px shell switch and the window class (rAF-throttled).
    useEffect(() => {
      let raf = 0;
      const r = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          setNarrow(isNarrow());
          setWc(L.windowClass(window.innerWidth));
        });
      };
      window.addEventListener("resize", r);
      const c = () => setCoarse(!!(coarseMq && coarseMq.matches));
      coarseMq && coarseMq.addEventListener && coarseMq.addEventListener("change", c);
      return () => {
        window.removeEventListener("resize", r);
        coarseMq && coarseMq.removeEventListener && coarseMq.removeEventListener("change", c);
      };
    }, []);

    // Theme: an explicit choice stamps data-theme; "system" follows prefers-color-scheme.
    // A layout effect, so a -dark deep link never paints a light frame first.
    useLayoutEffect(() => {
      const mq = matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        // One frame without transitions around the change (no colour animation on a theme switch).
        root.setAttribute("data-theme-switching", "");
        if (S.theme === "system") root.removeAttribute("data-theme");
        else root.setAttribute("data-theme", S.theme);
        const dark = S.theme === "system" ? mq.matches : S.theme === "dark";
        root.classList.toggle("wa-dark", dark);
        root.classList.toggle("wa-light", !dark);
        setResolved(dark ? "dark" : "light");
        requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
      };
      apply();
      mq.addEventListener && mq.addEventListener("change", apply);
      return () => mq.removeEventListener && mq.removeEventListener("change", apply);
    }, [S.theme]);

    const api = useMemo(() => {
      let seq = 0;
      const a = {
        get S() { return sRef.current; },
        set,
        // One navigation commit point: every change of screen or params goes through it. It records where
        // the old screen was scrolled and which opener had focus (for Back), and runs the change inside a View
        // Transition when the browser has one (else the ScreenBody fallback animates). dir: forward · back ·
        // lateral. A running transition finishes at once when a new navigation starts.
        commit(patch, dir) {
          const el = document.getElementById("kit-content");
          const at = { leave: el ? el.scrollTop : 0, from: null };
          const act = document.activeElement;
          const fromEl = act && act.closest ? act.closest("[data-kit-key]") : null;
          if (fromEl) at.from = fromEl.getAttribute("data-kit-key");
          const run = () => set((s) => {
            const p = typeof patch === "function" ? patch(s, at) : patch;
            if (!p || !Object.keys(p).length) return {};
            return { _dir: dir, _navKey: (s._navKey || 0) + 1, _restore: null, _from: null, ...p };
          });
          if (a._vt) { try { a._vt.skipTransition(); } catch (e) { /* finished */ } }
          if (!document.startViewTransition || KIT.util.reduced() || !root.dataset.ready || document.hidden) { run(); return; }
          root.dataset.nav = dir;
          let vt;
          try {
            vt = document.startViewTransition(() => new Promise((res) => { run(); setTimeout(res, 0); }));
          } catch (e) {
            delete root.dataset.nav;
            run();
            return;
          }
          a._vt = vt;
          const quiet = () => {};
          vt.ready.catch(quiet);
          vt.updateCallbackDone.catch(quiet);
          vt.finished.catch(quiet).finally(() => { if (a._vt === vt) { delete root.dataset.nav; a._vt = null; } });
        },
        // In-app navigation keeps the role: a screen the role may not open renders Denied.
        // go(id, params, { replace }): replace changes params (filters, tabs, paging) without a history entry,
        // a transition or a remount of the screen.
        go(id, params, o) {
          if (id == null) return a.openPicker();
          if (!KIT.screens[id]) KIT.stampErr("route: no screen " + id);
          if (o && o.replace) {
            set((s) => ({ ...place(s, id), params: params || {}, drawer: false, _dir: "replace", _navKey: s.screen === id ? s._navKey : (s._navKey || 0) + 1 }));
            return;
          }
          const s0 = sRef.current;
          const reg = KIT.screens[id];
          const dir = L.navDir("go", { isNav: !!(reg && reg.nav && reg.roles.includes(s0.role)) });
          a.commit((s, at) => ({ ...place(s, id), params: params || {}, hist: pushHist(s, at), drawer: false }), dir);
        },
        // Deep link (hash, screen index): a forced role or platform, else the screen's first role.
        jump(r) {
          if (r.screen && !KIT.screens[r.screen]) KIT.stampErr("route: no screen " + r.screen);
          a.commit((s, at) => ({ ...place(s, r.screen, { role: r.role, platform: r.platform, pickRole: true }), params: r.params || {}, hist: pushHist(s, at), drawer: false }), "lateral");
        },
        // Back returns to the scroll position the screen was left at and focuses its opener.
        back() {
          if (!sRef.current.hist.length) return;
          a.commit((s) => {
            if (!s.hist.length) return {};
            const prev = s.hist[s.hist.length - 1];
            return { screen: prev.screen, params: prev.params, platform: prev.platform, hist: s.hist.slice(0, -1), drawer: false, _restore: prev.scroll || 0, _from: prev.from || null };
          }, "back");
        },
        openPicker() { a.commit({ screen: null, params: {}, hist: [], drawer: false }, "lateral"); },
        // A role always starts on its own home, at every width.
        setRole(role) {
          const home = KIT.homeOf(role);
          if (!home) {
            set({ role });
            a.toast(KIT.t("app.noScreensRole", { role: KIT.roleName(role) }), { icon: "info" });
            return;
          }
          a.commit((s) => ({ ...place({ ...s, role }, home), params: {}, hist: [], drawer: false }), "lateral");
        },
        setPlatform(p) {
          const s = sRef.current;
          const reg = KIT.screens[s.screen];
          if (!reg || reg.platforms.includes(p)) { set({ platform: p }); return; }
          const home = KIT.homeOf(s.role);
          const pick = [home, ...Object.keys(KIT.screens)].find((id) => id && KIT.canOpen(id, s.role) && KIT.screens[id].platforms.includes(p) && !KIT.screens[id].internal);
          if (!pick) {
            setTimeout(() => a.toast(KIT.t("app.noPlatform", { platform: p, role: KIT.roleName(s.role) }), { icon: "info" }), 0);
            return;
          }
          a.commit((st, at) => ({ screen: pick, platform: p, params: {}, hist: pushHist(st, at) }), "lateral");
        },
        setTheme(t) {
          store.set("theme", t);
          set({ theme: t });
        },
        setLens(l) { set({ lens: l }); },
        setDrawer(v) { set({ drawer: !!v }); },
        toggleSidebar() { set((s) => ({ sidebar: !s.sidebar })); },
        // toast(msg, { icon, tone, action: { label, run }, ms, key }) -> id. Timing (KIT.logic.toastMs): 5 s + 1 s per
        // 40 characters above 80; with an action it stays until closed; a toast with the same key replaces the
        // older one. No toasts on the kiosk (feedback changes the control that was used).
        toast(msg, o = {}) {
          if (document.querySelector('[data-frame="kiosk"]')) {
            console.warn("kit: no toasts on the kiosk");
            return null;
          }
          const id = ++seq;
          const ms = L.toastMs(msg, o);
          set((s) => ({
            toasts: [...s.toasts.filter((x) => !(o.key && x.key === o.key)).slice(-2),
              { id, msg, icon: o.icon, tone: o.tone, action: o.action, ms, key: o.key }],
          }));
          return id;
        },
        dismiss(id) { set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })); },
        // Scenario hooks (scenario.js).
        beginScenario(sc) {
          set((s) => ({
            role: sc.role, platform: cfg.platforms.includes(sc.platform) ? sc.platform : s.platform,
            scenario: { id: sc.id, n: 0, playing: true }, hist: [], drawer: false,
          }));
        },
        setScenario(patch) { set((s) => (s.scenario ? { scenario: { ...s.scenario, ...patch } } : {})); },
        closeScenario() {
          KIT.scenario.stop(a);
          set({ scenario: null });
        },
      };
      return a;
    }, []);
    KIT._api = api;

    // First render: start a #scn- route, report what is registered, then mark the page ready.
    useEffect(() => {
      const problem = KIT.configProblems();
      if (problem) KIT.stampErr(problem);
      const first = readHash();
      if (first.screen && !KIT.screens[first.screen]) KIT.stampErr("route: no screen " + first.screen);
      root.dataset.screens = Object.values(KIT.screens).filter((s) => !s.internal).map((s) => `${s.id}|${s.code}|${s.roles.join("+")}`).join(";");
      root.dataset.scenarios = (KIT.SCENARIOS || []).map((s) => s.id).join(",");
      // Ready after the UI library (≤ 4.5 s, inside the 5 s budget of proto check) and the fonts (≤ 800 ms).
      // The module loader is deferred, so wait for the end of parsing before reading window.KIT_LIB.
      const parsed = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r, { once: true }) : r()));
      const libReady = parsed.then(() => (window.KIT_LIB
        ? Promise.race([window.KIT_LIB, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 4500))])
        : Promise.reject(new Error("loader missing"))));
      const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 800))]);
      Promise.all([libReady, fontsReady]).then(() => {
        if (KIT.ui._ && KIT.ui._.libLocalize) KIT.ui._.libLocalize();
        root.classList.add("kit-in"); // the stage fades in over --dur-2
        if (KIT.audit && KIT.audit.afterReady) KIT.audit.afterReady();
        root.dataset.ready = "1";
        if (first.scenario) KIT.scenario.run(api, first.scenario); // scenarios start after ready
      }, (e) => {
        root.classList.add("kit-in");
        KIT.stampErr("ui library: " + ((e && e.message) || e));
      });
      const onHash = () => {
        const r = readHash();
        api.commit((s) => fromRoute(s, r), "lateral");
        if (r.scenario) KIT.scenario.run(api, r.scenario);
        else if (r.screen && !KIT.screens[r.screen]) KIT.stampErr("route: no screen " + r.screen);
      };
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);

    useEffect(() => {
      document.title = KIT.t("app.title", { product: cfg.product });
    }, []);

    const reg = KIT.screens[S.screen];
    const layout = layoutOf(S, narrow);
    const site = KIT.roleDef(S.role).shell === "site";
    const user = S.role in densUser ? densUser[S.role] : store.get("density-" + S.role, null);
    const density = L.resolveDensity({
      shell: site ? "site" : "app", layout, narrow, coarse, user: site ? null : user,
      roleDensity: KIT.roleDef(S.role).density, screenDensity: reg && reg.density, config: cfg.density,
    });
    // <html data-density> (top-layer overlays and toasts read it) and <html data-wc>.
    useLayoutEffect(() => {
      root.dataset.density = S.screen == null ? "compact" : density;
      root.dataset.wc = wc;
    }, [density, wc, S.screen]);
    api.setDensity = (d) => {
      const v = d === "compact" || d === "comfortable" ? d : null;
      store.set("density-" + sRef.current.role, v);
      setDensUser((m) => ({ ...m, [sRef.current.role]: v }));
    };
    const ctx = {
      ...api, S,
      config: cfg, role: S.role, theme: S.theme, resolved, lens: S.lens, platform: S.platform,
      params: S.params, screen: S.screen, screenDef: reg || null, narrow, layout,
      density, densityUser: site ? null : user, wc, coarse,
      toasts: S.toasts, scenario: S.scenario, sidebar: S.sidebar, drawer: S.drawer, canBack: S.hist.length > 0,
    };
    return html`<${Ctx.Provider} value=${ctx}>
      <${ProtoBar} />
      <${Stage} />
      <${Toasts} />
      <${GuidePanel} />
    <//>`;
  }

  render(html`<${App} />`, document.getElementById("app"));
})();
