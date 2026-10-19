// core.js — the KIT namespace: Preact and htm wiring, error capture for headless checks,
// project configuration (window.KIT_CONFIG from js/config.js), the screen registry,
// the app context and small helpers. Loaded right after route.js; every later file
// reads window.KIT. Core file: projects do not edit it (see README.md).
(function () {
  "use strict";
  const KIT = (window.KIT = window.KIT || {});
  const root = document.documentElement;

  /* ---------------- Error capture ---------------- */
  // Script errors, rejected promises and Preact render errors land on <html data-err>
  // (first 200 characters), so a headless check fails the route instead of passing a
  // broken page. Registered before any project module loads, so a module that throws
  // while loading is reported too.
  const stampErr = (msg) => {
    root.dataset.err = String(msg == null ? "unknown error" : msg).slice(0, 200);
  };
  window.addEventListener("error", (e) => stampErr(e.message || (e.error && e.error.message) || "script error"));
  window.addEventListener("unhandledrejection", (e) => stampErr((e.reason && e.reason.message) || e.reason));
  // Preact reports render errors through its internal catch hook (options.__e) and may
  // leave the tree empty without a window error event; record those as well.
  const preactCatch = preact.options.__e;
  preact.options.__e = function (err) {
    stampErr((err && err.message) || err);
    if (preactCatch) return preactCatch.apply(this, arguments);
    throw err;
  };

  /* ---------------- Preact and htm ---------------- */
  const { h, render, createContext, Component, Fragment } = preact;
  const hooks = preactHooks; // useState, useEffect, useRef, useMemo, useCallback, useContext, useLayoutEffect
  const html = htm.bind(h);

  /* ---------------- Configuration ---------------- */
  // window.KIT_CONFIG = { product, roles: [{ id, name, home }], releases, platforms, defaultRole }.
  // Missing values fall back to a one-role web prototype, so the bare kit still renders.
  const PLATFORMS = ["web", "windows", "android"];
  function config() {
    const c = window.KIT_CONFIG || {};
    const roles = Array.isArray(c.roles) && c.roles.length ? c.roles : [{ id: "user", name: "User", home: null }];
    const releases = Array.isArray(c.releases) && c.releases.length ? c.releases.map(String) : ["MVP"];
    const platforms = Array.isArray(c.platforms) && c.platforms.length ? c.platforms.filter((p) => PLATFORMS.includes(p)) : ["web"];
    return {
      product: c.product || "Prototype",
      roles,
      releases,
      platforms: platforms.length ? platforms : ["web"],
      defaultRole: roles.some((r) => r.id === c.defaultRole) ? c.defaultRole : roles[0].id,
      locale: c.locale || "en-US",
    };
  }
  // Problems a check should fail on: role ids that the hash parser cannot read, and
  // screens that name a role, platform or release the configuration does not have.
  function configProblems() {
    const cfg = config();
    const ids = cfg.roles.map((r) => r.id);
    for (const id of ids) if (!/^[a-z0-9]+$/.test(id)) return `config: role id "${id}" must be lowercase letters and digits`;
    for (const r of cfg.roles) if (r.home && !KIT.screens[r.home]) return `config: home of ${r.id} is not a registered screen (${r.home})`;
    for (const s of Object.values(KIT.screens)) {
      const role = s.roles.find((r) => !ids.includes(r));
      if (role) return `screen ${s.id}: unknown role ${role}`;
      const plat = s.platforms.find((p) => !PLATFORMS.includes(p));
      if (plat) return `screen ${s.id}: unknown platform ${plat}`;
      if (!cfg.releases.includes(s.rel)) return `screen ${s.id}: unknown release ${s.rel}`;
    }
    return null;
  }

  /* ---------------- Screen registry ---------------- */
  // KIT.register(id, { comp, code, name, roles?, platforms?, rel?, nav?, icon? }).
  // Defaults: every role, web only, the first release. nav is the sidebar (or phone
  // tab bar) section label; a screen without nav is reached only through links.
  const screens = (KIT.screens = KIT.screens || {});
  function register(id, def) {
    const cfg = config();
    const d = def || {};
    screens[id] = Object.assign({ code: id.toUpperCase(), name: id }, d, {
      id,
      roles: Array.isArray(d.roles) && d.roles.length ? d.roles.slice() : cfg.roles.map((r) => r.id),
      platforms: Array.isArray(d.platforms) && d.platforms.length ? d.platforms.slice() : ["web"],
      rel: d.rel ? String(d.rel) : cfg.releases[0],
    });
    return screens[id];
  }
  const canOpen = (id, role) => !!screens[id] && screens[id].roles.includes(role);
  // A role's home: its configured home when it may open it, else the first screen it may open.
  function homeOf(role) {
    const r = config().roles.find((x) => x.id === role);
    if (r && r.home && canOpen(r.home, role)) return r.home;
    const first = Object.values(screens).find((s) => s.roles.includes(role));
    return first ? first.id : null;
  }
  const roleName = (id) => {
    const r = config().roles.find((x) => x.id === id);
    return r ? r.name : id;
  };

  /* ---------------- Helpers ---------------- */
  const cx = (...a) => a.filter(Boolean).join(" ");
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("kit-" + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("kit-" + k, JSON.stringify(v));
      } catch (e) {
        /* storage unavailable (private window, sandboxed frame) */
      }
    },
  };
  const reduced = () => {
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  };
  const nf = (v, d = 1) => (v == null || isNaN(v) ? "—" : Number(v).toLocaleString(config().locale, { maximumFractionDigits: d }));

  /* ---------------- App context ---------------- */
  // KIT.useApp() -> { role, theme, resolved, lens, platform, params, screen, narrow, layout,
  //   go, back, toast, setRole, setTheme, setLens, setPlatform, ... } (filled by main.js).
  const Ctx = createContext(null);
  const useApp = () => hooks.useContext(Ctx);

  Object.assign(KIT, {
    h, render, Component, Fragment, hooks, html,
    Ctx, useApp, register, screens, config, configProblems, homeOf, canOpen, roleName,
    stampErr, PLATFORMS,
    D: KIT.D || null, // sample data, set by js/data.js
    ui: KIT.ui || {},
    charts: KIT.charts || {},
    util: Object.assign(KIT.util || {}, { cx, store, reduced, nf }),
    // Navigate from anywhere (a screen module, a scenario step); main.js sets KIT._api.
    go: (id, params) => (KIT._api ? KIT._api.go(id, params) : undefined),
  });
})();
