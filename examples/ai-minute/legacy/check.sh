#!/usr/bin/env bash
# Usage: check.sh <out-dir> <route>...   Fails if any route logs a script error.
# Per route: light and dark at 1440x900, and a narrow shot at a true 390 px width
# through narrow.html (headless Edge clamps its window to about 500 px, so the
# prototype is loaded in a 390x844 iframe). The narrow run also fails on horizontal
# scroll at 390 px. <route>-narrow.png is cropped to the 390 px iframe when Python
# with Pillow is available; otherwise the gray margin right of the iframe remains.
set -u
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
HERE="$(cd "$(dirname "$0")" && pwd -W)"
PAGE="file:///$(cd "$(dirname "$0")/../../docs/05-design/prototype" && pwd -W)/index.html"
NARROW="file:///$HERE/narrow.html"
OUT="$1"; shift; mkdir -p "$OUT"; fail=0
for r in "$@"; do
  # A "#scn-<route>" route (controller ruling R6) auto-runs a guided scenario, one
  # step every ~600 ms; give it a bigger virtual-time budget than a static screen
  # needs, so the whole run (and its final step's screen check) finishes well before
  # the page is dumped or screenshotted. narrow.html waits 8 s before reading data-err
  # for a scenario route, so its budget is larger still.
  budget=5000; nbudget=6000
  case "$r" in scn-*) budget=9000; nbudget=12000 ;; esac
  for theme in light dark; do
    dom=$("$E" --headless=new --disable-gpu --virtual-time-budget=$budget --window-size=1440,900 --dump-dom "$PAGE#$r-$theme" 2>/dev/null)
    err=$(printf '%s' "$dom" | grep -o 'data-err="[^"]*"' | head -1)
    [ -n "$err" ] && { echo "FAIL $r $theme $err"; fail=1; }
    "$E" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=$budget --window-size=1440,900 --screenshot="$OUT/$r-$theme.png" "$PAGE#$r-$theme" 2>/dev/null
  done
  dom=$("$E" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=$nbudget --window-size=600,844 --dump-dom "$NARROW#$r-light" 2>/dev/null)
  err=$(printf '%s' "$dom" | grep -o 'data-err="[^"]*"' | head -1)
  [ -n "$err" ] && { echo "FAIL $r narrow $err"; fail=1; }
  printf '%s' "$dom" | grep -q 'data-ok="narrow"' || [ -n "$err" ] || { echo "FAIL $r narrow: the 390 px check did not complete"; fail=1; }
  "$E" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=$nbudget --window-size=600,844 --screenshot="$OUT/$r-narrow.png" "$NARROW#$r-light" 2>/dev/null
  python -c "import sys; from PIL import Image; p=sys.argv[1]; im=Image.open(p); im.crop((0,0,390,min(844,im.height))).save(p)" "$OUT/$r-narrow.png" 2>/dev/null || true
done
exit $fail
