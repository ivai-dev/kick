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
  const parse = KIT.makeParser({ roles: cfg.roles.map((r) => r.id), platforms: cfg.platforms });
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
  const pushHist = (s) => (s.screen == null ? [] : [...s.hist, { screen: s.screen, params: s.params, platform: s.platform }].slice(-20));
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
    const [resolved, setResolved] = useState("light");
    const sRef = useRef(S);
    sRef.current = S;

    useEffect(() => {
      const r = () => setNarrow(isNarrow());
      window.addEventListener("resize", r);
      return () => window.removeEventListener("resize", r);
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
        // In-app navigation keeps the role: a screen the role may not open renders Denied.
        go(id, params) {
          if (id == null) return a.openPicker();
          if (!KIT.screens[id]) KIT.stampErr("route: no screen " + id);
          set((s) => ({ ...place(s, id), params: params || {}, hist: pushHist(s), drawer: false }));
        },
        // Deep link (hash, screen index): a forced role or platform, else the screen's first role.
        jump(r) {
          if (r.screen && !KIT.screens[r.screen]) KIT.stampErr("route: no screen " + r.screen);
          set((s) => ({ ...place(s, r.screen, { role: r.role, platform: r.platform, pickRole: true }), params: r.params || {}, hist: pushHist(s), drawer: false }));
        },
        back() {
          set((s) => {
            if (!s.hist.length) return {};
            const prev = s.hist[s.hist.length - 1];
            return { screen: prev.screen, params: prev.params, platform: prev.platform, hist: s.hist.slice(0, -1), drawer: false };
          });
        },
        openPicker() { set({ screen: null, params: {}, hist: [], drawer: false }); },
        // A role always starts on its own home, at every width.
        setRole(role) {
          const home = KIT.homeOf(role);
          if (!home) {
            set({ role });
            a.toast(KIT.t("app.noScreensRole", { role: KIT.roleName(role) }), { icon: "info" });
            return;
          }
          set((s) => ({ ...place({ ...s, role }, home), params: {}, hist: [], drawer: false }));
        },
        setPlatform(p) {
          set((s) => {
            const reg = KIT.screens[s.screen];
            if (!reg || reg.platforms.includes(p)) return { platform: p };
            const home = KIT.homeOf(s.role);
            const pick = [home, ...Object.keys(KIT.screens)].find((id) => id && KIT.canOpen(id, s.role) && KIT.screens[id].platforms.includes(p));
            if (!pick) {
              setTimeout(() => a.toast(KIT.t("app.noPlatform", { platform: p, role: KIT.roleName(s.role) }), { icon: "info" }), 0);
              return {};
            }
            return { screen: pick, platform: p, params: {}, hist: pushHist(s) };
          });
        },
        setTheme(t) {
          store.set("theme", t);
          set({ theme: t });
        },
        setLens(l) { set({ lens: l }); },
        setDrawer(v) { set({ drawer: !!v }); },
        toggleSidebar() { set((s) => ({ sidebar: !s.sidebar })); },
        // toast(msg, { icon, action: { label, run } }) — disappears after 4 s.
        toast(msg, o = {}) {
          const id = ++seq;
          set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, icon: o.icon, action: o.action }] }));
          setTimeout(() => a.dismiss(id), 4000);
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
      root.dataset.screens = Object.values(KIT.screens).map((s) => `${s.id}|${s.code}|${s.roles.join("+")}`).join(";");
      root.dataset.scenarios = (KIT.SCENARIOS || []).map((s) => s.id).join(",");
      // Ready after the UI library (≤ 4.5 s, inside the 5 s budget of proto check) and the fonts (≤ 800 ms).
      // The module loader is deferred, so wait for the end of parsing before reading window.KIT_LIB.
      const parsed = new Promise((r) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r, { once: true }) : r()));
      const libReady = parsed.then(() => (window.KIT_LIB
        ? Promise.race([window.KIT_LIB, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 4500))])
        : Promise.reject(new Error("loader missing"))));
      const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 800))]);
      Promise.all([libReady, fontsReady]).then(() => {
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
        set((s) => fromRoute(s, r));
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
    const ctx = {
      ...api, S,
      config: cfg, role: S.role, theme: S.theme, resolved, lens: S.lens, platform: S.platform,
      params: S.params, screen: S.screen, screenDef: reg || null, narrow, layout: layoutOf(S, narrow),
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
