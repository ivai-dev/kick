// audit.js — kit checks that run inside the page (KIT.audit): the overlay gallery route #kit-overlays (the
// regression page test/overlays.html and the CDP script drive it). The runtime audit and the #kit-selftest
// route are added in the next step. Internal routes are not in data-screens, the screen index or any menu.
// Core file.
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

  KIT.audit = Object.assign(KIT.audit || {}, { Gallery, registerInternal });
})();
