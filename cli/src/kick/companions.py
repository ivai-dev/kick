"""Companions: tools a kick step can use when they are installed. kick offers the missing ones at the step that
needs them and installs them after an explicit yes; the answers are remembered per user (~/.kick/companions.yaml).
ECC is not a companion: it is required (kick doctor)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import yaml

from .ecc import config_dir, plugin_install
from .errors import KickError

OFFICIAL = "claude-plugins-official"
ANSWERS = ("installed", "later", "never")
STEPS = ("start", "understand", "shape", "plan", "build", "change")


@dataclass(frozen=True)
class Companion:
    id: str
    steps: tuple[str, ...]
    when: str
    purpose: str
    marketplace: str  # the GitHub repo of its marketplace
    plugin: str  # name@marketplace-name
    account: bool = False
    plugins: tuple[str, ...] = ()  # plugin names (any marketplace) that count as installed
    skills: tuple[str, ...] = ()  # user skills (~/.claude/skills/<name>) that count as installed
    mcp: tuple[str, ...] = ()  # MCP server names that count as installed
    note: str = ""

    def install_commands(self, known_marketplaces: set[str]) -> list[str]:
        name = self.plugin.split("@", 1)[1]
        out = [] if name in known_marketplaces else [f"claude plugin marketplace add {self.marketplace}"]
        return [*out, f"claude plugin install {self.plugin}"]


CATALOGUE = (
    Companion("superpowers", ("understand",), "the idea is still vague",
              "an interview that turns a vague idea into a clear brief, one question at a time",
              "anthropics/claude-plugins-official", f"superpowers@{OFFICIAL}", plugins=("superpowers",),
              note="it also brings its own plan and build steps; kick uses only its brainstorming"),
    Companion("mattpocock-skills", ("understand",), "a change in a running project needs a quick, sharp interview",
              "grill-me: a short, sharp interview about a change before it is written down",
              "anthropics/claude-plugins-official", f"mattpocock-skills@{OFFICIAL}", plugins=("mattpocock-skills",)),
    Companion("drawio", ("shape",), "a diagram is needed",
              "draws architecture and flow diagrams that open and edit in draw.io",
              "jgraph/drawio-mcp", "drawio@drawio", plugins=("drawio",), mcp=("drawio",)),
    Companion("frontend-design", ("shape", "build"), "the product has screens",
              "a clear design direction and production-grade screen code",
              "anthropics/claude-plugins-official", f"frontend-design@{OFFICIAL}", plugins=("frontend-design",)),
    Companion("impeccable", ("shape", "build"), "the product has screens",
              "design critique and polish for screens: spacing, type, colour, details",
              "pbakaus/impeccable", "impeccable@impeccable", plugins=("impeccable",)),
    Companion("ui-ux-pro-max", ("shape",), "the product has screens",
              "a searchable library of UI styles, palettes, font pairings and UX rules",
              "nextlevelbuilder/ui-ux-pro-max-skill", "ui-ux-pro-max@ui-ux-pro-max-skill",
              plugins=("ui-ux-pro-max",), skills=("ui-ux-pro-max",)),
    Companion("figma", ("shape",), "the team designs in Figma",
              "reads frames and design tokens from Figma and can put concepts on the canvas",
              "anthropics/claude-plugins-official", f"figma@{OFFICIAL}", account=True, plugins=("figma",)),
    Companion("superdesign", ("shape",), "you want many design variants quickly",
              "generates design variants you can branch and compare side by side",
              "anthropics/claude-plugins-official", f"superdesign@{OFFICIAL}", account=True,
              plugins=("superdesign",)),
    Companion("playwright", ("build",), "the review agents look at the running screens",
              "opens the running app in a browser to click through journeys and take screenshots",
              "anthropics/claude-plugins-official", f"playwright@{OFFICIAL}", plugins=("playwright",),
              mcp=("playwright", "chrome-devtools"), note="ECC's Chrome DevTools counts as a browser tool"),
    Companion("context7", ("build",), "the code uses libraries whose current documentation matters",
              "current documentation of libraries and frameworks while building",
              "anthropics/claude-plugins-official", f"context7@{OFFICIAL}", plugins=("context7",), mcp=("context7",)),
)
BY_ID = {c.id: c for c in CATALOGUE}


# ---------------------------------------------------------------- answers
def kick_home() -> Path:
    env = os.environ.get("KICK_HOME")
    return Path(env) if env else Path.home() / ".kick"


def answers_file() -> Path:
    return kick_home() / "companions.yaml"


def load_answers() -> dict[str, str]:
    try:
        data = yaml.safe_load(answers_file().read_text(encoding="utf-8-sig")) or {}
    except FileNotFoundError:
        return {}
    except (OSError, UnicodeDecodeError, yaml.YAMLError, ValueError) as exc:
        raise KickError(f"{answers_file()}: cannot be read: {exc}") from exc
    answers = data.get("answers") if isinstance(data, dict) else None
    if not isinstance(answers, dict):
        return {}
    return {k: v for k, v in answers.items() if k in BY_ID and v in ANSWERS}


def mark(companion_id: str, answer: str) -> None:
    if companion_id not in BY_ID:
        raise KickError(f"unknown companion {companion_id}; known: {', '.join(BY_ID)}")
    if answer not in ANSWERS:
        raise KickError(f"answer must be one of {', '.join(ANSWERS)}")
    answers = load_answers()
    answers[companion_id] = answer
    path = answers_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump({"answers": answers}, sort_keys=True), encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- detection
def _json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def known_marketplaces() -> set[str]:
    return set(_json(config_dir() / "plugins" / "known_marketplaces.json"))


def mcp_servers(project: Path | None) -> set[str]:
    """MCP servers in the user config (~/.claude.json, or .claude.json in CLAUDE_CONFIG_DIR), its entry for the
    project, the project's .mcp.json, and those bundled by installed plugins (ECC's chrome-devtools)."""
    names: set[str] = set()
    for path in {config_dir() / ".claude.json", Path.home() / ".claude.json"}:
        data = _json(path)
        names |= set(data.get("mcpServers") or {})
        if project is not None:
            for key, entry in (data.get("projects") or {}).items():
                if isinstance(entry, dict) and os.path.normcase(str(Path(key))) == os.path.normcase(str(project)):
                    names |= set(entry.get("mcpServers") or {})
    if project is not None:
        names |= set(_json(project / ".mcp.json").get("mcpServers") or {})
    ecc = plugin_install(lambda key: key == "ecc@ecc", project)
    if ecc is not None:
        names |= set(_json(ecc.root / ".mcp.json").get("mcpServers") or {})
    return names


def is_installed(companion: Companion, project: Path | None, servers: set[str] | None = None) -> bool:
    if plugin_install(lambda key: key.split("@", 1)[0] in companion.plugins, project) is not None:
        return True
    if any((config_dir() / "skills" / s / "SKILL.md").is_file() for s in companion.skills):
        return True
    servers = mcp_servers(project) if servers is None else servers
    return any(m in servers for m in companion.mcp)


@dataclass(frozen=True)
class State:
    companion: Companion
    installed: bool
    answer: str | None

    def to_offer(self) -> bool:
        return not self.installed and self.answer != "never"


def states(project: Path | None, step: str | None = None) -> list[State]:
    if step is not None and step not in STEPS:
        raise KickError(f"unknown step {step}; steps: {', '.join(STEPS)}")
    answers, servers = load_answers(), mcp_servers(project)
    return [State(c, is_installed(c, project, servers), answers.get(c.id)) for c in CATALOGUE
            if step is None or step in c.steps]
