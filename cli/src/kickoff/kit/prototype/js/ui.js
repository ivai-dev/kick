// ui.js — token-based components shared by every screen (KIT.ui): Icon, Button, Field,
// Table, KPI, StatusChip, Card, PageHeader, InfoPopover, EmptyState, Drawer, Menu, Toasts,
// and the shell pages Placeholder, Denied and NotFound. Every colour comes from the
// tokens in index.html; components take no inline colours. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = hooks;
  const { cx } = KIT.util;

  /* ---------------- Icons (Lucide, ISC license) ---------------- */
  const I = {
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    appwindow: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M10 4v4M2 8h20M6 4v4"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    bell: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cog: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    construct: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    layers: '<path d="m12.83 2.18 8.58 3.9a1 1 0 0 1 0 1.83l-8.58 3.9a2 2 0 0 1-1.66 0L2.6 7.91a1 1 0 0 1 0-1.83l8.58-3.9a2 2 0 0 1 1.66 0Z"/><path d="m2 12 9.17 4.17a2 2 0 0 0 1.66 0L22 12M2 17l9.17 4.17a2 2 0 0 0 1.66 0L22 17"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    minus: '<path d="M5 12h14"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    play: '<path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5Z" fill="currentColor" stroke="none"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    restore: '<rect width="12" height="12" x="4" y="8" rx="1.5"/><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    square: '<rect width="14" height="14" x="5" y="5" rx="1.5"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    volume: '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.41 7.59A1.4 1.4 0 0 1 5.42 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.42a1.4 1.4 0 0 1 .99.41l3.38 3.39a.7.7 0 0 0 1.21-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/>',
    wifi: '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0"/>',
    windows: '<rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
  };
  // n: icon name (unknown names draw nothing); s: size in px; label: makes it an image for screen readers.
  function Icon({ n, s = 18, cls = "", label }) {
    return html`<svg class=${"ic " + cls} width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden=${label ? undefined : "true"} role=${label ? "img" : undefined} aria-label=${label} dangerouslySetInnerHTML=${{ __html: I[n] || "" }}></svg>`;
  }

  /* ---------------- Controls ---------------- */
  // kind: primary | ghost | soft | danger; size: sm | lg; cls (or class): extra classes, kept with the kit's own.
  // An icon with no children is a square icon button (give it a label).
  function Button({ kind, size, icon, iconRight, block, label, children, type = "button", cls, class: klass, ...rest }) {
    const only = icon && (children == null || children === false);
    const is = size === "sm" ? 15 : size === "lg" ? 18 : 16;
    return html`<button type=${type} class=${cx("btn", kind, size, block && "block", only && "icon", cls, klass)} aria-label=${label} title=${only ? label : undefined} ...${rest}>
      ${icon && html`<${Icon} n=${icon} s=${is} />`}${children}${iconRight && html`<${Icon} n=${iconRight} s=${is} />`}
    </button>`;
  }

  // A labelled form field; children is the control, whose id must equal `id`.
  function Field({ id, label, req, hint, err, children }) {
    return html`<div class="field">
      <label for=${id}>${label}${req && html`<span class="req" aria-hidden="true">*</span>`}</label>
      ${children}
      ${err ? html`<span class="err" id=${id + "-err"}><${Icon} n="alert" s=${14} />${err}</span>` : hint && html`<span class="hint" id=${id + "-hint"}>${hint}</span>`}
    </div>`;
  }

  // tone: ok | warn | danger | info | accent | neutral (default) | line.
  function StatusChip({ tone, icon, children }) {
    return html`<span class=${cx("pill", tone)}>${icon && html`<${Icon} n=${icon} s=${14} />`}${children}</span>`;
  }

  // columns: [{ key, label, num?, render?: (row) => vnode }]; rows: objects; onRow makes rows clickable.
  // The table scrolls inside its own wrapper on narrow screens, never the page.
  function Table({ columns = [], rows = [], rowKey = "id", onRow, empty, caption, dense }) {
    return html`<div class="table-wrap"><table class=${cx("tbl", dense && "dense")}>
      ${caption && html`<caption class="sr-only">${caption}</caption>`}
      <thead><tr>${columns.map((c) => html`<th key=${c.key} scope="col" class=${c.num ? "n" : undefined}>${c.label}</th>`)}</tr></thead>
      <tbody>${rows.length
        ? rows.map((r, i) => html`<tr key=${r[rowKey] != null ? r[rowKey] : i} class=${onRow ? "click" : undefined} onClick=${onRow ? () => onRow(r) : undefined}>
            ${columns.map((c) => html`<td key=${c.key} class=${c.num ? "n" : undefined}>${c.render ? c.render(r) : r[c.key]}</td>`)}</tr>`)
        : html`<tr><td colspan=${columns.length} class="tbl-empty">${empty == null ? KIT.t("table.empty") : empty}</td></tr>`}</tbody>
    </table></div>`;
  }

  // A key figure. id is written as data-kpi (scenarios and checks select it); delta is a signed
  // number (deltaUnit, default "%"); deltaGood says which direction is good.
  function KPI({ id, label, value, unit, delta, deltaGood = "up", deltaUnit = "%", note, icon }) {
    const has = delta != null && !isNaN(delta);
    const dir = !has || Math.abs(delta) < 1e-9 ? 0 : delta > 0 ? 1 : -1;
    const good = dir === 0 ? null : (dir > 0) === (deltaGood === "up");
    const dtxt = !has ? "" : dir === 0 ? KIT.t("kpi.noChange") : `${dir > 0 ? "+" : "−"}${KIT.util.nf(Math.abs(delta))}${deltaUnit === "%" ? "%" : deltaUnit ? " " + deltaUnit : ""}`;
    return html`<div class="kpi" data-kpi=${id}>
      <div class="kpi-l t-cap">${icon && html`<${Icon} n=${icon} s=${15} />`}<span>${label}</span></div>
      <div class="kpi-v"><b class="t-kpi">${value}</b>${unit && html`<span class="kpi-u">${unit}</span>`}</div>
      ${(has || note) && html`<div class="kpi-f">
        ${has && html`<span class=${cx("kpi-d", good === true && "good", good === false && "bad")}>${dir !== 0 && html`<${Icon} n=${dir > 0 ? "up" : "down"} s=${14} />`}<span class="sr-only">${dir > 0 ? KIT.t("kpi.up") : dir < 0 ? KIT.t("kpi.down") : ""}${good === true ? KIT.t("kpi.good") : good === false ? KIT.t("kpi.bad") : ""}</span>${dtxt}</span>`}
        ${note && html`<span class="t-meta clamp1">${note}</span>`}
      </div>`}
    </div>`;
  }

  /* ---------------- Headers and surfaces ---------------- */
  let infoSeq = 0;
  // An (i) button that discloses a longer explanation. text: a string or a list of paragraphs.
  function InfoPopover({ text, label }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null);
    const btn = useRef(null);
    const pop = useRef(null);
    const id = useMemo(() => "kit-info-" + ++infoSeq, []);
    useLayoutEffect(() => {
      if (!open || !btn.current) return;
      const r = btn.current.getBoundingClientRect();
      const w = Math.min(360, window.innerWidth - 32);
      setPos({ top: r.bottom + 8, left: Math.max(16, Math.min(r.left - 8, window.innerWidth - w - 16)), width: w });
    }, [open]);
    useEffect(() => {
      if (!open) return undefined;
      const shut = () => setOpen(false);
      const down = (e) => {
        if (!(pop.current && pop.current.contains(e.target)) && !(btn.current && btn.current.contains(e.target))) shut();
      };
      const key = (e) => {
        if (e.key === "Escape") {
          e.stopImmediatePropagation();
          shut();
          btn.current && btn.current.focus();
        }
      };
      document.addEventListener("mousedown", down);
      document.addEventListener("keydown", key, true);
      window.addEventListener("resize", shut);
      return () => {
        document.removeEventListener("mousedown", down);
        document.removeEventListener("keydown", key, true);
        window.removeEventListener("resize", shut);
      };
    }, [open]);
    const paras = [].concat(text);
    return html`<span class="info"><button ref=${btn} type="button" class="info-btn" aria-label=${label || KIT.t("info.more")} aria-expanded=${open ? "true" : "false"} aria-controls=${open ? id : undefined} onClick=${() => setOpen(!open)}><${Icon} n="info" s=${16} /></button>
      ${open && html`<div class="info-pop" id=${id} ref=${pop} style=${pos ? { top: pos.top + "px", left: pos.left + "px", width: pos.width + "px" } : { visibility: "hidden" }}>${paras.map((p, i) => html`<p key=${i}>${p}</p>`)}</div>`}</span>`;
  }

  // Page header: optional eyebrow (screen code), the title with an optional info toggle, at
  // most one short sentence; children are the page actions.
  function PageHeader({ eyebrow, title, desc, info, back, children }) {
    const act = [].concat(children || []).filter(Boolean);
    return html`<div class="page-h">
      <div class="grow">
        ${back}
        ${eyebrow && html`<span class="t-cap">${eyebrow}</span>`}
        <div class="ph-title"><h1 class="t-h1">${title}</h1>${info && html`<${InfoPopover} text=${info} />`}</div>
        ${desc && html`<p class="t-body ph-desc">${desc}</p>`}
      </div>
      ${act.length > 0 && html`<div class="ph-act">${act}</div>`}
    </div>`;
  }

  // A card with an optional header (title, sub line, info, actions). flush: no body padding (tables, lists).
  function Card({ title, sub, info, actions, flush, id, children }) {
    const hid = id ? id + "-h" : undefined;
    return html`<section class="card" id=${id} aria-labelledby=${title ? hid : undefined}>
      ${title && html`<div class="card-h"><div class="col grow"><div class="ch-t"><h2 class="t-h3" id=${hid}>${title}</h2>${info && html`<${InfoPopover} text=${info} />`}</div>${sub && html`<span class="t-meta">${sub}</span>`}</div>${actions}</div>`}
      <div class=${flush ? "card-flush" : "card-b"}>${children}</div>
    </section>`;
  }

  function EmptyState({ icon = "inbox", title, children, action }) {
    return html`<div class="empty" role="status">
      <span class="ic-wrap"><${Icon} n=${icon} s=${22} /></span>
      ${title && html`<b class="t-h3">${title}</b>`}
      ${children && html`<span class="empty-txt">${children}</span>`}
      ${action}
    </div>`;
  }

  /* ---------------- Overlays ---------------- */
  // Keyboard handling shared by the drawer: focus moves in, Tab stays inside, Escape closes,
  // focus returns to where it was.
  function useTrap(ref, onClose) {
    useEffect(() => {
      const prev = document.activeElement;
      const first = ref.current && (ref.current.querySelector("[data-autofocus]") || ref.current.querySelector("input, select, textarea, button"));
      first && first.focus();
      const key = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose && onClose();
        }
        if (e.key === "Tab" && ref.current) {
          const f = [...ref.current.querySelectorAll("button, input, textarea, select, a[href], [tabindex]:not([tabindex='-1'])")].filter((x) => !x.disabled);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) {
            e.preventDefault();
            f[f.length - 1].focus();
          } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
            e.preventDefault();
            f[0].focus();
          }
        }
      };
      document.addEventListener("keydown", key, true);
      return () => {
        document.removeEventListener("keydown", key, true);
        prev && prev.focus && prev.focus();
      };
    }, []);
  }

  let drawerSeq = 0;
  function DrawerPanel({ title, onClose, footer, children }) {
    const ref = useRef(null);
    const hid = useMemo(() => "kit-drawer-" + ++drawerSeq, []);
    useTrap(ref, onClose);
    return html`<div class="scrim drawer-host" onMouseDown=${(e) => e.target === e.currentTarget && onClose && onClose()}>
      <aside class="sheet" role="dialog" aria-modal="true" aria-labelledby=${hid} ref=${ref}>
        <div class="sheet-h"><h2 id=${hid} class="t-h2 grow">${title}</h2><${Button} kind="ghost" size="sm" icon="x" label=${KIT.t("close")} onClick=${onClose} /></div>
        <div class="sheet-b">${children}</div>
        ${footer && html`<div class="sheet-f">${footer}</div>`}
      </aside>
    </div>`;
  }
  // A side sheet for forms and details (a bottom-to-top full sheet on narrow screens).
  function Drawer({ open = true, ...props }) {
    return open ? html`<${DrawerPanel} ...${props} />` : null;
  }

  // A dropdown list anchored to a button (the prototype bar's screen index uses it).
  function Menu({ anchor, onClose, children, width = 280 }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);
    useLayoutEffect(() => {
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const w = Math.min(width, window.innerWidth - 16);
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)), width: w });
    }, [anchor]);
    useEffect(() => {
      const down = (e) => {
        if (ref.current && !ref.current.contains(e.target) && !(anchor && anchor.contains(e.target))) onClose();
      };
      const key = (e) => {
        if (e.key === "Escape") {
          onClose();
          anchor && anchor.focus();
        }
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && ref.current) {
          e.preventDefault();
          const items = [...ref.current.querySelectorAll("button")];
          const i = items.indexOf(document.activeElement);
          const n = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
          items[n] && items[n].focus();
        }
      };
      document.addEventListener("mousedown", down);
      document.addEventListener("keydown", key);
      return () => {
        document.removeEventListener("mousedown", down);
        document.removeEventListener("keydown", key);
      };
    }, []);
    if (!pos) return null;
    return html`<div class="menu" role="menu" ref=${ref} style=${{ top: pos.top + "px", left: pos.left + "px", width: pos.width + "px" }}>${children}</div>`;
  }

  function Toasts() {
    const A = useApp();
    return html`<div class="toasts" role="status" aria-live="polite">${A.toasts.map((t) => html`<div key=${t.id} class="toast">
      ${t.icon && html`<${Icon} n=${t.icon} s=${18} cls="t-ic" />`}<span class="grow">${t.msg}</span>
      ${t.action && html`<button type="button" class="btn sm" onClick=${() => { t.action.run(); A.dismiss(t.id); }}>${t.action.label}</button>`}
      <button type="button" class="btn sm icon" aria-label=${KIT.t("dismiss")} onClick=${() => A.dismiss(t.id)}><${Icon} n="x" s=${15} /></button>
    </div>`)}</div>`;
  }

  /* ---------------- Shell pages ---------------- */
  // The stub every scaffolded screen starts with: its code, name and release.
  function Placeholder() {
    const A = useApp();
    const reg = KIT.screens[A.screen] || {};
    return html`<${PageHeader} eyebrow=${reg.code} title=${reg.name || KIT.t("screen")} />
      <${Card}><${EmptyState} icon="construct" title=${KIT.t("placeholder.title")}>${reg.code} · ${reg.name} · ${reg.rel}<//><//>`;
  }

  // Shown instead of a screen whose roles exclude the current role: never the screen content.
  function Denied() {
    const A = useApp();
    const reg = KIT.screens[A.screen] || {};
    const who = KIT.roleName(A.role);
    const home = KIT.homeOf(A.role);
    const allowed = (reg.roles || []).map(KIT.roleName).join(", ");
    return html`<div class="denied" data-denied=${A.screen}>
      <${EmptyState} icon="lock" title=${KIT.t("denied.title", { who })}
        action=${home && html`<${Button} kind="primary" icon="home" onClick=${() => A.go(home)}>${KIT.t("denied.home", { who })}<//>`}>
        ${reg.name ? KIT.t("denied.text", { name: reg.name, code: reg.code, allowed }) : ""}
      <//>
    </div>`;
  }

  function NotFound() {
    const A = useApp();
    return html`<${EmptyState} icon="search" title=${KIT.t("notfound.title")}
      action=${html`<${Button} icon="home" onClick=${A.openPicker}>${KIT.t("notfound.back")}<//>`}>
      ${KIT.t("notfound.text", { id: A.screen })}
    <//>`;
  }

  Object.assign(KIT.ui, {
    Icon, Button, Field, StatusChip, Table, KPI, InfoPopover, PageHeader, Card, EmptyState,
    Drawer, Menu, Toasts, Placeholder, Denied, NotFound,
  });
  KIT.util.icons = I;
})();
