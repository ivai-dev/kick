// ui-form.js — KIT.ui, part 2: fields and choice controls. Field (spans, answer widths, prefix and
// suffix), NumberField, Combobox (diacritic-insensitive, on the library popup), DateField (date ·
// memorable · month, calendar in a Popover), PeriodPicker, CheckboxGroup, ChoiceGroup (cards · chips ·
// segmented · list), SegmentedControl, ToggleChip, FilterChip, DisclosureChip, Switch, FileDrop. Pure logic
// (folding, matching, dates, keyboard) comes from js/logic.js. Every word goes through KIT.t. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useState, useEffect, useRef, useMemo, useLayoutEffect } = hooks;
  const { cx } = KIT.util;
  const L = KIT.logic;
  const U = KIT.ui;
  const { Icon, IconButton, Popover } = U;
  const { useUid, useOverlayEntry } = U._;
  const t = (k, v) => KIT.t(k, v);
  const overlays = KIT.overlays;

  /* ---------------- Field ---------------- */
  // A labelled field; children is the control, whose id must equal `id`. span 1–6 (in a .fgrid), width by
  // the expected answer (num3 · money · date · phone · tax · id · commune · name · full), prefix/suffix on the
  // control's centre line, optional "(optional)", hint and error tied to the control by aria-describedby.
  function Field({ id, label, req, optional, hint, err, span, width, prefix, suffix, children, group, cls }) {
    const hintId = hint ? id + "-hint" : null;
    const errId = err ? id + "-err" : null;
    const desc = [errId, hintId].filter(Boolean).join(" ") || undefined;
    let control = [].concat(children).filter((c) => c != null && c !== false);
    if (control.length === 1 && control[0] && control[0].props && (control[0].props.id === id || !control[0].props.id) && typeof control[0].type === "string") {
      const c = control[0];
      control = [preact.cloneElement(c, {
        "aria-describedby": c.props["aria-describedby"] || desc,
        "aria-invalid": c.props["aria-invalid"] != null ? c.props["aria-invalid"] : err ? "true" : undefined,
      })];
    }
    if (prefix || suffix) {
      control = html`<div class="affix" aria-invalid=${err ? "true" : undefined}>${prefix && html`<span class="pfx">${prefix}</span>`}${control}${suffix && html`<span class="sfx">${suffix}</span>`}</div>`;
    }
    const lab = html`${label}${req && html`<span class="req" aria-hidden="true">*</span>`}${optional && html` <span class="opt">${t("field.optional")}</span>`}`;
    const hintEl = hint && html`<span class="hint" id=${hintId}>${hint}</span>`;
    const errEl = err && html`<span class="err" id=${errId}><${Icon} n="alert" s=${14} />${err}</span>`;
    const klass = cx("field", span && "span-" + span, cls);
    if (group) {
      return html`<fieldset class=${klass} data-w=${width} data-kit="Field" aria-describedby=${desc}><legend>${lab}</legend>${hintEl}${control}${errEl}</fieldset>`;
    }
    return html`<div class=${klass} data-w=${width} data-kit="Field"><label for=${id}>${lab}</label>${hintEl}${control}${errEl}</div>`;
  }

  /* ---------------- NumberField ---------------- */
  // Small counts with a unit: text input with inputmode numeric, ↑/↓ step, optional −/+ buttons.
  function NumberField({ id, value, onChange, min, max, step = 1, suffix, stepper, placeholder, ...rest }) {
    const clamp = (n) => Math.min(max == null ? Infinity : max, Math.max(min == null ? -Infinity : min, n));
    const num = value === "" || value == null ? null : Number(value);
    const bump = (d) => onChange && onChange(clamp((num == null ? (min != null ? min : 0) : num) + d * step));
    const key = (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); bump(1); }
      if (e.key === "ArrowDown") { e.preventDefault(); bump(-1); }
    };
    const input = html`<input id=${id} class="input num" type="text" inputmode="numeric" autocomplete="off" value=${value == null ? "" : value}
      placeholder=${placeholder} onKeyDown=${key} onInput=${(e) => {
        const raw = e.currentTarget.value.replace(/[^\d-]/g, "");
        onChange && onChange(raw === "" ? "" : clamp(Number(raw)));
      }} ...${rest} />`;
    const box = suffix ? html`<div class="affix">${input}<span class="sfx">${suffix}</span></div>` : input;
    if (!stepper) return html`<span class="numf" data-kit="NumberField">${box}</span>`;
    return html`<span class="numf numf-step" data-kit="NumberField">
      <${IconButton} icon="minus" kind="secondary" label=${t("num.dec")} disabled=${num != null && min != null && num <= min} onClick=${() => bump(-1)} />
      ${box}
      <${IconButton} icon="plus" kind="secondary" label=${t("num.inc")} disabled=${num != null && max != null && num >= max} onClick=${() => bump(1)} />
    </span>`;
  }

  /* ---------------- Combobox ---------------- */
  // APG combobox with list autocomplete. options: [{ value, label, group, count, media, disabled }].
  // Matching folds diacritics ("hoa my" finds "Xã Hòa Mỹ"): prefix matches first, then word starts, then
  // substrings. ↓ opens, arrows move, Enter picks, Escape closes then clears. multiple renders FilterChips.
  function Combobox({ id, options = [], value, onChange, multiple, max, placeholder, emptyText, recent, renderOption, groups, disabled, invalid, ...rest }) {
    const cid = useUid("combo");
    const inputId = id || cid + "-input";
    const listId = cid + "-list";
    const wrapId = cid + "-wrap";
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(null); // null: not typing (single mode shows the selected label)
    const [active, setActive] = useState(-1);
    const inputRef = useRef(null);
    const wrapRef = useRef(null);
    const values = multiple ? [].concat(value || []) : value == null || value === "" ? [] : [value];
    const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
    const q = query || "";
    const shown = useMemo(() => {
      let list = L.matchOptions(q, options);
      if (multiple) list = list.filter((o) => !values.includes(o.value));
      if (!q && recent && recent.length) {
        const rec = recent.map((v) => byValue.get(v)).filter((o) => o && !(multiple && values.includes(o.value)));
        list = rec.map((o) => ({ ...o, group: t("combo.recent"), _recent: true })).concat(list.filter((o) => !recent.includes(o.value)));
      }
      return list;
    }, [q, options, values.join("|"), recent]);
    const full = multiple && max != null && values.length >= max;
    useOverlayEntry(open, cid, () => setOpen(false), false);
    useEffect(() => {
      if (!open) return undefined;
      const down = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target) && !e.composedPath().some((x) => x && x.id === listId)) close(); };
      document.addEventListener("mousedown", down);
      return () => document.removeEventListener("mousedown", down);
    }, [open]);
    useEffect(() => {
      if (!open || active < 0) return;
      const el = document.getElementById(listId + "-o" + active);
      el && el.scrollIntoView && el.scrollIntoView({ block: "nearest" });
    }, [active, open]);
    const close = () => { setOpen(false); setActive(-1); if (!multiple) setQuery(null); };
    const pick = (o) => {
      if (!o || o.disabled) return;
      if (multiple) {
        if (full) return;
        onChange && onChange([...values, o.value]);
        setQuery("");
        setActive(-1);
      } else {
        onChange && onChange(o.value);
        close();
      }
      inputRef.current && inputRef.current.focus();
    };
    const remove = (v) => onChange && onChange(values.filter((x) => x !== v));
    const move = (d) => {
      if (!open) { setOpen(true); setActive(d > 0 ? L.nextIndex(undefined, 1, shown.length, (i) => shown[i].disabled) : L.nextIndex(undefined, -1, shown.length, (i) => shown[i].disabled)); return; }
      setActive(L.nextIndex(active < 0 ? undefined : active, d, shown.length, (i) => shown[i].disabled));
    };
    const key = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { if (open && active >= 0) { e.preventDefault(); pick(shown[active]); } }
      else if (e.key === "Escape") {
        if (open && overlays.isTop(cid)) { e.preventDefault(); e.stopPropagation(); close(); }
        else if (!open && (q || values.length) && !multiple) { e.preventDefault(); e.stopPropagation(); setQuery(null); onChange && onChange(null); }
        else if (!open && q) { e.preventDefault(); e.stopPropagation(); setQuery(""); }
      } else if (e.key === "Backspace" && multiple && !q && values.length) remove(values[values.length - 1]);
      else if (e.key === "Tab") close();
    };
    const sel = !multiple && values.length ? byValue.get(values[0]) : null;
    const text = query != null ? query : sel ? sel.label : "";
    let lastGroup = null;
    const opts = shown.map((o, i) => {
      const head = (groups || o._recent) && o.group && o.group !== lastGroup ? html`<div class="combo-g" role="presentation" key=${"g" + i}>${(lastGroup = o.group)}</div>` : null;
      return html`${head}<div id=${listId + "-o" + i} key=${String(o.value)} role="option" class="combo-o" aria-selected=${i === active ? "true" : "false"}
        aria-disabled=${o.disabled ? "true" : undefined} onMouseDown=${(e) => e.preventDefault()} onClick=${() => pick(o)} onMouseMove=${() => active !== i && setActive(i)}>
        ${renderOption ? renderOption(o) : html`${o.media}<span class="combo-l">${o.label}</span>${o.count != null && html`<span class="combo-c t-meta tnum">${KIT.util.nf(o.count, 0)}</span>`}`}</div>`;
    });
    return html`<div class="combo" ref=${wrapRef} data-kit="Combobox">
      ${multiple && values.length > 0 && html`<div class="combo-chips">${values.map((v) => {
        const o = byValue.get(v);
        return html`<${FilterChip} key=${String(v)} label=${o ? o.label : String(v)} onRemove=${() => remove(v)} removeLabel=${t("combo.remove", { label: o ? o.label : v })} />`;
      })}</div>`}
      <div class="combo-box" id=${wrapId}>
        <input ref=${inputRef} id=${inputId} class="input" role="combobox" aria-expanded=${open ? "true" : "false"} aria-controls=${listId}
          aria-autocomplete="list" aria-activedescendant=${open && active >= 0 ? listId + "-o" + active : undefined} autocomplete="off"
          aria-invalid=${invalid ? "true" : undefined} disabled=${disabled || full} placeholder=${placeholder} value=${text} ...${rest}
          onInput=${(e) => { setQuery(e.currentTarget.value); setOpen(true); setActive(-1); }}
          onFocus=${() => { if (!multiple && sel) setQuery(null); }} onClick=${() => setOpen(true)} onKeyDown=${key} />
        <${Icon} n="down" cls="combo-chev" />
      </div>
      <wa-popup anchor=${wrapId} placement="bottom-start" distance="4" flip="" shift="" sync="width" active=${open ? true : undefined} class="combo-pop">
        <div class="combo-list" role="listbox" id=${listId} aria-label=${placeholder || t("filter.search")}>
          ${opts.length ? opts : html`<div class="combo-none t-meta" role="presentation">${emptyText || t("combo.empty", { q })}</div>`}
        </div>
        <span class="sr-only" role="status" aria-live="polite">${open ? t("combo.count", { n: shown.length }) : ""}</span>
      </wa-popup>
    </div>`;
  }

  /* ---------------- DateField ---------------- */
  const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  // A month grid with APG date-picker keys: arrows (day, week), PageUp/PageDown (month), Home/End (week),
  // Enter or Space picks.
  function Calendar({ value, min, max, onPick, today }) {
    const start = value || today || todayIso();
    const [cur, setCur] = useState(start);
    const ref = useRef(null);
    const y = +cur.slice(0, 4), m = +cur.slice(5, 7);
    const weeks = L.monthGrid(y, m);
    const days = t("date.weekdays").split(",");
    const out = (iso) => (min && iso < min) || (max && iso > max);
    const shiftMonth = (iso, n) => {
      const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1 + n, 1));
      const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(+iso.slice(8, 10), last)).padStart(2, "0")}`;
    };
    useEffect(() => {
      const el = ref.current && ref.current.querySelector(`[data-iso="${cur}"]`);
      el && el.focus({ preventScroll: true });
    }, [cur]);
    const key = (e) => {
      const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      let next = null;
      if (map[e.key] != null) next = L.addDays(cur, map[e.key]);
      else if (e.key === "PageUp") next = shiftMonth(cur, -1);
      else if (e.key === "PageDown") next = shiftMonth(cur, 1);
      else if (e.key === "Home") next = L.addDays(cur, -((new Date(cur + "T00:00:00Z").getUTCDay() + 6) % 7));
      else if (e.key === "End") next = L.addDays(cur, 6 - ((new Date(cur + "T00:00:00Z").getUTCDay() + 6) % 7));
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!out(cur)) onPick(cur); return; }
      if (next) { e.preventDefault(); setCur(next); }
    };
    return html`<div class="cal" ref=${ref} data-kit="Calendar">
      <div class="cal-h"><${IconButton} icon="left" size="sm" label=${t("date.prevMonth")} onClick=${() => setCur(shiftMonth(cur, -1))} />
        <b class="t-label grow ta-c" aria-live="polite">${t("period.month", { n: String(m).padStart(2, "0"), y })}</b>
        <${IconButton} icon="right" size="sm" label=${t("date.nextMonth")} onClick=${() => setCur(shiftMonth(cur, 1))} /></div>
      <table class="cal-g" role="grid" onKeyDown=${key}>
        <thead><tr>${days.map((d) => html`<th key=${d} scope="col" abbr=${d}>${d}</th>`)}</tr></thead>
        <tbody>${weeks.map((w, wi) => html`<tr key=${wi}>${w.map((iso, di) => (iso
          ? html`<td key=${di}><button type="button" class="cal-d" data-iso=${iso} tabindex=${iso === cur ? 0 : -1}
              aria-selected=${iso === value ? "true" : "false"} aria-current=${iso === (today || todayIso()) ? "date" : undefined}
              aria-disabled=${out(iso) ? "true" : undefined} aria-label=${L.formatDate(iso)}
              onClick=${() => { if (!out(iso)) onPick(iso); }}>${+iso.slice(8)}</button></td>`
          : html`<td key=${di}></td>`))}</tr>`)}</tbody>
      </table>
    </div>`;
  }

  // DateField: variant "date" (text dd/mm/yyyy, calendar button, preset chips), "memorable" (Day · Month ·
  // Year fields; birth dates) or "month" (month and year selects). value: ISO ("yyyy-mm-dd"; "yyyy-mm" for
  // month). onChange(iso or null). Invalid and out-of-range input says so under the control.
  function DateField({ id, variant = "date", value, onChange, min, max, presets, today, years, invalid, ...rest }) {
    const fid = useUid("date");
    const inputId = id || fid;
    const [text, setText] = useState(value ? L.formatDate(value) : "");
    const [err, setErr] = useState(null);
    const [open, setOpen] = useState(false);
    const [parts, setParts] = useState(() => {
      const [y0, m0, d0] = variant === "memorable" && value ? value.split("-") : ["", "", ""];
      return { d: d0 ? String(+d0) : "", m: m0 ? String(+m0) : "", y: y0 || "" };
    });
    useEffect(() => { if (variant === "date") setText(value ? L.formatDate(value) : ""); }, [value]);
    const check = (iso) => {
      if (!iso) return t("date.invalid", { example: L.formatDate(L.addDays(today || todayIso(), 30)) });
      if ((min && iso < min) || (max && iso > max)) return t("date.range", { min: L.formatDate(min || iso), max: L.formatDate(max || iso) });
      return null;
    };
    if (variant === "memorable") {
      const set = (k, v) => {
        const p = { ...parts, [k]: v.replace(/\D/g, "") };
        setParts(p);
        if (p.d && p.m && p.y.length === 4) {
          const iso = L.parseDate(`${p.d}/${p.m}/${p.y}`);
          const e = check(iso);
          setErr(e);
          onChange && onChange(e ? null : iso);
        }
      };
      return html`<div class="datef memo" data-kit="DateField">
        <div class="field"><label for=${inputId + "-d"}>${t("date.day")}</label><input id=${inputId + "-d"} class="input dm-2" inputmode="numeric" maxlength="2" value=${parts.d} onInput=${(e) => set("d", e.currentTarget.value)} /></div>
        <div class="field"><label for=${inputId + "-m"}>${t("date.month")}</label><input id=${inputId + "-m"} class="input dm-2" inputmode="numeric" maxlength="2" value=${parts.m} onInput=${(e) => set("m", e.currentTarget.value)} /></div>
        <div class="field"><label for=${inputId + "-y"}>${t("date.year")}</label><input id=${inputId + "-y"} class="input dm-4" inputmode="numeric" maxlength="4" value=${parts.y} onInput=${(e) => set("y", e.currentTarget.value)} /></div>
        ${err && html`<span class="err dm-err" role="alert"><${Icon} n="alert" s=${14} />${err}</span>`}
      </div>`;
    }
    if (variant === "month") {
      const [yv, mv] = value ? value.split("-") : ["", ""];
      const now = +(today || todayIso()).slice(0, 4);
      const ys = years || Array.from({ length: 41 }, (_, i) => now - 30 + i).reverse();
      const set = (yy, mm) => onChange && onChange(yy && mm ? `${yy}-${mm}` : null);
      return html`<div class="datef month" data-kit="DateField">
        <select id=${inputId} class="select" aria-label=${t("date.month")} value=${mv || ""} onChange=${(e) => set(yv, e.currentTarget.value)}>
          <option value="">${t("date.month")}</option>${Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((x) => html`<option key=${x} value=${x}>${x}</option>`)}</select>
        <select class="select" aria-label=${t("date.year")} value=${yv || ""} onChange=${(e) => set(e.currentTarget.value, mv)}>
          <option value="">${t("date.year")}</option>${ys.map((x) => html`<option key=${x} value=${String(x)}>${x}</option>`)}</select>
      </div>`;
    }
    const commit = (raw) => {
      if (!raw.trim()) { setErr(null); onChange && onChange(null); return; }
      const iso = L.parseDate(raw);
      const e = check(iso);
      setErr(e);
      if (!e) { setText(L.formatDate(iso)); onChange && onChange(iso); }
    };
    const btnId = inputId + "-cal";
    const errId = inputId + "-derr";
    return html`<div class="datef" data-kit="DateField">
      <div class="affix" aria-invalid=${err || invalid ? "true" : undefined}>
        <input id=${inputId} class="input" inputmode="numeric" autocomplete="off" placeholder="dd/mm/yyyy" value=${text}
          aria-invalid=${err || invalid ? "true" : undefined} aria-describedby=${err ? errId : rest["aria-describedby"]}
          onInput=${(e) => setText(e.currentTarget.value)} onBlur=${(e) => commit(e.currentTarget.value)}
          onKeyDown=${(e) => { if (e.key === "Enter") commit(e.currentTarget.value); }} />
        <${IconButton} id=${btnId} icon="calendar" size="sm" label=${t("date.pick")} aria-haspopup="dialog" onClick=${() => setOpen(!open)} />
      </div>
      ${presets && presets.length > 0 && html`<div class="row wrap gap-8 datef-pre">${presets.map((p) => {
        const iso = p.value || L.addDays(today || todayIso(), p.days || 0);
        return html`<button type="button" key=${p.label} class="chip" aria-pressed=${value === iso ? "true" : "false"} onClick=${() => { setErr(null); onChange && onChange(iso); }}>${p.label || t("date.presetDays", { n: p.days })}</button>`;
      })}</div>`}
      ${err && html`<span class="err" id=${errId} role="alert"><${Icon} n="alert" s=${14} />${err}</span>`}
      <${Popover} open=${open} anchor=${btnId} title=${t("date.pick")} onClose=${() => setOpen(false)} placement="bottom-end">
        ${open && html`<${Calendar} value=${value} min=${min} max=${max} today=${today} onPick=${(iso) => { setErr(null); onChange && onChange(iso); setOpen(false); document.getElementById(inputId) && document.getElementById(inputId).focus(); }} />`}
      <//>
    </div>`;
  }

  /* ---------------- PeriodPicker ---------------- */
  // Reporting period. granularity: day (a date range) · week · month · quarter · year. value: { from, to } for
  // days, "2026-W42", "2026-10", "2026-Q3", "2026". The trigger shows the period in words; the Popover holds a
  // granularity switch, the picker, presets and "Apply". onChange(value, granularity).
  function PeriodPicker({ granularity = "month", value, onChange, presets, min, max, compare, grains, today, label }) {
    const pid = useUid("period");
    const [open, setOpen] = useState(false);
    const [g, setG] = useState(granularity);
    const [v, setV] = useState(value);
    useEffect(() => { if (open) { setG(granularity); setV(value); } }, [open]);
    const words = L.periodLabel(value, granularity, t) + (compare === "prev" ? " " + t("period.compare.prev") : compare === "yoy" ? " " + t("period.compare.yoy") : "");
    const now = today || todayIso();
    const y = +((typeof v === "string" && v.slice(0, 4)) || now.slice(0, 4));
    const yearSel = (yy, set) => html`<select class="select sm" aria-label=${t("date.year")} value=${String(yy)} onChange=${(e) => set(+e.currentTarget.value)}>
      ${Array.from({ length: 8 }, (_, i) => +now.slice(0, 4) - 6 + i).reverse().map((x) => html`<option key=${x} value=${String(x)}>${x}</option>`)}</select>`;
    let body;
    if (g === "month") {
      body = html`${yearSel(y, (yy) => setV(`${yy}-${(typeof v === "string" && v.slice(5, 7)) || "01"}`))}<div class="per-grid">${Array.from({ length: 12 }, (_, i) => {
        const val = `${y}-${String(i + 1).padStart(2, "0")}`;
        return html`<button type="button" key=${val} class="chip" aria-pressed=${v === val ? "true" : "false"} onClick=${() => setV(val)}>${String(i + 1).padStart(2, "0")}</button>`;
      })}</div>`;
    } else if (g === "quarter") {
      body = html`${yearSel(y, (yy) => setV(`${yy}-${(typeof v === "string" && v.slice(5)) || "Q1"}`))}<div class="per-grid q">${[1, 2, 3, 4].map((n) => html`<button type="button" key=${n} class="chip" aria-pressed=${v === `${y}-Q${n}` ? "true" : "false"} onClick=${() => setV(`${y}-Q${n}`)}>${L.periodLabel(`${y}-Q${n}`, "quarter", t)}</button>`)}</div>`;
    } else if (g === "year") {
      body = html`<div class="per-grid">${Array.from({ length: 6 }, (_, i) => +now.slice(0, 4) - 5 + i).map((yy) => html`<button type="button" key=${yy} class="chip" aria-pressed=${v === String(yy) ? "true" : "false"} onClick=${() => setV(String(yy))}>${yy}</button>`)}</div>`;
    } else if (g === "week") {
      const wk = (typeof v === "string" && v.match(/W(\d+)/) && +v.match(/W(\d+)/)[1]) || 1;
      body = html`${yearSel(y, (yy) => setV(`${yy}-W${wk}`))}<${NumberField} id=${pid + "-wk"} value=${wk} min=${1} max=${53} stepper onChange=${(n) => setV(`${y}-W${n || 1}`)} aria-label=${t("gran.week")} />`;
    } else {
      const r = v && typeof v === "object" ? v : { from: L.addDays(now, -29), to: now };
      body = html`<div class="fgrid"><div class="field span-3"><label for=${pid + "-from"}>${t("period.from")}</label><${DateField} id=${pid + "-from"} value=${r.from} min=${min} max=${r.to} today=${now} onChange=${(iso) => iso && setV({ ...r, from: iso })} /></div>
        <div class="field span-3"><label for=${pid + "-to"}>${t("period.to")}</label><${DateField} id=${pid + "-to"} value=${r.to} min=${r.from} max=${max} today=${now} onChange=${(iso) => iso && setV({ ...r, to: iso })} /></div></div>`;
    }
    const gs = grains || ["day", "week", "month", "quarter", "year"];
    return html`<span class="period" data-kit="PeriodPicker">
      <button id=${pid} type="button" class="chip filter" aria-haspopup="dialog" aria-expanded=${open ? "true" : "false"} onClick=${() => setOpen(!open)}>
        <${Icon} n="calendar" />${label && html`<span class="t-meta">${label}:</span>`}<span>${words}</span><${Icon} n="down" cls="chev" /></button>
      <${Popover} open=${open} anchor=${pid} title=${t("period.granularity")} onClose=${() => setOpen(false)}
        footer=${html`<${U.Button} kind="primary" size="sm" onClick=${() => { setOpen(false); onChange && onChange(v, g); }}>${t("period.apply")}<//>`}>
        ${gs.length > 1 && html`<${SegmentedControl} label=${t("period.granularity")} size="sm" value=${g} onPick=${(x) => { setG(x); setV(null); }} items=${gs.map((x) => [x, t("gran." + x)])} />`}
        ${presets && presets.length > 0 && html`<div class="row wrap gap-8">${presets.map((p) => html`<button type="button" key=${p.label} class="chip" onClick=${() => { setOpen(false); onChange && onChange(p.value, p.granularity || g); }}>${p.label}</button>`)}</div>`}
        ${body}
      <//>
    </span>`;
  }

  /* ---------------- Choice ---------------- */
  // Roving tabindex radio group shared by ChoiceGroup and SegmentedControl: one Tab stop, arrows move and
  // select, Space selects.
  function useRadio(items, value, onPick) {
    const refs = useRef([]);
    const idx = Math.max(0, items.findIndex((x) => x.value === value));
    const key = (e, i) => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); onPick(items[i].value); return; }
      if (map[e.key] == null && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const off = (j) => !!items[j].disabled;
      const j = e.key === "Home" ? L.nextIndex(undefined, 1, items.length, off) : e.key === "End" ? L.nextIndex(undefined, -1, items.length, off) : L.nextIndex(i, map[e.key], items.length, off);
      if (j < 0) return;
      onPick(items[j].value);
      refs.current[j] && refs.current[j].focus();
    };
    const props = (x, i) => ({
      role: "radio", "aria-checked": x.value === value ? "true" : "false", tabindex: i === idx ? 0 : -1,
      "aria-disabled": x.disabled ? "true" : undefined, ref: (el) => (refs.current[i] = el),
      onKeyDown: (e) => key(e, i), onClick: () => !x.disabled && onPick(x.value),
    });
    return props;
  }
  const norm = (items) => (items || []).map((x) => (Array.isArray(x) ? { value: x[0], label: x[1], icon: x[2] } : x));

  // Switch the view of the same content ("List · Calendar", "Chart · Table"). items: [{ value, label, icon }]
  // or [[value, label, icon]].
  function SegmentedControl({ items, value, onPick, label, size, iconsOnly, cls }) {
    const list = norm(items);
    const props = useRadio(list, value, (v) => onPick && onPick(v));
    return html`<div class=${cx("segc", size, cls)} role="radiogroup" aria-label=${label} data-kit="SegmentedControl">
      ${list.map((x, i) => html`<button type="button" key=${String(x.value)} class="segc-o" aria-label=${iconsOnly ? x.label : undefined} ...${props(x, i)}>
        ${x.icon && html`<${Icon} n=${x.icon} s=${16} />`}${!iconsOnly && html`<span class="segc-l">${x.label}</span>`}</button>`)}
    </div>`;
  }

  // One of 2–12. variant: cards (descriptions or pictures; touch, kiosk) · chips (short labels, comfortable) ·
  // segmented (2–4 short labels, compact) · list (radios in columns). Default from the density.
  function ChoiceGroup({ variant, options, value, onChange, legend, columns, name, hint, err }) {
    const A = useApp();
    const gid = useUid("choice");
    const list = norm(options);
    const d = (A && A.density) || "compact";
    const short = list.every((o) => String(o.label).length <= 14 && !o.desc);
    const v = variant || (d === "touch" || d === "kiosk" ? "cards" : d === "comfortable" ? (short ? "chips" : "list") : list.length <= 4 && short ? "segmented" : "list");
    const props = useRadio(list, value, (x) => onChange && onChange(x));
    const style = columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined;
    return html`<div class="choice" data-kit="ChoiceGroup" data-variant=${v}>
      ${legend && html`<span class="field-l" id=${gid + "-l"}>${legend}</span>`}
      ${hint && html`<span class="hint t-meta">${hint}</span>`}
      <div class=${cx("choice-g", "v-" + v)} role="radiogroup" aria-labelledby=${legend ? gid + "-l" : undefined} aria-label=${legend ? undefined : name} style=${style}>
        ${list.map((o, i) => {
          const did = o.desc ? gid + "-d" + i : undefined;
          if (v === "cards") {
            return html`<div key=${String(o.value)} class="choice-card" aria-describedby=${did} ...${props(o, i)}>
              ${o.media && html`<span class="cc-media">${o.media}</span>`}<span class="cc-dot" aria-hidden="true"></span>
              <span class="cc-t">${o.label}</span>${o.desc && html`<span class="cc-d t-meta" id=${did}>${o.desc}</span>`}</div>`;
          }
          if (v === "chips") return html`<div key=${String(o.value)} class="chip" ...${props(o, i)}>${o.value === value && html`<${Icon} n="check" />`}${o.label}</div>`;
          if (v === "segmented") return html`<div key=${String(o.value)} class="segc-o" ...${props(o, i)}>${o.label}</div>`;
          return html`<div key=${String(o.value)} class="choice-li" aria-describedby=${did} ...${props(o, i)}><span class="cl-dot" aria-hidden="true"></span><span>${o.label}${o.desc && html`<span class="t-meta" id=${did}> · ${o.desc}</span>`}</span></div>`;
        })}
      </div>
      ${err && html`<span class="err"><${Icon} n="alert" s=${14} />${err}</span>`}
    </div>`;
  }

  // Many independent on/off options (skills, "No degree needed"): aria-pressed with a check icon when on.
  function ToggleChip({ pressed, onToggle, label, icon, id }) {
    return html`<button type="button" id=${id} class="chip" aria-pressed=${pressed ? "true" : "false"} data-kit="ToggleChip" onClick=${() => onToggle && onToggle(!pressed)}>
      ${pressed ? html`<${Icon} n="check" />` : icon && html`<${Icon} n=${icon} />`}${label}</button>`;
  }
  // An applied filter to remove: "Salary: 7–10 million ×", named "Remove filter …".
  function FilterChip({ label, onRemove, removeLabel }) {
    return html`<button type="button" class="chip filter-on" aria-label=${removeLabel || t("filter.remove", { label })} data-kit="FilterChip" onClick=${onRemove}>
      <span>${label}</span><${Icon} n="x" /></button>`;
  }
  // Opens a filter popover or panel and shows its value. aria-expanded and aria-controls only.
  function DisclosureChip({ label, value, expanded, controls, onClick, id, count }) {
    return html`<button type="button" id=${id} class=${cx("chip filter", value && "has-value")} aria-expanded=${expanded ? "true" : "false"} aria-controls=${controls}
      aria-haspopup="dialog" data-kit="DisclosureChip" onClick=${onClick}>
      <span>${label}${value ? ": " : ""}${value && html`<b class="dc-v">${value}</b>`}</span>${count > 0 && html`<span class="count info">${count}</span>`}<${Icon} n="down" cls="chev" /></button>`;
  }
  // A setting that applies at once: role="switch". unavailable: a reason (focusable, read, nothing changes).
  function Switch({ checked, onChange, label, desc, unavailable, id }) {
    const sid = useUid("sw");
    const bid = id || sid;
    return html`<div class="switch" data-kit="Switch">
      <button type="button" id=${bid} role="switch" class="sw" aria-checked=${checked ? "true" : "false"} aria-disabled=${unavailable ? "true" : undefined}
        aria-describedby=${desc || unavailable ? bid + "-d" : undefined} onClick=${() => !unavailable && onChange && onChange(!checked)}><span class="sw-k" aria-hidden="true"></span></button>
      <span class="sw-t"><label for=${bid} class="t-label">${label}</label>${(desc || unavailable) && html`<span id=${bid + "-d"} class="t-meta">${unavailable || desc}</span>`}</span>
    </div>`;
  }

  // Independent options with a tri-state "select all" parent. value: selected values.
  function CheckboxGroup({ legend, options, value = [], onChange, all, name, columns }) {
    const gid = useUid("cbg");
    const parent = useRef(null);
    const list = norm(options);
    const n = list.filter((o) => value.includes(o.value)).length;
    const state = n === 0 ? "none" : n === list.length ? "all" : "some";
    useLayoutEffect(() => { if (parent.current) parent.current.indeterminate = state === "some"; }, [state]);
    const toggle = (v) => onChange && onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    return html`<fieldset class="field cbg" data-kit="CheckboxGroup"><legend>${legend}</legend>
      ${all && html`<label class="check cbg-all"><input ref=${parent} type="checkbox" checked=${state === "all"} aria-checked=${state === "some" ? "mixed" : state === "all" ? "true" : "false"}
        onChange=${() => onChange && onChange(state === "all" ? [] : list.map((o) => o.value))} />${t("check.all")}</label>`}
      <div class="cbg-l" style=${columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
        ${list.map((o, i) => html`<label class="check" key=${String(o.value)}><input type="checkbox" name=${name || gid} id=${gid + "-" + i} checked=${value.includes(o.value)}
          disabled=${o.disabled} onChange=${() => toggle(o.value)} /><span>${o.label}${o.hint && html`<span class="t-meta"> · ${o.hint}</span>`}</span></label>`)}
      </div></fieldset>`;
  }

  /* ---------------- FileDrop ---------------- */
  const fmtSize = (b) => (b >= 1048576 ? KIT.util.nf(b / 1048576, 1) + " MB" : KIT.util.nf(Math.max(1, Math.round(b / 1024)), 0) + " KB");
  // Attach files: types and size stated before choosing, a drop zone on desktop, per-file progress
  // (role="progressbar", simulated over 600 ms) and errors naming the file. files: [{ name, size, error }].
  // onAdd(newFiles, errors); onRemove(file).
  function FileDrop({ accept, maxSize = 10 * 1048576, maxFiles = 5, files = [], onAdd, onRemove, hint, id, label }) {
    const fid = useUid("file");
    const inputRef = useRef(null);
    const [over, setOver] = useState(false);
    const [prog, setProg] = useState({});
    const [errs, setErrs] = useState([]);
    const types = (accept || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const okType = (f) => !types.length || types.some((tp) => (tp.startsWith(".") ? f.name.toLowerCase().endsWith(tp) : tp.endsWith("/*") ? (f.type || "").startsWith(tp.slice(0, -1)) : f.type === tp));
    const take = (list) => {
      const add = [], bad = [];
      for (const f of list) {
        if (files.length + add.length >= maxFiles) { bad.push(t("file.tooMany", { n: maxFiles })); break; }
        if (!okType(f)) bad.push(t("file.badType", { name: f.name }));
        else if (f.size > maxSize) bad.push(t("file.tooBig", { name: f.name, size: fmtSize(maxSize) }));
        else add.push({ name: f.name, size: f.size, type: f.type });
      }
      setErrs(bad);
      if (add.length) {
        const start = Date.now();
        const names = add.map((f) => f.name);
        const tick = () => {
          const p = Math.min(100, Math.round(((Date.now() - start) / 600) * 100));
          setProg((o) => { const n = { ...o }; names.forEach((x) => (n[x] = p)); return n; });
          if (p < 100) setTimeout(tick, 60);
        };
        tick();
        onAdd && onAdd(add, bad);
      } else if (bad.length) onAdd && onAdd([], bad);
    };
    return html`<div class="fdrop" data-kit="FileDrop">
      <div class=${cx("fd-zone", over && "over")} onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)}
        onDrop=${(e) => { e.preventDefault(); setOver(false); take([...e.dataTransfer.files]); }}>
        <${Icon} n="upload" />
        <span class="fd-t"><button type="button" class="btn secondary sm" id=${id || fid} onClick=${() => inputRef.current && inputRef.current.click()}>${label || t("file.choose")}</button>
          <span class="t-meta hide-xs">${t("file.drop")}</span></span>
        <span class="t-meta">${hint || t("file.hint", { size: fmtSize(maxSize) })}</span>
        <input ref=${inputRef} type="file" class="sr-only" tabindex="-1" aria-hidden="true" accept=${accept} multiple=${maxFiles > 1} onChange=${(e) => { take([...e.currentTarget.files]); e.currentTarget.value = ""; }} />
      </div>
      ${errs.length > 0 && html`<div class="fd-errs" role="alert">${errs.map((m, i) => html`<span class="err" key=${i}><${Icon} n="alert" s=${14} />${m}</span>`)}</div>`}
      ${files.length > 0 && html`<ul class="fd-list">${files.map((f) => {
        const p = prog[f.name] == null ? 100 : prog[f.name];
        return html`<li key=${f.name} class="fd-f">
          <${Icon} n="file" /><span class="grow minw0"><span class="clamp1 t-label">${f.name}</span>
            <span class="t-meta">${f.error ? html`<span class="err-t">${f.error}</span>` : p < 100 ? t("file.uploading", { name: "" }).trim() : fmtSize(f.size || 0) + " · " + t("file.done")}</span>
            ${p < 100 && html`<span class="fd-bar" role="progressbar" aria-label=${t("file.uploading", { name: f.name })} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${p}><span style=${{ width: p + "%" }}></span></span>`}</span>
          <${IconButton} icon="trash" size="sm" label=${t("file.remove", { name: f.name })} onClick=${() => onRemove && onRemove(f)} /></li>`;
      })}</ul>`}
    </div>`;
  }

  Object.assign(KIT.ui, {
    Field, NumberField, Combobox, DateField, Calendar, PeriodPicker, CheckboxGroup, ChoiceGroup, SegmentedControl,
    ToggleChip, FilterChip, DisclosureChip, Switch, FileDrop,
  });
})();
