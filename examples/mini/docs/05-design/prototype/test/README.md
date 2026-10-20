# Kit tests

| File | Runs | What it covers |
| --- | --- | --- |
| `route.test.js`, `logic.test.js` | CI: `node --test "test/*.test.js"` | hash routes; the pure helpers of `js/logic.js` (folding, density, window classes, toast timing, paging, sorting, dates, periods, keyboard helpers, overlay stack, selection, contrast) |
| `overlays.html` | by hand | the internal overlay gallery `../index.html#kit-overlays` in a frame |
| `cdp-overlays.mjs` | by hand, after a UI-library upgrade or an overlay change | trusted keyboard and mouse checks on the gallery over the Chrome DevTools Protocol: `node test/cdp-overlays.mjs` (Node 22, no npm dependencies; set `KICKOFF_BROWSER` when Edge or Chrome is not found; exit 1 on a failed check) |

`kickoff proto check` also runs the self-test route `#kit-selftest` once per check (overlay focus, exits,
alertdialog semantics, toasts, scroll and focus after routes).

## Manual checks (foundation F§8.4)

Open `overlays.html` in Edge or Chrome (from disk is fine) and walk:

1. **Dialog**: opens with focus on the first field; Tab and Shift+Tab stay inside; type in a field, press
   Escape: "Bỏ thay đổi?" asks first, its focus is on "Tiếp tục sửa"; Escape closes only the question.
2. **ConfirmDialog**: focus on "Hủy"; a click outside does nothing; Escape closes; focus returns to the opener;
   a screen reader announces an alert dialog with the consequence.
3. **Type to confirm**: the confirm button stays unavailable (focusable, with its reason) until the text matches,
   ignoring case and diacritics.
4. **SidePanel with a menu inside**: the first Escape closes the menu only, the second the panel.
5. **Menu keys** (`⋯` and "Tải báo cáo"): Enter, Space or ↓ open on the first item, ↑ on the last; arrows wrap,
   Home and End, typeahead; Tab closes and moves on; the unavailable item is focusable, shows its reason and keeps
   the menu open; the danger item is last after a separator; near the bottom edge the menu flips above and it
   follows its trigger when the page scrolls.
6. **Tip**: the cog button shows its name after 500 ms of hover and at once on keyboard focus; Escape hides it.
7. **Popover**: the trigger toggles it; Escape and an outside click close it; focus returns to the trigger.
8. **Back**: with a dialog open, the browser Back button closes the dialog and stays on the page.
9. **Toasts**: the plain toast leaves after 5 s (longer while hovered or focused); the toast with "Hoàn tác"
   stays until closed and leaves on a route change.
10. **Legacy menu**: focus starts on the first item; arrows move inside the menu only; Escape returns focus.
11. **Device frames** ("Device frames"): in the zoomed kiosk frame the confirm is anchored to the bottom of the
    frame; in the phone frame the side panel becomes a bottom sheet inside the phone.
12. **Dark theme and reduced motion**: repeat 1, 4 and 9 in the dark theme and with reduced motion (dissolves
    only, no travel).

Record the results and any API difference of the library in the CHANGELOG "Notes" of the upgrade.
