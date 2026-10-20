// charts.js — SVG charts drawn with theme tokens only (KIT.charts): BarChart, LineChart, Donut.
// Each chart measures its container and uses a viewBox equal to its pixel size, so text stays
// at 12 px at every width; x labels are thinned (never overlapped) when the plot is narrow.
// One "nice" scale per chart drives both the axis and the marks. Marks are focusable with a
// roving tabindex (Tab enters, arrow keys move, Escape hides the tooltip); hover and focus show
// the same tooltip. Tones: primary, ok, warn, danger, accent, ink3 (CSS classes tn-*, which set
// --c from the tokens). No entrance animation under reduced motion. Core file.
(function () {
  "use strict";
  const { html, hooks } = KIT;
  const { useState, useRef, useCallback, useEffect } = hooks;
  const { cx, reduced, nf } = KIT.util;
  const { Icon } = KIT.ui;

  const TONES = ["primary", "ok", "warn", "danger", "accent", "ink3"];
  const tn = (t) => "tn-" + (TONES.includes(t) ? t : "primary");
  const withUnit = (v, unit, d) => nf(v, d) + (!unit ? "" : unit === "%" ? "%" : " " + unit);

  // One scale for axis and marks: rounded steps of 1, 2, 2.5 or 5 x 10^k.
  function niceScale(lo, hi, n = 4) {
    if (!(hi > lo)) hi = lo + 1;
    const raw = (hi - lo) / n;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    const min = Math.floor(lo / step + 1e-9) * step, max = Math.ceil(hi / step - 1e-9) * step;
    const ticks = [];
    for (let v = min; v <= max + step / 2; v += step) ticks.push(+v.toFixed(6));
    const dec = step >= 1 && Number.isInteger(step) ? 0 : step >= 0.1 ? (Number.isInteger(step * 10) ? 1 : 2) : 2;
    return { min, max, step, ticks, dec };
  }
  const textW = (s) => String(s).length * 7.2; // 12 px UI font, tabular digits
  // Show every k-th x label, counted back from the last (the latest period is always labelled).
  const thin = (labels, slot) => Math.max(1, Math.ceil((Math.max(...labels.map(textW)) + 8) / Math.max(1, slot)));

  // Callback ref that keeps the element's width in state (ResizeObserver).
  function useWidth(def = 560) {
    const [w, setW] = useState(def);
    const ro = useRef(null);
    const node = useRef(null);
    const ref = useCallback((el) => {
      if (node.current === el) return;
      if (ro.current) {
        ro.current.disconnect();
        ro.current = null;
      }
      node.current = el;
      if (!el) return;
      const measure = () => {
        const x = Math.round(el.getBoundingClientRect().width);
        if (x > 0) setW((o) => (Math.abs(o - x) > 1 ? x : o));
      };
      measure();
      try {
        ro.current = new ResizeObserver(measure);
        ro.current.observe(el);
      } catch (e) {
        /* no ResizeObserver: keep the first width */
      }
    }, []);
    useEffect(() => () => ro.current && ro.current.disconnect(), []);
    return [ref, w];
  }

  // Roving focus and the active mark (hover or focus), shared by every chart.
  function useMarks(n) {
    const [act, setAct] = useState(null);
    const [cur, setCur] = useState(Math.max(0, n - 1));
    const move = (e, i) => {
      const k = e.key;
      let j = null;
      if (k === "ArrowRight" || k === "ArrowDown") j = Math.min(n - 1, i + 1);
      else if (k === "ArrowLeft" || k === "ArrowUp") j = Math.max(0, i - 1);
      else if (k === "Home") j = 0;
      else if (k === "End") j = n - 1;
      else if (k === "Escape") {
        setAct(null);
        return;
      }
      if (j == null) return;
      e.preventDefault();
      setCur(j);
      setAct(j);
      const fig = e.currentTarget.closest("figure");
      const el = fig && fig.querySelector(`[data-i="${j}"]`);
      el && el.focus();
    };
    const props = (i, label, cls = "ch-hit") => ({
      "data-i": i, tabindex: i === Math.min(cur, n - 1) ? 0 : -1, role: "img", "aria-label": label, class: cx(cls, "ch-mark", act === i && "on"),
      onFocus: () => { setCur(i); setAct(i); }, onBlur: () => setAct(null),
      onMouseEnter: () => setAct(i), onMouseLeave: () => setAct(null), onKeyDown: (e) => move(e, i),
    });
    return { act, props };
  }

  function ChartTip({ x, y, w, title, rows }) {
    const left = Math.max(70, Math.min(w - 70, x));
    return html`<div class="ch-tip" aria-hidden="true" style=${{ left: left + "px", top: y + "px" }}>
      <b>${title}</b>${rows.map((r, i) => html`<span class="r" key=${i}>${r.tone && html`<i class=${cx("ch-sw", tn(r.tone))}></i>`}<span class="n">${r.name}</span><span class="v">${r.value}</span></span>`)}
    </div>`;
  }
  function ChartEmpty({ height = 200 }) {
    return html`<div class=${"ch-empty h-" + (height >= 240 ? "lg" : height >= 160 ? "md" : "sm")} role="img" aria-label=${KIT.t("chart.noData")}><${Icon} n="chart" s=${20} /><span>${KIT.t("chart.noData")}</span></div>`;
  }
  function Legend({ items, line }) {
    return html`<div class="ch-legend">${items.map((s) => html`<span key=${s.name}><i class=${cx(line ? "ln" : "ch-sw", tn(s.tone))}></i>${s.name}</span>`)}</div>`;
  }
  const anim = () => (reduced() ? "" : "ch-anim");
  const barPath = (x, y0, wd, h, r) => {
    if (!(h > 0.5)) return "";
    r = Math.min(r, wd / 2, h);
    return `M${x},${y0}V${y0 - h + r}Q${x},${y0 - h} ${x + r},${y0 - h}H${x + wd - r}Q${x + wd},${y0 - h} ${x + wd},${y0 - h + r}V${y0}Z`;
  };
  // Axis frame shared by the cartesian charts: gridlines and y tick labels.
  function Axis({ sc, y, x0, x1, unit }) {
    return html`<g aria-hidden="true">${sc.ticks.map((t) => html`<g key=${t}>
      <line class=${t === sc.min ? "ch-base" : "ch-grid"} x1=${x0} x2=${x1} y1=${Math.round(y(t)) + 0.5} y2=${Math.round(y(t)) + 0.5} />
      <text class="ch-ax" x=${x0 - 8} y=${y(t)} dy="0.34em" text-anchor="end">${nf(t, sc.dec)}${unit === "%" ? "%" : ""}</text></g>`)}</g>`;
  }
  const padLeft = (sc, unit) => Math.max(...sc.ticks.map((t) => textW(nf(t, sc.dec) + (unit === "%" ? "%" : "")))) + 12;
  // refLine: { value, label?, tone?, at?: "start" | "end" } — a dashed target or limit line.
  function RefLine({ refLine, y, x0, x1, unit }) {
    if (!refLine) return null;
    const yy = Math.round(y(refLine.value)) + 0.5;
    return html`<g aria-hidden="true"><line class=${cx("ch-ref", refLine.tone && tn(refLine.tone))} x1=${x0} x2=${x1} y1=${yy} y2=${yy} />
      <text class="ch-ref-l" x=${refLine.at === "end" ? x1 : x0 + 6} y=${yy - 6} text-anchor=${refLine.at === "end" ? "end" : "start"}>${refLine.label || withUnit(refLine.value, unit)}</text></g>`;
  }
  function XLabels({ labels, xs, y, every }) {
    const n = labels.length;
    return html`<g aria-hidden="true">${labels.map((l, i) => ((n - 1 - i) % every === 0 ? html`<text key=${i} class="ch-ax" x=${xs(i)} y=${y} text-anchor="middle">${l}</text>` : null))}</g>`;
  }

  // Vertical columns. data: [{ label, value, tip? }]. highlight: indices drawn at full strength
  // (the rest muted); highlightLast = highlight the latest column.
  function BarChart({ data = [], height = 200, unit = "", highlightLast, highlight, refLine, tone = "primary", label = KIT.t("chart.column"), dec = 1 }) {
    const [ref, w] = useWidth();
    const n = data.length;
    const M = useMarks(n);
    if (!n || data.every((d) => d.value == null)) return html`<${ChartEmpty} height=${height} />`;
    const vals = data.map((d) => d.value || 0);
    const sc = niceScale(0, Math.max(...vals, refLine ? refLine.value : 0));
    const pl = padLeft(sc, unit), pr = 8, pt = 22, pb = 26;
    const pw = Math.max(40, w - pl - pr), ph = height - pt - pb;
    const band = pw / n, bw = Math.max(4, Math.min(24, band * 0.62));
    const y = (v) => pt + ph * (1 - (v - sc.min) / (sc.max - sc.min));
    const xc = (i) => pl + band * i + band / 2;
    const hi = highlight || (highlightLast ? [n - 1] : null);
    const on = (i) => !hi || hi.includes(i);
    const labelled = hi ? (hi.length <= 3 && band >= 30 ? hi : [hi[hi.length - 1]]) : [];
    const every = thin(data.map((d) => d.label), band);
    const maxI = vals.indexOf(Math.max(...vals));
    const summary = KIT.t("chart.barSummary", { label, n, first: data[0].label, last: data[n - 1].label, maxLabel: data[maxI].label, maxValue: withUnit(vals[maxI], unit, dec), lastValue: withUnit(vals[n - 1], unit, dec) });
    const a = M.act;
    return html`<figure class="ch" ref=${ref} aria-label=${summary}>
      <div class="ch-plot"><svg width=${w} height=${height} viewBox=${`0 0 ${w} ${height}`} role="group">
        <${Axis} sc=${sc} y=${y} x0=${pl} x1=${w - pr} unit=${unit} />
        ${a != null && html`<rect class="ch-band" x=${pl + band * a} y=${pt} width=${band} height=${ph} rx="4" />`}
        <g class=${cx(tn(tone), anim())}>${data.map((d, i) => html`<path key=${i} class=${cx("ch-bar", !on(i) && "mute")} d=${barPath(xc(i) - bw / 2, y(sc.min), bw, y(sc.min) - y(d.value || 0), 4)} />`)}</g>
        ${labelled.map((i) => html`<text key=${"v" + i} class="ch-val" x=${xc(i)} y=${y(vals[i]) - 7} text-anchor="middle" aria-hidden="true">${nf(vals[i], dec)}</text>`)}
        <${RefLine} refLine=${refLine} y=${y} x0=${pl} x1=${w - pr} unit=${unit} />
        <${XLabels} labels=${data.map((d) => d.label)} xs=${xc} y=${height - 8} every=${every} />
        ${data.map((d, i) => html`<rect key=${"h" + i} x=${pl + band * i} y=${pt} width=${band} height=${ph} ...${M.props(i, `${d.tip || d.label}: ${withUnit(d.value, unit, dec)}`)} />`)}
      </svg>
      ${a != null && html`<${ChartTip} w=${w} x=${xc(a)} y=${Math.max(pt, y(vals[a]) - 4)} title=${data[a].tip || data[a].label} rows=${[{ name: data[a].name || KIT.t("chart.value"), value: withUnit(data[a].value, unit, dec), tone: on(a) ? tone : null }]} />`}</div>
    </figure>`;
  }

  // Lines over shared x labels. series: [{ name, values, tone }]. One series gets a light area
  // wash and an end label; two or more get a legend. min: y floor (default 0).
  function LineChart({ labels = [], series = [], height = 200, unit = "", refLine, min = 0, label = KIT.t("chart.line"), dec = 1, tips }) {
    const [ref, w] = useWidth();
    const n = labels.length;
    const M = useMarks(n);
    const all = series.flatMap((s) => s.values).filter((v) => v != null);
    if (!n || !all.length) return html`<${ChartEmpty} height=${height} />`;
    const sc = niceScale(min, Math.max(...all, refLine ? refLine.value : min));
    const halfLab = Math.max(...labels.map(textW)) / 2;
    const pl = padLeft(sc, unit), pr = Math.max(10, halfLab - 4), pt = 22, pb = 26, inset = 6;
    const pw = Math.max(40, w - pl - pr - inset * 2), ph = height - pt - pb;
    const step = n > 1 ? pw / (n - 1) : 0;
    const xs = (i) => pl + inset + (n > 1 ? step * i : pw / 2);
    const y = (v) => pt + ph * (1 - (v - sc.min) / (sc.max - sc.min));
    const every = thin(labels, n > 1 ? step : pw);
    const one = series.length === 1;
    const path = (vals) => vals.map((v, i) => (v == null ? null : `${i && vals[i - 1] != null ? "L" : "M"}${xs(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join("");
    const a = M.act;
    const tipOf = (i) => (tips && tips[i]) || labels[i];
    const s0 = series[0], last0 = s0.values[n - 1];
    const summary = `${label}: ${series.map((s) => KIT.t("chart.lineSeries", { name: s.name, from: withUnit(s.values[0], unit, dec), firstLabel: labels[0], to: withUnit(s.values[n - 1], unit, dec), lastLabel: labels[n - 1] })).join("; ")}.`;
    const hitW = n > 1 ? step : pw;
    return html`<figure class="ch" ref=${ref} aria-label=${summary}>
      ${!one && html`<${Legend} items=${series} line />`}
      <div class="ch-plot"><svg width=${w} height=${height} viewBox=${`0 0 ${w} ${height}`} role="group">
        <${Axis} sc=${sc} y=${y} x0=${pl} x1=${w - pr} unit=${unit} />
        <${RefLine} refLine=${refLine} y=${y} x0=${pl} x1=${w - pr} unit=${unit} />
        ${a != null && html`<line class="ch-cross" x1=${xs(a)} x2=${xs(a)} y1=${pt} y2=${y(sc.min)} />`}
        <g class=${anim()}>
          ${one && html`<path class=${cx("ch-area", tn(s0.tone))} d=${path(s0.values) + `L${xs(n - 1)},${y(sc.min)}L${xs(0)},${y(sc.min)}Z`} />`}
          ${series.map((s) => html`<path key=${s.name} class=${cx("ch-line", tn(s.tone))} d=${path(s.values)} />`)}
        </g>
        ${series.map((s) => (s.values[n - 1] == null ? null : html`<circle key=${"e" + s.name} class=${cx("ch-dot", tn(s.tone))} cx=${xs(n - 1)} cy=${y(s.values[n - 1])} r="4" />`))}
        ${a != null && series.map((s) => (s.values[a] == null ? null : html`<circle key=${"a" + s.name} class=${cx("ch-dot", tn(s.tone))} cx=${xs(a)} cy=${y(s.values[a])} r="4.5" />`))}
        ${one && last0 != null && a == null && html`<text class="ch-val" x=${xs(n - 1) - 8} y=${y(last0) - 10} text-anchor="end" aria-hidden="true">${withUnit(last0, unit, dec)}</text>`}
        <${XLabels} labels=${labels} xs=${xs} y=${height - 8} every=${every} />
        ${labels.map((l, i) => html`<rect key=${"h" + i} x=${Math.max(pl, xs(i) - hitW / 2)} y=${pt} width=${hitW} height=${ph} ...${M.props(i, `${tipOf(i)}: ${series.map((s) => (one ? "" : s.name + " ") + withUnit(s.values[i], unit, dec)).join(", ")}`)} />`)}
      </svg>
      ${a != null && html`<${ChartTip} w=${w} x=${xs(a)} y=${Math.max(pt, Math.min(...series.map((s) => (s.values[a] == null ? height : y(s.values[a])))) - 8)} title=${tipOf(a)} rows=${series.map((s) => ({ name: s.name, value: withUnit(s.values[a], unit, dec), tone: s.tone }))} />`}</div>
    </figure>`;
  }

  // Ring of parts with a legend list (name, value, share). center: { value, label }.
  function Donut({ parts = [], size = 160, center, label = KIT.t("chart.donut"), unit = "" }) {
    const n = parts.length;
    const M = useMarks(n);
    const total = parts.reduce((s, p) => s + (p.value || 0), 0);
    if (!n || !(total > 0)) return html`<${ChartEmpty} height=${size} />`;
    const c = size / 2, th = Math.max(14, Math.round(size * 0.14)), r = c - 2, r0 = r - th;
    const gap = 2 / r; // 2 px surface gap between segments, as an angle
    const pt = (rad, ang) => [c + rad * Math.sin(ang), c - rad * Math.cos(ang)];
    let acc = 0;
    const segs = parts.map((p) => {
      const a0 = (acc / total) * Math.PI * 2;
      acc += p.value || 0;
      return { ...p, a0, a1: (acc / total) * Math.PI * 2 };
    });
    const multi = segs.filter((s) => s.value > 0).length > 1;
    const arc = (a0, a1) => {
      const g = multi ? gap / 2 : 0;
      if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 -= 1e-4;
      const s0 = a0 + g, s1 = Math.max(s0 + 0.001, a1 - g), big = s1 - s0 > Math.PI ? 1 : 0;
      const [x0, y0] = pt(r, s0), [x1, y1] = pt(r, s1), [x2, y2] = pt(r0, s1), [x3, y3] = pt(r0, s0);
      return `M${x0},${y0}A${r},${r} 0 ${big} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${big} 0 ${x3},${y3}Z`;
    };
    const pct = (v) => nf((v / total) * 100, 0) + "%";
    const a = M.act;
    const summary = `${label}: ${parts.map((p) => `${p.name} ${withUnit(p.value, unit)} (${pct(p.value)})`).join(", ")}.`;
    const mid = a != null ? pt((r + r0) / 2, (segs[a].a0 + segs[a].a1) / 2) : null;
    return html`<figure class="ch ch-donut" aria-label=${summary}>
      <div class="ch-donut-plot" style=${{ width: size + "px", height: size + "px" }}>
        <svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} role="group">
          <g class=${anim()}>${segs.map((s, i) => (s.value > 0 ? html`<path key=${i} d=${arc(s.a0, s.a1)} ...${M.props(i, `${s.name}: ${withUnit(s.value, unit)}, ${pct(s.value)}`, cx("ch-seg", tn(s.tone)))} />` : null))}</g>
          ${center && html`<text class="ch-c-v" x=${c} y=${c - 2} text-anchor="middle" aria-hidden="true">${center.value}</text><text class="ch-c-l" x=${c} y=${c + 17} text-anchor="middle" aria-hidden="true">${center.label}</text>`}
        </svg>
        ${a != null && html`<${ChartTip} w=${size + 140} x=${mid[0]} y=${mid[1] - 8} title=${segs[a].name} rows=${[{ name: pct(segs[a].value), value: withUnit(segs[a].value, unit) }]} />`}
      </div>
      <ul class="ch-dl">${parts.map((p, i) => html`<li key=${p.name} class=${a === i ? "on" : ""}><i class=${cx("ch-sw", tn(p.tone))}></i><span class="grow">${p.name}</span><b class="tnum">${nf(p.value)}</b><span class="subtle tnum">${pct(p.value || 0)}</span></li>`)}</ul>
    </figure>`;
  }

  Object.assign(KIT.charts, { BarChart, LineChart, Donut, ChartEmpty, Legend, niceScale });
})();
