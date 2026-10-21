"""FE v0 tooling: scaffold the frontend monorepo from the ux-spec, update the plugin-owned kit package, run the
checks, build the one-file customer bundle."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

from . import design
from .errors import KickoffError
from .model import Project, inside_root

# The template ships inside the package so `uv tool install` and wheels carry it.
TEMPLATE_DIR = Path(__file__).resolve().parent / "templates" / "fe"
KIT_PACKAGE = Path("packages") / "kit"  # plugin-owned: replaced by `kickoff fe update`, guarded by the hook
APP = Path("apps") / "web"  # fixed: the template's lockfile importers and manifest script name it
KIT_NAME = "@kickoff/kit"
TIMEOUT = 1800  # seconds per pnpm script; a hung build or browser must not hang the check
GENERATED = ("src/kickoff/config.ts", "src/kickoff/screens.ts", "src/kickoff/scenarios.ts")
SKIP_PARTS = {"node_modules", "dist", "dist-artifact", "test-results", "playwright-report", ".vite", "__pycache__",
              ".turbo"}
PLATFORM_ORDER = ("web", "windows", "android")
LOCALES = {
    "en": "en-US", "vi": "vi-VN", "fr": "fr-FR", "de": "de-DE", "es": "es-ES", "it": "it-IT", "pt": "pt-PT", "nl": "nl-NL",
    "ja": "ja-JP", "ko": "ko-KR", "zh": "zh-CN", "th": "th-TH", "id": "id-ID", "ms": "ms-MY",
}
CHECK_SCRIPTS = ("typecheck", "lint", "test", "build", "e2e")
SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json", ".md"}
EDGE_PATHS = (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe")


class FeError(KickoffError):
    """A frontend problem the user must fix (existing files, a missing ux-spec, a failed tool)."""


class ToolMissing(FeError):
    """pnpm or a browser for the e2e sweep is missing: the check is skipped, not passed (exit 4)."""


# ---------------------------------------------------------------- paths and ux-spec
def template_dir() -> Path:
    env = os.environ.get("KICKOFF_FE_TEMPLATE")
    return Path(env) if env else TEMPLATE_DIR


def fe_root(root: Path, project: Project) -> Path:
    return inside_root(root, project.fe.get("dir", "."), "fe.dir")


def app_dir(root: Path, project: Project) -> Path:
    return fe_root(root, project) / APP


def ux_spec_path(root: Path, project: Project) -> Path:
    project.docs_dir(root)
    value = project.fe.get("ux_spec") or project.proto.get("ux_spec") or f"{project.docs_root}/05-design/ux-spec.md"
    return inside_root(root, value, "fe.ux_spec")


def forbidden_patterns(project: Project) -> list[str]:
    return list(project.fe.get("forbidden") or project.proto.get("forbidden") or [])


def _cells(line: str) -> list[str]:
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _split_list(value: str) -> list[str]:
    return [v.strip().lower() for v in re.split(r"[,;/]", value) if v.strip()]


def parse_ux_spec(path: Path) -> list[dict]:
    """Rows {code, name, roles, platform, release} of the first table whose header starts with `| ID`."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError as exc:
        raise FeError(f"missing ux-spec: {path}") from exc
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
        rows.append({"code": cells[0], "name": cells[1], "roles": _split_list(cells[2]),
                     "platform": cells[3].lower(), "release": cells[4]})
    return rows


def screen_id(code: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-")


def _check_ids(rows: list[dict]) -> None:
    seen: dict[str, str] = {}
    for row in rows:
        sid = screen_id(row["code"])
        if not sid:
            raise FeError(f"ux-spec screen {row['code']!r} ({row['name']!r}) has no usable ID")
        if sid in seen:
            raise FeError(f"ux-spec screens {seen[sid]!r} and {row['code']!r} both become the screen id {sid!r}")
        seen[sid] = row["code"]


def ui_language(project: Project) -> str:
    value = str((project.languages or {}).get("ui") or "en")
    return value.split("-")[0].split("_")[0].lower() or "en"


def ui_locale(project: Project) -> str:
    value = str((project.languages or {}).get("ui") or "en")
    return value if "-" in value else LOCALES.get(value.lower(), value.lower())


# ---------------------------------------------------------------- generated files
def _q(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def _roles_in_order(project: Project, rows: list[dict]) -> list[str]:
    used: list[str] = []
    for row in rows:
        used += [r for r in row["roles"] if r not in used]
    return [r for r in project.roles if r in used] + [r for r in used if r not in project.roles]


def config_ts(project: Project, rows: list[dict]) -> str:
    roles = _roles_in_order(project, rows)
    lines = []
    for role in roles:
        home = next((screen_id(r["code"]) for r in rows if role in r["roles"]), None)
        name = project.roles[role].name if role in project.roles else role
        lines.append(f"    {{ id: {_q(role)}, name: {_q(name)}, shell: \"app\", home: {_q(home)} }},")
    return "\n".join([
        f"// {project.name}: roles and releases of the FE v0. Generated by `kickoff fe new`; project-owned from here.",
        "// shell: \"app\" (sidebar work tool) or \"site\" (public site); density: \"compact\" | \"comfortable\" | \"touch\".",
        'import type { KickoffConfig } from "@kickoff/kit";',
        "",
        "export const config: KickoffConfig = {",
        f"  product: {_q(project.name)},",
        f"  lang: {_q(ui_language(project))},",
        f"  locale: {_q(ui_locale(project))},",
        f"  releases: {_q([r.id for r in project.releases])},",
        f"  defaultRole: {_q(roles[0] if roles else None)},",
        "  roles: [",
        *lines,
        "  ],",
        "};",
        "",
    ])


def screens_ts(project: Project, rows: list[dict]) -> str:
    lines = []
    for row in rows:
        platforms = [p for p in _split_list(row["platform"]) if p in PLATFORM_ORDER] or ["web"]
        lines.append(
            f"  {{ id: {_q(screen_id(row['code']))}, code: {_q(row['code'])}, name: {_q(row['name'])}, "
            f"roles: {_q(row['roles'])}, platforms: {_q(platforms)}, rel: {_q(row['release'])}, "
            f"nav: {_q(row['name'])}, page: \"data\" }},"
        )
    return "\n".join([
        f"// {project.name}: one row per ux-spec screen. Keep `code`, `roles`, `platforms` and `rel` equal to the ux-spec.",
        'import type { ScreenDef } from "@kickoff/kit";',
        "",
        "export const screens: ScreenDef[] = [",
        *lines,
        "];",
        "",
    ])


def scenarios_ts(project: Project) -> str:
    return "\n".join([
        f"// {project.name}: guided demo scenarios, one per key journey: {{ id, name, role, steps: [{{ text, screen, params? }}] }}.",
        'import type { Scenario } from "@kickoff/kit";',
        "",
        "export const scenarios: Scenario[] = [];",
        "",
    ])


STUB_TSX = 'import { Placeholder } from "@kickoff/kit";\n\nexport default function Screen() {\n  return <Placeholder />;\n}\n'


# ---------------------------------------------------------------- new and update
def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def _template_files(src: Path) -> list[Path]:
    return [p for p in sorted(src.rglob("*")) if p.is_file() and not SKIP_PARTS.intersection(p.relative_to(src).parts)]


def new_fe(root: Path, project: Project, force: bool = False) -> list[Path]:
    """Copy the template into fe.dir and write the generated files for the ux-spec rows."""
    src, dest, app = template_dir(), fe_root(root, project), app_dir(root, project)
    if app.exists() and not force:
        raise FeError(f"{app} exists; use --force to regenerate the screens and refresh packages/kit")
    rows = parse_ux_spec(ux_spec_path(root, project))
    if not rows:
        raise FeError(f"no screens found in {ux_spec_path(root, project)}")
    _check_ids(rows)
    if not (src / "package.json").is_file():
        raise FeError(f"FE template not found: {src}")
    sample = [APP / g for g in GENERATED]
    written: list[Path] = []
    for path in _template_files(src):
        rel = path.relative_to(src)
        if rel.name == ".gitignore.kickoff" or rel in sample or rel.parent == APP / "src" / "screens":
            continue
        target = dest / rel
        if target.exists() and force and KIT_PACKAGE not in rel.parents:
            continue  # project-owned files survive --force; only the kit package is refreshed
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        written.append(target)
    kickoff_dir = app / "src" / "kickoff"
    for name, text in (("config.ts", config_ts(project, rows)), ("screens.ts", screens_ts(project, rows)),
                       ("scenarios.ts", scenarios_ts(project))):
        if not (kickoff_dir / name).exists():  # project-owned once written: --force never overwrites them
            _write(kickoff_dir / name, text)
            written.append(kickoff_dir / name)
    if force:
        written += _append_screens(kickoff_dir / "screens.ts", project, rows)
    for row in rows:
        stub = app / "src" / "screens" / f"{screen_id(row['code'])}.tsx"
        if not stub.exists():
            _write(stub, STUB_TSX)
            written.append(stub)
    ignore = src / ".gitignore.kickoff"
    if ignore.is_file():
        gitignore = root / ".gitignore"
        have = gitignore.read_text(encoding="utf-8").splitlines() if gitignore.exists() else []
        add = [line for line in ignore.read_text(encoding="utf-8").splitlines() if line and line not in have]
        if add:
            _write(gitignore, "\n".join([*have, *add]) + "\n")
            written.append(gitignore)
    return written


def _append_screens(path: Path, project: Project, rows: list[dict]) -> list[Path]:
    """Add the rows of ux-spec screens missing from an existing screens.ts before its closing `];`."""
    text = path.read_text(encoding="utf-8")
    missing = [r for r in rows if f'id: {_q(screen_id(r["code"]))}' not in text]
    if not missing:
        return []
    lines = [line for line in screens_ts(project, missing).splitlines() if line.startswith("  { id: ")]
    head, sep, tail = text.rpartition("];")
    if not sep:
        raise FeError(f"{path}: no closing `];`; add the rows for {', '.join(r['code'] for r in missing)} by hand")
    _write(path, head.rstrip("\n") + "\n" + "\n".join(lines) + "\n" + sep + tail)
    return [path]


def new_roles(root: Path, project: Project) -> list[str]:
    """Roles of the ux-spec that config.ts does not define (after `fe new --force`)."""
    config = (app_dir(root, project) / "src" / "kickoff" / "config.ts").read_text(encoding="utf-8")
    rows = parse_ux_spec(ux_spec_path(root, project))
    return [r for r in _roles_in_order(project, rows) if f"id: {_q(r)}" not in config]


def update_kit(root: Path, project: Project, dry: bool = False) -> list[tuple[str, str]]:
    """Make packages/kit equal to the plugin's copy: (path, "added" | "updated" | "removed") per change."""
    src = template_dir() / KIT_PACKAGE
    dest = fe_root(root, project) / KIT_PACKAGE
    if not src.is_dir():
        raise FeError(f"kit package not found in the template: {src}")
    if not dest.is_dir():
        raise FeError(f"no {dest}; run: kickoff fe new")
    changes: list[tuple[str, str]] = []
    want = {p.relative_to(src): p for p in _template_files(src)}
    have = {p.relative_to(dest): p for p in _template_files(dest)}
    for rel, path in want.items():
        if rel not in have:
            changes.append((str(KIT_PACKAGE / rel), "added"))
        elif have[rel].read_bytes() != path.read_bytes():
            changes.append((str(KIT_PACKAGE / rel), "updated"))
        else:
            continue
        if not dry:
            (dest / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, dest / rel)
    for rel, path in have.items():
        if rel not in want:
            changes.append((str(KIT_PACKAGE / rel), "removed"))
            if not dry:
                path.unlink()
    return changes


def migration_notes() -> list[str]:
    path = template_dir() / KIT_PACKAGE / "MIGRATION.md"
    if not path.is_file():
        return []
    return [line[2:].strip() for line in path.read_text(encoding="utf-8").splitlines() if line.startswith("- ")]


# ---------------------------------------------------------------- check and bundle
Runner = Callable[..., subprocess.CompletedProcess]


def _pnpm() -> str:
    exe = shutil.which("pnpm")
    if not exe:
        raise ToolMissing("pnpm not found; install Node.js 22+ and pnpm (corepack enable pnpm)")
    return exe


def browser_channel() -> str | None:
    """The Playwright channel for the e2e sweep: PW_CHANNEL, else an installed Edge or Chrome."""
    if os.environ.get("PW_CHANNEL"):
        return os.environ["PW_CHANNEL"]
    if sys.platform == "win32" and any(Path(p).is_file() for p in EDGE_PATHS):
        return "msedge"
    for name, channel in (("google-chrome", "chrome"), ("chrome", "chrome"), ("msedge", "msedge"),
                          ("microsoft-edge", "msedge")):
        if shutil.which(name):
            return channel
    return None


def _tail(text: str, n: int = 25) -> str:
    lines = [line for line in (text or "").splitlines() if line.strip()]
    return "\n".join("    " + line for line in lines[-n:])


def coverage(rows: list[dict], manifest: dict) -> list[str]:
    expected = [r["code"] for r in rows]
    registered = [s.get("code") for s in manifest.get("screens", [])]
    out = [f"coverage: {c} in ux-spec but not registered" for c in expected if c not in registered]
    out += [f"coverage: {c} registered but not in ux-spec" for c in registered if c not in expected]
    by_code = {s.get("code"): s for s in manifest.get("screens", [])}
    for row in rows:
        screen = by_code.get(row["code"])
        if screen and sorted(screen.get("roles", [])) != sorted(row["roles"]):
            out.append(f"coverage: {row['code']} roles {screen.get('roles')} differ from the ux-spec {row['roles']}")
        if screen and screen.get("rel") != row["release"]:
            out.append(f"coverage: {row['code']} release {screen.get('rel')!r} differs from the ux-spec {row['release']!r}")
    return out


def scan_forbidden(root: Path, project: Project) -> list[str]:
    try:
        patterns = [re.compile(p, re.IGNORECASE) for p in forbidden_patterns(project)]
    except re.error as exc:
        raise FeError(f"fe.forbidden in project.yaml: invalid regular expression: {exc}") from exc
    if not patterns:
        return []
    base = fe_root(root, project)
    out = []
    for folder in ("apps", "packages"):
        for dirpath, dirnames, filenames in os.walk(base / folder):
            dirnames[:] = sorted(d for d in dirnames if d not in SKIP_PARTS)  # prune node_modules and builds
            for name in sorted(filenames):
                path = Path(dirpath) / name
                if path.suffix not in SOURCE_SUFFIXES:
                    continue
                for n, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                    out += [f"forbidden: {path.relative_to(base).as_posix()}:{n}: /{p.pattern}/" for p in patterns
                            if p.search(line)]
    return out


def _run(run: Runner, argv: list[str], cwd: Path, env: dict | None = None) -> subprocess.CompletedProcess:
    try:
        return run(argv, cwd=cwd, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace",
                   stdin=subprocess.DEVNULL, timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(argv, 124, "", f"timed out after {TIMEOUT} s")


CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
CSS_RULE = re.compile(r"([^{}]+)\{([^{}]*)\}")
CSS_VAR = re.compile(r"(--[\w-]+)\s*:")


def direction_vars(css: str, d: str) -> tuple[set[str] | None, set[str] | None]:
    """The custom properties of a direction file's light block and dark block (None when a block is missing)."""
    light = f':root[data-direction="{d}"]'
    dark = f'{light}[data-theme="dark"]'
    found: dict[str, set[str]] = {}
    for selectors, body in CSS_RULE.findall(CSS_COMMENT.sub("", css)):
        for sel in (s.strip() for s in selectors.split(",")):
            if sel in (light, dark):
                found.setdefault(sel, set()).update(CSS_VAR.findall(body))
    return found.get(light), found.get(dark)


def direction_problems(app: Path, manifest: dict, need_lock: bool) -> list[str]:
    """Every offered (or locked) direction has its CSS file with a dark block, imported by directions.css; after
    kickoff:design-direction a direction is locked."""
    offered = [d for d in manifest.get("directions") or [] if isinstance(d, str)]
    locked = manifest.get("direction") if isinstance(manifest.get("direction"), str) else None
    styles = app / "src" / "styles"
    entry = styles / "directions.css"
    imports = CSS_COMMENT.sub("", entry.read_text(encoding="utf-8-sig")) if entry.is_file() else ""
    out = []
    for d in offered or ([locked] if locked else []):
        rel = f"apps/web/src/styles/directions/{d}.css"
        path = styles / "directions" / f"{d}.css"
        if not path.is_file():
            out.append(f"direction {d}: missing {rel}")
            continue
        light, dark = direction_vars(path.read_text(encoding="utf-8-sig"), d)
        dark_sel = f':root[data-direction="{d}"][data-theme="dark"]'
        if light is None:
            out.append(f'direction {d}: {rel} has no :root[data-direction="{d}"] block')
        elif dark is None:
            out.append(f"direction {d}: {rel} has no dark block ({dark_sel})")
        elif light - dark:
            # Same specificity as the dark tokens and loaded later: a light value missing in dark leaks into dark.
            out.append(f"direction {d}: the dark block ({dark_sel}) lacks {', '.join(sorted(light - dark))}")
        if f"directions/{d}.css" not in imports:
            out.append(f"direction {d}: not imported in apps/web/src/styles/directions.css")
    if need_lock and not locked:
        out.append("direction: kickoff:design-direction is done but none is locked; set `direction` in "
                   "apps/web/src/kickoff/config.ts to the direction the customer approved (gate CD)")
    return out


def detect(root: Path, project: Project, run: Runner = subprocess.run) -> list[str]:
    """impeccable's deterministic detector over the project's own UI code (exit 2 = findings)."""
    command = design.detector(root)
    if command is None:
        return ["detect: impeccable's detector not found; install impeccable (kickoff design doctor), "
                "or pass --skip-detect (reported as skipped)"]
    base = fe_root(root, project)
    targets = [p for p in (app_dir(root, project) / "src", base / "packages" / "ui" / "src") if p.is_dir()]
    env = {**os.environ, "IMPECCABLE_NO_TELEMETRY": "1"}
    try:
        done = _run(run, [*command, "detect", *(p.relative_to(base).as_posix() for p in targets)], base, env)
    except OSError as exc:  # a launcher that does not exist or cannot start
        return [f"detect: could not run {' '.join(command)}: {exc}"]
    if done.returncode == 0:
        return []
    output = (done.stderr or "") + (done.stdout or "")
    if done.returncode == 2:
        return ["detect: impeccable found AI-default patterns; fix them, or rule one out with a reason in "
                f".impeccable/config.json detector.ignoreRules\n{_tail(output)}"]
    return [f"detect: failed (exit {done.returncode})\n{_tail(output)}"]


def check(root: Path, project: Project, skip_e2e: bool = False, run: Runner = subprocess.run,
          shots: Path | None = None, skip_detect: bool = False, direction: str | None = None,
          need_lock: bool = False) -> list[str]:
    """Run the frontend checks; return failures (empty = pass). Raises ToolMissing when the check cannot run."""
    base = fe_root(root, project)
    if not (base / "package.json").is_file() or not app_dir(root, project).is_dir():
        raise FeError(f"no frontend in {base}; run: kickoff fe new")
    pnpm = _pnpm()
    if not (base / "node_modules").is_dir():
        return ["dependencies: not installed; run: pnpm install"]
    env = dict(os.environ)
    scripts = [s for s in CHECK_SCRIPTS if not (skip_e2e and s == "e2e")]
    if "e2e" in scripts:
        channel = browser_channel()
        if channel:
            env["PW_CHANNEL"] = channel
        if shots is not None:
            env["KICKOFF_SHOTS"] = str(shots.resolve())  # the e2e sweep writes one full-page screenshot per test
        if direction:
            env["KICKOFF_DIRECTION"] = direction
    failures: list[str] = []
    for script in scripts:
        done = _run(run, [pnpm, "-s", script], base, env)
        if done.returncode == 0:
            continue
        output = (done.stdout or "") + (done.stderr or "")
        if script == "e2e" and re.search(r"Executable doesn't exist|browserType\.launch|is not found at|"
                                         r"Chromium distribution .* is not found", output):
            hint = ("no browser for the e2e sweep: install Edge or Chrome, or run "
                    "`pnpm --filter web exec playwright install chromium` and set PW_CHANNEL=chromium")
            if not failures:
                raise ToolMissing(hint)
            failures.append(f"e2e: skipped ({hint})")  # keep the failures already found
            continue
        failures.append(f"{script}: failed (exit {done.returncode})\n{_tail(output)}")
    done = _run(run, [pnpm, "-s", "manifest"], base, env)
    try:
        manifest = json.loads(done.stdout) if done.returncode == 0 else None
    except ValueError:
        manifest = None
    if manifest is None:
        failures.append(f"manifest: failed (exit {done.returncode})\n{_tail((done.stdout or '') + (done.stderr or ''))}")
    else:
        failures += coverage(parse_ux_spec(ux_spec_path(root, project)), manifest)
        failures += direction_problems(app_dir(root, project), manifest, need_lock)
        if direction and direction not in (manifest.get("directions") or []) + [manifest.get("direction")]:
            failures.append(f"direction {direction}: not in config.ts directions")
    if not skip_detect:
        failures += detect(root, project, run)
    failures += scan_forbidden(root, project)
    return failures


def bundle(root: Path, project: Project, run: Runner = subprocess.run) -> Path:
    base = fe_root(root, project)
    done = _run(run, [_pnpm(), "-s", "build:artifact"], base)
    if done.returncode != 0:
        raise FeError(f"pnpm build:artifact failed (exit {done.returncode})\n{_tail((done.stdout or '') + (done.stderr or ''))}")
    out = app_dir(root, project) / "dist-artifact" / "index.html"
    if not out.is_file():
        raise FeError(f"pnpm build:artifact did not write {out}")
    return out
