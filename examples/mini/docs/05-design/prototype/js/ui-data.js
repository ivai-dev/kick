// ui-data.js — KIT.ui, part 3: lists at volume. DataTable (alias Table: fixed layout, sorting with
// Vietnamese collation, row links, selection across pages, paging, sticky header, responsive columns, a
// column menu, cards below 760 px, loading/error/empty states, tree rows, keyboard shortcuts), FilterBar,
// FilterRail, FilterTray, BulkBar, SavedViews, ShortcutLayer, ReorderList, SettingsLayout. Pure logic
// (sorting, paging, selection, folding) comes from js/logic.js. Every word goes through KIT.t. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = hooks;
  const { cx, store } = KIT.util;
  const L = KIT.logic;
  const U = KIT.ui;
  const { Icon, Button, IconButton, Popover, BottomSheet, Dialog, MenuButton, Pager, EmptyState, Banner, Skeleton, Clamp, EntityCard, Switch } = U;
  const { useUid } = U._;
  const t = (k, v) => KIT.t(k, v);
  const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
  const textOf = (v) => (v == null ? "" : typeof v === "string" || typeof v === "number" ? String(v) : "");
  const INTERACTIVE = "a, button, input, select, textarea, label, [role=checkbox], [role=button], [role=switch]";

  /* ---------------- ShortcutLayer ---------------- */
  // Keyboard shortcuts active only while focus is inside `scope` (WCAG 2.1.4); never in text fields; "?"
  // opens the key list with an off switch stored as "shortcuts". keys: { "j": fn, "ArrowDown": fn, … }.
  function ShortcutLayer({ scope, keys = {}, help = [], enabled = true }) {
    const [on, setOn] = useState(() => store.get("shortcuts", true));
    const [show, setShow] = useState(false);
    const keysRef = useRef(keys);
    keysRef.current = keys;
    useEffect(() => {
      const el = scope && (scope.current || scope);
      if (!el || !el.addEventListener || !enabled) return undefined;
      const down = (e) => {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
        if (e.key === "?") { e.preventDefault(); setShow(true); return; }
        if (!store.get("shortcuts", true)) return;
        const k = e.shiftKey && e.key.length > 1 ? "Shift+" + e.key : e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const fn = keysRef.current[k] || keysRef.current[e.key];
        if (fn && fn(e) !== false) e.preventDefault(); // a handler returns false to keep the native action
      };
      el.addEventListener("keydown", down);
      return () => el.removeEventListener("keydown", down);
    }, [scope && (scope.current || scope), enabled]);
    return html`<${Dialog} open=${show} size="s" kind="passive" title=${t("keys.help")} onClose=${() => setShow(false)}>
      <dl class="keys">${help.map((h, i) => html`<div key=${i} class="keys-r"><dt><kbd>${h.key}</kbd></dt><dd>${h.text}</dd></div>`)}</dl>
      <${Switch} label=${t("keys.toggle")} checked=${on} onChange=${(v) => { store.set("shortcuts", v); setOn(v); }} />
    <//>`;
  }

  /* ---------------- DataTable ---------------- */
  // columns: [{ key, label, width, align, num, sortable, sortValue, priority, clamp, nowrap, render, hideBelow, cardRole }]
  // rowLink(row) -> "#sc-32?id=…" or { go, params }: the first cell holds the link, a click elsewhere in the
  // row follows it (not on controls, not while text is selected). onOpen(row): a button in the first cell (panels).
  // selection "multi": selected (keys) + onSelect(keys, { allMatching }); selectAllMatching = { count, unit }.
  // sort { key, dir } + onSort (controlled) or uncontrolled. page: a number (with pageSize, total) or
  // { page, size, total, sizes, unit, onSize }; onPage(p). Rows longer than a page are sliced here.
  function DataTable(props) {
    const {
      columns = [], rows = [], rowKey = "id", caption, rowLink, onOpen, onRow, activeId, selection = "none", selected, onSelect,
      selectAllMatching, sort, onSort, page, pageSize, total, onPage, density, dense, stickyHeader = true, empty, loading, error, onRetry,
      columnsMenu, persistKey, narrow = "cards", rowLevel, expanded, onToggleRow, hasChildren, shortcuts, id, unit, label,
    } = props;
    const A = useApp();
    const gid = useUid("dt");
    const tid = id || gid;
    const wrapRef = useRef(null);
    const open = onOpen || onRow;
    const keyOf = (r, i) => (r && r[rowKey] != null ? r[rowKey] : i);
    const [width, setWidth] = useState(0);
    const [sortIn, setSortIn] = useState(sort || null);
    const [selIn, setSelIn] = useState([]);
    const [allIn, setAllIn] = useState(false);
    const [active, setActive] = useState(-1);
    const [hidden, setHidden] = useState(() => (persistKey ? store.get("cols-" + persistKey, []) : []));
    useLayoutEffect(() => {
      const el = wrapRef.current;
      if (!el) return undefined;
      const m = () => setWidth(Math.round(el.getBoundingClientRect().width));
      m();
      let ro;
      try { ro = new ResizeObserver(m); ro.observe(el); } catch (e) { /* no observer */ }
      return () => ro && ro.disconnect();
    }, []);
    const srt = onSort ? sort : sortIn;
    const sorted = useMemo(() => {
      if (!srt || !srt.key || onSort) return rows;
      const col = columns.find((c) => c.key === srt.key);
      return L.sortRows(rows, col && col.sortValue ? col.sortValue : srt.key, srt.dir);
    }, [rows, srt && srt.key, srt && srt.dir, onSort]);
    const pg = page == null ? null : typeof page === "object" ? page : { page, size: pageSize || 50, total: total != null ? total : rows.length };
    const view = pg && sorted.length > pg.size ? sorted.slice((pg.page - 1) * pg.size, pg.page * pg.size) : sorted;
    const sel = selected != null ? selected : selIn;
    const allMatching = selected != null ? !!(props.allMatching) : allIn;
    const setSel = (keys, all) => {
      if (selected == null) { setSelIn(keys); setAllIn(!!all); }
      onSelect && onSelect(keys, { allMatching: !!all });
    };
    const pageKeys = view.map(keyOf);
    const pageState = L.selection(sel).pageState(pageKeys);
    const isCards = narrow === "cards" && ((A && A.narrow) || (width > 0 && width < 560));
    const visible = columns.filter((c) => !hidden.includes(c.key) && !(c.hideBelow && width > 0 && width < c.hideBelow));
    const multi = selection === "multi";
    const first = visible[0];
    const primaryText = (r) => textOf(first && (first.text ? first.text(r) : r[first.key])) || String(keyOf(r, 0));
    const linkOf = (r) => {
      const l = rowLink && rowLink(r);
      if (!l) return null;
      if (typeof l === "string") return { href: l };
      const q = l.params ? "?" + Object.keys(l.params).filter((k) => l.params[k] != null).map((k) => k + "=" + encodeURIComponent(l.params[k])).join("&") : "";
      return { href: "#" + l.go + q, go: l.go, params: l.params };
    };
    const follow = (l, e) => {
      if (!l) return;
      if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { window.open(l.href, "_blank", "noopener"); return; }
      if (l.go) A.go(l.go, l.params || {});
      else location.hash = l.href.replace(/^#/, "");
    };
    const cell = (c, r) => {
      const v = c.render ? c.render(r) : r[c.key];
      if (!c.render && isEmpty(v)) return html`<span class="empty-v">—</span>`;
      if (c.clamp && (typeof v === "string" || typeof v === "number")) return html`<${Clamp} lines=${c.clamp} text=${String(v)} />`;
      return v;
    };
    const firstCell = (c, r) => {
      const content = cell(c, r);
      const l = linkOf(r);
      if (l) return html`<a class="tbl-link" href=${l.href} data-kit-key=${tid + ":" + keyOf(r, 0)} onClick=${(e) => { if (l.go && !e.ctrlKey && !e.metaKey && e.button === 0) { e.preventDefault(); follow(l, e); } }}>${content}</a>`;
      if (open) return html`<button type="button" class="tbl-open" data-kit-key=${tid + ":" + keyOf(r, 0)} onClick=${(e) => { e.stopPropagation(); open(r); }}>${content}</button>`;
      return content;
    };
    const rowClick = (r) => (e) => {
      if (e.target.closest && e.target.closest(INTERACTIVE)) return;
      if (window.getSelection && String(window.getSelection()).length) return;
      const l = linkOf(r);
      if (l) follow(l, e);
      else if (open) open(r);
    };
    const toggleKey = (k) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k], false);
    const sortBy = (c) => {
      const next = { key: c.key, dir: srt && srt.key === c.key && srt.dir === "asc" ? "desc" : "asc" };
      if (onSort) onSort(next);
      else setSortIn(next);
    };
    const sortCol = srt && columns.find((c) => c.key === srt.key);
    const totalN = pg ? pg.total : rows.length;
    const capText = [caption || label, t("dt.total", { n: KIT.util.nf(totalN, 0), unit: unit || t("dt.rows") }),
      sortCol ? t("dt.sortedBy", { col: sortCol.label, dir: t(srt.dir === "desc" ? "dt.desc" : "dt.asc") }) : ""].filter(Boolean).join(". ");
    // Keyboard: ↑/↓ (J/K) move the active row, Space/X toggle, Enter opens, Escape clears.
    const focusRow = (i) => {
      setActive(i);
      setTimeout(() => {
        const row = wrapRef.current && wrapRef.current.querySelectorAll("tbody tr")[i];
        const f = row && row.querySelector("a, button, input");
        f && f.focus();
      }, 0);
    };
    const keys = shortcuts ? {
      ArrowDown: () => focusRow(Math.min(view.length - 1, active + 1)), j: () => focusRow(Math.min(view.length - 1, active + 1)),
      ArrowUp: () => focusRow(Math.max(0, active - 1)), k: () => focusRow(Math.max(0, active - 1)),
      " ": (e) => { if (e.target.closest("input, button, a")) return false; if (multi && active >= 0) toggleKey(keyOf(view[active], active)); },
      x: () => multi && active >= 0 && toggleKey(keyOf(view[active], active)),
      "Shift+ArrowDown": () => { if (multi && active < view.length - 1) { const k = keyOf(view[active + 1], active + 1); if (!sel.includes(k)) setSel([...sel, k]); focusRow(active + 1); } },
      "Shift+ArrowUp": () => { if (multi && active > 0) { const k = keyOf(view[active - 1], active - 1); if (!sel.includes(k)) setSel([...sel, k]); focusRow(active - 1); } },
      Enter: (e) => { if (e.target.closest("a, button, input")) return false; if (active >= 0) { const l = linkOf(view[active]); if (l) follow(l); else if (open) open(view[active]); } },
      Escape: () => { if (active >= 0) setActive(-1); else if (sel.length) setSel([], false); },
    } : null;
    const colMenu = columnsMenu && html`<${MenuButton} label=${t("dt.columns")} icon="columns" size="sm" items=${columns.filter((c, i) => i > 0).map((c) => ({
      label: c.label, icon: hidden.includes(c.key) ? "square" : "check",
      onClick: () => { const next = hidden.includes(c.key) ? hidden.filter((k) => k !== c.key) : [...hidden, c.key]; setHidden(next); if (persistKey) store.set("cols-" + persistKey, next); },
    }))} />`;
    const pager = pg && html`<${Pager} page=${pg.page} size=${pg.size} total=${pg.total} sizes=${pg.sizes} unit=${pg.unit} listId=${tid}
      onPage=${(p) => { onPage && onPage(p); pg.onPage && pg.onPage(p); }} onSize=${pg.onSize} />`;
    const selBar = multi && selectAllMatching && pageState === "all" && selectAllMatching.count > pageKeys.length && html`<div class="dt-selall" role="status">
      ${allMatching ? t("dt.allSelected", { count: KIT.util.nf(selectAllMatching.count, 0), unit: selectAllMatching.unit || unit || "" })
        : html`<button type="button" class="btn link sm" onClick=${() => setSel(sel, true)}>${t("dt.selectAll", { count: KIT.util.nf(selectAllMatching.count, 0), unit: selectAllMatching.unit || unit || "" })}</button>`}</div>`;

    let body;
    if (error) {
      body = html`<${Banner} tone="danger" title=${t("dt.error")} actions=${onRetry && html`<${Button} size="sm" onClick=${onRetry}>${t("job.retry")}<//>`}>${typeof error === "string" ? error : null}<//>`;
    } else if (loading && !rows.length) {
      body = html`<div aria-busy="true"><${Skeleton} count=${5} /></div>`;
    } else if (!rows.length) {
      body = empty && typeof empty === "object" ? empty : html`<${EmptyState} kind="no-results">${empty == null ? t("table.empty") : empty}<//>`;
    } else if (isCards) {
      const role = (rk) => columns.find((c) => c.cardRole === rk);
      const tc = role("title") || first;
      const metas = columns.filter((c) => c.cardRole === "meta");
      const metaCols = metas.length ? metas : visible.filter((c) => c !== tc && !c.cardRole).slice(0, 2);
      body = html`<ul class="dt-cards" aria-label=${capText}>${view.map((r, i) => {
        const l = linkOf(r);
        const val = (c) => (c ? (c.render ? c.render(r) : r[c.key]) : null);
        return html`<li key=${String(keyOf(r, i))}><${EntityCard} layout="row" title=${val(tc)} href=${l ? l.href : undefined} go=${l && l.go} params=${l && l.params}
          meta=${metaCols.map((c) => ({ text: html`<span class="t-meta">${c.label}:</span> ${isEmpty(val(c)) ? "—" : val(c)}` }))}
          badge=${val(role("status"))} figure=${val(role("figure"))} actions=${val(role("action")) || (open && !l ? html`<${IconButton} icon="right" size="sm" label=${textOf(val(tc))} onClick=${() => open(r)} />` : null)}
          selected=${activeId != null && keyOf(r, i) === activeId} /></li>`;
      })}</ul>`;
    } else {
      const fixed = visible.some((c) => c.width);
      body = html`<div class=${cx("table-wrap", narrow === "scroll" && "scroll")}><table class=${cx("tbl", fixed && "fixed", (dense || density === "dense") && "dense", stickyHeader && "sticky", loading && "tbl-busy")}
          aria-busy=${loading ? "true" : undefined} aria-rowcount=${rowLevel ? undefined : undefined} role=${rowLevel ? "treegrid" : undefined}>
        <caption class="sr-only" id=${tid + "-caption"} tabindex="-1">${capText}</caption>
        ${fixed && html`<colgroup>${multi && html`<col style=${{ width: "40px" }} />`}${visible.map((c) => html`<col key=${c.key} style=${c.width ? { width: typeof c.width === "number" ? c.width + "px" : c.width } : undefined} />`)}</colgroup>`}
        <thead><tr>
          ${multi && html`<th class="chk" scope="col"><input type="checkbox" aria-label=${t("dt.selectPage")} checked=${pageState === "all"}
            ref=${(el) => el && (el.indeterminate = pageState === "some")} onChange=${() => setSel(pageState === "all" ? sel.filter((k) => !pageKeys.includes(k)) : Array.from(new Set([...sel, ...pageKeys])), false)} /></th>`}
          ${visible.map((c) => {
            const dir = srt && srt.key === c.key ? srt.dir : null;
            return html`<th key=${c.key} scope="col" class=${cx((c.num || c.align === "right") && "n")} aria-sort=${dir ? (dir === "desc" ? "descending" : "ascending") : undefined}>
              ${c.sortable ? html`<button type="button" class="tbl-sort" data-dir=${dir || undefined} onClick=${() => sortBy(c)}>${c.label}<${Icon} n=${dir === "asc" ? "arrowUp" : dir === "desc" ? "arrowDown" : "sort"} s=${14} /></button>` : c.label}</th>`;
          })}</tr></thead>
        <tbody>${view.map((r, i) => {
          const k = keyOf(r, i);
          const lvl = rowLevel ? rowLevel(r) : null;
          const kids = hasChildren && hasChildren(r);
          const isOpen = expanded && (Array.isArray(expanded) ? expanded.includes(k) : expanded.has && expanded.has(k));
          const linked = !!(rowLink && linkOf(r)) || !!open;
          return html`<tr key=${String(k)} class=${cx(linked && "has-link", onRow && !onOpen && "click")} aria-current=${activeId != null && k === activeId ? "true" : undefined}
            aria-selected=${multi ? (sel.includes(k) || allMatching ? "true" : "false") : undefined} aria-level=${lvl || undefined} style=${lvl ? { "--lvl": lvl } : undefined}
            aria-expanded=${kids ? (isOpen ? "true" : "false") : undefined} onClick=${linked ? rowClick(r) : undefined}>
            ${multi && html`<td class="chk"><input type="checkbox" aria-label=${t("dt.select", { name: primaryText(r) })} checked=${sel.includes(k) || allMatching} onChange=${() => toggleKey(k)} /></td>`}
            ${visible.map((c, ci) => html`<td key=${c.key} class=${cx((c.num || c.align === "right") && "n", c.nowrap && "nowrap")}>${ci === 0
              ? html`${kids && html`<button type="button" class="btn ghost icon sm tree-b" aria-label=${t(isOpen ? "dt.collapse" : "dt.expand", { name: primaryText(r) })} onClick=${(e) => { e.stopPropagation(); onToggleRow && onToggleRow(r); }}><${Icon} n=${isOpen ? "down" : "right"} /></button>`}${firstCell(c, r)}`
              : cell(c, r)}</td>`)}
          </tr>`;
        })}</tbody>
      </table></div>`;
    }
    return html`<div class="dt" ref=${wrapRef} id=${tid} data-kit="DataTable">
      ${colMenu && html`<div class="dt-tools">${colMenu}</div>`}
      ${selBar}
      ${body}
      ${pager}
      ${shortcuts && html`<${ShortcutLayer} scope=${wrapRef} keys=${keys} help=${typeof shortcuts === "object" && shortcuts.help ? shortcuts.help : []} />`}
    </div>`;
  }
  // 0.2 Table: same props; onRow keeps working (the first cell becomes a button), rows scroll sideways on phones.
  function Table(props) {
    return html`<${DataTable} narrow="scroll" stickyHeader=${false} ...${props} />`;
  }

  /* ---------------- Filters ---------------- */
  // One filter's choices: single (radio list with "All"), multi (checkboxes), text (an input).
  function FilterChoices({ f, value, onChange, idp }) {
    const opts = (f.options || []).map((o) => ({ ...o, label: o.count != null ? `${o.label} (${KIT.util.nf(o.count, 0)})` : o.label, disabled: o.disabled || (o.count === 0 && o.value !== value) }));
    if (f.type === "multi") return html`<${U.CheckboxGroup} legend=${f.label} options=${opts} value=${value || []} onChange=${onChange} />`;
    if (f.type === "text") return html`<input class="input" aria-label=${f.label} value=${value || ""} onInput=${(e) => onChange(e.currentTarget.value)} />`;
    if (f.type === "combobox") return html`<${U.Combobox} id=${idp} multiple options=${f.options || []} value=${value || []} onChange=${onChange} />`;
    return html`<${U.ChoiceGroup} variant="list" legend=${f.label} options=${[{ value: "", label: t("filter.all") }, ...opts]} value=${value == null ? "" : value} onChange=${(v) => onChange(v === "" ? null : v)} />`;
  }
  const filterText = (f, v) => {
    if (isEmpty(v)) return "";
    const name = (x) => { const o = (f.options || []).find((y) => y.value === x); return o ? o.label : String(x); };
    return Array.isArray(v) ? (v.length > 1 ? `${name(v[0])} +${v.length - 1}` : name(v[0])) : name(v);
  };
  // Search + filters + applied chips + sort + count above a list. filters: [{ key, label, type single · multi ·
  // text · combobox, options [{ value, label, count }], value }]. onChange(key, value) for every change (text
  // search debounced 300 ms); sync (default true) also writes the filters into the route params with
  // go(…, { replace: true }). Below 760 px the filters move into a FilterTray.
  function FilterBar({ search, filters = [], onChange, sort, count, savedViews, actions, onClear, sync = true }) {
    const A = useApp();
    const fid = useUid("fb");
    const [openKey, setOpenKey] = useState(null);
    const [tray, setTray] = useState(false);
    const [q, setQ] = useState(search ? search.value || "" : "");
    const emit = (key, value) => {
      onChange && onChange(key, value);
      if (sync && A && A.screen) {
        const p = { ...A.params };
        if (isEmpty(value)) delete p[key]; else p[key] = Array.isArray(value) ? value.join(",") : value;
        A.go(A.screen, p, { replace: true });
      }
    };
    const deb = useMemo(() => KIT.util.debounce((v) => emit("q", v), 300), [A && A.screen]);
    const applied = filters.filter((f) => !isEmpty(f.value));
    const clear = () => { filters.forEach((f) => !isEmpty(f.value) && emit(f.key, f.type === "multi" ? [] : null)); onClear && onClear(); };
    const countEl = count && html`<span class="fb-count t-meta" role="status">${t("filter.results", { n: KIT.util.nf(count.n, 0), unit: count.unit || "" })}</span>`;
    const searchEl = search && html`<div class="fb-search affix"><${Icon} n="search" s=${16} /><input class="input" type="search" aria-label=${search.label || t("filter.search")} placeholder=${search.placeholder}
      value=${q} onInput=${(e) => { setQ(e.currentTarget.value); deb(e.currentTarget.value); }} /></div>`;
    const sortEl = sort && html`<label class="fb-sort row gap-8"><span class="t-meta">${t("filter.sort")}</span><select class="select sm" value=${sort.value} onChange=${(e) => sort.onChange && sort.onChange(e.currentTarget.value)}>
      ${sort.options.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}</select></label>`;
    if (A && A.narrow) {
      return html`<div class="fbar narrow" data-kit="FilterBar">
        <div class="fb-row">${searchEl}<${Button} size="sm" icon="filter" onClick=${() => setTray(true)}>${t("filter.button")}${applied.length ? ` (${applied.length})` : ""}<//></div>
        <div class="fb-row">${countEl}${sortEl}</div>
        <${FilterTray} open=${tray} groups=${filters.map((f) => ({ id: f.key, label: f.label, kind: f.type === "multi" ? "toggle" : f.type || "single", options: f.options }))}
          value=${Object.fromEntries(filters.map((f) => [f.key, f.value]))} total=${count && count.n} unit=${count && count.unit}
          onApply=${(v) => { setTray(false); filters.forEach((f) => { if (JSON.stringify(v[f.key]) !== JSON.stringify(f.value)) emit(f.key, v[f.key]); }); }} onClose=${() => setTray(false)} />
      </div>`;
    }
    return html`<div class="fbar" data-kit="FilterBar">
      ${savedViews}
      <div class="fb-row">
        ${searchEl}
        ${filters.map((f) => {
          const bid = fid + "-" + f.key;
          return html`<span key=${f.key}><${U.DisclosureChip} id=${bid} label=${f.label} value=${filterText(f, f.value)} expanded=${openKey === f.key}
              controls=${bid + "-pop"} onClick=${() => setOpenKey(openKey === f.key ? null : f.key)} />
            <${Popover} open=${openKey === f.key} anchor=${bid} id=${bid + "-pop"} onClose=${() => setOpenKey(null)}>
              <${FilterChoices} f=${f} value=${f.value} idp=${bid + "-c"} onChange=${(v) => emit(f.key, v)} /><//></span>`;
        })}
        <span class="spacer"></span>${sortEl}${actions}
      </div>
      ${(applied.length > 0 || countEl) && html`<div class="fb-row">${countEl}
        ${applied.map((f) => html`<${U.FilterChip} key=${f.key} label=${f.label + ": " + filterText(f, f.value)} onRemove=${() => emit(f.key, f.type === "multi" ? [] : null)} />`)}
        ${applied.length > 0 && html`<button type="button" class="btn link sm" onClick=${clear}>${t("filter.clear")}</button>`}</div>`}
    </div>`;
  }
  // Faceted public search: a left column of disclosure groups with counts, applied live. groups: [{ id, label,
  // kind single · toggle · combobox, options [{ value, label, count, disabled }], open }]; value { [id]: v }.
  // Options with 0 results stay visible and disabled (except the selected one).
  function FilterRail({ groups = [], value = {}, onChange, title }) {
    const [open, setOpen] = useState(() => Object.fromEntries(groups.map((g, i) => [g.id, g.open != null ? g.open : i < 3])));
    return html`<aside class="frail" data-kit="FilterRail" aria-label=${title || t("filter.button")}>${groups.map((g) => {
      const f = { key: g.id, label: g.label, type: g.kind === "toggle" ? "multi" : g.kind, options: g.options };
      return html`<${U.Disclosure} key=${g.id} summary=${g.label} open=${!!open[g.id]} onToggle=${(v) => setOpen({ ...open, [g.id]: v })}>
        <${FilterChoices} f=${f} value=${value[g.id]} idp=${"fr-" + g.id} onChange=${(v) => onChange && onChange(g.id, v)} /><//>`;
    })}</aside>`;
  }
  // Filters on phone and kiosk: a bottom sheet that holds changes; "Show 214 jobs" applies them (countFor(held)
  // gives the live count), × discards them.
  function FilterTray({ open, groups = [], value = {}, total, unit, countFor, onApply, onClose }) {
    const [held, setHeld] = useState(value);
    useEffect(() => { if (open) setHeld(value); }, [open]);
    const n = countFor ? countFor(held) : total;
    return html`<${BottomSheet} open=${open} title=${t("filter.button")} onClose=${onClose}
      footer=${html`<${Button} kind="ghost" onClick=${() => setHeld(Object.fromEntries(groups.map((g) => [g.id, g.kind === "toggle" ? [] : null])))}>${t("filter.clear")}<//>
        <${Button} kind="primary" onClick=${() => onApply && onApply(held)}>${n != null ? t("filter.show", { n: KIT.util.nf(n, 0), unit: unit || "" }) : t("period.apply")}<//>`}>
      ${groups.map((g) => html`<div key=${g.id} class="ftray-g"><${FilterChoices} f=${{ key: g.id, label: g.label, type: g.kind === "toggle" ? "multi" : g.kind, options: g.options }}
        value=${held[g.id]} idp=${"ft-" + g.id} onChange=${(v) => setHeld({ ...held, [g.id]: v })} /></div>`)}
    <//>`;
  }
  // Actions on selected rows: replaces the filter row; the count is announced; danger actions open the
  // caller's ConfirmDialog with the count. actions: [{ label, icon, danger, unavailable, onClick }].
  function BulkBar({ count = 0, total, unit, actions = [], onSelectAll, onClear, note }) {
    if (!count) return note ? html`<p class="t-meta" role="status">${note}</p>` : html`<span class="sr-only" role="status"></span>`;
    return html`<div class="bulk" role="region" aria-label=${t("bulk.region")} data-kit="BulkBar">
      <span class="t-label" role="status" aria-live="polite">${t("bulk.count", { n: KIT.util.nf(count, 0) })}${unit ? " " + unit : ""}</span>
      ${onSelectAll && total > count && html`<button type="button" class="btn link sm" onClick=${onSelectAll}>${t("dt.selectAll", { count: KIT.util.nf(total, 0), unit: unit || "" })}</button>`}
      <span class="spacer"></span>
      ${actions.map((a, i) => html`<${Button} key=${i} size="sm" kind=${a.danger ? "secondary" : i === 0 ? "primary" : "secondary"} icon=${a.icon} unavailable=${a.unavailable} onClick=${a.onClick}>${a.label}<//>`)}
      <${Button} size="sm" kind="ghost" onClick=${onClear}>${t("bulk.clear")}<//>
    </div>`;
  }
  // Named filter sets per list: chips (≤ 8) + "More ▾"; "Save filters" asks for a name in Dialog S.
  function SavedViews({ views = [], active, onPick, onSave, onDelete }) {
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const nid = useUid("views");
    const main = views.slice(0, 8), rest = views.slice(8);
    return html`<div class="views row wrap gap-8" data-kit="SavedViews">
      <${U.SegmentedControl} label=${t("views.label")} value=${active} onPick=${onPick} items=${main.map((v) => ({ value: v.id, label: v.count != null ? `${v.name} (${KIT.util.nf(v.count, 0)})` : v.name }))} />
      ${rest.length > 0 && html`<${MenuButton} label=${t("views.more")} size="sm" items=${rest.map((v) => ({ label: v.name, onClick: () => onPick && onPick(v.id) }))} />`}
      ${onDelete && active && !(views.find((v) => v.id === active) || {}).system && html`<${IconButton} icon="trash" size="sm" label=${t("views.delete", { name: (views.find((v) => v.id === active) || {}).name || "" })} onClick=${() => onDelete(active)} />`}
      ${onSave && html`<${Button} size="sm" kind="ghost" icon="bookmark" onClick=${() => setSaving(true)}>${t("views.save")}<//>`}
      <${Dialog} open=${saving} size="s" title=${t("views.save")} onClose=${() => setSaving(false)}
        footer=${html`<${Button} onClick=${() => setSaving(false)}>${t("confirm.cancel")}<//><${Button} kind="primary" onClick=${() => { setSaving(false); onSave && onSave(name); setName(""); }}>${t("views.save")}<//>`}>
        <${U.Field} id=${nid} label=${t("views.name")}><input id=${nid} class="input" value=${name} onInput=${(e) => setName(e.currentTarget.value)} /><//>
      <//>
    </div>`;
  }

  /* ---------------- ReorderList ---------------- */
  // Order items by keyboard (Space lifts, arrows move, Space drops, Escape cancels) or with the menu
  // alternative (Up · Down · To top); the move is announced. onMove(from, to).
  function ReorderList({ items = [], onMove, render, label, nameOf }) {
    const [lifted, setLifted] = useState(-1);
    const [msg, setMsg] = useState("");
    const start = useRef(-1);
    const refs = useRef([]);
    const name = (it) => (nameOf ? nameOf(it) : textOf(it && (it.label || it.name)) || "");
    const move = (from, to) => {
      if (to < 0 || to >= items.length || from === to) return;
      onMove && onMove(from, to);
      setMsg(t("reorder.moved", { name: name(items[from]), n: to + 1, total: items.length }));
      return to;
    };
    const key = (e, i) => {
      if (e.key === " ") {
        e.preventDefault();
        if (lifted < 0) { setLifted(i); start.current = i; setMsg(t("reorder.lifted", { name: name(items[i]) })); }
        else { setLifted(-1); }
      } else if (lifted >= 0 && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const to = move(lifted, lifted + (e.key === "ArrowUp" ? -1 : 1));
        if (to != null) { setLifted(to); setTimeout(() => refs.current[to] && refs.current[to].focus(), 0); }
      } else if (e.key === "Escape" && lifted >= 0) {
        e.preventDefault();
        if (start.current !== lifted) move(lifted, start.current);
        setLifted(-1);
      }
    };
    return html`<div class="reorder" data-kit="ReorderList"><ol class="ro-l" aria-label=${label}>${items.map((it, i) => html`<li key=${it.id != null ? it.id : i} class=${cx("ro-i", lifted === i && "lifted")}>
      <button type="button" class="btn ghost icon sm ro-h" ref=${(el) => (refs.current[i] = el)} aria-label=${t("reorder.handle", { name: name(it) })} aria-pressed=${lifted === i ? "true" : "false"} onKeyDown=${(e) => key(e, i)} onClick=${() => setLifted(lifted === i ? -1 : i)}><${Icon} n="grip" /></button>
      <span class="grow minw0">${render ? render(it, i) : name(it)}</span>
      <${MenuButton} icon="more" size="sm" object=${name(it)} items=${[
        { label: t("reorder.up"), unavailable: i === 0 ? " " : undefined, onClick: () => move(i, i - 1) },
        { label: t("reorder.down"), unavailable: i === items.length - 1 ? " " : undefined, onClick: () => move(i, i + 1) },
        { label: t("reorder.top"), unavailable: i === 0 ? " " : undefined, onClick: () => move(i, 0) },
      ]} /></li>`)}</ol>
      <span class="sr-only" role="status" aria-live="polite">${msg}</span></div>`;
  }

  /* ---------------- SettingsLayout ---------------- */
  // Settings pages: a scroll-spy nav of the groups (links), an optional search that filters rows, and the
  // groups as sections. groups: [{ id, label }]; children: the sections (id = the group id).
  function SettingsLayout({ groups = [], search, onSearch, children }) {
    const [cur, setCur] = useState(groups[0] && groups[0].id);
    useEffect(() => {
      const root = document.getElementById("kit-content");
      let io;
      try {
        io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setCur(v.target.id); }, { root, rootMargin: "0px 0px -60% 0px" });
        groups.forEach((g) => { const el = document.getElementById(g.id); el && io.observe(el); });
      } catch (e) { /* no observer */ }
      return () => io && io.disconnect();
    }, [groups.map((g) => g.id).join("|")]);
    return html`<div class="settings" data-kit="SettingsLayout">
      <nav class="set-nav" aria-label=${t("settings.groups")}>
        ${search != null && html`<input class="input" type="search" aria-label=${t("settings.search")} placeholder=${t("settings.search")} value=${search} onInput=${(e) => onSearch && onSearch(e.currentTarget.value)} />`}
        ${groups.map((g) => html`<a key=${g.id} href=${"#" + g.id} aria-current=${cur === g.id ? "true" : undefined}
          onClick=${(e) => { e.preventDefault(); const el = document.getElementById(g.id); el && el.scrollIntoView({ block: "start" }); setCur(g.id); }}>${g.label}</a>`)}
      </nav>
      <div class="set-body">${children}</div>
    </div>`;
  }
  // One setting: label and hint on the left, the control on the right; "changed" marks a non-default value.
  function SettingRow({ label, hint, changed, onReset, children, id }) {
    return html`<div class="set-row" id=${id} data-kit="SettingRow">
      <div class="set-l"><span class="t-label">${label}${changed && html` <span class="pill info">${t("settings.changed")}</span>`}</span>${hint && html`<span class="t-meta">${hint}</span>`}
        ${changed && onReset && html`<button type="button" class="btn link sm" onClick=${onReset}>${t("settings.reset")}</button>`}</div>
      <div class="set-c">${children}</div>
    </div>`;
  }

  Object.assign(KIT.ui, { DataTable, Table, ShortcutLayer, FilterBar, FilterRail, FilterTray, BulkBar, SavedViews, ReorderList, SettingsLayout, SettingRow });
})();
