// logic.js — pure helpers of the kit (KIT.logic): text folding and option matching, density
// resolution, window classes, toast timing, paging items, sorting, dates and periods, list
// clamping, the StatusTabs form, keyboard helpers, the overlay stack, row selection, navigation direction and colour
// contrast. No DOM and no Preact: the same file runs in the browser (window.KIT.logic) and under
// `node --test` (module.exports). Core file.
(function (root) {
  "use strict";

  /* ---------------- Text ---------------- */
  // Lower case without diacritics: "Xã Hòa Mỹ" -> "xa hoa my", "Đ" -> "d". Spaces collapse.
  function fold(s) {
    return String(s == null ? "" : s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  // Options whose folded label matches the folded query: prefix matches first, then matches at a
  // word start, then substrings; the original order is kept inside each group. An empty query
  // returns every option. key: the option field to match (default "label"); options may be strings.
  function matchOptions(query, options, key) {
    const k = key || "label";
    const list = Array.isArray(options) ? options : [];
    const q = fold(query);
    if (!q) return list.slice();
    const pre = [], word = [], sub = [];
    for (const o of list) {
      const text = fold(typeof o === "string" ? o : o && o[k]);
      if (text.startsWith(q)) pre.push(o);
      else if ((" " + text).includes(" " + q)) word.push(o);
      else if (text.includes(q)) sub.push(o);
    }
    return pre.concat(word, sub);
  }

  /* ---------------- Density and window classes ---------------- */
  const DENSITIES = ["compact", "comfortable", "touch", "kiosk"];
  const DENSITY_DEFAULTS = { app: "compact", site: "comfortable", phone: "touch", windows: "compact" };

  // One density for the current view. Order: frame -> screen -> user override (app shell only) ->
  // touch (phone layouts, narrow windows, or a coarse pointer on the site shell) -> role -> the
  // configured default of the shell.
  //   shell: "app" | "site"; layout: "web" | "windows" | "phone-frame" | "phone-native";
  //   frame: "kiosk" or another frame density; config: KIT_CONFIG.density.
  function resolveDensity(o) {
    const x = o || {};
    const ok = (v) => DENSITIES.includes(v);
    const cfg = Object.assign({}, DENSITY_DEFAULTS, x.config || {});
    if (x.frame) return x.frame === "kiosk" ? "kiosk" : ok(x.frame) ? x.frame : "kiosk";
    if (ok(x.screenDensity)) return x.screenDensity;
    const shell = x.shell === "site" ? "site" : "app";
    if (shell === "app" && (x.user === "compact" || x.user === "comfortable")) return x.user;
    if (x.layout === "phone-native" || x.layout === "phone-frame") return ok(cfg.phone) ? cfg.phone : "touch";
    if (x.narrow || (x.coarse && shell === "site")) return "touch";
    if (ok(x.roleDensity)) return x.roleDensity;
    if (x.layout === "windows" && ok(cfg.windows)) return cfg.windows;
    const d = cfg[shell];
    return ok(d) ? d : DENSITY_DEFAULTS[shell];
  }

  // compact < 600 · medium < 840 · expanded < 1200 · large < 1600 · xlarge.
  function windowClass(width) {
    const w = Number(width) || 0;
    return w < 600 ? "compact" : w < 840 ? "medium" : w < 1200 ? "expanded" : w < 1600 ? "large" : "xlarge";
  }

  /* ---------------- Toasts ---------------- */
  // How long a toast stays: with an action it stays until closed (Infinity); an explicit ms wins;
  // otherwise 5 s plus 1 s per 40 characters above 80.
  function toastMs(msg, o) {
    const x = o || {};
    if (x.action) return Infinity;
    if (typeof x.ms === "number" && x.ms > 0) return x.ms;
    const n = String(msg == null ? "" : msg).length;
    return 5000 + 1000 * Math.ceil(Math.max(0, n - 80) / 40);
  }

  /* ---------------- Paging ---------------- */
  const GAP = "…";
  // Page buttons: every page up to 7, else 1 … p-1 p p+1 … last (with full runs near the ends).
  function pageItems(page, pages) {
    const n = Math.max(1, Math.floor(Number(pages) || 1));
    const p = Math.min(n, Math.max(1, Math.floor(Number(page) || 1)));
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    if (n <= 7) return range(1, n);
    if (p <= 4) return [...range(1, 5), GAP, n];
    if (p >= n - 3) return [1, GAP, ...range(n - 4, n)];
    return [1, GAP, p - 1, p, p + 1, GAP, n];
  }
  function pageCount(total, size) {
    return Math.max(1, Math.ceil((Number(total) || 0) / Math.max(1, Number(size) || 1)));
  }

  /* ---------------- Sorting ---------------- */
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.]+Z?)?$/;
  let collator = null;
  const coll = () => collator || (collator = new Intl.Collator("vi", { sensitivity: "base", numeric: true }));
  function compareValues(a, b) {
    const ea = a == null || a === "", eb = b == null || b === "";
    if (ea || eb) return ea && eb ? 0 : ea ? 1 : -1; // empty values last in both directions
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (a instanceof Date && b instanceof Date) return a - b;
    const sa = String(a), sb = String(b);
    if (ISO_DATE.test(sa) && ISO_DATE.test(sb)) return sa < sb ? -1 : sa > sb ? 1 : 0;
    return coll().compare(sa, sb);
  }
  // A sorted copy. key: a field name or a function row -> value; dir: "asc" | "desc".
  // Empty values stay last; equal rows keep their order.
  function sortRows(rows, key, dir) {
    const get = typeof key === "function" ? key : (r) => (r == null ? null : r[key]);
    const sign = dir === "desc" ? -1 : 1;
    return (rows || [])
      .map((r, i) => [r, i])
      .sort((x, y) => {
        const a = get(x[0]), b = get(y[0]);
        const ea = a == null || a === "", eb = b == null || b === "";
        if (ea || eb) return ea && eb ? x[1] - y[1] : ea ? 1 : -1;
        return sign * compareValues(a, b) || x[1] - y[1];
      })
      .map((p) => p[0]);
  }

  /* ---------------- Dates ---------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const validYmd = (y, m, d) => {
    if (!(y >= 1000 && y <= 9999 && m >= 1 && m <= 12 && d >= 1)) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  };
  // "19/11/2026", "1/2/2026", "19-11-2026", "19112026" -> "2026-11-19"; anything else -> null.
  function parseDate(text) {
    const s = String(text == null ? "" : text).trim();
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (!m) m = s.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (!m) {
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso && validYmd(+iso[1], +iso[2], +iso[3])) return s;
      return null;
    }
    const d = +m[1], mo = +m[2], y = +m[3];
    return validYmd(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
  }
  // "2026-11-19" -> "19/11/2026"; anything unparsable -> "".
  function formatDate(iso) {
    const m = String(iso == null ? "" : iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
  }
  function addDays(iso, n) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + Number(n || 0)));
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  }
  // Monday-first month grid: weeks of ISO dates (null outside the month).
  function monthGrid(year, month) {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
    while (cells.length % 7) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  // Period in words. value by granularity: day "2026-10-20"; week "2026-W42"; month "2026-10";
  // quarter "2026-Q3"; year "2026"; a range { from, to } (ISO dates). t: KIT.t (keys period.*);
  // without it the Vietnamese words are used.
  const PERIOD_VI = { "period.week": "Tuần {n}/{y}", "period.month": "Tháng {n}/{y}", "period.quarter": "Quý {n}/{y}", "period.year": "Năm {y}" };
  function periodLabel(value, granularity, t) {
    const tr = (k, v) => (t ? t(k, v) : PERIOD_VI[k].replace(/\{(\w+)\}/g, (m, x) => (v[x] != null ? v[x] : m)));
    if (value && typeof value === "object" && value.from) {
      const a = String(value.from), b = String(value.to || value.from);
      if (a === b) return formatDate(a);
      if (a.slice(0, 4) === b.slice(0, 4)) return `${formatDate(a).slice(0, 5)}–${formatDate(b)}`;
      return `${formatDate(a)}–${formatDate(b)}`;
    }
    const v = String(value == null ? "" : value);
    let m;
    if (granularity === "week" && (m = v.match(/^(\d{4})-W(\d{1,2})$/))) return tr("period.week", { n: +m[2], y: m[1] });
    if (granularity === "quarter" && (m = v.match(/^(\d{4})-Q([1-4])$/))) return tr("period.quarter", { n: +m[2], y: m[1] });
    if (granularity === "year" && (m = v.match(/^(\d{4})$/))) return tr("period.year", { y: m[1] });
    if ((granularity === "month" || !granularity) && (m = v.match(/^(\d{4})-(\d{2})$/))) return tr("period.month", { n: pad(+m[2]), y: m[1] });
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDate(v);
    return v;
  }

  /* ---------------- Lists ---------------- */
  // The first n items and how many are left: clampList(["a","b","c","d"], 2) -> { shown: ["a","b"], more: 2 }.
  function clampList(items, n) {
    const list = Array.isArray(items) ? items : [];
    const k = Math.max(0, Number(n) || 0);
    return { shown: list.slice(0, k), more: Math.max(0, list.length - k) };
  }

  /* ---------------- StatusTabs form ---------------- */
  // Tabs or a select, decided once per container width with hysteresis, so the switch cannot loop (the
  // select form has no strip to measure, and switching forms changes the container's height, not its width).
  // s: { form: "tabs" | "select", width, at } (null: start); m: { width (container px), overflow (the strip
  // needs more than 2 lines; read only in the tabs form) }. Returns s itself when nothing changes.
  //   tabs: overflow -> select, remembering the width `at` where the strip overflowed;
  //   select: same width -> unchanged; back to tabs (to measure again) only at `at + gap` px or wider.
  const TABS_START = Object.freeze({ form: "tabs", width: null, at: null });
  const TABS_GAP = 24;
  function tabsForm(s, m, gap) {
    const cur = s && s.form ? s : TABS_START;
    const g = gap == null ? TABS_GAP : Math.max(0, Number(gap) || 0);
    const w = Math.round(Number(m && m.width) || 0);
    if (!(w > 0)) return cur;
    if (cur.form === "tabs") {
      if (m && m.overflow) return { form: "select", width: w, at: w };
      return cur.width === w && cur.at == null ? cur : { form: "tabs", width: w, at: null };
    }
    if (cur.width === w) return cur;
    if (cur.at != null && w >= cur.at + g) return { form: "tabs", width: w, at: cur.at };
    return { form: "select", width: w, at: cur.at };
  }

  /* ---------------- Keyboard ---------------- */
  // Next enabled index from i by delta (+1 / -1), wrapping by default; -1 when nothing is enabled.
  function nextIndex(i, delta, n, isDisabled, wrap) {
    const count = Number(n) || 0;
    if (!count) return -1;
    const off = typeof isDisabled === "function" ? isDisabled : () => false;
    const step = delta < 0 ? -1 : 1;
    let j = Number.isInteger(i) ? i : step > 0 ? -1 : count;
    for (let k = 0; k < count; k++) {
      j += step;
      if (j < 0 || j >= count) {
        if (wrap === false) return Number.isInteger(i) && i >= 0 && i < count ? i : -1;
        j = (j + count) % count;
      }
      if (!off(j)) return j;
    }
    return -1;
  }
  // Typeahead: the index of the next label (after `start`, wrapping) that starts with `buffer`
  // (folded); -1 when none does.
  function typeahead(labels, buffer, start) {
    const list = labels || [];
    const q = fold(buffer);
    if (!q || !list.length) return -1;
    const from = Number.isInteger(start) ? start : -1;
    for (let k = 1; k <= list.length; k++) {
      const j = (from + k) % list.length;
      if (fold(list[j]).startsWith(q)) return j;
    }
    return -1;
  }

  /* ---------------- Overlay stack ---------------- */
  // One stack for every open overlay: Escape and Back close only the top entry.
  function overlayStack() {
    let items = [];
    return {
      push(entry) {
        items = items.filter((x) => x.id !== entry.id).concat([entry]);
        return entry.id;
      },
      remove(id) {
        const before = items.length;
        items = items.filter((x) => x.id !== id);
        return items.length !== before;
      },
      top() { return items.length ? items[items.length - 1] : null; },
      isTop(id) { return !!items.length && items[items.length - 1].id === id; },
      has(id) { return items.some((x) => x.id === id); },
      size() { return items.length; },
      list() { return items.slice(); },
      // Escape: close the top entry only. Returns its id, or null when the stack is empty.
      esc() {
        const t = items.length ? items[items.length - 1] : null;
        if (!t) return null;
        items = items.slice(0, -1);
        if (typeof t.close === "function") t.close();
        return t.id;
      },
      clear() { items = []; },
    };
  }

  /* ---------------- Row selection ---------------- */
  // Selected row keys that survive paging; "all matching" selects every row of the filter.
  function selection(initial) {
    let keys = new Set(initial || []);
    let all = false;
    let total = 0;
    const subs = new Set();
    const emit = () => subs.forEach((f) => f());
    const api = {
      has: (k) => all || keys.has(k),
      keys: () => Array.from(keys),
      size: () => (all ? total : keys.size),
      get allMatching() { return all; },
      toggle(k) {
        if (all) { all = false; }
        if (keys.has(k)) keys.delete(k); else keys.add(k);
        emit();
        return api;
      },
      set(list) { keys = new Set(list || []); all = false; emit(); return api; },
      // Select or clear every key of the visible page.
      selectPage(pageKeys, on) {
        for (const k of pageKeys || []) { if (on === false) keys.delete(k); else keys.add(k); }
        if (on === false) all = false;
        emit();
        return api;
      },
      // "none" | "some" | "all" for the header checkbox of the page.
      pageState(pageKeys) {
        const list = pageKeys || [];
        if (!list.length) return "none";
        const n = list.filter((k) => api.has(k)).length;
        return n === 0 ? "none" : n === list.length ? "all" : "some";
      },
      selectAllMatching(count) { all = true; total = Number(count) || 0; emit(); return api; },
      clear() { keys = new Set(); all = false; total = 0; emit(); return api; },
      subscribe(f) { subs.add(f); return () => subs.delete(f); },
    };
    return api;
  }

  /* ---------------- Navigation ---------------- */
  // The motion direction of a navigation: go -> forward (lateral when the target is a nav item of
  // the role), back -> back, everything else (jump, hash, role, platform, start page) -> lateral.
  function navDir(kind, o) {
    if (kind === "back") return "back";
    if (kind === "go") return o && o.isNav ? "lateral" : "forward";
    return "lateral";
  }

  /* ---------------- Colour ---------------- */
  function parseHex(hex) {
    const h = String(hex).replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  function luminance(rgb) {
    const c = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // WCAG contrast ratio of two colours (hex or [r, g, b]).
  function contrast(a, b) {
    const x = Array.isArray(a) ? a : parseHex(a);
    const y = Array.isArray(b) ? b : parseHex(b);
    if (!x || !y) return NaN;
    const la = luminance(x), lb = luminance(y);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  // CSS color-mix(in srgb, a pct%, b) as [r, g, b].
  function mix(a, b, pct) {
    const x = Array.isArray(a) ? a : parseHex(a);
    const y = Array.isArray(b) ? b : parseHex(b);
    const p = Math.max(0, Math.min(100, Number(pct))) / 100;
    return x.map((v, i) => Math.round(v * p + y[i] * (1 - p)));
  }

  /* ---------------- Audit thresholds ---------------- */
  // Defaults of the runtime audit (foundation F§8.1); KIT_CONFIG.audit may change them only with
  // the project lead's yes (proto lint warns, L17).
  const AUDIT_DEFAULTS = { maxSizes: 6, minLh: 1.2, minLhWrap: 1.34, minLhClip: 1.5, maxShift: 0.01 };
  // Share of the chart colour in a muted bar (color-mix with the surface); >= 3:1 against the
  // surface for every tone of the kit's default tokens, light and dark (test/logic.test.js).
  // 55 % measured 2.3–2.8:1 in the light theme, so the kit uses 70 %.
  const CHART_MUTE_PCT = 70;

  const api = {
    fold, matchOptions, DENSITIES, DENSITY_DEFAULTS, resolveDensity, windowClass, toastMs,
    GAP, pageItems, pageCount, compareValues, sortRows, parseDate, formatDate, addDays, monthGrid, periodLabel,
    clampList, TABS_START, TABS_GAP, tabsForm, nextIndex, typeahead, overlayStack, selection, navDir, parseHex, contrast, mix,
    AUDIT_DEFAULTS, CHART_MUTE_PCT,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.KIT = root.KIT || {}).logic = api;
})(typeof window !== "undefined" ? window : globalThis);
