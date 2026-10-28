"""The ECC plugin: where it is installed, the components kick uses, and the GateGuard exemption for kick documents."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

from .errors import KickError

TESTED_ECC = "2.2.3"
MIN_ECC = "2.2.3"
PLUGIN_KEY = "ecc@ecc"
# kind -> names: the only ECC components that skills, agents and references may name
COMPONENTS: dict[str, list[str]] = {
    "skill": ["search-first", "deep-research", "council", "product-lens", "codebase-onboarding", "contract-first",
              "api-design", "tdd-workflow", "orch-add-feature", "orch-change-feature", "orch-fix-defect",
              "e2e-testing"],
    "agent": ["architect", "planner", "security-reviewer", "database-reviewer", "code-explorer", "code-reviewer"],
}
EXEMPT_ENV = "GATEGUARD_EXEMPT_GLOBS"


class EccError(KickError):
    """ECC is missing, or a file kick would change cannot be read."""


@dataclass(frozen=True)
class Install:
    root: Path
    version: str


@dataclass(frozen=True)
class Check:
    level: str  # "ok" | "warn" | "fail"
    text: str

    def __str__(self) -> str:
        return f"{self.level}: {self.text}"


# ---------------------------------------------------------------- locating ECC
def config_dir() -> Path:
    env = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(env) if env else Path.home() / ".claude"


VERSION = re.compile(r"^v?(\d+(?:\.\d+)*)")


def version_key(value: str) -> tuple[int, ...] | None:
    """(2, 2, 3) for "2.2.3" or "v2.2.3-rc.1"; None when the value is not a version (a commit SHA, "unknown")."""
    m = VERSION.match((value or "").strip()) if isinstance(value, str) else None
    return tuple(int(n) for n in m.group(1).split(".")[:3]) if m else None


def _norm(p: str | Path) -> str:
    return os.path.normcase(str(Path(p).resolve()))


def _covers(project_path: str, project: Path) -> bool:
    """True when the entry's project folder is `project` or one of its parents (a git root above the project)."""
    base, here = _norm(project_path), _norm(project)
    return here == base or here.startswith(base.rstrip(os.sep) + os.sep)


def _manifest_version(root: Path) -> str:
    try:
        return json.loads((root / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")).get("version", "")
    except (OSError, ValueError):
        return ""


def find_install(project: Path | None = None) -> Install:
    """`KICK_ECC_ROOT`, else installed_plugins.json: a project-scope entry for `project` first, then the user
    scope; the highest version wins within a scope."""
    env = os.environ.get("KICK_ECC_ROOT")
    if env:
        root = Path(env)
        if not root.is_dir():
            raise EccError(f"KICK_ECC_ROOT={env} is not a folder")
        return Install(root, _manifest_version(root))
    best = plugin_install(lambda key: key == PLUGIN_KEY, project)
    if best is None:
        raise EccError(f"ECC is not installed (no {PLUGIN_KEY} in installed_plugins.json)")
    return best


def plugin_install(match, project: Path | None = None) -> Install | None:
    """The install of the first plugin key `match` accepts in installed_plugins.json: a project-scope entry for
    `project` first, then the user scope; the highest version wins within a scope. None when not installed."""
    path = config_dir() / "plugins" / "installed_plugins.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        data = {}
    except ValueError as exc:
        raise EccError(f"{path}: invalid JSON: {exc}") from exc
    plugins = data.get("plugins") if isinstance(data, dict) else None
    lists = [v for k, v in plugins.items() if match(k)] if isinstance(plugins, dict) else []
    entries = [e for v in lists if isinstance(v, list) for e in v if isinstance(e, dict)]
    entries = [e for e in entries if isinstance(e.get("installPath"), str) and Path(e["installPath"]).is_dir()]
    here = [e for e in entries if e.get("scope") in ("project", "local") and project is not None
            and isinstance(e.get("projectPath"), str) and _covers(e["projectPath"], project)]
    pool = here or [e for e in entries if e.get("scope") in ("user", "managed", None)]
    if not pool:
        return None
    best = max(pool, key=lambda e: version_key(str(e.get("version", ""))) or (0,))
    return Install(Path(best["installPath"]), str(best.get("version", "")))


def component_path(root: Path, kind: str, name: str) -> Path:
    if kind == "skill":
        return root / "skills" / name / "SKILL.md"
    return root / "agents" / f"{name}.md"


def missing_components(root: Path) -> list[str]:
    return [f"{kind} {name}" for kind, names in COMPONENTS.items() for name in names
            if not component_path(root, kind, name).is_file()]


# ---------------------------------------------------------------- doctor
EXEMPT_GLOBS = ["docs/kick/**"]


SETTINGS_FILES = ("settings.local.json", "settings.json")  # the first file that sets a key wins


def _read_env(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    env = data.get("env") if isinstance(data, dict) else None
    return env if isinstance(env, dict) else {}


def _exempt_source(project: Path) -> Path:
    """The project settings file whose GATEGUARD_EXEMPT_GLOBS is in effect (settings.json when none sets it)."""
    for name in SETTINGS_FILES:
        path = project / ".claude" / name
        if EXEMPT_ENV in _read_env(path):
            return path
    return project / ".claude" / "settings.json"


def _split(value) -> list[str]:
    if isinstance(value, list):
        value = ",".join(v for v in value if isinstance(v, str))
    if not isinstance(value, str):
        return []
    return [g.strip() for g in value.split(",") if g.strip()]


def install_checks(project: Path | None) -> tuple[Install | None, list[Check]]:
    """D1 installed, D2 version, D3 components."""
    try:
        install = find_install(project)
    except EccError as exc:
        return None, [Check("fail", f"D1 {exc}")]
    out = [Check("ok", f"D1 ECC {install.version or '(version unknown)'} at {install.root}")]
    v = version_key(install.version)
    if v is None:
        out.append(Check("warn", f"D2 ECC version {install.version or '(none)'!r} is not a version number; "
                                 f"kick needs {MIN_ECC} or later"))
    elif v < version_key(MIN_ECC):
        out.append(Check("fail", f"D2 ECC {install.version or '?'} is older than {MIN_ECC}: update the ecc plugin"))
    elif v[:2] > version_key(TESTED_ECC)[:2]:
        out.append(Check("warn", f"D2 ECC {install.version} is newer than the tested {TESTED_ECC}"))
    else:
        out.append(Check("ok", f"D2 version {install.version} (tested {TESTED_ECC})"))
    missing = missing_components(install.root)
    out.append(Check("fail", "D3 missing: " + ", ".join(missing)) if missing
               else Check("ok", f"D3 {sum(map(len, COMPONENTS.values()))} components present"))
    return install, out


def doctor(project: Path | None) -> list[Check]:
    """D1-D3 from install_checks; D4 a disabled ECC session hook; D5 the GateGuard exemption of kick documents."""
    _, out = install_checks(project)
    disabled = _split(os.environ.get("ECC_DISABLED_HOOKS", ""))
    if any("session:start" in d for d in disabled):
        out.append(Check("warn", "D4 ECC_DISABLED_HOOKS turns off ECC's session:start hook (no instincts at start)"))
    if project is not None:
        source = _exempt_source(project)
        have = set(_split(_read_env(source).get(EXEMPT_ENV)))
        lack = [g for g in EXEMPT_GLOBS if g not in have]
        out.append(Check("warn", f"D5 {EXEMPT_ENV} in .claude/{source.name} lacks {', '.join(lack)}: run kick setup")
                   if lack else Check("ok", "D5 GateGuard exempts kick documents"))
    return out


# ---------------------------------------------------------------- setup
@dataclass(frozen=True)
class Change:
    path: Path
    old: str
    new: str


def settings_change(project: Path) -> Change | None:
    """Add the kick globs to the settings file whose value is in effect (settings.local.json when it sets one)."""
    path = _exempt_source(project)
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    try:
        data = json.loads(old) if old.strip() else {}
    except ValueError as exc:
        raise EccError(f"{path}: invalid JSON, nothing written: {exc}") from exc
    if not isinstance(data, dict):
        raise EccError(f"{path}: expected a JSON object, nothing written")
    env = data.setdefault("env", {})
    if not isinstance(env, dict):
        raise EccError(f"{path}: \"env\" is not an object, nothing written")
    value = env.get(EXEMPT_ENV, "")
    if not isinstance(value, str):
        raise EccError(f"{path}: env.{EXEMPT_ENV} is not a string of comma-separated globs, nothing written")
    globs = _split(value)
    added = [g for g in EXEMPT_GLOBS if g not in globs]
    if not added:
        return None
    env[EXEMPT_ENV] = ",".join(globs + added)
    return Change(path, old, json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def write_change(change: Change) -> None:
    """Write through a temporary file in the same folder, so a crash never leaves a truncated settings file."""
    change.path.parent.mkdir(parents=True, exist_ok=True)
    tmp = change.path.with_name(change.path.name + ".kick-tmp")
    tmp.write_text(change.new, encoding="utf-8", newline="\n")
    os.replace(tmp, change.path)

