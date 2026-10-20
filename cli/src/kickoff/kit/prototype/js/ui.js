// ui.js — KIT.ui, part 1: icons, buttons, links and tips; the overlay set (Dialog, ConfirmDialog,
// SidePanel, BottomSheet, Popover, MenuButton, the legacy Menu, InfoPopover) and the Toaster, wrapped
// around the UI library (Web Awesome 3.14.0; projects never write its tags); the overlay stack
// (KIT.overlays) and Back-closes-the-top-overlay; device-frame scoping; usePresence, DensityScope,
// Persist; structure and feedback components (PageHeader, Card, StatTile, EmptyState, Banner, …).
// Inputs are in ui-form.js, lists and tables in ui-data.js. Every colour comes from the tokens; every
// word goes through KIT.t. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp, Fragment } = KIT;
  const { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } = hooks;
  const { cx } = KIT.util;
  const L = KIT.logic;
  const t = (k, v) => KIT.t(k, v);
  const overlays = (KIT.overlays = KIT.overlays || L.overlayStack());

  /* ---------------- Icons (Lucide, ISC license) ---------------- */
  const I = {
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    appwindow: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M10 4v4M2 8h20M6 4v4"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    back: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    bell: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cog: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/>',
    construct: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    keyboard: '<path d="M10 8h.01M12 12h.01M14 8h.01M16 12h.01M18 8h.01M6 8h.01M7 16h10M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
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
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    restore: '<rect width="12" height="12" x="4" y="8" rx="1.5"/><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
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
    xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  };
  // n: icon name (unknown names draw nothing); s: size in px; label: makes it an image for screen readers.
  function Icon({ n, s = 18, cls = "", label }) {
    return html`<svg class=${"ic " + cls} width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden=${label ? undefined : "true"} role=${label ? "img" : undefined} aria-label=${label} dangerouslySetInnerHTML=${{ __html: I[n] || "" }}></svg>`;
  }

  /* ---------------- Shared helpers ---------------- */
  let seq = 0;
  const nextId = (p) => "kit-" + p + "-" + ++seq;
  const useUid = (p) => useMemo(() => nextId(p), []);
  // Listen to a library event on the element itself only (wa-hide of a nested menu or tooltip bubbles up).
  function useOwnEvent(ref, name, fn) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    useEffect(() => {
      const el = ref.current;
      if (!el) return undefined;
      const f = (e) => { if (e.target === el) fnRef.current(e); };
      el.addEventListener(name, f);
      return () => el.removeEventListener(name, f);
    }, []);
  }
  const libReady = (tag) => (window.customElements ? customElements.whenDefined(tag) : Promise.resolve());
  // Controlled `open` for a library overlay. The library animates its own close (Escape, ×, backdrop) and
  // calls back; setting open=false again during that exit restarts the close and can leave the overlay
  // registered as dismissible, so the sync skips while the element is closing. Before the library is
  // defined, the attribute carries the initial state.
  function useLibOpen(ref, open) {
    const closing = useRef(false);
    useOwnEvent(ref, "wa-hide", (e) => {
      closing.current = true;
      setTimeout(() => { if (e.defaultPrevented) closing.current = false; }, 0);
    });
    useOwnEvent(ref, "wa-after-hide", () => { closing.current = false; });
    useOwnEvent(ref, "wa-show", () => { closing.current = false; });
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const apply = () => {
        if (open && !el.open) el.open = true;
        else if (!open && el.open && !closing.current) el.open = false;
      };
      if (window.customElements && customElements.get(el.localName)) apply();
      else {
        if (open) el.setAttribute("open", "");
        else el.removeAttribute("open");
        libReady(el.localName).then(() => requestAnimationFrame(apply));
      }
    }, [open]);
  }
  // The page h1 (the focus target when an opener is gone).
  const pageH1 = () => document.querySelector("[data-kit-h1], main h1, .page h1, .site-page h1, .m-content h1");
  function deepActive() {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  }
  // The element that opened an overlay, so focus can go back to it (a menu item hands over its menu's trigger).
  function opener() {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const dd = a.closest && a.closest("wa-dropdown");
    if (dd) return dd.querySelector('[slot="trigger"]') || a;
    return a;
  }
  // After a library overlay closed: when its opener is gone, focus the page h1.
  function refocus(returnTo) {
    setTimeout(() => {
      const a = document.activeElement;
      if (a && a !== document.body && a.isConnected) return;
      const target = returnTo && returnTo.isConnected ? returnTo : pageH1();
      if (target) {
        if (target === pageH1() && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }, 30);
  }

  // Back closes the top overlay: every modal surface pushes a history entry (with a token unique to that
  // opening) while open. Entries of overlays that closed while another entry was above them stay in the
  // history; landing on one skips it. selfBack counts the back() calls the kit makes itself.
  let popInstalled = false, pushSeq = 0, selfBack = 0;
  const goBack = () => {
    selfBack++;
    try { history.back(); } catch (e) { selfBack--; }
  };
  function installPop() {
    if (popInstalled) return;
    popInstalled = true;
    window.addEventListener("popstate", (e) => {
      const st = e.state && e.state.kitOverlay;
      const live = overlays.list().some((x) => x.token && x.token === st);
      if (selfBack > 0) {
        selfBack--;
        if (st && !live) goBack();
        return;
      }
      const top = overlays.top();
      if (top && top.token && top.token !== st) top.close && top.close("back");
      if (st && !live) goBack();
    });
  }
  // Register an open overlay in KIT.overlays (Escape and Back close only the top entry).
  function useOverlayEntry(open, id, close, withHistory) {
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(() => {
      if (!open) return undefined;
      installPop();
      let token = null;
      if (withHistory) {
        try {
          token = id + "#" + ++pushSeq;
          history.pushState({ kitOverlay: token }, "");
        } catch (e) {
          token = null; /* history unavailable (sandboxed frame) */
        }
      }
      overlays.push({ id, token, close: (why) => closeRef.current && closeRef.current(why) });
      return () => {
        overlays.remove(id);
        try {
          if (token && history.state && history.state.kitOverlay === token) goBack();
        } catch (e) {
          /* ignore */
        }
      };
    }, [open]);
  }

  // Device frames (phone, kiosk): overlays inside a frame are placed in the frame box. Top-layer overlays
  // ignore transforms but inherit CSS zoom, so frame px = window px / zoom.
  function frameOf(el) {
    return el && el.closest ? el.closest("[data-frame]") : null;
  }
  function useFrameScope(ref, open) {
    const [frame, setFrame] = useState(null);
    useLayoutEffect(() => {
      const el = ref.current;
      const f = frameOf(el);
      setFrame(f ? f.getAttribute("data-frame") || "frame" : null);
      if (!f || !open) return undefined;
      const place = () => {
        const r = f.getBoundingClientRect();
        const z = f.currentCSSZoom || 1;
        const px = (v) => Math.round((v / z) * 100) / 100 + "px";
        el.style.setProperty("--fx", px(r.left));
        el.style.setProperty("--fy", px(r.top));
        el.style.setProperty("--fw", px(r.width));
        el.style.setProperty("--fh", px(r.height));
        el.style.setProperty("--fr", px(window.innerWidth - r.right));
        el.style.setProperty("--fb", px(window.innerHeight - r.bottom));
      };
      place();
      window.addEventListener("resize", place);
      return () => window.removeEventListener("resize", place);
    }, [open]);
    return frame;
  }

  // "open" | "closing" | "closed": render while not "closed" and put data-state on the root, so kit-native
  // surfaces animate out (CSS [data-state="closing"]).
  function usePresence(open, exitMs) {
    const [state, setState] = useState(open ? "open" : "closed");
    useEffect(() => {
      if (open) { setState("open"); return undefined; }
      if (state === "closed") return undefined;
      if (KIT.util.reduced()) { setState("closed"); return undefined; }
      setState("closing");
      const tm = setTimeout(() => setState("closed"), exitMs == null ? KIT.util.motion().d2 : exitMs);
      return () => clearTimeout(tm);
    }, [open]);
    return state;
  }

  // The library's own words (close buttons) in the kit language. Called once when the library is ready.
  function libLocalize() {
    const reg = window.KIT_LIB_I18N;
    const lang = KIT.config().lang;
    if (typeof reg !== "function" || !lang || lang === "en") return;
    try {
      reg({ $code: lang, $name: lang, $dir: "ltr", close: t("close"), loading: t("loading"), moreOptions: t("more") });
    } catch (e) {
      /* keep the library defaults */
    }
  }

  /* ---------------- Buttons, links, tips ---------------- */
  // Tip: names an icon-only control on hover and focus (not on touch). The child gets an id when it has none.
  function Tip({ text, children, placement = "top" }) {
    const A = useApp();
    const kids = [].concat(children).filter((c) => c != null && c !== false);
    const own = kids.find((c) => c && c.props && c.props.id);
    const genId = useUid("tip");
    const id = (own && own.props.id) || genId;
    const touch = A && (A.coarse || A.density === "touch" || A.density === "kiosk");
    if (!text || touch) return kids;
    const out = kids.map((c, i) => (i === 0 && c && c.props && !c.props.id ? preact.cloneElement(c, { id }) : c));
    return html`${out}<wa-tooltip for=${id} placement=${placement} show-delay="500" hide-delay="100" data-kit="Tip">${text}</wa-tooltip>`;
  }

  // kind: primary · secondary (default) · ghost · danger · act · link; size: sm · md · lg · xl.
  // loading: true -> after 300 ms a spinner and "Working…", clicks ignored, width kept, shown ≥ 500 ms.
  // unavailable: a reason string -> aria-disabled, focusable, the reason is read and shown on activation.
  // href renders a link styled as a button. An icon with no children is an icon button (give it a label).
  function Button(props) {
    const { kind, size, icon, iconRight, block, label, loading, loadingLabel, unavailable, href, children, type = "button", cls, class: klass, onClick, ...rest } = props;
    const ref = useRef(null);
    const reasonId = useUid("why");
    const [busy, setBusy] = useState(false);
    const [why, setWhy] = useState(false);
    const width = useRef(null);
    const shownAt = useRef(0);
    useEffect(() => {
      if (loading) {
        if (ref.current) width.current = ref.current.getBoundingClientRect().width;
        const tm = setTimeout(() => { shownAt.current = Date.now(); setBusy(true); }, 300);
        return () => clearTimeout(tm);
      }
      if (!busy) return undefined;
      const left = Math.max(0, 500 - (Date.now() - shownAt.current));
      const tm = setTimeout(() => setBusy(false), left);
      return () => clearTimeout(tm);
    }, [loading]);
    const only = icon && (children == null || children === false) && !busy;
    const k = kind === "soft" ? "secondary" : kind || "secondary";
    const blocked = busy || !!loading || !!unavailable;
    const click = (e) => {
      if (blocked) {
        e.preventDefault();
        if (unavailable) setWhy(true);
        return;
      }
      onClick && onClick(e);
    };
    const cls2 = cx("btn", k, size, block && "block", only && "icon", cls, klass);
    const aria = {
      "aria-label": label, "aria-disabled": blocked ? "true" : rest["aria-disabled"],
      "aria-describedby": unavailable ? reasonId : rest["aria-describedby"], "data-loading": busy ? "" : undefined,
      style: busy && width.current ? { minWidth: width.current + "px" } : rest.style,
    };
    const inner = busy
      ? html`<${Icon} n="loader" cls="ic-spin" /><span>${loadingLabel || t("loading")}</span>`
      : html`${icon && html`<${Icon} n=${icon} />`}${children}${iconRight && html`<${Icon} n=${iconRight} />`}`;
    const el = href
      ? html`<a ref=${ref} href=${href} class=${cls2} data-kit="Button" ...${rest} ...${aria} onClick=${click}>${inner}</a>`
      : html`<button ref=${ref} type=${type} class=${cls2} data-kit="Button" ...${rest} ...${aria} onClick=${click}>${inner}</button>`;
    const tipped = only && label ? html`<${Tip} text=${label}>${el}<//>` : el;
    if (!unavailable) return tipped;
    return html`<span class="btn-wrap">${tipped}<span id=${reasonId} class=${why ? "why" : "sr-only"} role="status">${unavailable}</span></span>`;
  }

  // A square icon-only button; the label is its name and its tip.
  function IconButton({ icon, label, kind = "ghost", size, ...rest }) {
    return html`<${Button} kind=${kind} size=${size} icon=${icon} label=${label} data-kit="IconButton" ...${rest} />`;
  }

  // Navigation only: href, or go (+ params) for an in-app route (#<id>); variant back "‹ …", more "… ›".
  function Link({ href, go, params, variant, children, cls, ...rest }) {
    const A = useApp();
    const to = go ? "#" + go : href;
    const click = (e) => {
      if (!go || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      A.go(go, params || {});
    };
    return html`<a href=${to} class=${cx("lnk", variant && "lnk-" + variant, cls)} data-kit="Link" onClick=${click} ...${rest}>${variant === "back" && html`<span aria-hidden="true">‹ </span>`}${children}${variant === "more" && html`<span aria-hidden="true"> ›</span>`}</a>`;
  }

  /* ---------------- Overlays: dialogs, panels, sheets ---------------- */
  const SIZES = { s: 1, m: 1, l: 1, full: 1 };
  // Set autofocus on the element that should take focus when the overlay opens (never the × button).
  function markAutofocus(el, pick) {
    if (!el) return;
    el.querySelectorAll("[autofocus]").forEach((x) => { if (!x.hasAttribute("data-kit-keepfocus")) x.removeAttribute("autofocus"); });
    if (el.querySelector("[data-kit-keepfocus][autofocus]")) return;
    const target = (pick && el.querySelector(pick)) || el.querySelector("[data-autofocus]") ||
      el.querySelector(".ov-body input:not([type=hidden]):not([disabled]), .ov-body select:not([disabled]), .ov-body textarea:not([disabled])") ||
      el.querySelector(".ov-body");
    if (target) target.setAttribute("autofocus", "");
  }

  // The one modal surface: Dialog (wa-dialog) and SidePanel/BottomSheet (wa-drawer) share it.
  function Modal({ tag, open = true, title, footer, dirty, alert, passive, onClose, initialFocus, size, placement, frameAnchor, devices, header, consequence, kitName, id, children, cls }) {
    const ref = useRef(null);
    const [guard, setGuard] = useState(false);
    const openRef = useRef(open);
    openRef.current = open;
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const returnTo = useRef(null);
    const A = useApp();
    const frame = useFrameScope(ref, open);
    useLibOpen(ref, open);
    const oid = useUid("ov");
    const request = (why) => {
      if (dirtyRef.current && why !== "force") { setGuard(true); return; }
      onClose && onClose(why);
    };
    useOverlayEntry(open, oid, (why) => request(why || "back"), true);
    useLayoutEffect(() => { if (open) returnTo.current = opener(); }, [open]);
    useOwnEvent(ref, "wa-show", () => markAutofocus(ref.current, initialFocus));
    useOwnEvent(ref, "wa-hide", (e) => {
      if (!openRef.current) return; // the caller closed it
      if (dirtyRef.current) { e.preventDefault(); setGuard(true); return; }
      onClose && onClose("library");
    });
    useOwnEvent(ref, "wa-after-hide", () => refocus(returnTo.current));
    // ConfirmDialog: alertdialog semantics and the consequence as the description (shadow DOM patch).
    useEffect(() => {
      if (!alert || !open) return undefined;
      let alive = true;
      libReady(tag).then(() => ref.current && ref.current.updateComplete).then(() => {
        if (!alive || !ref.current || !ref.current.shadowRoot) return;
        const d = ref.current.shadowRoot.querySelector('[part~="dialog"]');
        if (d) {
          d.setAttribute("role", "alertdialog");
          if (consequence) d.setAttribute("aria-description", consequence);
        }
      });
      return () => { alive = false; };
    }, [open, consequence]);
    const isDrawer = tag === "wa-drawer";
    const inFrame = !!frame;
    const full = !isDrawer && A && A.wc === "compact" && !inFrame;
    const place = isDrawer ? (inFrame ? "bottom" : placement || "end") : undefined;
    const props = {
      ref, id, "data-kit": kitName, label: title,
      "light-dismiss": alert ? false : passive || !dirty,
      "with-footer": footer ? true : undefined,
      "data-size": isDrawer ? (size === "l" ? "l" : "m") : SIZES[size] ? size : "m",
      "data-full": full ? "" : undefined,
      "data-anchor": frameAnchor && (inFrame || (A && A.wc === "compact")) ? "bottom" : undefined,
      placement: place,
      class: cx(inFrame && "in-frame", cls),
    };
    const body = html`<div class=${cx("ov-body", passive && "passive")} tabindex="-1">${children}</div>`;
    const foot = footer && html`<div slot="footer" class="ov-foot">${footer}</div>`;
    const actions = (header || devices) && html`<div slot="header-actions" class="ov-hact">${devices}${header}</div>`;
    const el = KIT.h(tag, props, actions, body, foot);
    if (alert || dirty == null) return el;
    return html`${el}<${ConfirmDialog} open=${guard} question=${t("discard.q")} consequence=${t("discard.c")}
      cancelLabel=${t("discard.keep")} confirmLabel=${t("discard.ok")} onClose=${() => setGuard(false)}
      onConfirm=${() => { setGuard(false); onClose && onClose("discard"); }} />`;
  }

  // Dialog: short task (≤ 4 fields), reading, media, preview. size s 400 · m 560 · l 880 · full.
  // kind transactional (light dismiss only while pristine) or passive (reading; light dismiss).
  // dirty: closing asks "Discard changes?". Full screen on compact windows; bottom-anchored in device frames.
  function Dialog({ open = true, size = "m", title, kind = "transactional", dirty, footer, onClose, initialFocus, devices, id, children }) {
    return html`<${Modal} tag="wa-dialog" kitName="Dialog" open=${open} size=${size} title=${title} passive=${kind === "passive"}
      dirty=${dirty} footer=${footer} onClose=${onClose} initialFocus=${initialFocus} devices=${size === "full" ? devices : null} id=${id}>${children}<//>`;
  }

  // ConfirmDialog (alias Confirm): destroy, lock, publish or unpublish, overwrite, leave a dirty form.
  // Focus starts on "Cancel"; Escape is Cancel; a click outside does nothing; the confirm names verb + object.
  // typeToConfirm = { expected, label }: confirm stays unavailable (with its reason) until the text matches.
  function ConfirmDialog({ open = true, question, consequence, confirmLabel, cancelLabel, danger = true, count, typeToConfirm, onConfirm, onClose, children }) {
    const [typed, setTyped] = useState("");
    const fid = useUid("ctype");
    useEffect(() => { if (!open) setTyped(""); }, [open]);
    const need = typeToConfirm && typeToConfirm.expected;
    const match = !need || L.fold(typed) === L.fold(need);
    const why = need && !match ? t("confirm.typeWhy", { expected: need }) : null;
    const footer = html`<${Button} kind="secondary" autofocus data-kit-keepfocus="" onClick=${() => onClose && onClose("cancel")}>${cancelLabel || t("confirm.cancel")}<//>
      <${Button} kind=${danger ? "danger" : "primary"} unavailable=${why} onClick=${() => onConfirm && onConfirm()}>${confirmLabel}<//>`;
    return html`<${Modal} tag="wa-dialog" kitName="ConfirmDialog" open=${open} size="s" title=${question} alert=${true}
      consequence=${consequence} frameAnchor=${true} footer=${footer} onClose=${onClose}>
      ${consequence && html`<p class="t-body">${consequence}</p>`}
      ${count != null && html`<p class="t-meta">${count}</p>`}
      ${children}
      ${need && html`<div class="field"><label for=${fid}>${typeToConfirm.label || t("confirm.type", { expected: need })}</label>
        <input id=${fid} class="input" autocomplete="off" value=${typed} onInput=${(e) => setTyped(e.currentTarget.value)} /></div>`}
    <//>`;
  }

  // SidePanel (alias Drawer): modal (wa-drawer) for create/edit with 5–8 fields; non-modal (an aside in
  // the page flow, docked when the list keeps ≥ 560 px, else over the list without a scrim) for the
  // read-only detail of the selected row. pager = { index, total, onPrev, onNext }; onExpand opens the page.
  function SidePanel(p) {
    const { open = true, modal = true } = p;
    if (!modal) return html`<${PanelAside} ...${p} open=${open} />`;
    const header = html`${p.pager && html`<${PanelPager} pager=${p.pager} />`}${p.onExpand && html`<${IconButton} icon="expand" size="sm" label=${t("panel.expand")} onClick=${p.onExpand} />`}`;
    return html`<${Modal} tag="wa-drawer" kitName="SidePanel" open=${open} title=${p.title} footer=${p.footer} dirty=${p.dirty}
      onClose=${p.onClose} size=${p.size} placement=${p.side === "start" ? "start" : "end"} header=${p.pager || p.onExpand ? header : null}
      initialFocus=${p.initialFocus} id=${p.id} cls=${p.cls}>${p.children}<//>`;
  }
  function PanelPager({ pager }) {
    return html`<span class="ov-pager"><span class="t-meta tnum">${t("panel.pager", { index: pager.index, total: pager.total })}</span>
      <${IconButton} icon="up" size="sm" label=${t("panel.prev")} disabled=${!pager.onPrev || pager.index <= 1} onClick=${pager.onPrev} />
      <${IconButton} icon="down" size="sm" label=${t("panel.next")} disabled=${!pager.onNext || pager.index >= pager.total} onClick=${pager.onNext} /></span>`;
  }
  function PanelAside({ open, title, footer, pager, onExpand, onClose, size = "m", children, id }) {
    const ref = useRef(null);
    const hid = useUid("panel");
    const state = usePresence(open);
    const [dock, setDock] = useState(true);
    const returnTo = useRef(null);
    useLayoutEffect(() => {
      if (open) returnTo.current = document.activeElement;
    }, [open]);
    useEffect(() => {
      const el = ref.current;
      const parent = el && el.parentElement;
      if (!parent) return undefined;
      const measure = () => {
        const w = parent.getBoundingClientRect().width;
        const panel = el.getBoundingClientRect().width || 480;
        setDock(w - panel >= 560);
      };
      measure();
      let ro;
      try { ro = new ResizeObserver(measure); ro.observe(parent); } catch (e) { /* no observer */ }
      return () => ro && ro.disconnect();
    }, [state === "closed"]);
    useOverlayEntry(open, hid, () => onClose && onClose("back"), true);
    const close = () => {
      onClose && onClose("close");
      const back = returnTo.current;
      setTimeout(() => (back && back.isConnected ? back.focus({ preventScroll: true }) : refocus(null)), 0);
    };
    const key = (e) => {
      if (e.key === "Escape" && overlays.isTop(hid)) {
        e.stopPropagation();
        close();
      }
    };
    if (state === "closed") return null;
    return html`<aside ref=${ref} id=${id} class=${cx("spanel", "sz-" + size, dock ? "docked" : "over")} role="complementary" aria-labelledby=${hid + "-h"}
      data-kit="SidePanel" data-state=${state} onKeyDown=${key}>
      <div class="spanel-h"><h2 id=${hid + "-h"} class="t-title-l clamp1 grow" tabindex="-1">${title}</h2>
        ${pager && html`<${PanelPager} pager=${pager} />`}${onExpand && html`<${IconButton} icon="expand" size="sm" label=${t("panel.expand")} onClick=${onExpand} />`}
        <${IconButton} icon="x" size="sm" label=${t("close")} onClick=${close} /></div>
      <div class="spanel-b">${children}</div>
      ${footer && html`<div class="spanel-f">${footer}</div>`}
    </aside>`;
  }

  // BottomSheet (alias Sheet): phone and kiosk filters, pickers, help, short detail. A bottom drawer below
  // 760 px or inside a device frame; elsewhere it renders as Dialog M.
  function BottomSheet({ open = true, title, footer, onClose, children, id }) {
    const A = useApp();
    const probe = useRef(null);
    const [inFrame, setInFrame] = useState(false);
    useLayoutEffect(() => { setInFrame(!!frameOf(probe.current)); }, []);
    const sheet = (A && A.narrow) || inFrame;
    return html`<span ref=${probe} hidden></span>${sheet
      ? html`<${Modal} tag="wa-drawer" kitName="BottomSheet" open=${open} title=${title} footer=${footer} onClose=${onClose} placement="bottom" id=${id}>${children}<//>`
      : html`<${Modal} tag="wa-dialog" kitName="BottomSheet" open=${open} size="m" title=${title} footer=${footer} onClose=${onClose} id=${id}>${children}<//>`}`;
  }

  // Popover: an anchored non-modal panel tied to one control (a filter, a deadline, a date). anchor: the
  // trigger's id (the trigger toggles open; Escape and an outside click close). A BottomSheet below 760 px.
  function Popover({ open = true, anchor, title, footer, onClose, placement = "bottom-start", children, id, cls }) {
    const A = useApp();
    const ref = useRef(null);
    const pid = useUid("pop");
    const openRef = useRef(open);
    openRef.current = open;
    useOverlayEntry(open && !(A && A.narrow), pid, () => onClose && onClose("back"), false);
    // The anchor is set as a property (not `for`), so the trigger's own click handler stays in charge of
    // open; the library still positions the panel, closes it on Escape and on an outside click.
    const narrow = !!(A && A.narrow);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return undefined;
      const a = typeof anchor === "string" ? document.getElementById(anchor) : anchor;
      if (a) a.setAttribute("aria-expanded", open ? "true" : "false");
      let alive = true;
      libReady("wa-popover").then(() => el.updateComplete).then(() => {
        if (!alive) return;
        if (el.anchor !== a) el.anchor = a || null;
        const want = !!open && !narrow;
        if (want && !el.open) el.open = true;
        else if (!want && el.open) el.open = false;
      });
      return () => { alive = false; };
    }, [anchor, open, narrow]);
    useOwnEvent(ref, "wa-hide", () => { if (openRef.current) onClose && onClose("library"); });
    useEffect(() => {
      if (!open || !title) return;
      libReady("wa-popover").then(() => ref.current && ref.current.updateComplete).then(() => {
        const d = ref.current && ref.current.shadowRoot && ref.current.shadowRoot.querySelector('[part~="dialog"]');
        if (d) d.setAttribute("aria-label", title);
      });
    }, [open, title]);
    if (A && A.narrow) return html`<${BottomSheet} open=${open} title=${title} footer=${footer} onClose=${onClose}>${children}<//>`;
    return html`<wa-popover ref=${ref} id=${id} placement=${placement} distance="6" without-arrow="" data-kit="Popover" class=${cls}>
      <div class="pop">${title && html`<div class="pop-h"><b class="t-title clamp1 grow">${title}</b><${IconButton} icon="x" size="sm" label=${t("close")} onClick=${() => onClose && onClose("close")} /></div>`}
        <div class="pop-b">${children}</div>${footer && html`<div class="pop-f">${footer}</div>`}</div>
    </wa-popover>`;
  }

  /* ---------------- Menus ---------------- */
  // MenuButton: 2–7 commands on one object. items: [{ label, sub, icon, onClick, danger, unavailable, separator }].
  // Danger items go last after a separator; unavailable items stay focusable with their reason and keep
  // the menu open. An icon-only trigger is named "More actions: <object>".
  function MenuButton({ label, icon, kind = "ghost", size, items = [], placement = "bottom-end", object, id, cls }) {
    const A = useApp();
    const ref = useRef(null);
    const tid = useUid("menu");
    const trigId = id || tid;
    const list = useMemo(() => {
      const safe = items.filter((x) => x && !x.danger);
      const danger = items.filter((x) => x && x.danger && !x.separator);
      return danger.length && safe.length ? [...safe, { separator: true }, ...danger] : [...safe, ...danger];
    }, [items]);
    useOwnEvent(ref, "wa-select", (e) => {
      const v = e.detail && e.detail.item && e.detail.item.getAttribute("value");
      const it = list[Number(v)];
      if (!it) return;
      if (it.unavailable) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      it.onClick && it.onClick();
    });
    const only = icon && !label;
    const name = only ? (object ? t("tip.more", { object }) : t("more")) : undefined;
    const dsize = { compact: "s", comfortable: "m", touch: "l", kiosk: "xl" }[(A && A.density) || "compact"];
    return html`<wa-dropdown ref=${ref} placement=${placement} distance="4" size=${dsize} data-kit="MenuButton" class=${cls}>
        <button slot="trigger" id=${trigId} type="button" class=${cx("btn", kind, size, only && "icon")} aria-label=${name}>
          ${icon && html`<${Icon} n=${icon} />`}${label}${label && html`<${Icon} n="down" cls="chev" />`}</button>
        ${list.map((x, i) => (x.separator
          ? html`<div key=${"s" + i} role="separator" class="mb-sep"></div>`
          : html`<wa-dropdown-item key=${i} value=${String(i)} variant=${x.danger ? "danger" : undefined}
              data-unavailable=${x.unavailable ? "" : undefined} aria-disabled=${x.unavailable ? "true" : undefined}>
              ${x.icon && html`<span slot="icon"><${Icon} n=${x.icon} s=${16} /></span>`}${x.label}
              ${(x.sub || x.unavailable) && html`<span slot="details" class="t-meta mb-sub">${typeof x.unavailable === "string" ? x.unavailable : x.sub}</span>`}
            </wa-dropdown-item>`))}
      </wa-dropdown>${only && name && !(A && (A.coarse || A.density === "touch" || A.density === "kiosk")) && html`<wa-tooltip for=${trigId} placement="top" show-delay="500" hide-delay="100">${name}</wa-tooltip>`}`;
  }

  // Legacy (0.2) anchored menu, kept one release: use MenuButton. Focus goes to the first item; ↑/↓, Home,
  // End and typeahead move inside the menu only; Tab and Escape close; it flips above when there is no room,
  // follows scroll and resize, and sits in KIT.overlays.
  function Menu({ anchor, onClose, children, width = 280 }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);
    const mid = useUid("lmenu");
    const buf = useRef({ text: "", at: 0 });
    useOverlayEntry(true, mid, () => onClose && onClose(), false);
    useLayoutEffect(() => {
      if (!anchor) return undefined;
      const place = () => {
        const r = anchor.getBoundingClientRect();
        const w = Math.min(width, window.innerWidth - 16);
        const h = ref.current ? ref.current.offsetHeight : 0;
        const below = window.innerHeight - r.bottom - 8;
        const top = h && below < h && r.top > below ? Math.max(8, r.top - 6 - h) : r.bottom + 6;
        setPos({ top, left: Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)), width: w });
      };
      place();
      requestAnimationFrame(place);
      window.addEventListener("resize", place);
      document.addEventListener("scroll", place, true);
      return () => {
        window.removeEventListener("resize", place);
        document.removeEventListener("scroll", place, true);
      };
    }, [anchor]);
    useEffect(() => {
      const items = ref.current ? [...ref.current.querySelectorAll("button, [role=menuitem]")] : [];
      const cur = items.find((b) => b.getAttribute("aria-current") === "true") || items[0];
      cur && cur.focus({ preventScroll: true });
      const down = (e) => {
        if (ref.current && !ref.current.contains(e.target) && !(anchor && anchor.contains(e.target))) onClose();
      };
      document.addEventListener("mousedown", down);
      return () => document.removeEventListener("mousedown", down);
    }, [!!pos]);
    const key = (e) => {
      const items = [...ref.current.querySelectorAll("button, [role=menuitem]")];
      const i = items.indexOf(document.activeElement);
      let j = null;
      if (e.key === "ArrowDown") j = L.nextIndex(i < 0 ? undefined : i, 1, items.length);
      else if (e.key === "ArrowUp") j = L.nextIndex(i < 0 ? undefined : i, -1, items.length);
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = items.length - 1;
      else if (e.key === "Escape") {
        if (!overlays.isTop(mid)) return;
        e.preventDefault();
        e.stopPropagation();
        onClose();
        anchor && anchor.focus();
        return;
      } else if (e.key === "Tab") {
        onClose();
        return;
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        const now = Date.now();
        buf.current = { text: (now - buf.current.at < 700 ? buf.current.text : "") + e.key, at: now };
        j = L.typeahead(items.map((b) => b.textContent), buf.current.text, i);
      }
      if (j == null || j < 0) return;
      e.preventDefault();
      items[j] && items[j].focus();
    };
    return html`<div class="menu" role="menu" ref=${ref} data-kit="Menu" onKeyDown=${key}
      style=${pos ? { top: pos.top + "px", left: pos.left + "px", width: pos.width + "px" } : { visibility: "hidden", top: "0px", left: "0px" }}>${children}</div>`;
  }

  // Toggletip: an (i) button that explains a rule (≤ 300 characters), on staff pages. text: a string or
  // paragraphs. The text is in a polite live region; Escape and an outside click close it.
  function InfoPopover({ text, label }) {
    const [open, setOpen] = useState(false);
    const bid = useUid("info");
    const paras = [].concat(text);
    return html`<span class="info" data-kit="InfoPopover"><button id=${bid} type="button" class="info-btn" aria-label=${t("info.label", { label: label || t("info.more") })}
        aria-expanded=${open ? "true" : "false"} onClick=${() => setOpen(!open)}><${Icon} n="info" s=${16} /></button>
      <${Popover} open=${open} anchor=${bid} onClose=${() => setOpen(false)} cls="info-pop">
        <div class="info-txt" role="status" aria-live="polite">${open && paras.map((p, i) => html`<p key=${i}>${p}</p>`)}</div>
      <//></span>`;
  }

  /* ---------------- Toasts ---------------- */
  // Kit-owned timing (the library item has duration 0): plain 5 s + 1 s per 40 characters above 80, paused on
  // hover, on focus inside and while the window is hidden; with an action it stays until closed, its action,
  // a route change, or a new toast with the same key. No toasts on the kiosk.
  const TONE = { ok: "success", warn: "warning", danger: "danger", info: "brand" };
  function Toaster() {
    const A = useApp();
    const ref = useRef(null);
    const items = useRef(new Map()); // id -> { el, timer, left, started, paused }
    const aRef = useRef(A);
    aRef.current = A;
    const startTimer = (id) => {
      const it = items.current.get(id);
      if (!it || !isFinite(it.left) || it.timer || it.paused.size) return;
      it.started = Date.now();
      it.timer = setTimeout(() => aRef.current.dismiss(id), it.left);
    };
    const pauseTimer = (id, why) => {
      const it = items.current.get(id);
      if (!it) return;
      it.paused.add(why);
      if (it.timer) {
        clearTimeout(it.timer);
        it.timer = null;
        it.left = Math.max(800, it.left - (Date.now() - it.started));
      }
    };
    const resumeTimer = (id, why) => {
      const it = items.current.get(id);
      if (!it) return;
      it.paused.delete(why);
      startTimer(id);
    };
    useEffect(() => {
      const vis = () => {
        for (const id of items.current.keys()) (document.hidden ? pauseTimer : resumeTimer)(id, "hidden");
      };
      document.addEventListener("visibilitychange", vis);
      return () => document.removeEventListener("visibilitychange", vis);
    }, []);
    // Sync the library items with the toast list.
    useEffect(() => {
      const host = ref.current;
      if (!host) return;
      const want = new Set(A.toasts.map((x) => x.id));
      for (const [id, it] of items.current) {
        if (want.has(id)) continue;
        if (it.timer) clearTimeout(it.timer);
        items.current.delete(id);
        if (it.el.isConnected) {
          if (typeof it.el.hide === "function") it.el.hide();
          else it.el.remove();
        }
      }
      for (const x of A.toasts) {
        if (items.current.has(x.id)) continue;
        const el = document.createElement("wa-toast-item");
        el.setAttribute("duration", "0");
        el.setAttribute("variant", TONE[x.tone] || "neutral");
        el.setAttribute("data-kit-toast", String(x.id));
        if (x.action) el.setAttribute("data-action", "");
        const row = document.createElement("div");
        row.className = "toast-row";
        if (x.icon && I[x.icon]) {
          const ic = document.createElement("span");
          ic.className = "toast-ic";
          ic.innerHTML = `<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[x.icon]}</svg>`;
          row.appendChild(ic);
        }
        const msg = document.createElement("span");
        msg.className = "toast-msg";
        msg.textContent = x.msg;
        row.appendChild(msg);
        if (x.action) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn sm ghost toast-act";
          b.textContent = x.action.label;
          b.addEventListener("click", () => {
            try { x.action.run && x.action.run(); } finally { aRef.current.dismiss(x.id); }
          });
          row.appendChild(b);
        }
        el.appendChild(row);
        el.addEventListener("wa-hide", (e) => { if (e.target === el && items.current.has(x.id)) aRef.current.dismiss(x.id); });
        el.addEventListener("mouseenter", () => pauseTimer(x.id, "hover"));
        el.addEventListener("mouseleave", () => resumeTimer(x.id, "hover"));
        el.addEventListener("focusin", () => pauseTimer(x.id, "focus"));
        el.addEventListener("focusout", () => resumeTimer(x.id, "focus"));
        items.current.set(x.id, { el, timer: null, left: x.ms, started: 0, paused: new Set(document.hidden ? ["hidden"] : []) });
        host.appendChild(el);
        startTimer(x.id);
      }
    }, [A.toasts]);
    // A route change closes action toasts.
    useEffect(() => {
      for (const x of aRef.current.toasts) if (x.action) aRef.current.dismiss(x.id);
    }, [A.screen]);
    // Placement: compact -> bottom-left of the content region; comfortable -> bottom centre; touch -> bottom,
    // full width; phone frame -> inside the phone screen.
    const [place, setPlace] = useState({});
    useLayoutEffect(() => {
      const measure = () => {
        const frame = document.querySelector('[data-frame="phone"]');
        if (frame) {
          const r = frame.getBoundingClientRect();
          const z = frame.currentCSSZoom || 1;
          setPlace({ mode: "frame", left: r.left / z, right: (window.innerWidth - r.right) / z, bottom: (window.innerHeight - r.bottom) / z + 72 });
          return;
        }
        const main = A.density === "compact" ? document.querySelector(".main") : null;
        const bar = document.querySelector(".abar.sticky");
        const lift = bar ? bar.getBoundingClientRect().height : 0;
        if (main) setPlace({ mode: "main", left: main.getBoundingClientRect().left, bottom: lift });
        else setPlace({ mode: A.density === "touch" ? "touch" : "centre", bottom: lift + (A.density === "touch" ? 64 : 0) });
      };
      measure();
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }, [A.density, A.layout, A.screen, A.toasts.length]);
    const style = place.mode === "frame"
      ? { "--tx": place.left + "px", "--tr": place.right + "px", "--tb": place.bottom + "px" }
      : { "--tx": (place.left || 0) + "px", "--tb": (place.bottom || 0) + "px" };
    return html`<wa-toast ref=${ref} placement=${place.mode === "main" ? "bottom-start" : "bottom-center"} data-place=${place.mode} data-kit="Toaster" style=${style}></wa-toast>`;
  }
  // 0.2 name.
  const Toasts = Toaster;

  /* ---------------- Density, persistence, frames ---------------- */
  function DensityScope({ mode, children }) {
    return html`<div data-density=${mode} class="kit-scope" data-kit="DensityScope">${children}</div>`;
  }
  // Keeps a frame part still across route changes (view-transition-name kit-keep-<name>).
  function Persist({ name, children, as = "div", cls }) {
    return KIT.h(as, { class: cls, "data-kit": "Persist", style: { viewTransitionName: "kit-keep-" + name } }, children);
  }
  // A device frame's scrolling body: it becomes #kit-content (scroll restore and focus after routes).
  function FrameScroll({ children, cls }) {
    return html`<div id="kit-content" class=${cx("frame-scroll", cls)} data-kit="FrameScroll">${children}</div>`;
  }

  /* ---------------- Fields, status, tables (0.2 API; replaced in ui-form.js and ui-data.js) ---------------- */
  function Field({ id, label, req, hint, err, children }) {
    return html`<div class="field" data-kit="Field">
      <label for=${id}>${label}${req && html`<span class="req" aria-hidden="true">*</span>`}</label>
      ${children}
      ${err ? html`<span class="err" id=${id + "-err"}><${Icon} n="alert" s=${14} />${err}</span>` : hint && html`<span class="hint" id=${id + "-hint"}>${hint}</span>`}
    </div>`;
  }
  // tone: ok | warn | danger | info | accent | neutral (default) | line.
  function StatusChip({ tone, icon, children }) {
    return html`<span class=${cx("pill", tone)} data-kit="StatusChip">${icon && html`<${Icon} n=${icon} s=${14} />`}${children}</span>`;
  }
  function Table({ columns = [], rows = [], rowKey = "id", onRow, empty, caption, dense }) {
    return html`<div class="table-wrap"><table class=${cx("tbl", dense && "dense")} data-kit="Table">
      ${caption && html`<caption class="sr-only">${caption}</caption>`}
      <thead><tr>${columns.map((c) => html`<th key=${c.key} scope="col" class=${c.num ? "n" : undefined}>${c.label}</th>`)}</tr></thead>
      <tbody>${rows.length
        ? rows.map((r, i) => html`<tr key=${r[rowKey] != null ? r[rowKey] : i} class=${onRow ? "click" : undefined} onClick=${onRow ? () => onRow(r) : undefined}>
            ${columns.map((c) => html`<td key=${c.key} class=${c.num ? "n" : undefined}>${c.render ? c.render(r) : r[c.key]}</td>`)}</tr>`)
        : html`<tr><td colspan=${columns.length} class="tbl-empty">${empty == null ? KIT.t("table.empty") : empty}</td></tr>`}</tbody>
    </table></div>`;
  }
  function KPI({ id, label, value, unit, delta, deltaGood = "up", deltaUnit = "%", note, icon }) {
    const has = delta != null && !isNaN(delta);
    const dir = !has || Math.abs(delta) < 1e-9 ? 0 : delta > 0 ? 1 : -1;
    const good = dir === 0 ? null : (dir > 0) === (deltaGood === "up");
    const dtxt = !has ? "" : dir === 0 ? KIT.t("kpi.noChange") : `${dir > 0 ? "+" : "−"}${KIT.util.nf(Math.abs(delta))}${deltaUnit === "%" ? "%" : deltaUnit ? " " + deltaUnit : ""}`;
    return html`<div class="kpi" data-kpi=${id} data-kit="StatTile">
      <div class="kpi-l">${icon && html`<${Icon} n=${icon} s=${15} />`}<span>${label}</span></div>
      <div class="kpi-v"><b class="t-figure-l">${value}</b>${unit && html`<span class="kpi-u">${unit}</span>`}</div>
      ${(has || note) && html`<div class="kpi-f">
        ${has && html`<span class=${cx("kpi-d", good === true && "good", good === false && "bad")}>${dir !== 0 && html`<${Icon} n=${dir > 0 ? "up" : "down"} s=${14} />`}<span class="sr-only">${dir > 0 ? KIT.t("kpi.up") : dir < 0 ? KIT.t("kpi.down") : ""}${good === true ? KIT.t("kpi.good") : good === false ? KIT.t("kpi.bad") : ""}</span>${dtxt}</span>`}
        ${note && html`<span class="t-meta clamp1">${note}</span>`}
      </div>`}
    </div>`;
  }

  /* ---------------- Headers and surfaces (0.2 API; extended in part 2) ---------------- */
  function PageHeader({ eyebrow, title, desc, sentence, info, back, children }) {
    const act = [].concat(children || []).filter(Boolean);
    const line = sentence || desc;
    return html`<div class="page-h" data-kit="PageHeader">
      <div class="grow">
        ${back}
        ${eyebrow && html`<span class="t-cap">${eyebrow}</span>`}
        <div class="ph-title"><h1 class="t-headline" tabindex="-1" data-kit-h1="">${title}</h1>${info && html`<${InfoPopover} text=${info} />`}</div>
        ${line && html`<p class="ph-sent">${line}</p>`}
      </div>
      ${act.length > 0 && html`<div class="ph-act">${act}</div>`}
    </div>`;
  }
  function Card({ title, sub, info, actions, flush, id, children }) {
    const hid = id ? id + "-h" : undefined;
    return html`<section class="card" id=${id} aria-labelledby=${title ? hid : undefined} data-kit="Card">
      ${title && html`<div class="card-h"><div class="ch-col"><div class="ch-t"><h2 class="t-title clamp1" id=${hid}>${title}</h2>${info && html`<${InfoPopover} text=${info} />`}</div>${sub && html`<span class="t-meta clamp1">${sub}</span>`}</div>${actions && html`<div class="ch-act">${actions}</div>`}</div>`}
      <div class=${flush ? "card-flush" : "card-b"}>${children}</div>
    </section>`;
  }
  function EmptyState({ icon = "inbox", title, children, action }) {
    return html`<div class="empty" role="status" data-kit="EmptyState">
      <span class="ic-wrap"><${Icon} n=${icon} s=${22} /></span>
      ${title && html`<b class="empty-t">${title}</b>`}
      ${children && html`<span class="empty-txt">${children}</span>`}
      ${action}
    </div>`;
  }

  /* ---------------- Shell pages ---------------- */
  function Placeholder() {
    const A = useApp();
    const reg = KIT.screens[A.screen] || {};
    return html`<${PageHeader} title=${reg.name || KIT.t("screen")} sentence=${reg.code + " · " + reg.rel} />
      <${Card}><${EmptyState} icon="construct" title=${KIT.t("placeholder.title")}>${reg.code} · ${reg.name} · ${reg.rel}<//><//>`;
  }
  function Denied() {
    const A = useApp();
    const reg = KIT.screens[A.screen] || {};
    const who = KIT.roleName(A.role);
    const home = KIT.homeOf(A.role);
    const allowed = (reg.roles || []).map(KIT.roleName).join(", ");
    return html`<div class="denied" data-denied=${A.screen}>
      <h1 class="sr-only" tabindex="-1" data-kit-h1="">${KIT.t("denied.title", { who })}</h1>
      <${EmptyState} icon="lock" title=${KIT.t("denied.title", { who })}
        action=${home && html`<${Button} kind="primary" icon="home" onClick=${() => A.go(home)}>${KIT.t("denied.home", { who })}<//>`}>
        ${reg.name ? KIT.t("denied.text", { name: reg.name, code: reg.code, allowed }) : ""}
      <//>
    </div>`;
  }
  function NotFound() {
    const A = useApp();
    return html`<h1 class="sr-only" tabindex="-1" data-kit-h1="">${KIT.t("notfound.title")}</h1><${EmptyState} icon="search" title=${KIT.t("notfound.title")}
      action=${html`<${Button} icon="home" onClick=${A.openPicker}>${KIT.t("notfound.back")}<//>`}>
      ${KIT.t("notfound.text", { id: A.screen })}
    <//>`;
  }

  Object.assign(KIT.ui, {
    Icon, Button, IconButton, Link, Tip,
    Dialog, ConfirmDialog, Confirm: ConfirmDialog, SidePanel, Drawer: SidePanel, BottomSheet, Sheet: BottomSheet,
    Popover, MenuButton, Menu, InfoPopover, Toaster, Toasts,
    DensityScope, Persist, FrameScroll, usePresence,
    Field, StatusChip, Table, KPI, StatTile: KPI, PageHeader, Card, Surface: Card, EmptyState,
    Placeholder, Denied, NotFound,
  });
  KIT.ui._ = { useOwnEvent, useUid, useOverlayEntry, useFrameScope, frameOf, refocus, pageH1, deepActive, libLocalize, nextId };
  KIT.util.icons = I;
})();
