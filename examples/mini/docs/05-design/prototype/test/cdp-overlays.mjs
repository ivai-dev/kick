// Overlay regression run over the Chrome DevTools Protocol with trusted keyboard and mouse input.
// Not part of CI; run it after a UI-library upgrade (README "Upgrading the library") or a change to the
// overlay wrappers. Node 22 (built-in WebSocket), no npm dependencies.
//   node test/cdp-overlays.mjs [page.html] [--port 9341] [--keep]
// Default page: ../index.html#kit-overlays (the kit's internal overlay gallery). Set KICKOFF_BROWSER to
// the Edge or Chrome executable when it is not found. Exit code 1 when a check fails.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const port = Number((args[args.indexOf("--port") + 1] || "").match(/^\d+$/) ? args[args.indexOf("--port") + 1] : 9341);
const pageArg = args.find((a) => !a.startsWith("--") && !/^\d+$/.test(a));
const url = pageArg ? (pageArg.includes("://") ? pageArg : pathToFileURL(path.resolve(pageArg)).href) : pathToFileURL(path.join(here, "..", "index.html")).href + "#kit-overlays";

function findBrowser() {
  if (process.env.KICKOFF_BROWSER) return process.env.KICKOFF_BROWSER;
  const c = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/usr/bin/chromium",
  ];
  return c.find((p) => existsSync(p));
}
const exe = findBrowser();
if (!exe) { console.error("no Edge or Chrome found; set KICKOFF_BROWSER"); process.exit(4); }
const prof = mkdtempSync(path.join(tmpdir(), "kit-cdp-"));
const proc = spawn(exe, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  "--window-size=1440,900", "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find((x) => x.type === "page"); wsUrl = p && p.webSocketDebuggerUrl; } catch (e) { /* not up yet */ }
  if (!wsUrl) await sleep(200);
}
if (!wsUrl) { console.error("no CDP endpoint"); proc.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const waiting = new Map();
const logs = [];
ws.addEventListener("message", (m) => {
  const d = JSON.parse(m.data);
  if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); }
  if (d.method === "Page.screencastFrame") ws.send(JSON.stringify({ id: ++seq, method: "Page.screencastFrameAck", params: { sessionId: d.params.sessionId } }));
  if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + ((d.params.exceptionDetails.exception || {}).description || d.params.exceptionDetails.text).slice(0, 200));
});
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result && r.result.exceptionDetails) return "ERR " + ((r.result.exceptionDetails.exception || {}).description || r.result.exceptionDetails.text);
  return r.result && r.result.result ? r.result.result.value : undefined;
}
async function waitFor(expr, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(100); } return false; }
const KEYS = { Escape: 27, Tab: 9, Enter: 13, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35, PageUp: 33, PageDown: 34, " ": 32 };
async function key(k, shift = false) {
  const base = { key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: KEYS[k], nativeVirtualKeyCode: KEYS[k], modifiers: shift ? 8 : 0 };
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  if (k === "Enter" || k === " ") await send("Input.dispatchKeyEvent", { type: "char", ...base, text: k === "Enter" ? "\r" : " " });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  await sleep(150);
}
async function type(text) { await send("Input.insertText", { text }); await sleep(100); }
const rectOf = (sel) => ev(`(()=>{const e=${sel};if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
async function clickAt(x, y) {
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  await sleep(200);
}
async function click(id) { await ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e&&e.scrollIntoView({block:"center"})})()`); await sleep(100); const r = await rectOf(`document.getElementById(${JSON.stringify(id)})`); if (!r) return false; await clickAt(r.x + r.w / 2, r.y + r.h / 2); return true; }
async function hover(id) { const r = await rectOf(`document.getElementById(${JSON.stringify(id)})`); if (r) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x + r.w / 2, y: r.y + r.h / 2 }); }
const active = () => ev(`(()=>{let a=document.activeElement;while(a&&a.shadowRoot&&a.shadowRoot.activeElement)a=a.shadowRoot.activeElement;return a?(a.id||a.localName)+"|"+(a.textContent||"").trim().slice(0,24):""})()`);
const popOpen = (anchorId) => ev(`[...document.querySelectorAll('[data-kit="Popover"]')].some((p)=>p.open&&p.anchor&&p.anchor.id===${JSON.stringify(anchorId)})`);
const dialogOpen = (kit) => ev(`[...document.querySelectorAll('[data-kit="${kit}"]')].some((e)=>e.open)`);

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "pass" : "FAIL"}  ${name}${detail !== undefined ? "  " + JSON.stringify(detail) : ""}`); };

await send("Runtime.enable"); await send("Page.enable"); await send("Accessibility.enable");
// Headless pages turn hidden after a while (no rendering, no animations); keep this one focused and visible.
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Page.setWebLifecycleState", { state: "active" });
// Headless rendering also stalls when nothing asks for frames, which freezes CSS animations and the library's
// animated close; a small screencast keeps frames coming.
await send("Page.startScreencast", { format: "jpeg", quality: 5, maxWidth: 320, maxHeight: 200, everyNthFrame: 1 });
await send("Page.navigate", { url });
const ready = await waitFor("document.documentElement.dataset.ready==='1'||!!document.documentElement.dataset.err", 20000);
check("ready", ready && !(await ev("document.documentElement.dataset.err")), await ev("document.documentElement.dataset.err||''"));
await sleep(600);

// 1. Dialog: first field focused, Tab stays inside, dirty guard, focus returns.
await click("g-dlg"); await sleep(500);
check("dialog opens", await dialogOpen("Dialog"));
check("dialog focus on first field", (await active()).startsWith("g-phone"), await active());
const tabs = [];
for (let i = 0; i < 5; i++) { await key("Tab"); tabs.push(await active()); }
check("dialog keeps Tab inside", await ev(`(()=>{let a=document.activeElement;return !!(a&&a.closest('[data-kit="Dialog"]'))})()`), tabs);
await ev(`document.getElementById("g-phone").focus()`); await type("0912");
await key("Escape"); await sleep(500);
check("dirty dialog asks before closing", (await dialogOpen("Dialog")) && (await ev(`[...document.querySelectorAll('[data-kit="ConfirmDialog"]')].some((e)=>e.open)`)));
check("discard confirm focuses keep editing", (await active()).includes("Tiếp tục") || (await active()).includes("Keep"), await active());
await key("Escape"); await sleep(500);
check("escape closes only the confirm", await dialogOpen("Dialog"));
await key("Escape"); await sleep(400);
await key("Tab"); await sleep(100);
// Leave via the discard button.
const discard = await ev(`(()=>{const d=[...document.querySelectorAll('[data-kit="ConfirmDialog"]')].find((e)=>e.open);return !!d})()`);
if (discard) { await ev(`[...document.querySelectorAll('[data-kit="ConfirmDialog"]')].find((e)=>e.open).querySelector(".btn.danger").click()`); await sleep(600); }
check("dialog closes after discard", !(await dialogOpen("Dialog")));
check("dialog returns focus to its opener", (await active()).startsWith("g-dlg"), await active());

// 2. ConfirmDialog: focus on cancel, alertdialog with description, no light dismiss, Esc closes.
await click("g-conf"); await sleep(500);
check("confirm focus on cancel", (await active()).includes("Hủy") || (await active()).includes("Cancel"), await active());
const ax = await send("Accessibility.getFullAXTree", {});
const alertNode = ax.result.nodes.find((n) => n.role && n.role.value === "alertdialog");
check("confirm is an alertdialog with a description", alertNode && alertNode.description && alertNode.description.value, alertNode && { name: alertNode.name && alertNode.name.value });
await clickAt(30, 860); await sleep(400);
check("confirm ignores outside clicks", await ev(`[...document.querySelectorAll('[data-kit="ConfirmDialog"]')].some((e)=>e.open)`));
await key("Escape"); await sleep(500);
check("confirm closes on Escape and returns focus", (await active()).startsWith("g-conf"), await active());

// 3. SidePanel with a menu inside: Escape order.
await click("g-panel"); await sleep(600);
check("panel focus on first field", (await active()).startsWith("g-date"), await active());
await click("g-nested"); await sleep(400);
check("nested menu opens", await ev(`!!document.querySelector('[data-kit="SidePanel"] wa-dropdown[open]')`));
await key("Escape"); await sleep(400);
check("first Escape closes the menu only", !(await ev(`!!document.querySelector('wa-dropdown[open]')`)) && (await dialogOpen("SidePanel")));
await key("Escape"); await sleep(600);
check("second Escape closes the panel", !(await dialogOpen("SidePanel")));
check("panel returns focus", (await active()).startsWith("g-panel"), await active());

// 4. MenuButton keys, unavailable item, danger last.
await ev(`document.getElementById("g-menu").focus()`); await key("Enter"); await sleep(400);
check("menu opens on Enter", await ev(`!!document.querySelector('wa-dropdown[open]')`));
const order = await ev(`[...document.querySelector('wa-dropdown[open]').children].map((c)=>c.getAttribute("role")==="separator"?"---":c.textContent.trim().split("\\n")[0].trim())`);
check("danger item last after a separator", Array.isArray(order) && order[order.length - 2] === "---", order);
await key("ArrowDown"); await key("ArrowDown"); await sleep(100);
const onUnavailable = await active();
await key("Enter"); await sleep(300);
check("unavailable item keeps the menu open", await ev(`!!document.querySelector('wa-dropdown[open]')`), onUnavailable);
await key("Escape"); await sleep(400);
check("menu closes and returns focus", (await active()).startsWith("g-menu"), await active());

// 5. Tip on hover and focus.
await ev("document.activeElement && document.activeElement.blur()"); await sleep(300);
await hover("g-tip"); await sleep(900);
check("tip on hover", await ev(`[...document.querySelectorAll("wa-tooltip")].some((x)=>x.open&&x.getAttribute("for")==="g-tip")`));
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 880 }); await sleep(400);

// 6. Popover: opens, Escape closes and returns focus.
await click("g-pop"); await sleep(500);
check("popover opens", await popOpen("g-pop"));
await key("Escape"); await sleep(500);
check("popover closes on Escape and returns focus", !(await popOpen("g-pop")) && (await active()).startsWith("g-pop"), await active());

// 7. Back closes the top overlay.
await click("g-dlg"); await sleep(600);
const histBefore = await ev("JSON.stringify(history.state)");
await ev("history.back()"); await sleep(800);
check("Back closes the dialog", !(await dialogOpen("Dialog")), histBefore);

// 8. Legacy menu keys.
await click("g-legacy"); await sleep(300);
const first = await active();
await key("ArrowDown"); const second = await active();
await key("Escape"); await sleep(200);
check("legacy menu: first item, arrows, Escape", first.includes("Mục một") && second.includes("Mục hai") && !(await ev(`!!document.querySelector('[data-kit="Menu"]')`)), [first, second]);

// 9. Toasts: plain disappears after its time, an action toast stays.
await click("g-toast"); await sleep(300);
check("toast shows", await ev(`!!document.querySelector("wa-toast-item")`));
await sleep(5800);
check("plain toast disappears after 5 s", !(await ev(`!!document.querySelector("wa-toast-item:not([data-action])")`)));
await click("g-toast-act"); await sleep(10500);
check("action toast stays after 10 s", await ev(`!!document.querySelector("wa-toast-item[data-action]")`));

// 10. Device frames: overlays inside the kiosk and phone frames.
await click("g-frames"); await sleep(400);
await click("g-k-conf"); await sleep(600);
const k = await rectOf(`document.getElementById("g-kiosk")`);
const kd = await rectOf(`[...document.querySelectorAll('[data-kit="ConfirmDialog"]')].find((e)=>e.open).shadowRoot.querySelector('[part~="dialog"]')`);
check("kiosk confirm is bottom-anchored inside the frame", k && kd && kd.x >= k.x - 2 && kd.x + kd.w <= k.x + k.w + 2 && Math.abs(kd.y + kd.h - (k.y + k.h)) < 4, { frame: k, dialog: kd });
await key("Escape"); await sleep(500);
await click("g-p-panel"); await sleep(700);
const p = await rectOf(`document.getElementById("g-phone-frame")`);
const pd = await rectOf(`[...document.querySelectorAll('[data-kit="SidePanel"]')].find((e)=>e.open).shadowRoot.querySelector('[part~="dialog"]')`);
check("phone panel is a bottom sheet inside the frame", p && pd && pd.x >= p.x - 2 && pd.x + pd.w <= p.x + p.w + 2 && pd.y + pd.h <= p.y + p.h + 4, { frame: p, panel: pd });
await key("Escape"); await sleep(500);

// 11. Combobox: folding and keys.
await ev(`document.getElementById("g-combo").focus()`); await type("ca mau"); await sleep(300);
const opts = await ev(`[...document.querySelectorAll('[role="option"]')].filter((o)=>o.getClientRects().length).map((o)=>o.textContent.trim())`);
check("combobox folds diacritics", Array.isArray(opts) && opts.length >= 1 && opts[0].startsWith("Cà Mau"), opts);
await key("ArrowDown"); await key("Enter"); await sleep(200);
check("combobox picks with Enter", (await ev(`document.getElementById("g-combo").value`)) === "Cà Mau");
await ev(`document.getElementById("g-combo").value=""`);
await ev(`document.getElementById("g-combo").focus()`); await type("hoa my"); await sleep(300);
const opts2 = await ev(`[...document.querySelectorAll('[role="option"]')].filter((o)=>o.getClientRects().length).map((o)=>o.textContent.trim())`);
check("combobox: hoa my finds Xã Hòa Mỹ", Array.isArray(opts2) && opts2[0] && opts2[0].startsWith("Xã Hòa Mỹ"), opts2);
await key("Escape"); await sleep(200);
check("combobox Escape closes the list", (await ev(`document.getElementById("g-combo").getAttribute("aria-expanded")`)) === "false");

// 12. DateField: calendar keys.
await click("g-day-cal"); await sleep(600);
const d0 = await active();
await key("ArrowRight"); const d1 = await active();
await key("ArrowDown"); const d2 = await active();
await key("Enter"); await sleep(400);
check("date grid: arrows move by day and week, Enter picks", d0.includes("20") && d1.includes("21") && d2.includes("28") && (await ev(`document.getElementById("g-day").value`)) === "28/10/2026", [d0, d1, d2]);
await ev(`(()=>{const i=document.getElementById("g-day");i.focus();i.value="31/02/2026";i.dispatchEvent(new Event("input",{bubbles:true}));i.blur()})()`); await sleep(300);
check("date field rejects 31/02/2026", await ev(`!!document.querySelector('[data-kit="DateField"] .err')`));

// 13. ChoiceGroup: one Tab stop, arrows select.
await ev(`document.querySelector('[data-kit="ChoiceGroup"] [aria-checked="true"]').focus()`);
await key("ArrowRight"); await sleep(100);
check("choice group arrows select", (await ev(`document.querySelector('[data-kit="ChoiceGroup"] [aria-checked="true"]').textContent.trim()`)) === "Chiều");

// 14. DataTable: sort, select a page, paging moves focus to the caption.
await ev(`document.querySelector('#g-list .tbl-sort').scrollIntoView({block:"center"})`); await sleep(200);
await ev(`document.querySelector('#g-list .tbl-sort').click()`); await sleep(300);
check("sortable header sets aria-sort", (await ev(`document.querySelector('#g-list th[aria-sort]') && document.querySelector('#g-list th[aria-sort]').getAttribute("aria-sort")`)) === "ascending");
const firstName = await ev(`document.querySelector('#g-list tbody tr td:nth-child(2)').textContent.trim()`);
await ev(`document.querySelector('#g-list thead input[type=checkbox]').click()`); await sleep(300);
check("header checkbox selects the page", (await ev(`document.querySelectorAll('#g-list tbody tr[aria-selected="true"]').length`)) === 25, firstName);
check("select all matching is offered", await ev(`!!document.querySelector('#g-list .dt-selall button')`));
await ev(`[...document.querySelectorAll('#g-list .pg-n')].find((b)=>b.textContent.trim()==="2").click()`); await sleep(300);
check("paging keeps the selection and focuses the caption", (await active()).startsWith("g-list-caption") && (await ev(`document.querySelectorAll('[data-kit="BulkBar"]').length`)) === 1, await active());
check("empty cells show a dash", await ev(`!!document.querySelector('#g-list td .empty-v')`));

// 15. Routes: forward starts at the top with focus on the h1; Back restores the scroll and focuses the opener.
await ev(`KIT._api.go("kit-overlays", {})`); await sleep(900);
await ev(`document.querySelector('#g-list tbody tr:nth-child(3) .tbl-link').scrollIntoView({block:"center"})`); await sleep(200);
const before = await ev(`document.getElementById("kit-content").scrollTop`);
await ev(`document.querySelector('#g-list tbody tr:nth-child(3) .tbl-link').focus()`);
await key("Enter"); await sleep(900);
check("forward route: scroll 0, focus on the h1", (await ev(`document.getElementById("kit-content").scrollTop`)) === 0 && (await ev(`document.activeElement && document.activeElement.hasAttribute("data-kit-h1")`)), [await active(), await ev(`document.getElementById("kit-content").scrollTop`), await ev("JSON.stringify(KIT._api.S.params)+KIT._api.S._navKey+KIT._api.S._dir")]);
await ev("KIT._api.back()"); await sleep(900);
const after = await ev(`document.getElementById("kit-content").scrollTop`);
check("Back restores the scroll and focuses the opener", Math.abs(after - before) < 4 && (await ev(`!!(document.activeElement && document.activeElement.closest(".tbl-link"))`)), { before, after, active: await active() });

check("no script errors", logs.length === 0, logs);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
ws.close(); proc.kill(); await sleep(300);
if (!args.includes("--keep")) { try { rmSync(prof, { recursive: true, force: true }); } catch (e) { /* locked */ } }
process.exit(failed.length ? 1 : 0);
