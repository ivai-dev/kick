// audit.js — kit checks that run inside the page (KIT.audit): the runtime audit A1–A18 (afterReady stamps
// data-audit-fail / data-audit-warn), the self-test route #kit-selftest (S1–S8, stamps data-selftest), and
// the overlay gallery #kit-overlays (the regression page test/overlays.html and test/cdp-overlays.mjs drive
// it). Internal routes are not in data-screens, the screen index or any menu. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useState } = hooks;
  const U = KIT.ui;

  function Gallery() {
    const A = useApp();
    const [dlg, setDlg] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [conf, setConf] = useState(false);
    const [typed, setTyped] = useState(false);
    const [panel, setPanel] = useState(false);
    const [aside, setAside] = useState(false);
    const [sheet, setSheet] = useState(false);
    const [pop, setPop] = useState(false);
    const [legacy, setLegacy] = useState(null);
    const [frames, setFrames] = useState(false);
    const [kConf, setKConf] = useState(false);
    const [kSheet, setKSheet] = useState(false);
    const [pPanel, setPPanel] = useState(false);
    const [last, setLast] = useState("—");
    const [place, setPlace] = useState(null);
    const [places, setPlaces] = useState([]);
    const [day, setDay] = useState("2026-10-20");
    const [shift, setShift] = useState("sang");
    const [view, setView] = useState("list");
    const [on, setOn] = useState(true);
    const [skills, setSkills] = useState(["may"]);
    const COMMUNES = ["Phường An Xuyên", "Phường Tân Thành", "Xã Hòa Mỹ", "Xã Tân Hòa", "Xã Khánh Bình", "Cà Mau", "Xã Đất Mới", "Xã Năm Căn"]
      .map((label, i) => ({ value: "c" + i, label, count: (i * 37) % 90 }));
    const items = [
      { label: "Xem hồ sơ", onClick: () => setLast("Xem hồ sơ") },
      { label: "Mời phỏng vấn", sub: "Gửi lời mời qua email", onClick: () => setLast("Mời phỏng vấn") },
      { label: "Lưu trữ", unavailable: "Hồ sơ đang chờ duyệt" },
      { label: "Xóa hồ sơ", danger: true, onClick: () => setConf(true) },
    ];
    return html`<${U.PageHeader} title="Kit overlays" sentence="Regression gallery for the overlay set (internal route)." />
      <${U.Card} title="Overlays" sub=${"Last action: " + last} id="g-card">
        <div class="row wrap gap-8">
          <${U.Button} id="g-dlg" onClick=${() => setDlg(true)}>Dialog<//>
          <${U.Button} id="g-conf" kind="danger" onClick=${() => setConf(true)}>ConfirmDialog<//>
          <${U.Button} id="g-typed" onClick=${() => setTyped(true)}>Type to confirm<//>
          <${U.Button} id="g-panel" kind="primary" onClick=${() => setPanel(true)}>SidePanel<//>
          <${U.Button} id="g-aside" onClick=${() => setAside(!aside)}>Non-modal panel<//>
          <${U.Button} id="g-sheet" onClick=${() => setSheet(true)}>BottomSheet<//>
          <${U.Button} id="g-pop" onClick=${() => setPop(!pop)} aria-haspopup="dialog">Popover<//>
          <${U.MenuButton} id="g-menu" icon="more" object="Nguyễn Thị Ẵng" items=${items} />
          <${U.MenuButton} id="g-menu2" label="Tải báo cáo" items=${[{ label: "Excel (.xlsx)" }, { label: "PDF" }]} />
          <${U.IconButton} id="g-tip" icon="cog" label="Cài đặt hiển thị" onClick=${() => setLast("cog")} />
          <${U.Button} id="g-toast" onClick=${() => A.toast("Đã lưu hồ sơ.", { icon: "check" })}>Toast<//>
          <${U.Button} id="g-toast-act" onClick=${() => A.toast("Đã ẩn tin.", { action: { label: "Hoàn tác", run: () => setLast("undo") } })}>Toast + action<//>
          <button id="g-legacy" type="button" class="btn" onClick=${(e) => setLegacy(legacy ? null : e.currentTarget)}>Legacy menu</button>
          <${U.InfoPopover} text="Hồ sơ được giữ 12 tháng kể từ lần cập nhật cuối." label="Thời gian lưu hồ sơ" />
          <${U.Button} id="g-frames" onClick=${() => setFrames(!frames)}>Device frames<//>
        </div>
        <div class="fgrid">
          <${U.Field} id="g-combo" label="Xã, phường" span=${3} width="commune"><${U.Combobox} id="g-combo" options=${COMMUNES} value=${place} onChange=${setPlace} placeholder="Gõ tên xã" /><//>
          <${U.Field} id="g-combo-m" label="Nhiều xã" span=${3}><${U.Combobox} id="g-combo-m" multiple max=${3} options=${COMMUNES} value=${places} onChange=${setPlaces} recent=${["c5"]} /><//>
          <${U.Field} id="g-day" label="Ngày phỏng vấn" span=${2} width="date"><${U.DateField} id="g-day" value=${day} onChange=${setDay} min="2026-10-01" max="2026-12-31" today="2026-10-20" presets=${[{ days: 15 }, { days: 30 }]} /><//>
          <${U.Field} id="g-num" label="Số lượng" span=${2}><${U.NumberField} id="g-num" value=${60} suffix="người" stepper min=${1} /><//>
          <${U.Field} id="g-period" label="Kỳ báo cáo" span=${2}><${U.PeriodPicker} value="2026-10" granularity="month" today="2026-10-20" onChange=${(v) => setLast(String(v))} /><//>
        </div>
        <${U.ChoiceGroup} legend="Ca làm việc" value=${shift} onChange=${setShift} options=${[{ value: "sang", label: "Sáng" }, { value: "chieu", label: "Chiều" }, { value: "ca", label: "Cả ngày" }]} />
        <div class="row wrap gap-8"><${U.SegmentedControl} label="Cách xem" value=${view} onPick=${setView} items=${[["list", "Danh sách", "list"], ["cal", "Lịch", "calendar"]]} />
          <${U.ToggleChip} label="May công nghiệp" pressed=${skills.includes("may")} onToggle=${() => setSkills(skills.includes("may") ? [] : ["may"])} />
          <${U.FilterChip} label="Lương: 7–10 triệu" onRemove=${() => setLast("filter removed")} />
          <${U.DisclosureChip} label="Lương" value="7–10 triệu" expanded=${false} /></div>
        <${U.Switch} label="Hiển thị trên cổng" desc="Người lao động thấy tin này ngay." checked=${on} onChange=${setOn} />
        <${U.FileDrop} accept=".pdf,image/*" files=${[]} />
        <div class="l-panel">
          <div class="col gap-8 grow"><p class="t-body">List area (the non-modal panel docks beside it when it keeps 560 px).</p></div>
          <${U.SidePanel} modal=${false} open=${aside} title="Chi tiết ứng viên" onClose=${() => setAside(false)}
            pager=${{ index: 5, total: 186, onPrev: () => setLast("prev"), onNext: () => setLast("next") }}><p>Nguyễn Thị Ẵng · Kế toán</p><//>
        </div>
      <//>
      <${Structure} />
      <${Lists} />
      ${legacy && html`<${U.Menu} anchor=${legacy} onClose=${() => setLegacy(null)} width=${240}>
        <button type="button" role="menuitem" onClick=${() => { setLegacy(null); setLast("legacy 1"); }}>Mục một</button>
        <button type="button" role="menuitem" onClick=${() => { setLegacy(null); setLast("legacy 2"); }}>Mục hai</button><//>`}
      <${U.Popover} open=${pop} anchor="g-pop" title="Hạn nộp" onClose=${() => setPop(false)}>
        <p class="t-body">Chọn hạn nộp hồ sơ.</p><${U.Button} id="g-pop-in" size="sm" onClick=${() => setLast("pop button")}>Áp dụng<//><//>
      <${U.Dialog} open=${dlg} title="Sửa thông tin liên hệ" dirty=${dirty} onClose=${() => { setDlg(false); setDirty(false); }}
        footer=${html`<${U.Button} onClick=${() => { setDlg(false); setDirty(false); }}>Hủy<//><${U.Button} kind="primary" onClick=${() => { setDlg(false); setDirty(false); setLast("saved"); }}>Lưu<//>`}>
        <${U.Field} id="g-phone" label="Số điện thoại"><input id="g-phone" class="input" onInput=${() => setDirty(true)} /><//>
        <${U.Field} id="g-mail" label="Email"><input id="g-mail" class="input" /><//>
      <//>
      <${U.ConfirmDialog} open=${conf} question="Xóa hồ sơ này?" consequence="Hồ sơ của Nguyễn Thị Ẵng sẽ bị xóa. Bạn không khôi phục lại được."
        confirmLabel="Xóa hồ sơ" onClose=${() => setConf(false)} onConfirm=${() => { setConf(false); setLast("deleted"); }} />
      <${U.ConfirmDialog} open=${typed} question="Phục hồi bản sao lưu?" consequence="Dữ liệu hiện tại sẽ bị thay thế."
        confirmLabel="Phục hồi" typeToConfirm=${{ expected: "SL-2026-10-20" }} onClose=${() => setTyped(false)} onConfirm=${() => { setTyped(false); setLast("restored"); }} />
      <${U.SidePanel} open=${panel} title="Mời phỏng vấn" onClose=${() => setPanel(false)}
        footer=${html`<${U.Button} onClick=${() => setPanel(false)}>Hủy<//><${U.Button} kind="primary" onClick=${() => { setPanel(false); setLast("invited"); }}>Gửi lời mời<//>`}>
        <${U.Field} id="g-date" label="Ngày phỏng vấn"><input id="g-date" class="input" value="22/10/2026" /><//>
        <div class="row gap-8"><span>Mẫu lời mời</span><${U.MenuButton} id="g-nested" label="Chọn mẫu" placement="bottom-start" items=${[{ label: "Mẫu ngắn" }, { label: "Mẫu đầy đủ" }]} /></div>
      <//>
      <${U.BottomSheet} open=${sheet} title="Bộ lọc" onClose=${() => setSheet(false)} footer=${html`<${U.Button} kind="primary" onClick=${() => setSheet(false)}>Xem 41 việc<//>`}>
        <p>Ngành nghề, mức lương, khoảng cách.</p><//>
      ${frames && html`<div class="row ai-start gap-24 wrap" id="g-frames-box">
        <div class="g-kiosk" style=${{ zoom: 0.4 }}><div class="g-kiosk-screen" data-frame="kiosk" data-density="kiosk" id="g-kiosk" style=${{ width: "864px", height: "640px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", background: "var(--bg)", border: "1px solid var(--line)" }}>
          <b class="t-headline">Bạn muốn làm gì?</b>
          <${U.Button} id="g-k-conf" kind="act" size="lg" onClick=${() => setKConf(true)}>Hủy hồ sơ<//>
          <${U.Button} id="g-k-sheet" size="lg" onClick=${() => setKSheet(true)}>Nhờ cán bộ hỗ trợ<//>
          <${U.ConfirmDialog} open=${kConf} question="Hủy hồ sơ?" consequence="Hồ sơ chưa gửi sẽ bị xóa." confirmLabel="Hủy hồ sơ" onClose=${() => setKConf(false)} onConfirm=${() => setKConf(false)} />
          <${U.BottomSheet} open=${kSheet} title="Nhờ cán bộ hỗ trợ" onClose=${() => setKSheet(false)}><p>Cán bộ ở quầy sẽ đến hỗ trợ bạn.</p><//>
        </div></div>
        <div class="phone" style=${{ zoom: 0.6 }}><div class="phone-screen" data-frame="phone" data-density="touch" id="g-phone-frame">
          <div class="m-app"><div class="m-content"><b class="t-title-l">Việc làm gần bạn</b>
            <${U.Button} id="g-p-panel" kind="primary" onClick=${() => setPPanel(true)}>Bộ lọc<//>
            <${U.SidePanel} open=${pPanel} title="Bộ lọc" onClose=${() => setPPanel(false)}><p>Ngành nghề, mức lương.</p><//>
          </div></div></div></div>
      </div>`}`;
  }

  // Structure and feedback components with stress content (long titles, missing values, many facts).
  function Structure() {
    const [tab, setTab] = useState("all");
    const [page, setPage] = useState(5);
    const [open, setOpen] = useState(false);
    const [errs, setErrs] = useState([]);
    return html`<${U.Card} title="Structure and feedback" sub="Stress content: long titles, empty values, many facts">
      <${U.SectionHead} title="Việc làm mới" count=${38} link=${{ label: "Xem tất cả", go: "kit-overlays" }} />
      <${U.StatusTabs} label="Trạng thái" value=${tab} onPick=${setTab} panelId="g-tabpanel"
        items=${[{ key: "all", label: "Tất cả", count: 186 }, { key: "new", label: "Mới", count: 38 }, { key: "seen", label: "Đã xem", count: 0 }]} />
      <div id="g-tabpanel" class="col gap-8">
        <div class="kpis">
          <${U.StatTile} id="g-k1" label="Hồ sơ mới trong tuần" value="1.240" unit="hồ sơ" delta=${7.1} period="so với tuần trước" spark=${[3, 5, 4, 7, 6, 9]} />
          <${U.StatTile} id="g-k2" label="Đã tuyển" value="31" unit="/40 người" context="Mục tiêu tháng 10" go="kit-overlays" />
        </div>
        <${U.Meter} label="Đã tuyển" value=${31} max=${40} />
        <div class="g12">
          <div class="c-6"><${U.ChartCard} title="Hồ sơ theo tháng" sub="Tháng 5–10/2026" takeaway="Tháng 10 có nhiều hồ sơ nhất." source="Dữ liệu mẫu" downloads=${true} height=${200}
            chart=${html`<${KIT.charts.BarChart} id="g-series" label="Hồ sơ" labels=${["T5", "T6", "T7", "T8", "T9", "T10"]} layout="stack"
              series=${[{ name: "Trực tuyến", values: [30, 41, 29, 37, 46, 52] }, { name: "Tại quầy", values: [12, 9, 14, 11, 8, 10] }]} />`}
            table=${{ columns: [{ key: "m", label: "Tháng" }, { key: "v", label: "Hồ sơ", num: true }], rows: [{ id: 1, m: "T9", v: 54 }, { id: 2, m: "T10", v: 62 }] }} /></div>
          <div class="c-6 col gap-12"><${KIT.charts.BarList} rows=${[{ label: "Thợ may", value: 120 }, { label: "Kế toán", value: 48 }, { label: "Lái xe", value: 77 }]} unit="việc" />
            <${KIT.charts.Funnel} stages=${[{ label: "Xem tin", value: 1240 }, { label: "Nộp hồ sơ", value: 310 }, { label: "Phỏng vấn", value: 92 }, { label: "Trúng tuyển", value: 31 }]} /></div>
        </div>
        <div class="grid-2">
          <${U.EntityCard} go="kit-overlays" params=${{ id: "v1" }} title="Nhân viên kinh doanh thiết bị y tế khu vực các xã ven biển phía Nam tỉnh Cà Mau, ưu tiên có kinh nghiệm"
            subtitle="Công ty TNHH Thiết bị Y tế Phương Nam Ánh Dương Toàn Cầu chi nhánh Cà Mau" badge=${html`<${U.StatusChip} tone="info">Mới<//>`}
            figure="8–11 triệu" figure2="/tháng" meta=${[{ icon: "building", text: "Phường Tân Thành · Cùng xã" }, { icon: "clock", text: "Còn 5 ngày" }]}
            facts=${["Toàn thời gian", "Không cần bằng cấp", "Có chỗ ở", "Bảo hiểm"]} />
          <${U.EntityCard} layout="row" go="kit-overlays" title="Thợ may công nghiệp" subtitle="Công ty May Phương Nam" figure="Thỏa thuận" meta=${["Xã Hòa Mỹ"]} facts=${["Ca sáng"]} />
        </div>
        <div class="card"><${U.ListRow} title="Nguyễn Thị Ẵng · Kế toán tổng hợp" meta="Nộp 18/10 · Phường Tân Thành" status=${html`<${U.StatusChip} tone="warn">Chờ duyệt<//>`} go="kit-overlays" />
          <${U.ListRow} title="Trần Văn Ữ" status=${html`<${U.StatusChip}>Đã xem<//>`} figure="7–9 triệu" /></div>
        <${U.SummaryList} columns=${2} rows=${[{ label: "Số điện thoại", value: "0912 345 678", action: { label: "Sửa số điện thoại", onClick: () => {} } }, { label: "Email", value: "" }, { label: "Mã số thuế", value: "2000000110-001" }]} />
        <${U.Timeline} events=${[{ at: "20/10/2026 09:12", who: "Lãnh đạo", action: "đã duyệt", tone: "ok" }, { at: "19/10/2026", who: "Cán bộ", action: "trả lại", quote: "Bổ sung mô tả công việc.", tone: "warn" }]} />
        <${U.Pager} page=${page} size=${50} total=${7840} sizes=${[25, 50, 100]} onPage=${setPage} listId="g-list" />
        <${U.Pager} mode="more" page=${1} size=${20} total=${214} unit="việc" onPage=${() => {}} />
        <${U.Stepper} steps=${[{ label: "Số điện thoại" }, { label: "Mã xác thực" }, { label: "Thông tin" }]} current=${2} />
        <${U.Disclosure} summary="Câu hỏi thường gặp" open=${open} onToggle=${setOpen}><p class="t-prose">Hồ sơ được giữ 12 tháng.</p><//>
        <${U.Banner} tone="warn" title="Tin đang ẩn" actions=${html`<${U.Button} size="sm">Hiện lại<//>`}>Người lao động không thấy tin này.<//>
        <${U.ErrorSummary} errors=${errs} /><div><${U.Button} id="g-errs" onClick=${() => setErrs([{ field: "g-phone", text: "Nhập số điện thoại" }])}>Show errors<//></div>
        <${U.JobProgress} title="Xuất báo cáo" steps=${[{ label: "Đọc dữ liệu" }, { label: "Tạo tệp" }]} current=${1} />
        <${U.Skeleton} count=${2} />
        <${U.EmptyState} kind="no-results" title="Không có việc phù hợp" action=${html`<${U.Button}>Xóa bộ lọc<//>`}>Thử bỏ bớt bộ lọc.<//>
        <p class="t-body"><${U.Clamp} text="Một dòng chữ rất dài để thử cắt chữ và hiện đầy đủ khi rê chuột hoặc khi được chọn bằng bàn phím trong bảng" /> · <${U.Num} value=${1240} /></p>
        <${U.SubNav} label="Tin tức" items=${[{ id: "kit-overlays", label: "Tin tức" }, { id: "kit-selftest", label: "Sự kiện" }]} />
      </div>
      <${U.ActionBar} status="Đã lưu nháp lúc 09:12" actions=${html`<${U.Button} kind="primary">Gửi duyệt<//>`} />
    <//>`;
  }

  // DataTable family with synthetic rows at volume.
  const NAMES = ["Nguyễn Thị Ẵng", "Đặng Văn Bình", "Dương Thị Cúc", "Trần Văn Ữ", "Lê Thị Hòa", "Phạm Minh Đức", "Huỳnh Thị Mỹ", "Võ Văn Toàn"];
  const ROWS = Array.from({ length: 137 }, (_, i) => ({
    id: "r" + i, name: NAMES[i % NAMES.length] + " " + (i + 1), job: ["Kế toán", "Thợ may", "Lái xe", "Bán hàng"][i % 4],
    sent: `2026-${String(1 + (i % 9)).padStart(2, "0")}-${String(1 + (i * 7) % 28).padStart(2, "0")}`, salary: 5 + (i * 13) % 20,
    status: ["Mới", "Đã xem", "Chờ duyệt"][i % 3], note: i % 5 === 0 ? "" : "Ghi chú " + i,
  }));
  function Lists() {
    const A = useApp();
    const [page, setPage] = useState(1);
    const [sel, setSel] = useState([]);
    const [job, setJob] = useState(null);
    const rows = job ? ROWS.filter((r) => r.job === job) : ROWS;
    const cols = [
      { key: "name", label: "Họ tên", sortable: true, cardRole: "title" },
      { key: "job", label: "Vị trí", width: 140, sortable: true, cardRole: "meta" },
      { key: "sent", label: "Ngày gửi", width: 112, sortable: true, nowrap: true, render: (r) => KIT.logic.formatDate(r.sent) },
      { key: "salary", label: "Lương (triệu)", width: 120, num: true, sortable: true },
      { key: "status", label: "Trạng thái", width: 140, render: (r) => html`<${U.StatusChip} tone=${r.status === "Mới" ? "info" : r.status === "Chờ duyệt" ? "warn" : undefined}>${r.status}<//>`, cardRole: "status" },
      { key: "note", label: "Ghi chú", width: 160, hideBelow: 800 },
    ];
    return html`<${U.Card} title="Lists" sub="DataTable, FilterBar, BulkBar" flush>
      <div class="col gap-12" style=${{ padding: "16px" }}>
        <${U.FilterBar} sync=${false} search=${{ placeholder: "Tìm theo tên" }} count=${{ n: rows.length, unit: "ứng viên" }}
          filters=${[{ key: "job", label: "Vị trí", type: "single", value: job, options: ["Kế toán", "Thợ may", "Lái xe", "Bán hàng"].map((v) => ({ value: v, label: v, count: ROWS.filter((r) => r.job === v).length })) }]}
          onChange=${(k, v) => { if (k === "job") { setJob(v); setPage(1); setSel([]); } }} />
        <${U.BulkBar} count=${sel.length} unit="ứng viên" actions=${[{ label: "Mời phỏng vấn", icon: "send" }, { label: "Không phù hợp" }]} onClear=${() => setSel([])} />
        <${U.DataTable} id="g-list" caption="Ứng viên" unit="ứng viên" columns=${cols} rows=${rows} selection="multi" selected=${sel} onSelect=${(k) => setSel(k)}
          selectAllMatching=${{ count: rows.length, unit: "ứng viên" }} page=${{ page, size: 25, total: rows.length, sizes: [25, 50, 100] }} onPage=${setPage}
          rowLink=${(r) => ({ go: "kit-overlays", params: { id: r.id } })} activeId=${A.params.id} shortcuts columnsMenu persistKey="g-list" />
      </div><//>`;
  }

  // Internal routes: every role may open them; they stay out of data-screens, the index and menus.
  function registerInternal(id, comp, extra) {
    KIT.register(id, Object.assign({ comp, code: id.toUpperCase(), name: id, internal: true }, extra || {}));
  }
  registerInternal("kit-overlays", Gallery, { name: "Kit overlays" });

  /* ---------------- Runtime audit (A1–A18) ---------------- */
  // Runs once per load after data-ready: checks the product area (#kit-content and the overlays open at that
  // moment; not the prototype bar, start page, guide panel or Windows chrome) against the foundation rules and
  // stamps <html data-audit-fail="…"> (errors) and data-audit-warn="…" (warnings), 400 characters each, items
  // separated by "; ". Thresholds: KIT_CONFIG.audit (defaults KIT.logic.AUDIT_DEFAULTS).
  const CHROME = ".proto, .launch, .guide, .win-title, .taskbar, [data-kit-audit=\"off\"]";
  const CHART = ".ch, .barlist, .funnel";
  const INTERACTIVE = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], [role=option], [role=switch], [role=radio], [role=checkbox]";
  const MIN_FS = { compact: 13, comfortable: 14, touch: 14, kiosk: 19 };
  const MIN_FS_CHART = { compact: 12, comfortable: 13, touch: 13, kiosk: 19 };
  const MIN_TARGET = { compact: 24, comfortable: 24, touch: 40, kiosk: 56 };
  const short = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 24);
  const densityOf = (el) => {
    const d = el.closest && el.closest("[data-density]");
    return (d && d.getAttribute("data-density")) || document.documentElement.dataset.density || "compact";
  };
  const visible = (el) => {
    if (!el.getClientRects || !el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  // WCAG 2.5.8 inline exception: a link in a sentence, i.e. an inline box whose block container holds other
  // words besides the link ("Xem <a>điều khoản</a> trước khi gửi."). A link alone in a cell, a heading or a
  // list item is not in a sentence.
  function inSentence(e) {
    if (getComputedStyle(e).display !== "inline") return false;
    let b = e.parentElement;
    while (b && getComputedStyle(b).display === "inline") b = b.parentElement;
    if (!b) return false;
    const sp = (s) => String(s || "").replace(/\s+/g, " ").trim();
    return /[\p{L}\p{N}]/u.test(sp(b.textContent).replace(sp(e.textContent), ""));
  }
  // A stretched link (EntityCard and ListRow titles: an absolutely positioned ::after over the card or row)
  // is hit over that overlay, so its target is the overlay's box, not the text. Null for other links.
  function stretchedBox(e) {
    const a = getComputedStyle(e, "::after");
    if (!a || a.position !== "absolute" || !a.content || a.content === "none" || a.content === "normal") return null;
    let p = e.parentElement;
    while (p && p !== document.documentElement) {
      const cs = getComputedStyle(p);
      if (cs.position !== "static" || cs.transform !== "none") break;
      p = p.parentElement;
    }
    if (!p || p === document.documentElement) return null;
    const r = p.getBoundingClientRect();
    const z = p.currentCSSZoom || 1;
    const px = (v) => (/px$/.test(v) ? parseFloat(v) : 0);
    return { w: r.width / z - px(a.left) - px(a.right), h: r.height / z - px(a.top) - px(a.bottom) };
  }
  function roots() {
    const list = [];
    const c = document.getElementById("kit-content");
    if (c) list.push(c);
    document.querySelectorAll("wa-dialog[open], wa-drawer[open], wa-popover[open], wa-dropdown[open]").forEach((o) => {
      if (!(c && c.contains(o))) list.push(o);
    });
    return list;
  }
  function accName(el) {
    const label = el.getAttribute("aria-label");
    if (label && label.trim()) return label.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) return lb.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || "").join(" ").trim();
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l && l.textContent.trim()) return l.textContent.trim();
    }
    const wrap = el.closest("label");
    if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    if (el.tagName === "INPUT" && (el.placeholder || el.value) && el.type !== "checkbox" && el.type !== "radio") return el.placeholder || el.value;
    const txt = (el.textContent || "").trim();
    if (txt) return txt;
    const img = el.querySelector("img[alt], svg[aria-label]");
    return img ? img.getAttribute("alt") || img.getAttribute("aria-label") : "";
  }
  function run(th) {
    const fail = [], warn = [];
    const add = (list, id, msg) => { if (!list.some((x) => x.startsWith(id + " ") && list.length > 6)) list.push(id + " " + msg); };
    const rs = roots();
    const all = [];
    rs.forEach((r) => { all.push(r); r.querySelectorAll("*").forEach((e) => all.push(e)); });
    const els = all.filter((e) => !(e.closest && e.closest(CHROME)) && !(e.closest && e.closest(".sr-only")));
    const texts = els.filter((e) => ownText(e) && !/^(SCRIPT|STYLE|TITLE|OPTION)$/.test(e.tagName) && visible(e));
    const sizes = new Set();
    const lang = document.documentElement.lang;
    const seen = {};
    for (const e of texts) {
      const cs = getComputedStyle(e);
      const fs = parseFloat(cs.fontSize);
      const inChart = !!e.closest(CHART);
      const lh = cs.lineHeight === "normal" ? 1.2 * fs : parseFloat(cs.lineHeight);
      const ratio = lh / fs;
      const d = densityOf(e);
      const tx = short(e.textContent);
      const once = (k) => (seen[k] ? false : (seen[k] = true));
      if (!inChart) sizes.add(Math.round(fs * 2) / 2);
      if (parseInt(cs.fontWeight, 10) > 700 && once("A1" + cs.fontWeight)) add(fail, "A1", `weight ${cs.fontWeight} '${tx}'`);
      if (ratio < th.minLh - 0.005 && once("A3" + fs + lh)) add(fail, "A3", `line-height ${lh}/${fs} '${tx}'`);
      const lines = e.getBoundingClientRect().height / lh;
      if (lines > 1.5 && ratio < th.minLhWrap - 0.005 && once("A4" + fs + lh)) add(/^H[1-3]$/.test(e.tagName) ? fail : warn, "A4", `wrapping ${lh}/${fs} '${tx}'`);
      const clipped = cs.overflow === "hidden" || cs.overflowY === "hidden" || cs.overflowX === "hidden";
      if (clipped && (cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none"))) {
        const pad = parseFloat(cs.paddingTop) / fs;
        if (ratio < th.minLhClip - 0.005 && pad < 0.1 && once("A5" + fs + lh)) add(fail, "A5", `clipped text ${lh}/${fs} '${tx}'`);
      }
      if (parseFloat(cs.letterSpacing) < 0 && once("A6ls")) add(fail, "A6", `negative letter-spacing '${tx}'`);
      if (lang === "vi" && cs.textTransform === "uppercase" && once("A6up")) add(fail, "A6", `uppercase Vietnamese '${tx}'`);
      const min = (inChart ? MIN_FS_CHART : MIN_FS)[d] || 13;
      if (fs < min - 0.01 && once("A7" + fs + d)) add(fail, "A7", `${fs}px < ${min} (${d}) '${tx}'`);
    }
    if (sizes.size > th.maxSizes) add(fail, "A2", `${sizes.size} sizes > ${th.maxSizes} (${[...sizes].sort((a, b) => a - b).join(",")})`);
    // A8 names, A9 roles, A10 targets.
    const inter = els.filter((e) => e.matches && e.matches(INTERACTIVE) && visible(e));
    for (const e of inter) {
      const nm = accName(e);
      if (!nm && !(e.tagName === "INPUT" && e.closest("label"))) add(fail, "A8", `no name: ${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""}`);
      if (e.tagName === "BUTTON" && e.hasAttribute("title") && !(e.textContent || "").trim()) add(fail, "A8", `title on icon button '${short(nm)}'`);
      if (e.hasAttribute("aria-pressed") && e.hasAttribute("aria-expanded")) add(fail, "A9", `aria-pressed and aria-expanded '${short(nm)}'`);
      // Targets: links in a sentence (WCAG 2.5.8 inline exception), inputs inside a label, and table
      // checkboxes (their cell) are excluded; a stretched link is measured over its overlay.
      if (e.tagName === "A" && inSentence(e)) continue;
      if (e.tagName === "INPUT" && (e.closest("label") || e.closest("td.chk, th.chk") || e.classList.contains("sr-only"))) continue;
      if (e.closest(CHART)) continue;
      const z = e.currentCSSZoom || 1;
      const r = e.getBoundingClientRect();
      const box = e.tagName === "A" ? stretchedBox(e) : null;
      const w = box ? box.w : r.width / z, h = box ? box.h : r.height / z;
      const d = densityOf(e);
      const min = MIN_TARGET[d] || 24;
      if (Math.min(w, h) < min - 0.5) add(fail, "A10", `${Math.round(w)}×${Math.round(h)} ${e.tagName.toLowerCase()} '${short(nm)}' (${d} ${min})`);
      else if (d === "touch" && Math.min(w, h) < 44 - 0.5) add(warn, "A10", `${Math.round(w)}×${Math.round(h)} '${short(nm)}' (touch 44)`);
    }
    els.forEach((e) => { if (e.getAttribute && e.getAttribute("role") === "menu" && e.querySelector("a[href]")) add(fail, "A9", "role=menu with links"); });
    // A11 one filled button per region, ≤ 2 in the viewport.
    const filled = inter.filter((e) => e.matches(".btn.primary, .btn.act") && !e.matches("[aria-current]"));
    const regionOf = (e) => e.closest(".page-h, .card-h, .ov-foot, .abar, .spanel-f, .card, .page, .site-page, .m-content");
    const per = new Map();
    filled.forEach((e) => { const r = regionOf(e); per.set(r, (per.get(r) || 0) + 1); });
    for (const n of per.values()) if (n > 1) { add(warn, "A11", `${n} filled buttons in one region`); break; }
    const inView = filled.filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    if (inView.length > 2) add(warn, "A11", `${inView.length} filled buttons in view`);
    // A12 one h1 per screen with tabindex -1.
    const c = document.querySelector(".stage");
    if (c && document.getElementById("kit-content")) {
      const h1s = [...c.querySelectorAll("h1")].filter((h) => !h.closest(CHROME));
      if (h1s.length !== 1) add(fail, "A12", `${h1s.length} h1`);
      else if (h1s[0].getAttribute("tabindex") !== "-1") add(fail, "A12", "h1 without tabindex=-1");
    }
    // A13 layout shift.
    if (shift > th.maxShift) add(warn, "A13", `layout shift ${shift.toFixed(3)}`);
    // A14 clickable rows have a link or button in the first cell; A15 empty cells; A16 long lists page.
    els.filter((e) => e.tagName === "TR").forEach((tr) => {
      if ((tr.classList.contains("click") || tr.classList.contains("has-link") || tr.hasAttribute("onclick")) && !(tr.cells[0] && tr.cells[0].querySelector("a[href], button"))) add(fail, "A14", "clickable row without a link or button in its first cell");
    });
    const emptyTd = els.filter((e) => e.tagName === "TD" && !e.textContent.trim() && !e.children.length && !e.classList.contains("tbl-empty"));
    if (emptyTd.length) add(warn, "A15", `${emptyTd.length} empty table cells (use "—")`);
    els.filter((e) => e.tagName === "TBODY" && e.rows.length > 25).forEach((tb) => {
      const box = tb.closest(".dt, .card, section") || tb.parentElement;
      if (!box.querySelector('[data-kit="Pager"]')) add(warn, "A16", `${tb.rows.length} rows without paging`);
    });
    // A17 images and pictograms have a size; A18 duplicate ids.
    els.filter((e) => e.tagName === "IMG" && visible(e)).forEach((img) => {
      if (!img.getAttribute("width") && getComputedStyle(img).aspectRatio === "auto") add(warn, "A17", `image without size '${short(img.alt)}'`);
      if (!img.hasAttribute("alt")) add(warn, "A17", "image without alt");
    });
    const ids = {};
    document.querySelectorAll("[id]").forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
    const dup = Object.keys(ids).filter((k) => ids[k] > 1 && k);
    if (dup.length) add(fail, "A18", `duplicate ids: ${dup.slice(0, 3).join(", ")}`);
    return { fail, warn };
  }
  let shift = 0;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) shift += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch (e) {
    /* no layout-shift entries in this browser */
  }
  const cut = (items) => items.join("; ").slice(0, 400);
  function afterReady() {
    const root = document.documentElement;
    try {
      const th = KIT.config().audit;
      const { fail, warn } = run(th);
      if (fail.length) root.dataset.auditFail = cut(fail); else delete root.dataset.auditFail;
      if (warn.length) root.dataset.auditWarn = cut(warn); else delete root.dataset.auditWarn;
    } catch (e) {
      root.dataset.auditWarn = "audit did not run: " + String((e && e.message) || e).slice(0, 120);
    }
    if (/^#kit-selftest(?:-|$)/.test(location.hash)) setTimeout(selftest, 50);
  }

  /* ---------------- Self-test (#kit-selftest, S1–S8) ---------------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, ms = 2000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      try { if (fn()) return true; } catch (e) { /* not yet */ }
      await wait(40);
    }
    return false;
  }
  const deep = () => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a; };
  let bed = null;
  function Bed() {
    const [s, setS] = useState({});
    bed = { set: (p) => setS((o) => ({ ...o, ...p })) };
    const open = (k) => !!s[k];
    const close = (k) => () => bed.set({ [k]: false });
    return html`<${U.PageHeader} title="Kit self-test" sentence="Internal route: checks the overlay set, toasts and routes." />
      <div class="row wrap gap-8">
        ${["dlg", "conf", "panel", "aside", "sheet", "pop", "menu", "gone"].map((k) => html`<button key=${k} type="button" class="btn" id=${"st-" + k} onClick=${() => bed.set({ [k]: true })}>${k}</button>`)}
        ${!s.goneHidden && html`<button type="button" class="btn" id="st-opener-gone" onClick=${() => bed.set({ gone: true })}>opener</button>`}
        <${U.MenuButton} id="st-menu-btn" label="Menu" items=${[{ label: "One" }, { label: "Two" }]} />
      </div>
      <div class="l-panel"><p class="grow">List</p><${U.SidePanel} modal=${false} open=${open("aside")} title="Aside" onClose=${close("aside")}><p>Detail</p><//></div>
      <span data-st="Dialog"><${U.Dialog} open=${open("dlg")} title="Dialog" onClose=${close("dlg")}>
        <${U.Field} id="st-f" label="Field"><input id="st-f" class="input" /><//>
        <button type="button" class="btn" id="st-pop-in">Pop</button>
        <${U.Popover} open=${open("popIn")} anchor="st-pop-in" title="Inner" onClose=${close("popIn")}><p>Inner popover</p><//><//></span>
      <span data-st="ConfirmDialog"><${U.ConfirmDialog} open=${open("conf")} question="Delete it?" consequence="It cannot be restored." confirmLabel="Delete" onClose=${close("conf")} onConfirm=${close("conf")} /></span>
      <span data-st="SidePanel"><${U.SidePanel} open=${open("panel")} title="Panel" onClose=${close("panel")}><${U.Field} id="st-p" label="Field"><input id="st-p" class="input" /><//><//></span>
      <span data-st="BottomSheet"><${U.BottomSheet} open=${open("sheet")} title="Sheet" onClose=${close("sheet")}><p>Sheet</p><//></span>
      <span data-st="Popover"><${U.Popover} open=${open("pop")} anchor="st-pop" title="Popover" onClose=${close("pop")}><button type="button" class="btn">Inside</button><//></span>
      <span data-st="Gone"><${U.Dialog} open=${open("gone")} title="Gone" kind="passive" onClose=${close("gone")}><p>The opener is removed.</p><//></span>`;
  }
  function Page({ which }) {
    return html`<${U.PageHeader} title=${"Self-test page " + which} />
      ${Array.from({ length: 40 }, (_, i) => html`<p key=${i} class="t-body">Line ${i + 1}</p>`)}
      <button type="button" class="btn" id=${"st-go-" + which} data-kit-key=${"st-" + which}>Go</button>`;
  }
  async function selftest() {
    const root = document.documentElement;
    const A = KIT._api;
    const fail = (n, d) => { root.dataset.err = `selftest S${n}: ${d}`.slice(0, 200); root.dataset.selftest = "fail"; };
    const el = (sel) => document.querySelector(sel);
    const inside = (h) => { const a = deep(); return !!(a && (h.contains(a) || (h.shadowRoot && h.shadowRoot.contains(a)))); };
    const steps = [["dlg", "Dialog", "#st-f"], ["conf", "ConfirmDialog", null], ["panel", "SidePanel", "#st-p"], ["sheet", "BottomSheet", null], ["pop", "Popover", null]];
    try {
      if (!(await until(() => bed && el("#st-dlg")))) return fail(1, "test bed did not render");
      // S8: every library element is defined.
      const undef = [...document.querySelectorAll("*")].filter((e) => e.localName.startsWith("wa-") && !customElements.get(e.localName));
      if (undef.length) return fail(8, "undefined " + undef[0].localName);
      for (const [k, kit] of steps) {
        const opener = el("#st-" + k);
        opener.focus();
        bed.set({ [k]: true });
        const h = () => el(`[data-st="${kit}"] [data-kit]`) || el(`[data-st="${kit}"] wa-dialog, [data-st="${kit}"] wa-drawer, [data-st="${kit}"] wa-popover`);
        if (!(await until(() => h() && h().open && inside(h()), 2500))) return fail(1, `${kit}: focus not inside (${deep() && (deep().id || deep().localName)})`);
        if (kit === "ConfirmDialog") {
          const a = deep();
          if (!a || !/cancel|hủy/i.test(a.textContent || "")) return fail(1, "ConfirmDialog: focus not on cancel");
          await wait(100);
          const d = h().shadowRoot && h().shadowRoot.querySelector('[part~="dialog"]');
          if (!d || d.getAttribute("role") !== "alertdialog" || !d.getAttribute("aria-description")) return fail(5, "ConfirmDialog is not an alertdialog with a description");
        }
        bed.set({ [k]: false });
        await wait(10);
        if (!h() || !h().isConnected) return fail(3, `${kit}: removed before its exit`);
        if (!(await until(() => !h().open, 2500))) return fail(3, `${kit}: still open after close`);
        if (!(await until(() => deep() === opener, 2000))) return fail(2, `${kit}: focus did not return (${deep() && (deep().id || deep().localName)})`);
      }
      // S1 for the menu and the non-modal panel.
      el("#st-menu-btn").focus();
      el("#st-menu-btn").click();
      if (!(await until(() => el("#st-menu-btn").closest("wa-dropdown").open, 2000))) return fail(1, "MenuButton: the menu did not open");
      if (!(await until(() => deep() && deep().localName === "wa-dropdown-item", 600))) {
        el("#st-menu-btn").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        if (!(await until(() => deep() && deep().localName === "wa-dropdown-item", 1500))) return fail(1, `MenuButton: focus not on an item (${deep() && (deep().id || deep().localName)})`);
      }
      el("#st-menu-btn").closest("wa-dropdown").open = false;
      await wait(300);
      bed.set({ aside: true });
      if (!(await until(() => el('[data-kit="SidePanel"][role="complementary"]'), 1500))) return fail(1, "non-modal SidePanel did not open");
      bed.set({ aside: false });
      await wait(400);
      // S2 with the opener removed: focus goes to the page h1.
      el("#st-opener-gone").focus();
      bed.set({ gone: true });
      const g = () => el('[data-st="Gone"] wa-dialog');
      if (!(await until(() => g().open, 2000))) return fail(1, "Gone dialog did not open");
      bed.set({ goneHidden: true });
      await wait(100);
      bed.set({ gone: false });
      if (!(await until(() => deep() && deep().hasAttribute("data-kit-h1"), 2500))) return fail(2, `opener gone: focus on ${deep() && (deep().id || deep().localName)}, not the h1`);
      // S4: a popover inside a modal: the first Escape closes only the popover.
      bed.set({ dlg: true });
      await until(() => el('[data-st="Dialog"] wa-dialog').open, 2000);
      await wait(300);
      bed.set({ popIn: true });
      if (!(await until(() => [...document.querySelectorAll('[data-st="Dialog"] wa-popover')].some((p) => p.open), 2000))) return fail(4, "inner popover did not open");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await wait(400);
      if ([...document.querySelectorAll('[data-st="Dialog"] wa-popover')].some((p) => p.open)) return fail(4, "Escape did not close the popover");
      if (!el('[data-st="Dialog"] wa-dialog').open) return fail(4, "Escape closed the dialog under the popover");
      bed.set({ dlg: false, popIn: false });
      await wait(500);
      // S6: toasts.
      A.toast("Self-test toast", { ms: 600 });
      A.toast("Self-test action", { action: { label: "Undo", run: () => {} } });
      await wait(1400);
      const msgs = () => [...document.querySelectorAll("wa-toast-item")].map((x) => x.textContent);
      if (msgs().some((m) => m.includes("Self-test toast"))) return fail(6, "plain toast still shown after its time");
      await wait(10000);
      if (!msgs().some((m) => m.includes("Self-test action"))) return fail(6, "action toast left before 10 s");
      // S7: routes.
      A.go("kit-selftest-a");
      if (!(await until(() => el('[data-screen="kit-selftest-a"]'), 2000))) return fail(7, "page a did not open");
      await wait(300);
      const sc = () => document.getElementById("kit-content");
      el("#st-go-a").focus({ preventScroll: true });
      sc().scrollTop = 400;
      await wait(50);
      const left = sc().scrollTop;
      A.go("kit-selftest-b");
      if (!(await until(() => el('[data-screen="kit-selftest-b"]'), 2000))) return fail(7, "page b did not open");
      await wait(400);
      if (sc().scrollTop !== 0) return fail(7, "forward route kept the scroll " + sc().scrollTop);
      if (!(deep() && deep().hasAttribute("data-kit-h1"))) return fail(7, "forward route: focus not on the h1");
      A.back();
      if (!(await until(() => el('[data-screen="kit-selftest-a"]'), 2000))) return fail(7, "back did not return");
      await wait(400);
      if (Math.abs(sc().scrollTop - left) > 2) return fail(7, `back did not restore the scroll (${sc().scrollTop} vs ${left})`);
      if (!(deep() && deep().id === "st-go-a")) return fail(7, "back: focus not on the opener");
      root.dataset.selftest = "pass";
    } catch (e) {
      fail(0, (e && e.message) || e);
    }
  }
  registerInternal("kit-selftest", Bed, { name: "Kit self-test" });
  registerInternal("kit-selftest-a", () => html`<${Page} which="a" />`, { name: "Self-test a" });
  registerInternal("kit-selftest-b", () => html`<${Page} which="b" />`, { name: "Self-test b" });

  KIT.audit = Object.assign(KIT.audit || {}, { Gallery, registerInternal, afterReady, run, selftest });
})();
