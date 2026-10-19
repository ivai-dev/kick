"""Prototype kit tooling: scaffold a prototype, check it in a headless browser, lint it, bundle it."""

from __future__ import annotations

import html as html_lib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
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
        role_lines.append(f"    {{ id: {json.dumps(role)}, name: {json.dumps(name, ensure_ascii=False)}, home: {json.dumps(home)} }},")
    platforms = [p for p in PLATFORM_ORDER if any(p in _split_list(r["platform"]) for r in rows)] or ["web"]
    lines = [
        f"// config.js — {project.name}: roles, releases and platforms of the prototype.",
        "window.KIT_CONFIG = {",
        f"  product: {json.dumps(project.name, ensure_ascii=False)},",
        "  roles: [",
        *role_lines,
        "  ],",
        f"  releases: {json.dumps([r.id for r in project.releases], ensure_ascii=False)},",
        f"  platforms: {json.dumps(platforms)},",
        f"  defaultRole: {json.dumps(ordered[0] if ordered else None)},",
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


def _screen_task(browser: _Browser, base: Path, screen: dict, kind: str, shots: Path | None) -> str | None:
    route = screen["id"]
    role = screen["roles"][0] if screen["roles"] else ""
    hash_ = f"{route}-{role}-{'light' if kind == 'narrow' else kind}"
    try:
        if kind == "narrow":
            attrs = browser.dump(
                (base / "narrow.html").as_uri() + "#" + hash_, 6000, size=(600, 844), file_access=True
            )
            if _attr(attrs, "ok") == "narrow":
                return None
            return f"{route} narrow: {_attr(attrs, 'err') or '390 px check did not complete'}"
        shot = shots / f"{route}-{kind}.png" if shots else None
        attrs = browser.dump((base / "index.html").as_uri() + "#" + hash_, 5000, shot=shot)
    except ProtoError as exc:
        return f"{route} {kind}: {exc}"
    err = _attr(attrs, "err")
    if err:
        return f"{route} {kind}: {err}"
    if _attr(attrs, "ready") != "1":
        return f"{route} {kind}: not ready"
    return None


def _scenario_task(browser: _Browser, base: Path, sid: str) -> str | None:
    try:
        attrs = browser.dump((base / "index.html").as_uri() + f"#scn-{sid}", 9000)
        err = _attr(attrs, "err")
        if err:
            return f"scenario {sid}: {err}"
        if _attr(attrs, "scenario") != "done":
            return f"scenario {sid}: did not finish ({_attr(attrs, 'scenario') or 'not started'})"
        attrs = browser.dump(
            (base / "narrow.html").as_uri() + f"#scn-{sid}-light", 12000, size=(600, 844), file_access=True
        )
    except ProtoError as exc:
        return f"scenario {sid}: {exc}"
    if _attr(attrs, "ok") != "narrow":
        return f"scenario {sid}: narrow: {_attr(attrs, 'err') or '390 px check did not complete'}"
    return None


def check(
    root: Path,
    project: Project,
    routes: list[str] | None = None,
    shots: Path | None = None,
    jobs: int = 4,
) -> list[str]:
    """Open the prototype in a headless browser. Returns failures (empty = pass).

    `routes` limits the per-screen dumps to those screen ids; `[]` means coverage only. Scenarios run
    only when `routes` is None.
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

    wanted = None if routes is None else {r.lower() for r in routes}
    selected = [s for s in screens if wanted is None or s["id"] in wanted or s["code"].lower() in wanted]
    tasks = [(s, kind) for s in selected for kind in (*THEMES, "narrow")]
    with ThreadPoolExecutor(max_workers=max(1, jobs)) as pool:
        screen_results = list(pool.map(lambda t: _screen_task(browser, base, t[0], t[1], shots), tasks))
        scenario_results = (
            list(pool.map(lambda sid: _scenario_task(browser, base, sid), scenarios)) if routes is None else []
        )
    failures += [r for r in screen_results if r]
    failures += [r for r in scenario_results if r]
    return failures


# ---------------------------------------------------------------- lint
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])")
STRING_RE = re.compile(r"\"(?:[^\"\\\n]|\\.)*\"|'(?:[^'\\\n]|\\.)*'|`[^`\n]*`")


def _outside_tokens(text: str) -> str:
    """Blank out the tokens block (keeping line numbers) so design-system values are not linted."""
    start, end = text.find(TOKENS_BEGIN), text.find(TOKENS_END)
    if start == -1 or end == -1 or end < start:
        return text
    block = text[start : end + len(TOKENS_END)]
    return text[:start] + re.sub(r"[^\n]", "", block) + text[end + len(TOKENS_END) :]


def lint(root: Path, project: Project) -> tuple[dict[str, int], list[str]]:
    base = proto_dir(root, project)
    cfg = project.proto
    max_sizes = int(cfg.get("max_font_sizes", 16))
    max_600 = int(cfg.get("max_weight_600", 20))
    max_inline = int(cfg.get("max_inline_styles", 60))
    forbidden = [(p, re.compile(p)) for p in cfg.get("forbidden") or []]

    files: list[tuple[str, str, bool]] = []  # (label, text, is_js)
    index = base / "index.html"
    if index.is_file():
        files.append(("index.html", _outside_tokens(index.read_text(encoding="utf-8")), False))
    for path in sorted((base / "js").glob("*.js")):
        files.append((f"js/{path.name}", path.read_text(encoding="utf-8"), True))
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

    metrics = {
        "font_sizes": len(sizes),
        "weight_600": weight_600,
        "inline_styles": inline,
        "raw_hex": sum(d.startswith("raw hex") for d in detail),
    }
    failures: list[str] = []
    if metrics["font_sizes"] > max_sizes:
        failures.append(f"font sizes: {metrics['font_sizes']} distinct (max {max_sizes})")
    if weight_600 > max_600:
        failures.append(f"font-weight 600: {weight_600} (max {max_600})")
    if inline > max_inline:
        failures.append(f"inline styles: {inline} (max {max_inline})")
    failures += detail
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
