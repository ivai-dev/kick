"""The ECC plugin: where it is installed, the components kickoff uses, project setup and patched handoffs."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

from .errors import KickoffError

TESTED_ECC = "2.2.3"
MIN_ECC = "2.2.3"
PLUGIN_KEY = "ecc@ecc"
# kind -> names: the only ECC components that skills, agents and references may name
COMPONENTS: dict[str, list[str]] = {
    "skill": ["search-first", "deep-research", "council", "product-lens", "accessibility", "frontend-a11y"],
    "agent": ["architect", "planner", "security-reviewer", "database-reviewer"],
    "script": ["scripts/github-coordination.js"],
}
SCRIPTS = {Path(p).stem: p for p in COMPONENTS["script"]}
EXEMPT_ENV = "GATEGUARD_EXEMPT_GLOBS"
ROUTER_TABLE = Path("skills") / "ecc-router" / "references" / "routing-table.md"
ROUTER_BEGIN, ROUTER_END = "<!-- kickoff:router:begin -->", "<!-- kickoff:router:end -->"
ROUTER_HEADING = "## 3. Planning lane"
ROUTER_BLOCK = f"""{ROUTER_BEGIN}
| Request | Primary | Support |
|---------|---------|---------|
| Repository has `.kickoff/` and the request is kickoff work (discovery, scope, features, UX, prototype, sign-off, architecture, plan, estimate, tickets) | kickoff:using-kickoff | — |

Inside a repository with `.kickoff/`, kickoff phases own the PRD, ADR, architecture, plan and ticket artefacts: do not route them to plan-prd, blueprint, architecture-decision-records or epic-decompose. Code work on tickets routes to the orch-* owners as usual.
{ROUTER_END}
"""


class EccError(KickoffError):
    """ECC is missing, or a file kickoff would change cannot be read."""


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


def version_key(value: str) -> tuple[int, ...]:
    return tuple(int(n) for n in re.findall(r"\d+", value or "")[:3]) or (0,)


def _same_path(a: str | Path, b: Path) -> bool:
    return os.path.normcase(str(Path(a).resolve())) == os.path.normcase(str(b.resolve()))


def _manifest_version(root: Path) -> str:
    try:
        return json.loads((root / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")).get("version", "")
    except (OSError, ValueError):
        return ""


def find_install(project: Path | None = None) -> Install:
    """`KICKOFF_ECC_ROOT`, else installed_plugins.json: a project-scope entry for `project` first, then the user
    scope; the highest version wins within a scope."""
    env = os.environ.get("KICKOFF_ECC_ROOT")
    if env:
        root = Path(env)
        if not root.is_dir():
            raise EccError(f"KICKOFF_ECC_ROOT={env} is not a folder")
        return Install(root, _manifest_version(root))
    path = config_dir() / "plugins" / "installed_plugins.json"
    try:
        entries = json.loads(path.read_text(encoding="utf-8")).get("plugins", {}).get(PLUGIN_KEY) or []
    except FileNotFoundError:
        entries = []
    except ValueError as exc:
        raise EccError(f"{path}: invalid JSON: {exc}") from exc
    entries = [e for e in entries if e.get("installPath") and Path(e["installPath"]).is_dir()]
    local = [e for e in entries if e.get("scope") == "project" and project and e.get("projectPath")
             and _same_path(e["projectPath"], project)]
    pool = local or [e for e in entries if e.get("scope") == "user"]
    if not pool:
        raise EccError(f"ECC is not installed (no {PLUGIN_KEY} in installed_plugins.json)")
    best = max(pool, key=lambda e: version_key(e.get("version", "")))
    return Install(Path(best["installPath"]), best.get("version", ""))


def component_path(root: Path, kind: str, name: str) -> Path:
    if kind == "skill":
        return root / "skills" / name / "SKILL.md"
    if kind == "agent":
        return root / "agents" / f"{name}.md"
    return root / name


def missing_components(root: Path) -> list[str]:
    return [f"{kind} {name}" for kind, names in COMPONENTS.items() for name in names
            if not component_path(root, kind, name).is_file()]


# ---------------------------------------------------------------- doctor
def exempt_globs(docs_root: str) -> list[str]:
    return [".kickoff/**", f"{docs_root.strip('/')}/**", "AGENTS.md"]


def _settings_env(project: Path) -> dict:
    env: dict = {}
    for name in ("settings.json", "settings.local.json"):
        try:
            data = json.loads((project / ".claude" / name).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        env.update(data.get("env") or {})
    return env


def _split(value: str) -> list[str]:
    return [g.strip() for g in (value or "").split(",") if g.strip()]


def router_table() -> Path:
    return config_dir() / ROUTER_TABLE


def install_checks(project: Path | None) -> tuple[Install | None, list[Check]]:
    """D1 installed, D2 version, D3 components."""
    try:
        install = find_install(project)
    except EccError as exc:
        return None, [Check("fail", f"D1 {exc}")]
    out = [Check("ok", f"D1 ECC {install.version or '(version unknown)'} at {install.root}")]
    v = version_key(install.version)
    if v < version_key(MIN_ECC):
        out.append(Check("fail", f"D2 ECC {install.version or '?'} is older than {MIN_ECC}: update the ecc plugin"))
    elif v[:2] > version_key(TESTED_ECC)[:2]:
        out.append(Check("warn", f"D2 ECC {install.version} is newer than the tested {TESTED_ECC}"))
    else:
        out.append(Check("ok", f"D2 version {install.version} (tested {TESTED_ECC})"))
    missing = missing_components(install.root)
    out.append(Check("fail", "D3 missing: " + ", ".join(missing)) if missing
               else Check("ok", f"D3 {sum(map(len, COMPONENTS.values()))} components present"))
    return install, out


def doctor(project: Path | None, docs_root: str | None) -> list[Check]:
    _, out = install_checks(project)
    disabled = _split(os.environ.get("ECC_DISABLED_HOOKS", ""))
    if any("session:start" in d for d in disabled):
        out.append(Check("warn", "D4 ECC_DISABLED_HOOKS turns off ECC's session:start hook (no instincts at start)"))
    if project is not None and docs_root is not None:
        have = set(_split(_settings_env(project).get(EXEMPT_ENV, "")))
        lack = [g for g in exempt_globs(docs_root) if g not in have]
        out.append(Check("warn", f"D5 {EXEMPT_ENV} lacks {', '.join(lack)}: run kickoff ecc setup") if lack
                   else Check("ok", "D5 GateGuard exempts kickoff documents"))
    table = router_table()
    if table.is_file() and ROUTER_BEGIN not in table.read_text(encoding="utf-8"):
        out.append(Check("warn", "D6 ecc-router has no kickoff route: run kickoff ecc setup --router"))
    return out


# ---------------------------------------------------------------- setup
@dataclass(frozen=True)
class Change:
    path: Path
    old: str
    new: str


def settings_change(project: Path, docs_root: str) -> Change | None:
    path = project / ".claude" / "settings.json"
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    try:
        data = json.loads(old) if old.strip() else {}
    except ValueError as exc:
        raise EccError(f"{path}: invalid JSON, nothing written: {exc}") from exc
    if not isinstance(data, dict):
        raise EccError(f"{path}: expected a JSON object, nothing written")
    env = data.setdefault("env", {})
    globs = _split(env.get(EXEMPT_ENV, ""))
    added = [g for g in exempt_globs(docs_root) if g not in globs]
    if not added:
        return None
    env[EXEMPT_ENV] = ",".join(globs + added)
    return Change(path, old, json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def router_change() -> Change | None:
    path = router_table()
    if not path.is_file():
        raise EccError(f"ecc-router is not installed: {path} does not exist")
    old = path.read_text(encoding="utf-8")
    if ROUTER_BEGIN in old:
        return None
    lines = old.splitlines(keepends=True)
    at = next((i + 1 for i, line in enumerate(lines) if line.strip() == ROUTER_HEADING), None)
    if at is None:
        new = old + ("" if old.endswith("\n") or not old else "\n") + "\n" + ROUTER_BLOCK
    else:
        new = "".join(lines[:at]) + "\n" + ROUTER_BLOCK + "".join(lines[at:])
    return Change(path, old, new)


def write_change(change: Change) -> None:
    change.path.parent.mkdir(parents=True, exist_ok=True)
    change.path.write_text(change.new, encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- patched handoffs
def run_script(name: str, args: list[str], cwd: Path, project: Path | None = None) -> int:
    """Run an ECC script from the ECC root with `cwd` as the working folder (the epic-* commands use a path
    relative to the current folder, which only works inside the ECC repository)."""
    if name not in SCRIPTS:
        raise KickoffError(f"unknown ECC script {name}; known: {', '.join(sorted(SCRIPTS))}")
    node = shutil.which("node")
    if not node:
        raise KickoffError("node not found")
    script = find_install(project).root / SCRIPTS[name]
    if not script.is_file():
        raise EccError(f"{script} does not exist in the installed ECC")
    return subprocess.run([node, str(script), *args], cwd=cwd).returncode
