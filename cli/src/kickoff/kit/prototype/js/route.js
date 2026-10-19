// Hash routing for kickoff prototypes: #<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>]
// Trailing tokens are stripped from the right in any order; #scn-<id> runs a guided scenario.
(function (root) {
  "use strict";
  const THEMES = new Set(["light", "dark"]);
  const LENSES = new Set(["full", "tags", "mvp"]);

  function makeParser(cfg) {
    const platforms = new Set(cfg.platforms || []);
    const roles = new Set(cfg.roles || []);
    return function parseHash(hash) {
      const raw = String(hash || "").replace(/^#/, "");
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
      return { screen: scenario ? null : id, scenario, theme, lens, platform, role };
    };
  }

  function formatHash(r) {
    const head = r.scenario ? "scn-" + r.scenario : r.screen;
    const lens = r.lens && r.lens !== "full" ? r.lens : null;
    return "#" + [head, r.theme, lens, r.platform, r.role].filter(Boolean).join("-");
  }

  const api = { makeParser, formatHash };
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign((root.KIT = root.KIT || {}), api);
})(typeof window !== "undefined" ? window : globalThis);
