// Hash routing for kickoff prototypes:
//   #<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>][?key=value&key=value]
// Trailing tokens are stripped from the right in any order; #scn-<id> runs a guided scenario.
// Parameters after "?" become the screen's params (a device view, a record id): integers become
// numbers, true/false become booleans, everything else stays text.
(function (root) {
  "use strict";
  const THEMES = new Set(["light", "dark"]);
  const LENSES = new Set(["full", "tags", "mvp"]);

  function readValue(v) {
    if (/^-?\d+$/.test(v)) return Number(v);
    if (v === "true") return true;
    if (v === "false") return false;
    return v;
  }
  function parseParams(query) {
    const params = {};
    for (const pair of String(query || "").split("&")) {
      if (!pair) continue;
      const i = pair.indexOf("=");
      const key = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
      if (!key) continue;
      params[key] = i < 0 ? true : readValue(decodeURIComponent(pair.slice(i + 1).replace(/\+/g, " ")));
    }
    return params;
  }

  function makeParser(cfg) {
    const platforms = new Set(cfg.platforms || []);
    const roles = new Set(cfg.roles || []);
    return function parseHash(hash) {
      const full = String(hash || "").replace(/^#/, "");
      const q = full.indexOf("?");
      const raw = q < 0 ? full : full.slice(0, q);
      const params = q < 0 ? {} : parseParams(full.slice(q + 1));
      const parts = raw ? raw.split("-") : [];
      let theme = null, lens = "full", platform = null, role = null;
      while (parts.length > 1) {
        const tok = parts[parts.length - 1];
        if (THEMES.has(tok)) theme = tok;
        else if (LENSES.has(tok)) lens = tok;
        else if (platforms.has(tok)) platform = tok;
        else if (roles.has(tok)) role = tok;
        else break;
        parts.pop();
      }
      const id = parts.join("-") || null;
      const scenario = id && id.startsWith("scn-") ? id.slice(4) : null;
      return { screen: scenario ? null : id, scenario, theme, lens, platform, role, params };
    };
  }

  function formatHash(r) {
    const head = r.scenario ? "scn-" + r.scenario : r.screen;
    const lens = r.lens && r.lens !== "full" ? r.lens : null;
    const keys = Object.keys(r.params || {}).filter((k) => r.params[k] != null && r.params[k] !== "");
    const query = keys.map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(String(r.params[k]))).join("&");
    return "#" + [head, r.theme, lens, r.platform, r.role].filter(Boolean).join("-") + (query ? "?" + query : "");
  }

  const api = { makeParser, formatHash, parseParams };
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign((root.KIT = root.KIT || {}), api);
})(typeof window !== "undefined" ? window : globalThis);
