"""Prototype kit tooling: scaffold a prototype, check it in a headless browser, lint it, bundle it."""

from __future__ import annotations

import base64
import html as html_lib
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path, PurePosixPath, PureWindowsPath

from .errors import KickoffError
from .model import Project, inside_root

# The kit ships inside the package so `uv tool install` and wheels carry it.
KIT_DIR = Path(__file__).resolve().parent / "kit" / "prototype"

MODULES_BEGIN = "<!-- kickoff:modules:begin -->"
MODULES_END = "<!-- kickoff:modules:end -->"
TOKENS_BEGIN = "/* kickoff:tokens:begin */"
TOKENS_END = "/* kickoff:tokens:end */"

PLATFORM_ORDER = ("web", "windows", "android")
BROWSER_NAMES = ("msedge", "microsoft-edge", "google-chrome", "chromium", "chromium-browser", "chrome")
THEMES = ("light", "dark")
# UI language -> locale for numbers and dates in the kit (KIT_CONFIG.locale).
LOCALES = {
    "en": "en-US", "vi": "vi-VN", "fr": "fr-FR", "de": "de-DE", "es": "es-ES", "it": "it-IT", "pt": "pt-PT", "nl": "nl-NL",
    "ja": "ja-JP", "ko": "ko-KR", "zh": "zh-CN", "th": "th-TH", "id": "id-ID", "ms": "ms-MY",
}
# Languages whose stacked diacritics make small uppercase labels hard to read: no small capitals (the kit
# sets --cap-case: none for them from KIT_CONFIG.lang; kept for callers of 0.2).
NO_SMALL_CAPS = frozenset({"vi"})
# Kit core scripts (js/<name>.js); every other js/*.js file is a project module.
KIT_CORE_JS = frozenset({"route", "logic", "core", "ui", "ui-form", "ui-data", "charts", "scope", "shell", "scenario", "audit", "main"})
# Runtime audit thresholds (KIT.logic.AUDIT_DEFAULTS); a project changes them only with the lead's yes.
AUDIT_DEFAULTS = {"maxSizes": 6, "minLh": 1.2, "minLhWrap": 1.34, "minLhClip": 1.5, "maxShift": 0.01}


class ProtoError(KickoffError):
    """A prototype problem the user must fix (existing files, missing ux-spec)."""


class BrowserNotFound(ProtoError):
    """No Edge or Chrome could be located."""


# ---------------------------------------------------------------- paths and ux-spec
def kit_dir() -> Path:
    env = os.environ.get("KICKOFF_KIT")
    return Path(env) if env else KIT_DIR


def proto_dir(root: Path, project: Project) -> Path:
    project.docs_dir(root)
    return inside_root(root, project.proto.get("dir", f"{project.docs_root}/05-design/prototype"), "proto.dir")


def ux_spec_path(root: Path, project: Project) -> Path:
    project.docs_dir(root)
    return inside_root(root, project.proto.get("ux_spec", f"{project.docs_root}/05-design/ux-spec.md"), "proto.ux_spec")


def _cells(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _split_list(value: str) -> list[str]:
    return [v.strip().lower() for v in re.split(r"[,;/]", value) if v.strip()]


def parse_ux_spec(path: Path) -> list[dict]:
    """Rows {code, name, roles, platform, release} of the first table whose header starts with `| ID`."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError as exc:
        raise ProtoError(f"missing ux-spec: {path}") from exc
    rows: list[dict] = []
    in_table = False
    for line in lines:
        stripped = line.strip()
        if not in_table:
            if re.match(r"\|\s*ID\b", stripped, re.IGNORECASE):
                in_table = True
            continue
        if not stripped.startswith("|"):
            break
        cells = _cells(stripped)
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            continue
        cells += [""] * (5 - len(cells))
        rows.append(
            {
                "code": cells[0],
                "name": cells[1],
                "roles": _split_list(cells[2]),
                "platform": cells[3].lower(),
                "release": cells[4],
            }
        )
    return rows


# ---------------------------------------------------------------- new
def _screen_id(code: str) -> str:
    return code.lower()


def ui_language(project: Project) -> str:
    """The two-letter UI language of the project (languages.ui), lower case."""
    value = str((project.languages or {}).get("ui") or "en")
    return value.split("-")[0].split("_")[0].lower() or "en"


def ui_locale(project: Project) -> str:
    """The locale for numbers and dates in the prototype: languages.ui as given when it names a region."""
    value = str((project.languages or {}).get("ui") or "en")
    if "-" in value:
        return value
    return LOCALES.get(value.lower(), value.lower())


def _config_js(project: Project, rows: list[dict]) -> str:
    used: list[str] = []
    for row in rows:
        for role in row["roles"]:
            if role not in used:
                used.append(role)
    ordered = [r for r in project.roles if r in used] + [r for r in used if r not in project.roles]
    role_lines = []
    for role in ordered:
        home = next((_screen_id(r["code"]) for r in rows if role in r["roles"]), None)
        name = project.roles[role].name if role in project.roles else role
        role_lines.append(
            f"    {{ id: {json.dumps(role)}, name: {json.dumps(name, ensure_ascii=False)}, home: {json.dumps(home)}, shell: \"app\" }},"
        )
    platforms = [p for p in PLATFORM_ORDER if any(p in _split_list(r["platform"]) for r in rows)] or ["web"]
    lines = [
        f"// config.js — {project.name}: roles, releases and platforms of the prototype.",
        "// shell: \"app\" (sidebar work tool) or \"site\" (public site: top menu, footer, phone tabs; see the kit README).",
        "window.KIT_CONFIG = {",
        f"  product: {json.dumps(project.name, ensure_ascii=False)},",
        f"  locale: {json.dumps(ui_locale(project))},",
        f"  lang: {json.dumps(ui_language(project))},",
        "  roles: [",
        *role_lines,
        "  ],",
        f"  releases: {json.dumps([r.id for r in project.releases], ensure_ascii=False)},",
        f"  platforms: {json.dumps(platforms)},",
        f"  defaultRole: {json.dumps(ordered[0] if ordered else None)},",
        '  // density: { app: "compact", site: "comfortable", phone: "touch" },   // per shell; roles[].density overrides',
        '  // fonts: ["https://fonts.googleapis.com/css2?family=…&display=swap"],   // replaces the kit\'s Inter link',
        "};",
        "",
    ]
    return "\n".join(lines)


def _screens_js(project: Project, rows: list[dict]) -> str:
    lines = [f"// screens.js — {project.name}: one stub per ux-spec row. Replace each comp with the real screen.", '"use strict";']
    for row in rows:
        platforms = [p for p in _split_list(row["platform"]) if p in PLATFORM_ORDER] or ["web"]
        lines.append(
            f"KIT.register({json.dumps(_screen_id(row['code']))}, {{ code: {json.dumps(row['code'])}, "
            f"name: {json.dumps(row['name'], ensure_ascii=False)}, roles: {json.dumps(row['roles'])}, "
            f"platforms: {json.dumps(platforms)}, rel: {json.dumps(row['release'])}, comp: KIT.ui.Placeholder }});"
        )
    lines.append("")
    return "\n".join(lines)


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def new_prototype(root: Path, project: Project, force: bool = False) -> list[Path]:
    """Copy the kit into proto.dir and write config, screen stubs, data and scenarios for the ux-spec."""
    dest = proto_dir(root, project)
    src = kit_dir()
    if not (src / "index.html").is_file():
        raise ProtoError(f"kit not found: {src}")
    if (dest / "index.html").exists() and not force:
        raise ProtoError(f"{dest / 'index.html'} exists; use --force to overwrite")
    rows = parse_ux_spec(ux_spec_path(root, project))
    if not rows:
        raise ProtoError(f"no screens found in {ux_spec_path(root, project)}")
    written: list[Path] = []
    for path in sorted(src.rglob("*")):
        if path.is_dir() or "__pycache__" in path.parts:
            continue
        target = dest / path.relative_to(src)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        written.append(target)
    _write(dest / "js" / "config.js", _config_js(project, rows))
    _write(dest / "js" / "data.js", f"// data.js — synthetic sample data for {project.name}. Invented names and numbers only.\nKIT.D = {{}};\n")
    _write(dest / "js" / "screens.js", _screens_js(project, rows))
    _write(dest / "js" / "scenarios.js", "// scenarios.js — guided demo scenarios.\nKIT.SCENARIOS = [];\n")
    index = dest / "index.html"
    text = index.read_text(encoding="utf-8")
    scripts = "\n".join(f'<script src="js/{name}.js" charset="utf-8"></script>' for name in ("config", "data", "screens", "scenarios"))
    text = re.sub(
        re.escape(MODULES_BEGIN) + r".*?" + re.escape(MODULES_END),
        lambda _m: f"{MODULES_BEGIN}\n{scripts}\n{MODULES_END}",
        text,
        flags=re.DOTALL,
    )
    _write(index, text)
    for name in ("config", "data", "screens", "scenarios"):
        path = dest / "js" / f"{name}.js"
        if path not in written:
            written.append(path)
    if index not in written:
        written.append(index)
    return written


# ---------------------------------------------------------------- update
TITLE_RE = re.compile(r"<title>.*?</title>", re.DOTALL)


def _block(text: str, begin: str, end: str) -> str | None:
    start = text.find(begin)
    stop = text.find(end, start + len(begin)) if start != -1 else -1
    return text[start : stop + len(end)] if start != -1 and stop != -1 else None


def update_prototype(root: Path, project: Project, dry: bool = False) -> list[tuple[str, str]]:
    """Bring a prototype's kit core up to the installed kit; keep every project file.

    Copies the kit core files over the project's copies and rebuilds index.html from the kit's
    page with the project's title, tokens block and modules block. Returns (path, "added" or
    "updated") for every file that differs; writes nothing when `dry` is true.
    """
    dest = proto_dir(root, project)
    src = kit_dir()
    index = dest / "index.html"
    if not index.is_file():
        raise ProtoError(f"no prototype in {dest}; run: kickoff proto new")
    old_page = index.read_text(encoding="utf-8")
    page = (src / "index.html").read_text(encoding="utf-8")
    for begin, end in ((TOKENS_BEGIN, TOKENS_END), (MODULES_BEGIN, MODULES_END)):
        mine, theirs = _block(old_page, begin, end), _block(page, begin, end)
        if mine is None or theirs is None:
            raise ProtoError(f"index.html has no {begin} … {end} block; cannot update it safely")
        page = page.replace(theirs, mine, 1)
    title = TITLE_RE.search(old_page)
    if title:
        page = TITLE_RE.sub(lambda _m: title.group(0), page, count=1)

    changes: list[tuple[str, str]] = []
    for path in sorted(src.rglob("*")):
        if path.is_dir() or "__pycache__" in path.parts or path.name == "index.html":
            continue
        rel = path.relative_to(src)
        target = dest / rel
        new = path.read_bytes()
        old = target.read_bytes() if target.is_file() else None
        if old == new:
            continue
        changes.append((rel.as_posix(), "added" if old is None else "updated"))
        if not dry:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(new)
    if page != old_page:
        changes.append(("index.html", "updated"))
        if not dry:
            _write(index, page)
    return changes


def _project_modules(base: Path) -> list[tuple[str, str]]:
    """(label, text) of the project's own scripts: js/*.js minus the kit core."""
    out = []
    for path in sorted((base / "js").glob("*.js")):
        if path.stem not in KIT_CORE_JS:
            out.append((f"js/{path.name}", path.read_text(encoding="utf-8")))
    return out


def migration_notes(root: Path, project: Project) -> list[str]:
    """What a prototype built on kit 0.2 has to change for 0.3 (one line per finding); reads only."""
    base = proto_dir(root, project)
    index = base / "index.html"
    if not index.is_file():
        return []
    page = index.read_text(encoding="utf-8")
    tokens = _block(page, TOKENS_BEGIN, TOKENS_END) or ""
    modules = _project_modules(base)
    code = "\n".join(text for _, text in modules)
    both = tokens + "\n" + code
    notes: list[str] = []

    def count(pattern: str, text: str, flags: int = 0) -> int:
        return len(re.findall(pattern, text, flags))

    if re.search(r"--fw-medium:\s*600", tokens) or re.search(r"--fw-bold:\s*700", tokens) or "--fw-heavy" in tokens:
        notes.append("tokens: --fw-medium is 600 (kit meaning 500); use role tokens --t-* or --fw-semibold")
    n = count(r"font-weight\s*:\s*(?:800|900)\b", both) + count(r"--fw-heavy\b", both)
    if n:
        notes.append(f"type: weight 800 in {n} rules; lint L1 fails until they move to 600/700")
    n = count(r"line-height:\s*1\s*[;}]", both)
    if n:
        notes.append(f"type: {n} rules with line-height 1; lint L2")
    for label, text in modules:
        if "fonts.googleapis.com" in text:
            notes.append(f"fonts: {label} loads a font at run time; move it to KIT_CONFIG.fonts")
    n = sum(len(LINT_L13.findall(text)) for _, text in modules)
    if n:
        notes.append(f"overlays: {n} conditionally mounted overlays; pass open=")
    n = sum(len(_handmade_overlays(text)) for _, text in modules)
    if n:
        notes.append(f'overlays: {n} hand-made overlays (role="dialog", scrim, keydown); move to KIT.ui')
    if re.search(r"\.site-page\s+\.(?:btn|input|field)\b", tokens):
        notes.append("density: public size overrides in the tokens block; the comfortable density replaces them")
    if re.search(r"\.page\s*\{[^}]*max-width", both):
        notes.append('layout: .page width override; register screens with page: "data" or "form"')
    if re.search(r"transition:[^;]*width", both):
        notes.append("motion: width transition; lint L14")
    n = count(r"onRow=", code)
    if n:
        notes.append(f"tables: {n} onRow tables; they keep working, move to rowLink for links")
    if re.search(r"\.toast\([^)]*action\s*:", code, re.DOTALL):
        notes.append("toasts: action toasts no longer auto-dismiss (R-32)")
    if re.search(r"\bt-body\b", code):
        notes.append("type: .t-body is now the body role (14 px on staff screens); long paragraphs use .t-prose")
    if "--act" not in tokens and re.search(r"""kind=\\?["']?act\b|kind:\s*["']act["']""", code):
        notes.append("tokens: --act is missing; act buttons fall back to --primary")
    return notes


# ---------------------------------------------------------------- browser
KNOWN_BROWSER_FILES = frozenset(
    {"msedge", "microsoft-edge", "microsoft-edge-stable", "chrome", "google-chrome", "google-chrome-stable",
     "chromium", "chromium-browser"}
)


def _vetted_browser(value: str) -> str:
    """proto.browser comes from the repository, so it may only name Edge, Chrome or Chromium.

    The file name must be a known one, and a relative path with folders is refused (it could point at a binary
    shipped in the repository). KICKOFF_BROWSER, set by the user, is not restricted."""
    win = PureWindowsPath(value)
    name = win.name.lower().replace(" ", "-")
    if name.endswith(".exe"):
        name = name[: -len(".exe")]
    folders = "/" in value or "\\" in value
    absolute = win.is_absolute() or PurePosixPath(value).is_absolute()
    if name not in KNOWN_BROWSER_FILES or (folders and not absolute):
        raise ProtoError(
            f"proto.browser {value!r} is not allowed: project.yaml may only name Edge, Chrome or Chromium "
            f"({', '.join(sorted(KNOWN_BROWSER_FILES))}), as a bare command or an absolute path; "
            "set KICKOFF_BROWSER to run any other executable"
        )
    return value


def find_browser(project: Project) -> str | None:
    env = os.environ.get("KICKOFF_BROWSER")
    if env:
        return env
    configured = project.proto.get("browser")
    if configured:
        return _vetted_browser(str(configured))
    for name in BROWSER_NAMES:
        found = shutil.which(name)
        if found:
            return found
    candidates: list[Path] = []
    for var in ("ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"):
        base = os.environ.get(var)
        if base:
            candidates += [
                Path(base) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
                Path(base) / "Google" / "Chrome" / "Application" / "chrome.exe",
            ]
    candidates += [
        Path("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
        Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        Path("/Applications/Chromium.app/Contents/MacOS/Chromium"),
    ]
    for path in candidates:
        if path.is_file():
            return str(path)
    return None


def _root_attrs(dom: str) -> str:
    match = re.search(r'<html\b((?:"[^"]*"|\'[^\']*\'|[^>"\'])*)>', dom, re.IGNORECASE)
    return match.group(1) if match else ""


def _attr(attrs: str, name: str) -> str | None:
    match = re.search(rf'\sdata-{name}="([^"]*)"', " " + attrs.lstrip())
    return html_lib.unescape(match.group(1)) if match else None


class _Browser:
    def __init__(self, exe: str):
        self.exe = exe

    def dump(
        self,
        url: str,
        budget: int,
        size: tuple[int, int] = (1440, 900),
        file_access: bool = False,
        shot: Path | None = None,
    ) -> str:
        """Return the root element's attributes of the rendered page, or raise ProtoError."""
        with tempfile.TemporaryDirectory(prefix="kickoff-proto-", ignore_cleanup_errors=True) as profile:
            cmd = [
                self.exe,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                f"--user-data-dir={profile}",
                f"--window-size={size[0]},{size[1]}",
                f"--virtual-time-budget={budget}",
            ]
            if sys.platform.startswith("linux"):
                cmd.append("--no-sandbox")
            if file_access:
                cmd.append("--allow-file-access-from-files")
            if shot is not None:
                shot.parent.mkdir(parents=True, exist_ok=True)
                cmd.append(f"--screenshot={shot}")
            cmd += ["--dump-dom", url]
            try:
                done = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
            except subprocess.TimeoutExpired as exc:
                raise ProtoError("browser timed out") from exc
            except OSError as exc:
                raise ProtoError(f"cannot start the browser: {exc}") from exc
        attrs = _root_attrs(done.stdout)
        if not attrs and "<html" not in done.stdout.lower():
            raise ProtoError(f"browser returned no page (exit {done.returncode})")
        return attrs


def _parse_screens(value: str | None) -> list[dict]:
    screens = []
    for part in (value or "").split(";"):
        bits = part.split("|")
        if len(bits) == 3 and bits[0]:
            screens.append({"id": bits[0], "code": bits[1], "roles": [r for r in bits[2].split("+") if r]})
    return screens


def _route_spec(route: str, screens: list[dict]) -> dict | None:
    """Resolve a check route: a screen id or code, optional role and theme tokens, optional ?parameters.

    "sc-08", "SC-08", "sc-08-guest", "sc-08-guest?kiosk=1&id=tt03" -> {id, role, query, label}.
    """
    base, _, query = route.partition("?")
    parts = base.strip().lower().split("-")
    roles = {r for s in screens for r in s["roles"]}
    role = None
    while len(parts) > 1 and (parts[-1] in roles or parts[-1] in THEMES):
        token = parts.pop()
        if token in roles:
            role = token
    key = "-".join(parts)
    screen = next((s for s in screens if s["id"] == key or s["code"].lower() == key), None)
    if screen is None:
        return None
    first = screen["roles"][0] if screen["roles"] else ""
    if role not in screen["roles"]:
        role = first
    plain = not query and role == first
    label = screen["id"] if plain else re.sub(r"[^a-z0-9]+", "-", route.lower()).strip("-")
    return {"id": screen["id"], "role": role, "query": query, "label": label}


def _screen_task(
    browser: _Browser, base: Path, spec: dict, kind: str, shots: Path | None, scale: int = 1
) -> tuple[str | None, str | None]:
    """(failure, warning) of one dump: errors, readiness, the runtime audit (data-audit-fail / -warn).
    `scale` multiplies the time budgets (a retry after a transient failure gets more time)."""
    route = spec["label"]
    query = f"?{spec['query']}" if spec["query"] else ""
    hash_ = f"{spec['id']}-{spec['role']}-{'light' if kind == 'narrow' else kind}{query}"
    try:
        if kind == "narrow":
            shot = shots / f"{route}-narrow.png" if shots else None
            attrs = browser.dump(
                (base / "narrow.html").as_uri() + "#" + hash_, 7000 * scale, size=(600, 844), file_access=True, shot=shot
            )
            if _attr(attrs, "ok") == "narrow":
                return None, None
            return f"{route} narrow: {_attr(attrs, 'err') or '390 px check did not complete'}", None
        shot = shots / f"{route}-{kind}.png" if shots else None
        attrs = browser.dump((base / "index.html").as_uri() + "#" + hash_, 5000 * scale, shot=shot)
    except ProtoError as exc:
        return f"{route} {kind}: {exc}", None
    err = _attr(attrs, "err")
    if err:
        return f"{route} {kind}: {err}", None
    if _attr(attrs, "ready") != "1":
        return f"{route} {kind}: not ready", None
    audit = _attr(attrs, "audit-fail")
    warn = _attr(attrs, "audit-warn")
    return (f"{route} {kind}: audit {audit}" if audit else None), (f"{route} {kind}: {warn}" if warn else None)


def _scenario_task(browser: _Browser, base: Path, sid: str, scale: int = 1) -> str | None:
    try:
        attrs = browser.dump((base / "index.html").as_uri() + f"#scn-{sid}", 10000 * scale)
        err = _attr(attrs, "err")
        if err:
            return f"scenario {sid}: {err}"
        if _attr(attrs, "scenario") != "done":
            return f"scenario {sid}: did not finish ({_attr(attrs, 'scenario') or 'not started'})"
        attrs = browser.dump(
            (base / "narrow.html").as_uri() + f"#scn-{sid}-light", 13000 * scale, size=(600, 844), file_access=True
        )
    except ProtoError as exc:
        return f"scenario {sid}: {exc}"
    if _attr(attrs, "ok") != "narrow":
        return f"scenario {sid}: narrow: {_attr(attrs, 'err') or '390 px check did not complete'}"
    return None


# ---------------------------------------------------------------- self-test (Chrome DevTools Protocol)
# The self-test opens and closes overlays and changes routes, which needs rendered frames: a --dump-dom run
# renders none (no animation frames, CSS animations never end). So it runs in a headless browser driven over
# the DevTools Protocol, with a small screencast that keeps frames coming. Standard library only.
class _WebSocket:
    def __init__(self, url: str, timeout: float = 10):
        match = re.match(r"ws://([^/:]+):(\d+)(/.*)", url)
        if not match:
            raise ProtoError(f"bad debugging address {url}")
        host, port, path = match.group(1), int(match.group(2)), match.group(3)
        self.sock = socket.create_connection((host, port), timeout=timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        request = (f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                   f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.sock.sendall(request.encode())
        head = b""
        while b"\r\n\r\n" not in head:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ProtoError("debugging session closed during the handshake")
            head += chunk
        if b" 101 " not in head.split(b"\r\n", 1)[0]:
            raise ProtoError("debugging session refused the connection")
        self.buf = head.split(b"\r\n\r\n", 1)[1]

    def _read(self, n: int) -> bytes:
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ProtoError("debugging session closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, text: str) -> None:
        data = text.encode()
        mask = os.urandom(4)
        n = len(data)
        head = bytes([0x81]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n) if n < 65536 else bytes([0x80 | 127]) + struct.pack(">Q", n))
        self.sock.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def recv(self) -> str | None:
        payload = b""
        while True:
            b1, b2 = self._read(2)
            n = b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            data = self._read(n)
            opcode = b1 & 0x0F
            if opcode == 8:
                raise ProtoError("debugging session closed")
            if opcode in (9, 10):
                continue
            payload += data
            if b1 & 0x80:
                return payload.decode("utf-8", errors="replace")

    def close(self) -> None:
        try:
            self.sock.close()
        except OSError:
            pass


def _cdp_selftest(exe: str, url: str, timeout: float = 60) -> str | None:
    """Run #kit-selftest in a rendering headless browser; None on pass, else the failure text."""
    with tempfile.TemporaryDirectory(prefix="kickoff-selftest-", ignore_cleanup_errors=True) as profile:
        cmd = [exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
               "--remote-debugging-port=0", "--window-size=1440,900", "about:blank"]
        if sys.platform.startswith("linux"):
            cmd.append("--no-sandbox")
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except OSError as exc:
            return f"cannot start the browser: {exc}"
        ws = None
        try:
            port_file = Path(profile) / "DevToolsActivePort"
            deadline = time.time() + 20
            port = 0
            while not port and time.time() < deadline:
                try:  # the browser may still be writing the file (Windows refuses the read meanwhile)
                    first = port_file.read_text(encoding="utf-8").split()
                    port = int(first[0]) if first else 0
                except (OSError, ValueError):
                    port = 0
                if not port:
                    time.sleep(0.1)
            if not port:
                return "the browser opened no debugging port"
            pages = []
            while time.time() < deadline and not pages:
                try:
                    with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=5) as resp:  # noqa: S310 (local debugging port)
                        pages = [p for p in json.loads(resp.read().decode()) if p.get("type") == "page"]
                except OSError:
                    time.sleep(0.2)
            if not pages:
                return "no page in the debugging session"
            ws = _WebSocket(pages[0]["webSocketDebuggerUrl"])
            seq = [0]

            def call(method: str, params: dict | None = None) -> dict:
                seq[0] += 1
                mine = seq[0]
                ws.send(json.dumps({"id": mine, "method": method, "params": params or {}}))
                while True:
                    msg = json.loads(ws.recv() or "{}")
                    if msg.get("method") == "Page.screencastFrame":
                        seq[0] += 1
                        ws.send(json.dumps({"id": seq[0], "method": "Page.screencastFrameAck", "params": {"sessionId": msg["params"]["sessionId"]}}))
                    if msg.get("id") == mine:
                        return msg.get("result") or {}

            call("Page.enable")
            call("Emulation.setFocusEmulationEnabled", {"enabled": True})
            call("Page.startScreencast", {"format": "jpeg", "quality": 5, "maxWidth": 320, "maxHeight": 200, "everyNthFrame": 1})
            call("Page.navigate", {"url": url})
            end = time.time() + timeout
            expr = "JSON.stringify([document.documentElement.dataset.selftest||'', document.documentElement.dataset.err||''])"
            while time.time() < end:
                time.sleep(0.5)
                result = call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
                state, err = json.loads(((result.get("result") or {}).get("value")) or '["", ""]')
                if state == "pass":
                    return None
                if state == "fail" or err:
                    return err or "failed"
            return "did not finish"
        except (OSError, ValueError, ProtoError) as exc:
            return f"debugging session failed ({exc})"
        finally:
            if ws:
                ws.close()
            proc.kill()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                pass


TRANSIENT = re.compile(
    r"not ready|did not complete|timeout|timed out|is undefined|is not defined|failed to fetch|networkerror"
    r"|error loading|importing a module script failed|no page",
    re.IGNORECASE,
)


def check(
    root: Path,
    project: Project,
    routes: list[str] | None = None,
    shots: Path | None = None,
    jobs: int = 4,
    warnings: list[str] | None = None,
) -> list[str]:
    """Open the prototype in a headless browser. Returns failures (empty = pass).

    `routes` limits the per-screen dumps to those routes: a screen id or code, optionally with a role
    token and ?parameters ("sc-08-guest?kiosk=1"); `[]` means coverage only. Scenarios and the kit
    self-test run only when `routes` is None. With `shots`, every dump also writes a screenshot (light, dark
    and 390 px). Every dump also reads the runtime audit: data-audit-fail is a failure, data-audit-warn is
    appended to `warnings` when a list is given.
    """
    exe = find_browser(project)
    if exe is None:
        raise BrowserNotFound("no Edge or Chrome found; set KICKOFF_BROWSER or proto.browser in project.yaml")
    browser = _Browser(exe)
    base = proto_dir(root, project)
    if not (base / "index.html").is_file():
        raise ProtoError(f"no prototype in {base}; run: kickoff proto new")
    spec_rows = parse_ux_spec(ux_spec_path(root, project))
    try:
        attrs = browser.dump((base / "index.html").as_uri(), 5000)
    except ProtoError as exc:
        return [f"index: not ready ({exc})"]
    if _attr(attrs, "ready") != "1":
        err = _attr(attrs, "err")
        return ["index: not ready" + (f" ({err})" if err else "")]
    screens = _parse_screens(_attr(attrs, "screens"))
    scenarios = [s for s in (_attr(attrs, "scenarios") or "").split(",") if s]

    failures: list[str] = []
    if _attr(attrs, "err"):
        failures.append(f"index: {_attr(attrs, 'err')}")
    registered = [s["code"] for s in screens]
    expected = [r["code"] for r in spec_rows]
    failures += [f"coverage: {c} in ux-spec but not registered" for c in expected if c not in registered]
    failures += [f"coverage: {c} registered but not in ux-spec" for c in registered if c not in expected]

    if routes is None:
        specs = [{"id": s["id"], "role": s["roles"][0] if s["roles"] else "", "query": "", "label": s["id"]} for s in screens]
    else:
        specs = []
        for route in routes:
            spec = _route_spec(route, screens)
            if spec is None:
                failures.append(f"route: no registered screen matches {route}")
            else:
                specs.append(spec)
    tasks = [(s, kind) for s in specs for kind in (*THEMES, "narrow")]
    with ThreadPoolExecutor(max_workers=max(1, jobs)) as pool:
        selftest = pool.submit(_cdp_selftest, exe, (base / "index.html").as_uri() + "#kit-selftest-light") if routes is None else None
        screen_results = list(pool.map(lambda t: _screen_task(browser, base, t[0], t[1], shots), tasks))
        scenario_results = (
            list(pool.map(lambda sid: _scenario_task(browser, base, sid), scenarios)) if routes is None else []
        )
        selftest_result = selftest.result() if selftest else None
    # The kit loads its libraries from a CDN at run time: a slow or failed fetch looks like a broken screen.
    # Every failure that looks transient runs once more, one at a time with twice the time budget; a real
    # defect fails again and is reported, a recovered one is reported as a warning.
    retried: list[str] = []
    for i, (fail, _) in enumerate(screen_results):
        if fail and TRANSIENT.search(fail):
            screen_results[i] = _screen_task(browser, base, *tasks[i], shots, scale=2)
            retried += [fail] if not screen_results[i][0] else []
    for i, fail in enumerate(scenario_results):
        if fail and TRANSIENT.search(fail):
            scenario_results[i] = _scenario_task(browser, base, scenarios[i], scale=2)
            retried += [fail] if not scenario_results[i] else []
    if selftest_result and TRANSIENT.search(selftest_result):
        first, selftest_result = selftest_result, _cdp_selftest(exe, (base / "index.html").as_uri() + "#kit-selftest-light")
        retried += [f"selftest: {first}"] if not selftest_result else []
    failures += [r[0] for r in screen_results if r[0]]
    failures += [r for r in scenario_results if r]
    if selftest_result:
        failures.append(f"selftest: {selftest_result}")
    if warnings is not None:
        warnings += [r[1] for r in screen_results if r[1]]
        warnings += [f"passed on a retry after a transient failure: {f}" for f in retried]
    return failures


# ---------------------------------------------------------------- lint
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])")
STRING_RE = re.compile(r"\"(?:[^\"\\\n]|\\.)*\"|'(?:[^'\\\n]|\\.)*'|`[^`\n]*`")

# Foundation rules (kit 0.3 spec §10.2). A line containing "kit:allow <rule-id>" is exempt from that rule.
LINT_L1 = [re.compile(p, re.M) for p in (
    r"font-weight\s*:\s*(?:800|900)\b", r"--fw-[\w-]+\s*:\s*(?:800|900)\b",
    r"(?:^|[;{\s])font\s*:\s*(?:800|900)\b", r"--t-[\w-]+\s*:\s*(?:800|900)\b")]
LINT_L2 = re.compile(r"line-height\s*:\s*(?:0?\.\d+|1(?:\.[01]\d*)?)\s*(?:!important)?\s*[;}]", re.M)
LINT_L3 = re.compile(r"letter-spacing\s*:\s*-", re.M)
LINT_L5 = re.compile(r"<wa-", re.M)
LINT_L6 = [re.compile(r"<button\b[^>]*\btitle=", re.M), re.compile(r"\.(?:Button|IconButton)\}[^>]*\btitle=", re.M)]
LINT_L7_OK = [re.compile(p) for p in (
    r"^https://cdn\.jsdelivr\.net/npm/(?:@[\w.-]+/)?[\w.-]+@\d+\.\d+\.\d+/", r"^https://unpkg\.com/(?:@[\w.-]+/)?[\w.-]+@\d+\.\d+\.\d+/",
    r"^https://cdnjs\.cloudflare\.com/ajax/libs/[\w.-]+/\d+\.\d+\.\d+/", r"^https://fonts\.googleapis\.com/css2\?", r"^https://fonts\.gstatic\.com/")]
LINT_L7_BAD = re.compile(r"webawesome-pro|kit\.webawesome\.com")
LINT_L8 = re.compile(r"\.(?:btn|input|select|textarea|chip|pill)\b[^{]*\{[^}]*\b(?:min-)?height\s*:\s*\d+px")
LINT_L9 = re.compile(r"\.(?:page|site-page)\b[^{]*\{[^}]*\bmax-width\b")
LINT_L10 = re.compile(r"(?<![\w-])(?:gap|row-gap|column-gap|padding(?:-[a-z-]+)?|margin(?:-[a-z-]+)?)\s*:\s*([^;}\"'`]+)")
SPACING_SCALE = {0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64}
LINT_L11 = [re.compile(r"""role=\\?["']?(?:dialog|alertdialog)"""), re.compile(r"aria-modal"), re.compile(r"""class=\\?["']?scrim""")]
LINT_L11_KEY = re.compile(r"""addEventListener\(\s*["']keydown["']""")
LINT_L12 = re.compile(r"""\.(?:Drawer|SidePanel)\}[\s\S]{0,800}?kind=\\?["']?danger""")
LINT_L13 = re.compile(r"&&\s*html\x60\s*<\$\{(?:U|KIT\.ui)\.(?:Dialog|ConfirmDialog|Confirm|SidePanel|Drawer|BottomSheet|Sheet|Popover)\}")
LINT_L14_LAYOUT = re.compile(r"transition(?:-property)?\s*:[^;}]*\b(?:width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*)\b")
LINT_L14_SPRING = re.compile(r"cubic-bezier\(\s*[\d.]+\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)")
LINT_L14_LONG = re.compile(r"(?:animation|transition)[^;}]*?\b(\d{3,4})ms")
LINT_L15 = re.compile(r"<tr\b[^>]*\bonClick")
LINT_L18 = [
    (re.compile(r"""kind=\\?["']?soft|kind:\s*["']soft["']"""), 'kind "soft" (use secondary)'),
    (re.compile(r"\.Menu\}"), "KIT.ui.Menu (use MenuButton)"),
    (re.compile(r"\.Table\}[^>]*\bonRow="), "Table onRow (use DataTable rowLink or onOpen)"),
    (re.compile(r"--ease-spring"), "--ease-spring (use --ease-enter)"),
    (re.compile(r"--fw-heavy"), "--fw-heavy (no weight above 700)"),
]
MIGRATING = 'see kit README "Migrating to 0.3"'


def _outside_tokens(text: str) -> str:
    """Blank out the tokens block (keeping line numbers) so design-system values are not linted."""
    start, end = text.find(TOKENS_BEGIN), text.find(TOKENS_END)
    if start == -1 or end == -1 or end < start:
        return text
    block = text[start : end + len(TOKENS_END)]
    return text[:start] + re.sub(r"[^\n]", "", block) + text[end + len(TOKENS_END) :]


def _handmade_overlays(text: str) -> list[int]:
    """Offsets of hand-made overlay markers (L11): dialog roles, aria-modal, a scrim, an Escape keydown handler."""
    hits = [m.start() for rx in LINT_L11 for m in rx.finditer(text)]
    for m in LINT_L11_KEY.finditer(text):
        if "Escape" in text[max(0, m.start() - 400) : m.end() + 400]:
            hits.append(m.start())
    return sorted(hits)


def _line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def _allowed(text: str, pos: int, rule: str) -> bool:
    start = text.rfind("\n", 0, pos) + 1
    end = text.find("\n", pos)
    line = text[start : end if end != -1 else len(text)]
    names = {rule, "lh"} if rule == "L2" else {rule}
    return any(f"kit:allow {n}" in line for n in names)


def lint(root: Path, project: Project) -> tuple[dict, list[str]]:
    """Static checks of the prototype. Returns (metrics, failures); metrics["warnings"] lists the warnings.

    Scope of the 0.3 rules: index.html (all of it for L1–L3, L7 and L14; the tokens block for L8–L10 and L18)
    and the project modules (js/*.js minus the kit core) for every rule.
    """
    base = proto_dir(root, project)
    cfg = project.proto
    max_sizes = int(cfg.get("max_font_sizes", 16))
    max_600 = int(cfg.get("max_weight_600", 20))
    max_inline = int(cfg.get("max_inline_styles", 60))
    forbidden = [(p, re.compile(p)) for p in cfg.get("forbidden") or []]

    files: list[tuple[str, str, bool]] = []  # (label, text, is_js)
    index = base / "index.html"
    page = index.read_text(encoding="utf-8") if index.is_file() else ""
    if page:
        files.append(("index.html", _outside_tokens(page), False))
    for label, text in _project_modules(base):
        files.append((label, text, True))
    if not files:
        raise ProtoError(f"no prototype in {base}; run: kickoff proto new")

    sizes: set[str] = set()
    weight_600 = inline = 0
    detail: list[str] = []
    for label, text, is_js in files:
        for value in re.findall(r"font-size:\s*([^;}\"'`]+)", text):
            sizes.add(re.sub(r"\s+", " ", value.strip().lower()))
        weight_600 += len(re.findall(r"font-weight:\s*600\b", text))
        if is_js:
            inline += len(re.findall(r"\bstyle=", text))
        for number, line in enumerate(text.splitlines(), 1):
            if is_js:
                for literal in STRING_RE.findall(line):
                    for hex_value in HEX_RE.findall(literal):
                        detail.append(f"raw hex colour {hex_value} in {label}:{number}")
            for pattern, regex in forbidden:
                for match in regex.finditer(line):
                    detail.append(f"forbidden /{pattern}/ in {label}:{number}: {match.group(0)}")

    config_js = base / "js" / "config.js"
    config_text = config_js.read_text(encoding="utf-8") if config_js.is_file() else ""
    if ui_language(project) != "en" and config_js.is_file():
        if not re.search(r"\blocale\s*:", config_text):
            detail.append(
                f"locale: languages.ui is {ui_language(project)} but js/config.js sets no locale; "
                f'add locale: "{ui_locale(project)}" so numbers and dates use its separators'
            )

    # ---- foundation rules (L1–L18)
    errors: list[str] = []
    warnings: list[str] = []
    modules = _project_modules(base)
    tokens = _block(page, TOKENS_BEGIN, TOKENS_END) or ""
    tok_offset = page.find(TOKENS_BEGIN) if tokens else 0
    tok_line = page.count("\n", 0, tok_offset)
    vi = ui_language(project) == "vi"

    def each(rx: re.Pattern, text: str, rule: str):
        for m in rx.finditer(text):
            if not _allowed(text, m.start(), rule):
                yield m

    css_sources = [("index.html", page, 0), *((label, text, 0) for label, text in modules)]
    for label, text, _ in css_sources:
        for rx in LINT_L1:
            for m in each(rx, text, "L1"):
                errors.append(f"weight 800+ in {label}:{_line_of(text, m.start())}; use 400–700 (700 only for display)")
        for m in each(LINT_L2, text, "L2"):
            errors.append(f"line-height below 1.2 in {label}:{_line_of(text, m.start())}; text boxes need ≥ 1.2 (clipped text ≥ 1.5)")
        for m in each(LINT_L3, text, "L3"):
            (errors if vi else warnings).append(f"negative letter-spacing in {label}:{_line_of(text, m.start())}")
        for m in each(LINT_L14_LAYOUT, text, "L14"):
            errors.append(f"layout transition in {label}:{_line_of(text, m.start())}")
        for m in each(LINT_L14_SPRING, text, "L14"):
            if float(m.group(1) or 0) > 1 or float(m.group(2) or 0) > 1:
                errors.append(f"spring easing in {label}:{_line_of(text, m.start())}")
        for m in each(LINT_L14_LONG, text, "L14"):
            line_start = text.rfind("\n", 0, m.start()) + 1
            line_end = text.find("\n", m.start())
            if int(m.group(1)) > 300 and "--dur-tint" not in text[line_start : line_end if line_end != -1 else None]:
                warnings.append(f"motion longer than 300 ms in {label}:{_line_of(text, m.start())}")

    # Project-owned CSS: the tokens block and the modules.
    owned = [("index.html", tokens, tok_line), *((label, text, 0) for label, text in modules)]
    off_scale = 0
    for label, text, shift in owned:
        for m in each(LINT_L8, text, "L8"):
            warnings.append(f"literal control height in {label}:{_line_of(text, m.start()) + shift}; use --ctl-h / --chip-h / --tag-h")
        for m in each(LINT_L9, text, "L9"):
            warnings.append(f'page width override in {label}:{_line_of(text, m.start()) + shift}; use page: "data" | "form"')
        for m in each(LINT_L10, text, "L10"):
            for px in re.findall(r"(-?\d+(?:\.\d+)?)px", m.group(1)):
                if abs(float(px)) not in SPACING_SCALE:
                    off_scale += 1
        for rx, what in LINT_L18:
            for m in each(rx, text, "L18"):
                warnings.append(f"deprecated: {what} in {label}:{_line_of(text, m.start()) + shift}; {MIGRATING}")
    if off_scale:
        warnings.append(f"{off_scale} spacing values off the scale")

    for label, text in modules:
        for m in each(LINT_L5, text, "L5"):
            errors.append(f"library element in {label}:{_line_of(text, m.start())}; use KIT.ui")
        for rx in LINT_L6:
            for m in each(rx, text, "L6"):
                errors.append(f"title tooltip on a button in {label}:{_line_of(text, m.start())}; give the button a label (KIT.ui shows a Tip)")
        for pos in _handmade_overlays(text):
            if not _allowed(text, pos, "L11"):
                errors.append(f"hand-made overlay in {label}:{_line_of(text, pos)}; use KIT.ui.Dialog / SidePanel / ConfirmDialog / Popover / MenuButton")
        for m in each(LINT_L12, text, "L12"):
            warnings.append(f"destructive action in a side panel in {label}:{_line_of(text, m.start())}; use ConfirmDialog")
        for m in each(LINT_L13, text, "L13"):
            errors.append(f"conditionally mounted overlay in {label}:{_line_of(text, m.start())}; pass open= so it can animate out")
        for m in each(LINT_L15, text, "L15"):
            errors.append(f"click handler on a table row in {label}:{_line_of(text, m.start())}; use DataTable rowLink")

    # L7: exact CDN versions and allowed hosts.
    urls: list[tuple[str, str]] = []
    for m in re.finditer(r"<(?:script|link)\b[^>]*>", page):
        tag = m.group(0)
        if re.search(r"""rel=["']?preconnect""", tag):
            continue
        for u in re.findall(r"""\b(?:src|href)=["'](https?://[^"']+)["']""", tag):
            urls.append(("index.html", u))
    for label, text in [("index.html", page), *modules]:
        for u in re.findall(r"""import\(\s*["'](https?://[^"']+)["']""", text):
            urls.append((label, u))
    fonts = re.search(r"\bfonts\s*:\s*\[([^\]]*)\]", config_text)
    if fonts:
        for u in re.findall(r"""["']([^"']+)["']""", fonts.group(1)):
            if not u.startswith("https://fonts.googleapis.com/css2?"):
                errors.append(f"unpinned or disallowed URL {u}")
    for _label, u in urls:
        if not any(rx.match(u) for rx in LINT_L7_OK):
            errors.append(f"unpinned or disallowed URL {u}")
    for label, text in [("index.html", page), *modules]:
        for m in LINT_L7_BAD.finditer(text):
            errors.append(f"unpinned or disallowed URL {m.group(0)} in {label}:{_line_of(text, m.start())}")

    # L17: audit thresholds changed in config.js.
    audit = re.search(r"\baudit\s*:\s*\{([^}]*)\}", config_text)
    if audit:
        changed = []
        for key, value in re.findall(r"(\w+)\s*:\s*([\d.]+)", audit.group(1)):
            if key in AUDIT_DEFAULTS and float(value) != float(AUDIT_DEFAULTS[key]):
                changed.append(key)
        if changed:
            warnings.append(f"audit thresholds changed in js/config.js: {', '.join(changed)}; needs the lead's yes")

    metrics = {
        "font_sizes": len(sizes),
        "weight_600": weight_600,
        "inline_styles": inline,
        "raw_hex": sum(d.startswith("raw hex") for d in detail),
        "off_scale_spacing": off_scale,
        "warnings": warnings,
    }
    failures: list[str] = []
    if metrics["font_sizes"] > max_sizes:
        failures.append(f"font sizes: {metrics['font_sizes']} distinct (max {max_sizes})")
    if weight_600 > max_600:
        failures.append(f"font-weight 600: {weight_600} (max {max_600})")
    if inline > max_inline:
        failures.append(f"inline styles: {inline} (max {max_inline})")
    failures += detail
    failures += errors
    return metrics, failures


# ---------------------------------------------------------------- bundle
SCRIPT_RE = re.compile(r'<script\b[^>]*\bsrc="js/([^"]+)"[^>]*></script>')
SCRIPT_END_RE = re.compile(r"</(script)", re.IGNORECASE)


def _script_path(base: Path, src: str) -> Path:
    """The file a `js/<src>` tag names; absolute paths, drive letters and `..` are refused."""
    if (src[0] in "/\\" or PureWindowsPath(src).drive or ".." in re.split(r"[/\\]", src)
            or not (base / "js" / src).resolve().is_relative_to((base / "js").resolve())):
        raise ProtoError(f"script src 'js/{src}' must stay inside the prototype's js folder")
    return base / "js" / src


def bundle(root: Path, project: Project, out: Path | None = None) -> Path:
    """One self-contained HTML file: project scripts inlined, CDN scripts untouched."""
    base = proto_dir(root, project)
    index = base / "index.html"
    if not index.is_file():
        raise ProtoError(f"no prototype in {base}; run: kickoff proto new")

    def inline(match: re.Match) -> str:
        path = _script_path(base, match.group(1))
        try:
            source = path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise ProtoError(f"missing script: {path}") from exc
        return '<script charset="utf-8">' + SCRIPT_END_RE.sub(r"<\\/\1", source) + "</script>"

    result = SCRIPT_RE.sub(inline, index.read_text(encoding="utf-8"))
    target = out or base / "dist" / "prototype.html"
    _write(target, result)
    return target
