// core.js — the KIT namespace: Preact and htm wiring, error capture for headless checks,
// project configuration (window.KIT_CONFIG from js/config.js), the screen registry,
// the app context and small helpers. Loaded right after route.js; every later file
// reads window.KIT. Core file: projects do not edit it (see README.md).
(function () {
  "use strict";
  const KIT = (window.KIT = window.KIT || {});
  const root = document.documentElement;

  /* ---------------- Error capture ---------------- */
  // Script errors, rejected promises and Preact render errors land on <html data-err>
  // (first 200 characters), so a headless check fails the route instead of passing a
  // broken page. Registered before any project module loads, so a module that throws
  // while loading is reported too.
  const stampErr = (msg) => {
    root.dataset.err = String(msg == null ? "unknown error" : msg).slice(0, 200);
  };
  window.addEventListener("error", (e) => stampErr(e.message || (e.error && e.error.message) || "script error"));
  window.addEventListener("unhandledrejection", (e) => stampErr((e.reason && e.reason.message) || e.reason));
  // Preact reports render errors through its internal catch hook (options.__e) and may
  // leave the tree empty without a window error event; record those as well.
  const preactCatch = preact.options.__e;
  preact.options.__e = function (err) {
    stampErr((err && err.message) || err);
    if (preactCatch) return preactCatch.apply(this, arguments);
    throw err;
  };

  /* ---------------- Preact and htm ---------------- */
  const { h, render, createContext, Component, Fragment } = preact;
  const hooks = preactHooks; // useState, useEffect, useRef, useMemo, useCallback, useContext, useLayoutEffect
  const html = htm.bind(h);

  /* ---------------- Configuration ---------------- */
  // window.KIT_CONFIG = { product, roles: [{ id, name, home, shell?, tabs? }], releases, platforms,
  //   defaultRole, locale?, lang?, strings?, site? }.
  //   shell: "app" (default: sidebar work tool) or "site" (public site: top menu, footer, phone tab bar).
  //   tabs: screen ids of the phone bottom bar of a site role.
  //   site: { org, account, signIn: [{ label, go }], signOut, footer: [lines] } (see shell.js).
  //   lang: the kit's own words ("en", "vi"); defaults to the language of the locale.
  //   strings: { key: text } overrides single kit strings (see KIT.t).
  // Missing values fall back to a one-role web prototype, so the bare kit still renders.
  const PLATFORMS = ["web", "windows", "android"];
  function config() {
    const c = window.KIT_CONFIG || {};
    const roles = Array.isArray(c.roles) && c.roles.length ? c.roles : [{ id: "user", name: "User", home: null }];
    const releases = Array.isArray(c.releases) && c.releases.length ? c.releases.map(String) : ["MVP"];
    const platforms = Array.isArray(c.platforms) && c.platforms.length ? c.platforms.filter((p) => PLATFORMS.includes(p)) : ["web"];
    const locale = c.locale || "en-US";
    const L = KIT.logic || {};
    return {
      product: c.product || "Prototype",
      roles,
      releases,
      platforms: platforms.length ? platforms : ["web"],
      defaultRole: roles.some((r) => r.id === c.defaultRole) ? c.defaultRole : roles[0].id,
      locale,
      lang: c.lang || String(locale).slice(0, 2).toLowerCase(),
      strings: c.strings || {},
      site: c.site || {},
      // density: the default density per shell ({ app, site, phone, windows }); roles[].density overrides.
      density: Object.assign({}, L.DENSITY_DEFAULTS || {}, c.density || {}),
      // fonts: Google Fonts css2 URLs; the first replaces the kit's Inter link, the others are added.
      fonts: Array.isArray(c.fonts) ? c.fonts.filter((u) => typeof u === "string") : [],
      // audit: runtime audit thresholds (change only with the project lead's yes).
      audit: Object.assign({}, L.AUDIT_DEFAULTS || {}, c.audit || {}),
    };
  }
  // Document attributes from the configuration, before the first render (main.js calls it once):
  // <html lang data-lang data-density> and the font links of KIT_CONFIG.fonts.
  function applyDocConfig() {
    const cfg = config();
    root.lang = cfg.lang;
    root.dataset.lang = cfg.lang;
    if (!root.dataset.density) root.dataset.density = cfg.density.app || "compact";
    const fonts = cfg.fonts.filter((u) => /^https:\/\/fonts\.googleapis\.com\/css2\?/.test(u));
    if (fonts.length) {
      const link = document.getElementById("kit-fonts");
      if (link) link.href = fonts[0];
      for (const href of fonts.slice(1)) {
        if (document.querySelector(`link[href="${CSS.escape(href)}"]`)) continue;
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = href;
        document.head.appendChild(l);
      }
    }
  }
  const roleDef = (id) => config().roles.find((r) => r.id === id) || {};

  /* ---------------- Kit strings ---------------- */
  // Every word the kit itself shows (in the product area and in the prototype chrome) goes through
  // KIT.t(key, vars). Packs: en, vi; KIT_CONFIG.strings overrides single keys. "{name}" in a text is
  // replaced by vars.name.
  const PACKS = {
    en: {
      "table.empty": "Nothing here yet.", "kpi.noChange": "No change", "kpi.up": "Up", "kpi.down": "Down",
      "kpi.good": ", good:", "kpi.bad": ", needs attention:", "info.more": "More information", "close": "Close",
      "dismiss": "Dismiss", "back": "Back", "screen": "Screen", "placeholder.title": "Being designed",
      "denied.title": "Not available for {who}", "denied.home": "Go to {who} home", "denied.text": "{name} ({code}) is for {allowed}.",
      "notfound.title": "No such screen", "notfound.back": "Back to the start", "notfound.text": "Nothing is registered as {id}.",
      "rel.in": "In {r}", "rel.arrives": "Arrives in {r}", "rel.screen": "This screen arrives in {r}.", "rel.notIn": "Not in {first}.",
      "chart.noData": "No data yet", "chart.value": "Value", "chart.column": "Column chart", "chart.line": "Line chart", "chart.donut": "Donut chart",
      "chart.barSummary": "{label}: {n} columns from {first} to {last}; highest {maxLabel} {maxValue}; latest {lastValue}.",
      "chart.lineSeries": "{name} from {from} ({firstLabel}) to {to} ({lastLabel})",
      "scn.region": "Guided scenario", "scn.step": "Step {n} of {total}", "scn.playing": " · playing", "scn.close": "Close scenario",
      "scn.stop": "Stop", "scn.prev": "Previous", "scn.next": "Next", "scn.steps": "{n} steps", "scn.play": "Play",
      "proto.controls": "Prototype controls", "proto.tag": "Prototype", "proto.start": "Roles and scenarios", "proto.role": "Role",
      "proto.platform": "Platform", "proto.scope": "Release scope", "proto.theme": "Theme", "proto.screens": "Screens",
      "proto.noScreens": "No screens registered yet.", "lens.full": "Full product", "lens.tags": "Release tags", "lens.mvp": "{r} only",
      "theme.light": "Light", "theme.dark": "Dark", "theme.system": "System", "theme.toLight": "Light theme", "theme.toDark": "Dark theme",
      "start.title": "Choose a role to explore the product", "start.lead": "Clickable prototype of the full product, every role and release. Sample data only.",
      "start.roles": "Roles", "start.startsOn": "Starts on {name} ({code})", "start.noRoleScreens": "No screens for this role yet",
      "start.open": "Open", "start.unavailable": "Not available", "start.scenarios": "Guided scenarios", "start.noScenarios": "No guided scenarios yet.",
      "start.footer": "Synthetic sample data. Nothing you enter leaves this page.",
      "nav.main": "Main navigation", "nav.closeMenu": "Close menu", "nav.openMenu": "Open navigation", "nav.collapse": "Collapse sidebar",
      "nav.expand": "Expand sidebar", "nav.arrives": "{name} · arrives in {r}", "nav.roleSwitch": "Role: {role}. Switch role", "nav.switchRole": "Switch role",
      "site.menu": "Menu", "site.account": "Account", "site.signOut": "Sign out", "site.home": "Home",
      "app.noScreensRole": "No screens for {role} yet.", "app.noPlatform": "No {platform} screens for {role}.", "app.title": "{product} · Prototype",
      "win.minimise": "Minimise", "win.restore": "Restore down", "win.maximise": "Maximise", "win.open": "Open {p}", "win.exit": "Exit",
      "win.window": "{p} window", "win.minimised": "{p} is minimised. Open it again from the taskbar.", "win.taskbar": "Windows taskbar (simulated)",
      "win.tray": "{p} in the tray", "win.trayMenu": "{p} tray menu",
      "app.screenTitle": "{screen} · {product}", "loading": "Working…", "more": "More actions", "tip.more": "More actions: {object}",
      "confirm.cancel": "Cancel", "confirm.type": "Type “{expected}” to confirm", "confirm.typeWhy": "Type “{expected}” exactly to continue",
      "discard.q": "Discard changes?", "discard.c": "Unsaved changes will be lost.", "discard.keep": "Keep editing", "discard.ok": "Discard changes",
      "panel.expand": "Open the full page", "panel.pager": "{index}/{total}", "panel.prev": "Previous item", "panel.next": "Next item",
      "info.label": "Explanation: {label}", "proto.density": "Density", "density.compact": "Compact", "density.comfortable": "Comfortable",
      "proto.search": "Find a screen", "proto.noMatch": "No matching screen",
      "period.week": "Week {n}/{y}", "period.month": "{n}/{y}", "period.quarter": "Q{n} {y}", "period.year": "{y}",
      "field.optional": "(optional)", "num.dec": "Decrease", "num.inc": "Increase", "combo.empty": "No match for “{q}”",
      "combo.remove": "Remove {label}", "combo.recent": "Recent", "combo.count": "{n} results",
      "date.pick": "Choose a date", "date.invalid": "Enter a real date, for example {example}", "date.range": "Choose a date from {min} to {max}",
      "date.day": "Day", "date.month": "Month", "date.year": "Year", "date.prevMonth": "Previous month", "date.nextMonth": "Next month",
      "date.weekdays": "Mo,Tu,We,Th,Fr,Sa,Su", "date.presetDays": "{n} days", "date.today": "Today",
      "period.compare.prev": "vs the previous period", "period.compare.yoy": "vs the same period last year", "period.apply": "Apply",
      "period.granularity": "Period", "gran.day": "Day", "gran.week": "Week", "gran.month": "Month", "gran.quarter": "Quarter", "gran.year": "Year",
      "period.from": "From", "period.to": "To",
      "check.all": "Select all", "file.hint": "PDF or image, up to {size}", "file.choose": "Choose files", "file.drop": "or drop them here",
      "file.remove": "Remove {name}", "file.tooBig": "{name} is larger than {size}", "file.badType": "{name} is not an accepted file type",
      "file.uploading": "Uploading {name}", "file.done": "Uploaded", "file.tooMany": "At most {n} files",
      "filter.remove": "Remove filter {label}", "stepper.live": "Step {n} of {total} · {label}",
      "pager.label": "Pagination", "pager.prev": "Previous page", "pager.next": "Next page", "pager.range": "{from}–{to} / {total}",
      "pager.size": "Rows per page", "pager.more": "Show {size} more {unit}", "pager.newer": "Newer", "pager.older": "Older", "pager.page": "Page {n}",
      "errors.title": "{n} things to fix", "meter.text": "{value} of {max}", "job.continue": "You can carry on; you will be told when it is done",
      "job.retry": "Try again", "job.failed": "Stopped at: {step}", "job.done": "Done", "section.all": "See all",
      "dt.sortedBy": "Sorted by {col}, {dir}", "dt.asc": "ascending", "dt.desc": "descending", "dt.sortBy": "Sort by {col}",
      "dt.select": "Select {name}", "dt.selectPage": "Select the whole page", "dt.selectAll": "Select all {count} {unit} that match",
      "dt.allSelected": "All {count} {unit} that match are selected", "dt.columns": "Columns", "dt.error": "The list did not load.",
      "dt.expand": "Expand {name}", "dt.collapse": "Collapse {name}", "dt.total": "{n} {unit}", "dt.actions": "Actions",
      "dt.cleared": "Selection cleared because the filter changed", "dt.rows": "rows",
      "filter.search": "Search", "filter.clear": "Clear filters", "filter.more": "More filters", "filter.button": "Filters",
      "filter.show": "Show {n} {unit}", "filter.all": "All", "filter.sort": "Sort", "filter.results": "{n} {unit}",
      "bulk.region": "Actions on selected items", "bulk.count": "{n} selected", "bulk.clear": "Clear selection",
      "views.save": "Save filters", "views.more": "More", "views.name": "Name", "views.delete": "Delete {name}", "views.label": "Saved views",
      "keys.help": "Keyboard shortcuts", "keys.toggle": "Use keyboard shortcuts",
      "reorder.moved": "Moved {name} to position {n} of {total}", "reorder.up": "Move up", "reorder.down": "Move down", "reorder.top": "Move to top",
      "reorder.handle": "Reorder {name}", "reorder.lifted": "{name} lifted. Arrow keys move it, Space drops it, Escape cancels.",
      "settings.search": "Find a setting", "settings.reset": "Restore default", "settings.changed": "Changed", "settings.groups": "Settings sections",
      "chart.view": "Chart", "chart.table": "Table", "chart.views": "View", "chart.download": "Download", "chart.png": "Image (PNG)",
      "chart.excel": "Excel (.xlsx)", "chart.source": "Source: {source}", "chart.funnel": "Funnel", "chart.kept": "{pct} kept", "chart.ranking": "Ranking",
      "chart.grouped": "Grouped columns", "chart.stacked": "Stacked columns",
    },
    vi: {
      "table.empty": "Chưa có dữ liệu.", "kpi.noChange": "Không đổi", "kpi.up": "Tăng", "kpi.down": "Giảm",
      "kpi.good": ", tốt:", "kpi.bad": ", cần chú ý:", "info.more": "Thông tin thêm", "close": "Đóng",
      "dismiss": "Ẩn", "back": "Quay lại", "screen": "Màn hình", "placeholder.title": "Đang thiết kế",
      "denied.title": "Vai trò {who} không mở được màn hình này", "denied.home": "Về trang đầu của {who}", "denied.text": "{name} ({code}) dành cho: {allowed}.",
      "notfound.title": "Không có màn hình này", "notfound.back": "Về trang bắt đầu", "notfound.text": "Không có màn hình nào tên {id}.",
      "rel.in": "Có trong {r}", "rel.arrives": "Có từ {r}", "rel.screen": "Màn hình này có từ {r}.", "rel.notIn": "Không có trong {first}.",
      "chart.noData": "Chưa có số liệu", "chart.value": "Giá trị", "chart.column": "Biểu đồ cột", "chart.line": "Biểu đồ đường", "chart.donut": "Biểu đồ tròn",
      "chart.barSummary": "{label}: {n} cột, từ {first} đến {last}; cao nhất {maxLabel} {maxValue}; mới nhất {lastValue}.",
      "chart.lineSeries": "{name} từ {from} ({firstLabel}) đến {to} ({lastLabel})",
      "scn.region": "Kịch bản demo", "scn.step": "Bước {n}/{total}", "scn.playing": " · đang chạy", "scn.close": "Đóng kịch bản",
      "scn.stop": "Dừng", "scn.prev": "Bước trước", "scn.next": "Bước sau", "scn.steps": "{n} bước", "scn.play": "Chạy",
      "proto.controls": "Điều khiển bản mẫu", "proto.tag": "Bản mẫu", "proto.start": "Vai trò và kịch bản", "proto.role": "Vai trò",
      "proto.platform": "Nền tảng", "proto.scope": "Phạm vi giai đoạn", "proto.theme": "Giao diện", "proto.screens": "Màn hình",
      "proto.noScreens": "Chưa có màn hình nào.", "lens.full": "Toàn bộ sản phẩm", "lens.tags": "Nhãn giai đoạn", "lens.mvp": "Chỉ {r}",
      "theme.light": "Sáng", "theme.dark": "Tối", "theme.system": "Theo máy", "theme.toLight": "Giao diện sáng", "theme.toDark": "Giao diện tối",
      "start.title": "Chọn một vai trò để xem sản phẩm", "start.lead": "Bản mẫu bấm thử của toàn bộ sản phẩm, đủ mọi vai trò và giai đoạn. Chỉ dùng dữ liệu mẫu.",
      "start.roles": "Vai trò", "start.startsOn": "Mở đầu ở {name} ({code})", "start.noRoleScreens": "Vai trò này chưa có màn hình",
      "start.open": "Mở", "start.unavailable": "Chưa có", "start.scenarios": "Kịch bản demo", "start.noScenarios": "Chưa có kịch bản demo.",
      "start.footer": "Dữ liệu mẫu. Mọi thứ bạn nhập chỉ nằm trên trang này.",
      "nav.main": "Điều hướng chính", "nav.closeMenu": "Đóng menu", "nav.openMenu": "Mở menu", "nav.collapse": "Thu gọn menu",
      "nav.expand": "Mở rộng menu", "nav.arrives": "{name} · có từ {r}", "nav.roleSwitch": "Vai trò: {role}. Đổi vai trò", "nav.switchRole": "Đổi vai trò",
      "site.menu": "Menu", "site.account": "Tài khoản", "site.signOut": "Đăng xuất", "site.home": "Trang chủ",
      "app.noScreensRole": "Vai trò {role} chưa có màn hình.", "app.noPlatform": "Vai trò {role} chưa có màn hình {platform}.", "app.title": "{product} · Bản mẫu",
      "win.minimise": "Thu nhỏ", "win.restore": "Thu cửa sổ", "win.maximise": "Phóng to", "win.open": "Mở {p}", "win.exit": "Thoát",
      "win.window": "Cửa sổ {p}", "win.minimised": "{p} đang thu nhỏ. Mở lại từ thanh tác vụ.", "win.taskbar": "Thanh tác vụ Windows (mô phỏng)",
      "win.tray": "{p} ở khay hệ thống", "win.trayMenu": "Menu khay của {p}",
      "app.screenTitle": "{screen} · {product}", "loading": "Đang xử lý…", "more": "Thao tác khác", "tip.more": "Thao tác khác: {object}",
      "confirm.cancel": "Hủy", "confirm.type": "Nhập “{expected}” để xác nhận", "confirm.typeWhy": "Nhập đúng “{expected}” để tiếp tục",
      "discard.q": "Bỏ thay đổi?", "discard.c": "Các thay đổi chưa lưu sẽ mất.", "discard.keep": "Tiếp tục sửa", "discard.ok": "Bỏ thay đổi",
      "panel.expand": "Mở trang đầy đủ", "panel.pager": "{index}/{total}", "panel.prev": "Mục trước", "panel.next": "Mục sau",
      "info.label": "Giải thích: {label}", "proto.density": "Mật độ", "density.compact": "Gọn", "density.comfortable": "Thoải mái",
      "proto.search": "Tìm màn hình", "proto.noMatch": "Không có màn hình phù hợp",
      "period.week": "Tuần {n}/{y}", "period.month": "Tháng {n}/{y}", "period.quarter": "Quý {n}/{y}", "period.year": "Năm {y}",
      "field.optional": "(không bắt buộc)", "num.dec": "Giảm", "num.inc": "Tăng", "combo.empty": "Không tìm thấy “{q}”",
      "combo.remove": "Bỏ chọn {label}", "combo.recent": "Gần đây", "combo.count": "{n} kết quả",
      "date.pick": "Chọn ngày", "date.invalid": "Ngày không đúng, ví dụ {example}", "date.range": "Chọn ngày từ {min} đến {max}",
      "date.day": "Ngày", "date.month": "Tháng", "date.year": "Năm", "date.prevMonth": "Tháng trước", "date.nextMonth": "Tháng sau",
      "date.weekdays": "T2,T3,T4,T5,T6,T7,CN", "date.presetDays": "{n} ngày", "date.today": "Hôm nay",
      "period.compare.prev": "so với kỳ trước", "period.compare.yoy": "so với cùng kỳ năm trước", "period.apply": "Áp dụng",
      "period.granularity": "Kỳ", "gran.day": "Ngày", "gran.week": "Tuần", "gran.month": "Tháng", "gran.quarter": "Quý", "gran.year": "Năm",
      "period.from": "Từ ngày", "period.to": "Đến ngày",
      "check.all": "Chọn tất cả", "file.hint": "PDF hoặc ảnh, tối đa {size}", "file.choose": "Chọn tệp", "file.drop": "hoặc kéo thả vào đây",
      "file.remove": "Xóa tệp {name}", "file.tooBig": "{name} lớn hơn {size}", "file.badType": "{name} không đúng loại tệp",
      "file.uploading": "Đang tải lên {name}", "file.done": "Đã tải lên", "file.tooMany": "Tối đa {n} tệp",
      "filter.remove": "Bỏ lọc {label}", "stepper.live": "Bước {n}/{total} · {label}",
      "pager.label": "Phân trang", "pager.prev": "Trang trước", "pager.next": "Trang sau", "pager.range": "{from}–{to} / {total}",
      "pager.size": "Số dòng mỗi trang", "pager.more": "Xem thêm {size} {unit}", "pager.newer": "Mới hơn", "pager.older": "Cũ hơn", "pager.page": "Trang {n}",
      "errors.title": "Có {n} mục cần sửa", "meter.text": "{value} trên {max}", "job.continue": "Bạn có thể tiếp tục, hệ thống sẽ báo khi xong",
      "job.retry": "Thử lại", "job.failed": "Không xong ở bước: {step}", "job.done": "Đã xong", "section.all": "Xem tất cả",
      "dt.sortedBy": "Sắp xếp theo {col}, {dir}", "dt.asc": "tăng dần", "dt.desc": "giảm dần", "dt.sortBy": "Sắp xếp theo {col}",
      "dt.select": "Chọn {name}", "dt.selectPage": "Chọn cả trang", "dt.selectAll": "Chọn tất cả {count} {unit} theo bộ lọc",
      "dt.allSelected": "Đã chọn tất cả {count} {unit} theo bộ lọc", "dt.columns": "Cột", "dt.error": "Không tải được danh sách.",
      "dt.expand": "Mở rộng {name}", "dt.collapse": "Thu gọn {name}", "dt.total": "{n} {unit}", "dt.actions": "Thao tác",
      "dt.cleared": "Đã bỏ chọn vì bộ lọc thay đổi", "dt.rows": "dòng",
      "filter.search": "Tìm", "filter.clear": "Xóa bộ lọc", "filter.more": "Thêm bộ lọc", "filter.button": "Bộ lọc",
      "filter.show": "Xem {n} {unit}", "filter.all": "Tất cả", "filter.sort": "Sắp xếp", "filter.results": "{n} {unit}",
      "bulk.region": "Thao tác với mục đã chọn", "bulk.count": "Đã chọn {n}", "bulk.clear": "Bỏ chọn",
      "views.save": "Lưu bộ lọc", "views.more": "Thêm", "views.name": "Tên bộ lọc", "views.delete": "Xóa bộ lọc {name}", "views.label": "Bộ lọc đã lưu",
      "keys.help": "Phím tắt", "keys.toggle": "Dùng phím tắt",
      "reorder.moved": "Đã chuyển {name} đến vị trí {n}/{total}", "reorder.up": "Lên", "reorder.down": "Xuống", "reorder.top": "Đưa lên đầu",
      "reorder.handle": "Đổi vị trí {name}", "reorder.lifted": "Đã chọn {name}. Dùng phím mũi tên để chuyển, Space để thả, Esc để hủy.",
      "settings.search": "Tìm cài đặt", "settings.reset": "Khôi phục mặc định", "settings.changed": "Đã đổi", "settings.groups": "Nhóm cài đặt",
      "chart.view": "Biểu đồ", "chart.table": "Bảng", "chart.views": "Cách xem", "chart.download": "Tải xuống", "chart.png": "Ảnh (PNG)",
      "chart.excel": "Excel (.xlsx)", "chart.source": "Nguồn: {source}", "chart.funnel": "Phễu", "chart.kept": "giữ lại {pct}", "chart.ranking": "Xếp hạng",
      "chart.grouped": "Biểu đồ cột nhóm", "chart.stacked": "Biểu đồ cột chồng",
    },
  };
  function t(key, vars) {
    const cfg = config();
    const pack = PACKS[cfg.lang] || PACKS.en;
    const raw = cfg.strings[key] != null ? cfg.strings[key] : pack[key] != null ? pack[key] : PACKS.en[key] != null ? PACKS.en[key] : key;
    return vars ? String(raw).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : raw;
  }
  // Problems a check should fail on: role ids that the hash parser cannot read, and
  // screens that name a role, platform or release the configuration does not have.
  function configProblems() {
    const cfg = config();
    const ids = cfg.roles.map((r) => r.id);
    for (const id of ids) if (!/^[a-z0-9]+$/.test(id)) return `config: role id "${id}" must be lowercase letters and digits`;
    for (const r of cfg.roles) if (r.home && !KIT.screens[r.home]) return `config: home of ${r.id} is not a registered screen (${r.home})`;
    for (const s of Object.values(KIT.screens)) {
      if (s.internal) continue;
      const role = s.roles.find((r) => !ids.includes(r));
      if (role) return `screen ${s.id}: unknown role ${role}`;
      const plat = s.platforms.find((p) => !PLATFORMS.includes(p));
      if (plat) return `screen ${s.id}: unknown platform ${plat}`;
      if (!cfg.releases.includes(s.rel)) return `screen ${s.id}: unknown release ${s.rel}`;
    }
    return null;
  }

  /* ---------------- Screen registry ---------------- */
  // KIT.register(id, { comp, code, name, roles?, platforms?, rel?, nav?, icon?, menu?, bare? }).
  // Defaults: every role, web only, the first release. nav is the sidebar (or phone
  // tab bar) section label; a screen without nav is reached only through links. In the site
  // shell, screens with nav form the top menu (menu overrides the label) except the account
  // group (KIT_CONFIG.site.account). bare: see isBare.
  const screens = (KIT.screens = KIT.screens || {});
  function register(id, def) {
    const cfg = config();
    const d = def || {};
    screens[id] = Object.assign({ code: id.toUpperCase(), name: id }, d, {
      id,
      roles: Array.isArray(d.roles) && d.roles.length ? d.roles.slice() : cfg.roles.map((r) => r.id),
      platforms: Array.isArray(d.platforms) && d.platforms.length ? d.platforms.slice() : ["web"],
      rel: d.rel ? String(d.rel) : cfg.releases[0],
    });
    return screens[id];
  }
  const canOpen = (id, role) => !!screens[id] && screens[id].roles.includes(role);
  // A bare screen renders on the stage without any shell (a device frame, a full-screen start).
  // bare: true, or (params, role) => boolean.
  function isBare(id, params, role) {
    const s = screens[id];
    if (!s || !s.bare) return false;
    try {
      return typeof s.bare === "function" ? !!s.bare(params || {}, role) : !!s.bare;
    } catch (e) {
      return false;
    }
  }
  // A role's home: its configured home when it may open it, else the first screen it may open.
  function homeOf(role) {
    const r = config().roles.find((x) => x.id === role);
    if (r && r.home && canOpen(r.home, role)) return r.home;
    const first = Object.values(screens).find((s) => !s.internal && s.roles.includes(role));
    return first ? first.id : null;
  }
  const roleName = (id) => {
    const r = config().roles.find((x) => x.id === id);
    return r ? r.name : id;
  };

  /* ---------------- Helpers ---------------- */
  const cx = (...a) => a.filter(Boolean).join(" ");
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("kit-" + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("kit-" + k, JSON.stringify(v));
      } catch (e) {
        /* storage unavailable (private window, sandboxed frame) */
      }
    },
  };
  const reduced = () => {
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  };
  const nf = (v, d = 1) => (v == null || isNaN(v) ? "—" : Number(v).toLocaleString(config().locale, { maximumFractionDigits: d }));
  // Motion tokens in ms and px, read from the CSS (one source with the stylesheet).
  function motion() {
    const cs = getComputedStyle(document.documentElement);
    const ms = (n, d) => {
      const v = cs.getPropertyValue(n).trim();
      if (!v) return d;
      return v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : parseFloat(v) || d;
    };
    const px = (n, d) => parseFloat(cs.getPropertyValue(n)) || d;
    return { d1: ms("--dur-1", 100), d2: ms("--dur-2", 150), d3: ms("--dur-3", 200), d4: ms("--dur-4", 250), d5: ms("--dur-5", 300), shift1: px("--shift-1", 4), shift2: px("--shift-2", 8) };
  }
  // Resolves after the next render has painted (two animation frames).
  const afterRender = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  function debounce(fn, ms = 300) {
    let tm = null;
    const d = (...a) => { clearTimeout(tm); tm = setTimeout(() => fn(...a), ms); };
    d.cancel = () => clearTimeout(tm);
    return d;
  }
  // FLIP: records the children of `container` (keyed by data-key), awaits mutate() (a promise resolved
  // after the new render, e.g. KIT.util.afterRender()), then moves each child from its old place to the new
  // one; new children fade in. No-op under reduced motion.
  async function flip(container, mutate, ms) {
    if (!container) { await mutate(); return; }
    const before = new Map();
    for (const el of container.children) if (el.dataset && el.dataset.key != null) before.set(el.dataset.key, el.getBoundingClientRect());
    await mutate();
    if (reduced()) return;
    const dur = ms == null ? motion().d3 : ms;
    for (const el of container.children) {
      const key = el.dataset && el.dataset.key;
      if (key == null) continue;
      const old = before.get(key);
      if (!old) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion().d2, easing: "cubic-bezier(0, 0, 0, 1)" });
        continue;
      }
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left, dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: dur, easing: "cubic-bezier(.2, 0, 0, 1)" });
    }
  }
  // Takes a leaving element out of the flow at its place, fades it out and removes the clone.
  function collapseOut(el, ms) {
    if (!el || !el.parentElement) return Promise.resolve();
    if (reduced()) return Promise.resolve();
    const r = el.getBoundingClientRect();
    const host = el.offsetParent || document.body;
    const hr = host.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    Object.assign(ghost.style, { position: "absolute", left: r.left - hr.left + host.scrollLeft + "px", top: r.top - hr.top + host.scrollTop + "px", width: r.width + "px", height: r.height + "px", margin: "0", pointerEvents: "none" });
    ghost.setAttribute("aria-hidden", "true");
    host.appendChild(ghost);
    const a = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms == null ? motion().d2 : ms, easing: "cubic-bezier(.3, 0, 1, 1)" });
    return a.finished.catch(() => {}).then(() => ghost.remove());
  }

  /* ---------------- App context ---------------- */
  // KIT.useApp() -> { role, theme, resolved, lens, platform, params, screen, narrow, layout,
  //   go, back, toast, setRole, setTheme, setLens, setPlatform, ... } (filled by main.js).
  const Ctx = createContext(null);
  const useApp = () => hooks.useContext(Ctx);

  // The UI library behind KIT.ui (index.html loads it; every URL there carries this version).
  const lib = {
    name: "@awesome.me/webawesome", version: "3.14.0",
    tags: ["dialog", "drawer", "dropdown", "dropdown-item", "tooltip", "popover", "popup", "toast", "toast-item",
      "tab-group", "tab", "tab-panel", "radio-group", "radio"],
  };

  Object.assign(KIT, {
    lib,
    h, render, Component, Fragment, hooks, html,
    Ctx, useApp, register, screens, config, configProblems, homeOf, canOpen, roleName, roleDef, isBare, t, applyDocConfig,
    stampErr, PLATFORMS,
    D: KIT.D || null, // sample data, set by js/data.js
    ui: KIT.ui || {},
    charts: KIT.charts || {},
    util: Object.assign(KIT.util || {}, { cx, store, reduced, nf, motion, afterRender, debounce, flip, collapseOut }),
    // Navigate from anywhere (a screen module, a scenario step); main.js sets KIT._api.
    go: (id, params, o) => (KIT._api ? KIT._api.go(id, params, o) : undefined),
  });
})();
