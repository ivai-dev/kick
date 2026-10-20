const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../js/logic.js");

test("fold removes diacritics and case", () => {
  assert.equal(L.fold("Xã Hòa Mỹ"), "xa hoa my");
  assert.equal(L.fold("Đ/đ"), "d/d");
  assert.equal(L.fold("  Cà   Mau "), "ca mau");
  assert.equal(L.fold(null), "");
});

test("matchOptions orders prefix, word start, substring", () => {
  const opts = ["Xã Hòa Mỹ", "Hòa Thành", "Phường Tân Thành", "Cà Mau", "Xã Tân Hòa"].map((label) => ({ label }));
  assert.deepEqual(L.matchOptions("hoa", opts).map((o) => o.label), ["Hòa Thành", "Xã Hòa Mỹ", "Xã Tân Hòa"]);
  assert.deepEqual(L.matchOptions("hoa my", opts).map((o) => o.label), ["Xã Hòa Mỹ"]);
  assert.deepEqual(L.matchOptions("ca mau", opts).map((o) => o.label), ["Cà Mau"]);
  assert.deepEqual(L.matchOptions("anh", opts).map((o) => o.label), ["Hòa Thành", "Phường Tân Thành"]);
  assert.equal(L.matchOptions("", opts).length, 5);
  assert.deepEqual(L.matchOptions("mau", ["Cà Mau", "Mau lẹ"]), ["Mau lẹ", "Cà Mau"]);
});

test("resolveDensity matrix", () => {
  const r = L.resolveDensity;
  // defaults per shell
  assert.equal(r({ shell: "app", layout: "web" }), "compact");
  assert.equal(r({ shell: "site", layout: "web" }), "comfortable");
  assert.equal(r({ shell: "app", layout: "windows" }), "compact");
  assert.equal(r({ shell: "app", layout: "phone-frame" }), "touch");
  assert.equal(r({ shell: "site", layout: "phone-native", narrow: true }), "touch");
  // narrow and coarse
  assert.equal(r({ shell: "app", layout: "web", narrow: true }), "touch");
  assert.equal(r({ shell: "site", layout: "web", narrow: true }), "touch");
  assert.equal(r({ shell: "site", layout: "web", coarse: true }), "touch");
  assert.equal(r({ shell: "app", layout: "web", coarse: true }), "compact");
  // user override: app shell only
  assert.equal(r({ shell: "app", layout: "web", user: "comfortable" }), "comfortable");
  assert.equal(r({ shell: "site", layout: "web", user: "compact" }), "comfortable");
  assert.equal(r({ shell: "app", layout: "web", user: "kiosk" }), "compact");
  // role and screen
  assert.equal(r({ shell: "app", layout: "web", roleDensity: "comfortable" }), "comfortable");
  assert.equal(r({ shell: "app", layout: "web", narrow: true, roleDensity: "comfortable" }), "touch");
  assert.equal(r({ shell: "site", layout: "web", screenDensity: "compact", narrow: true }), "compact");
  // frames win
  assert.equal(r({ shell: "site", layout: "web", frame: "kiosk", screenDensity: "compact" }), "kiosk");
  // configured defaults
  assert.equal(r({ shell: "app", layout: "web", config: { app: "comfortable" } }), "comfortable");
  assert.equal(r({ shell: "site", layout: "web", config: { site: "bogus" } }), "comfortable");
});

test("windowClass boundaries", () => {
  const w = L.windowClass;
  assert.deepEqual([599, 600, 839, 840, 1199, 1200, 1599, 1600].map(w),
    ["compact", "medium", "medium", "expanded", "expanded", "large", "large", "xlarge"]);
});

test("toastMs", () => {
  assert.equal(L.toastMs("Đã lưu."), 5000);
  assert.equal(L.toastMs("x".repeat(80)), 5000);
  assert.equal(L.toastMs("x".repeat(120)), 6000);
  assert.equal(L.toastMs("x".repeat(121)), 7000);
  assert.equal(L.toastMs("Đã ẩn tin.", { action: { label: "Hoàn tác" } }), Infinity);
  assert.equal(L.toastMs("x", { ms: 300 }), 300);
});

test("pageItems", () => {
  assert.deepEqual(L.pageItems(1, 1), [1]);
  assert.deepEqual(L.pageItems(3, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(L.pageItems(5, 157), [1, "…", 4, 5, 6, "…", 157]);
  assert.deepEqual(L.pageItems(1, 157), [1, 2, 3, 4, 5, "…", 157]);
  assert.deepEqual(L.pageItems(157, 157), [1, "…", 153, 154, 155, 156, 157]);
  assert.deepEqual(L.pageItems(99, 3), [1, 2, 3]);
  assert.equal(L.pageCount(2340, 50), 47);
  assert.equal(L.pageCount(0, 50), 1);
});

test("sortRows: Vietnamese collation, numbers, ISO dates, empty last", () => {
  const names = ["Đặng Văn A", "Dương Thị B", "An", "Bình"].map((name) => ({ name }));
  assert.deepEqual(L.sortRows(names, "name", "asc").map((r) => r.name), ["An", "Bình", "Dương Thị B", "Đặng Văn A"]);
  assert.deepEqual(L.sortRows(names, "name", "desc").map((r) => r.name)[0], "Đặng Văn A");
  const nums = [{ n: 10 }, { n: 9 }, { n: null }, { n: 100 }];
  assert.deepEqual(L.sortRows(nums, "n", "asc").map((r) => r.n), [9, 10, 100, null]);
  assert.deepEqual(L.sortRows(nums, "n", "desc").map((r) => r.n), [100, 10, 9, null]);
  const dates = [{ d: "2026-10-02" }, { d: "2025-12-31" }, { d: "2026-01-15" }];
  assert.deepEqual(L.sortRows(dates, "d", "desc").map((r) => r.d), ["2026-10-02", "2026-01-15", "2025-12-31"]);
  assert.deepEqual(L.sortRows([{ c: "SC-10" }, { c: "SC-9" }], "c", "asc").map((r) => r.c), ["SC-9", "SC-10"]);
  assert.deepEqual(L.sortRows(dates, (r) => r.d.slice(5), "asc").map((r) => r.d), ["2026-01-15", "2026-10-02", "2025-12-31"]);
});

test("parseDate and formatDate", () => {
  assert.equal(L.parseDate("19/11/2026"), "2026-11-19");
  assert.equal(L.parseDate("1/2/2026"), "2026-02-01");
  assert.equal(L.formatDate(L.parseDate("1/2/2026")), "01/02/2026");
  assert.equal(L.parseDate("19-11-2026"), "2026-11-19");
  assert.equal(L.parseDate("19112026"), "2026-11-19");
  assert.equal(L.parseDate("29/02/2027"), null);
  assert.equal(L.parseDate("29/02/2028"), "2028-02-29");
  assert.equal(L.parseDate("31/04/2026"), null);
  assert.equal(L.parseDate("hôm qua"), null);
  assert.equal(L.formatDate("2026-11-19"), "19/11/2026");
  assert.equal(L.formatDate(""), "");
  assert.equal(L.addDays("2026-12-30", 3), "2027-01-02");
  const grid = L.monthGrid(2026, 10);
  assert.equal(grid[0][3], "2026-10-01"); // 1 October 2026 is a Thursday
  assert.ok(grid.every((w) => w.length === 7));
});

test("periodLabel", () => {
  assert.equal(L.periodLabel("2026-10", "month"), "Tháng 10/2026");
  assert.equal(L.periodLabel("2026-Q3", "quarter"), "Quý 3/2026");
  assert.equal(L.periodLabel("2026", "year"), "Năm 2026");
  assert.equal(L.periodLabel("2026-W42", "week"), "Tuần 42/2026");
  assert.equal(L.periodLabel({ from: "2026-10-01", to: "2026-10-20" }), "01/10–20/10/2026");
  assert.equal(L.periodLabel({ from: "2025-12-01", to: "2026-01-20" }), "01/12/2025–20/01/2026");
  assert.equal(L.periodLabel("2026-10-20", "day"), "20/10/2026");
  const en = (k, v) => ({ "period.month": "{n}/{y}" })[k].replace(/\{(\w+)\}/g, (m, x) => v[x]);
  assert.equal(L.periodLabel("2026-03", "month", en), "03/2026");
});

test("clampList", () => {
  assert.deepEqual(L.clampList(["a", "b", "c", "d"], 2), { shown: ["a", "b"], more: 2 });
  assert.deepEqual(L.clampList(["a"], 2), { shown: ["a"], more: 0 });
});

test("tabsForm: one decision per width, hysteresis, no loop", () => {
  const f = L.tabsForm;
  let s = f(null, { width: 600, overflow: false });
  assert.deepEqual(s, { form: "tabs", width: 600, at: null });
  assert.equal(f(s, { width: 600, overflow: false }), s); // same width: the same object (no re-render)
  s = f(s, { width: 300, overflow: true });
  assert.deepEqual(s, { form: "select", width: 300, at: 300 });
  // The select form has no strip: whatever the observer reports at this width, nothing changes.
  for (let i = 0; i < 50; i++) {
    assert.equal(f(s, { width: 300, overflow: false }), s);
    assert.equal(f(s, { width: 300, overflow: true }), s);
  }
  // Wider, but within the hysteresis: stays a select.
  s = f(s, { width: 323, overflow: false });
  assert.deepEqual(s, { form: "select", width: 323, at: 300 });
  // Narrower: stays a select, the switch width is kept.
  s = f(s, { width: 200 });
  assert.deepEqual(s, { form: "select", width: 200, at: 300 });
  // At least `gap` wider than the switch width: back to tabs, measured again.
  s = f(s, { width: 324 });
  assert.deepEqual(s, { form: "tabs", width: 324, at: 300 });
  // The strip still overflows there: select again, and the switch width moves up (it ratchets).
  s = f(s, { width: 324, overflow: true });
  assert.deepEqual(s, { form: "select", width: 324, at: 324 });
  assert.equal(f(s, { width: 340 }).form, "select");
  // It fits: tabs, and the switch width is forgotten.
  s = f(f(s, { width: 400 }), { width: 400, overflow: false });
  assert.deepEqual(s, { form: "tabs", width: 400, at: null });
  // A simulated observer loop: tabs overflow at 320, the select is measured at the same width. Bounded.
  let st = L.TABS_START, flips = 0;
  for (let i = 0; i < 100; i++) {
    const next = f(st, { width: 320, overflow: st.form === "tabs" });
    if (next.form !== st.form) flips++;
    st = next;
  }
  assert.equal(flips, 1);
  assert.equal(st.form, "select");
  // Hidden or unmeasured containers change nothing; a custom gap.
  assert.equal(f(st, { width: 0 }), st);
  assert.equal(f({ form: "select", width: 300, at: 300 }, { width: 310 }, 10).form, "tabs");
  assert.equal(L.TABS_GAP, 24);
});

test("typeahead", () => {
  const labels = ["Xem hồ sơ", "Mời phỏng vấn", "Xóa hồ sơ", "Lưu trữ"];
  assert.equal(L.typeahead(labels, "x", -1), 0);
  assert.equal(L.typeahead(labels, "x", 0), 2);
  assert.equal(L.typeahead(labels, "xo", 0), 2);
  assert.equal(L.typeahead(labels, "luu", 3), 3);
  assert.equal(L.typeahead(labels, "z", 0), -1);
});

test("nextIndex wraps and skips disabled", () => {
  const off = (i) => i === 1;
  assert.equal(L.nextIndex(0, 1, 4, off), 2);
  assert.equal(L.nextIndex(3, 1, 4, off), 0);
  assert.equal(L.nextIndex(0, -1, 4, off), 3);
  assert.equal(L.nextIndex(2, -1, 4, off), 0);
  assert.equal(L.nextIndex(3, 1, 4, off, false), 3);
  assert.equal(L.nextIndex(undefined, 1, 4), 0);
  assert.equal(L.nextIndex(undefined, -1, 4), 3);
  assert.equal(L.nextIndex(0, 1, 2, () => true), -1);
});

test("overlayStack: push, top, Esc closes the top only, remove by id", () => {
  const s = L.overlayStack();
  const closed = [];
  s.push({ id: "dialog", close: () => closed.push("dialog") });
  s.push({ id: "menu", close: () => closed.push("menu") });
  assert.equal(s.top().id, "menu");
  assert.ok(s.isTop("menu") && !s.isTop("dialog"));
  assert.equal(s.esc(), "menu");
  assert.deepEqual(closed, ["menu"]);
  assert.equal(s.top().id, "dialog");
  s.push({ id: "pop" });
  assert.ok(s.remove("dialog"));
  assert.ok(!s.has("dialog"));
  assert.equal(s.size(), 1);
  s.push({ id: "pop" });
  assert.equal(s.size(), 1);
  assert.equal(s.esc(), "pop");
  assert.equal(s.esc(), null);
});

test("selection: toggle, page, all matching, clear", () => {
  const sel = L.selection();
  let calls = 0;
  sel.subscribe(() => calls++);
  sel.toggle("a").toggle("b");
  assert.ok(sel.has("a") && sel.has("b"));
  sel.toggle("a");
  assert.ok(!sel.has("a"));
  assert.equal(sel.pageState(["a", "b"]), "some");
  sel.selectPage(["a", "b", "c"], true);
  assert.equal(sel.pageState(["a", "b", "c"]), "all");
  sel.selectPage(["d"], true); // another page: selection survives paging
  assert.equal(sel.size(), 4);
  sel.selectAllMatching(186);
  assert.ok(sel.allMatching && sel.size() === 186 && sel.has("zzz"));
  sel.toggle("c"); // any manual change leaves "all matching"
  assert.ok(!sel.allMatching);
  sel.clear(); // a filter change clears the selection
  assert.equal(sel.size(), 0);
  assert.equal(sel.pageState([]), "none");
  assert.ok(calls >= 6);
});

test("navDir", () => {
  assert.equal(L.navDir("go"), "forward");
  assert.equal(L.navDir("go", { isNav: true }), "lateral");
  assert.equal(L.navDir("back"), "back");
  for (const k of ["jump", "hash", "role", "platform", "picker"]) assert.equal(L.navDir(k), "lateral");
});

test("contrast and the muted chart colour", () => {
  assert.ok(Math.abs(L.contrast("#FFFFFF", "#0E7490") - 5.36) < 0.01);
  assert.ok(Math.abs(L.contrast("#000", "#fff") - 21) < 1e-9);
  // Kit default tokens (index.html tokens block): every chart tone, light and dark.
  const themes = {
    light: { surface: "#FFFFFF", tones: ["#2453A6", "#17784A", "#A45806", "#B42328", "#5845BF", "#5B6976"] },
    dark: { surface: "#121B23", tones: ["#7AA7F0", "#4BC389", "#F0A33C", "#FF6B6E", "#A898FF", "#8D9CA9"] },
  };
  for (const [name, t] of Object.entries(themes)) {
    for (const c of t.tones) {
      const muted = L.mix(c, t.surface, L.CHART_MUTE_PCT);
      assert.ok(L.contrast(muted, t.surface) >= 3, `${name} ${c} muted ${L.contrast(muted, t.surface).toFixed(2)}`);
    }
  }
});

test("audit defaults", () => {
  assert.deepEqual(L.AUDIT_DEFAULTS, { maxSizes: 6, minLh: 1.2, minLhWrap: 1.34, minLhClip: 1.5, maxShift: 0.01 });
});
