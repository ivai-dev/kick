"""The plugin's skills, agents, command and hooks: they exist, name only real commands and components, speak in
plain words, and offer companions at every step."""

import json
import re
from pathlib import Path

import pytest

from kick import companions, ecc
from kick.cli import build_parser

ROOT = Path(__file__).resolve().parents[2]
SKILL_NAMES = {"using-kick", "start", "understand", "shape", "plan", "build", "change"}
SKILLS = sorted((ROOT / "skills").glob("*/SKILL.md"))
AGENTS = sorted((ROOT / "agents").glob("*.md"))
COMMANDS = sorted((ROOT / "commands").glob("*.md"))
TEMPLATES = sorted((ROOT / "cli" / "src" / "kick" / "templates").rglob("*.md"))
PLUGIN_TEXT = sorted({*(ROOT / "skills").rglob("*.md"), *AGENTS, *COMMANDS, *TEMPLATES})

# Words from kickoff 0.9 that must not come back: gate codes, gates, phases, work-breakdown jargon, numbered items
# and the throw-away prototype. GateGuard (ECC's hook) is allowed.
BANNED_CASED = re.compile(r"\bC[1-6]\b|\bCD\b|\bWBS\b|\bADR-\d|\b[AQDFV]\d+\b")
BANNED_WORDS = re.compile(r"\bgates?\b|\bphases?\b|\bbaselines?\b|\bprototypes?\b", re.IGNORECASE)
ALLOWED = re.compile(r"throw-away prototype", re.IGNORECASE)


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def frontmatter(path: Path) -> dict:
    match = re.match(r"---\n(.*?)\n---\n", text(path), re.DOTALL)
    assert match, f"{path} has no frontmatter"
    return dict(line.split(": ", 1) for line in match.group(1).splitlines() if ": " in line)


def cli_commands() -> set[str]:
    parser = build_parser()
    action = next(a for a in parser._actions if a.dest == "command")
    return set(action.choices)


def code_spans(body: str) -> list[str]:
    fenced = re.findall(r"```[a-z]*\n(.*?)```", body, re.DOTALL)
    inline = re.findall(r"`([^`\n]+)`", re.sub(r"```.*?```", "", body, flags=re.DOTALL))
    return [line for block in fenced for line in block.splitlines()] + inline


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


# ---------------------------------------------------------------- shape of the plugin
def test_seven_skills_one_command_five_agents():
    assert {p.parent.name for p in SKILLS} == SKILL_NAMES
    assert [p.name for p in COMMANDS] == ["kick.md"]
    assert {p.stem for p in AGENTS} == {"art-director", "craft-auditor", "ia-reviewer", "integrator",
                                        "viewpoint-reviewer"}


@pytest.mark.parametrize("path", SKILLS, ids=lambda p: p.parent.name)
def test_skill_frontmatter(path):
    meta = frontmatter(path)
    assert meta["name"] == path.parent.name
    assert meta["description"].startswith("Use when")


@pytest.mark.parametrize("path", AGENTS, ids=lambda p: p.stem)
def test_agents_are_read_only(path):
    meta = frontmatter(path)
    assert meta["name"] == path.stem and meta["description"].startswith("Use when")
    assert not {"Write", "Edit", "Bash"} & {t.strip() for t in meta["tools"].split(",")}


def test_command_invokes_the_router():
    body = text(ROOT / "commands" / "kick.md")
    assert "kick:using-kick" in body and "`kick status`" in body


@pytest.mark.parametrize("path", SKILLS, ids=lambda p: p.parent.name)
def test_every_skill_has_its_pressure_scenarios(path):
    body = text(path.parent / "tests" / "pressure.md").lower()
    for scenario in ("jargon", "just start coding", "design the database now"):
        assert scenario in body, f"{rel(path)}: pressure.md lacks the scenario '{scenario}'"


# ---------------------------------------------------------------- plain words and companions
@pytest.mark.parametrize("path", SKILLS, ids=lambda p: p.parent.name)
def test_every_skill_reads_plain_words_and_offers_companions(path):
    body = text(path)
    assert "plain-words.md" in body
    assert "kick companions --step" in body


def test_step_skills_offer_companions_for_their_own_step():
    for name in SKILL_NAMES - {"using-kick"}:
        assert f"kick companions --step {name}" in text(ROOT / "skills" / name / "SKILL.md")


def test_every_companion_is_described():
    body = text(ROOT / "skills" / "using-kick" / "references" / "companions.md")
    missing = [c.id for c in companions.CATALOGUE if f"| {c.id} |" not in body]
    assert not missing, f"companions.md does not describe {missing}"
    assert "kick companions mark" in body


@pytest.mark.parametrize("path", PLUGIN_TEXT, ids=rel)
def test_no_kickoff_jargon(path):
    found = []
    for number, line in enumerate(text(path).splitlines(), 1):
        clean = ALLOWED.sub("", line)
        found += [f"{number}: {m.group(0)}" for m in BANNED_CASED.finditer(clean)]
        found += [f"{number}: {m.group(0)}" for m in BANNED_WORDS.finditer(clean)]
    assert not found, f"{rel(path)} uses words kick no longer uses: {found}"


def test_no_old_plugin_name():
    offenders = [rel(p) for p in PLUGIN_TEXT if re.search(r"\bkickoff\b", ALLOWED.sub("", text(p)))
                 and "skills/start/" not in rel(p)]
    assert not offenders, f"the old name appears in {offenders}"


# ---------------------------------------------------------------- names that must exist
def test_every_kick_command_named_exists():
    known = cli_commands()
    unknown = []
    for path in PLUGIN_TEXT:
        for span in code_spans(text(path)):
            for name in re.findall(r"(?:^|&&\s*|;\s*|\$\s*)kick ([a-z][a-z-]*)", span.strip()):
                if name not in known:
                    unknown.append(f"{rel(path)}: kick {name}")
    assert not unknown, unknown


def test_every_ecc_component_named_is_checked_by_doctor():
    known = set(ecc.COMPONENTS["skill"]) | set(ecc.COMPONENTS["agent"])
    unknown = sorted({f"{rel(p)}: ecc:{n}" for p in PLUGIN_TEXT for n in re.findall(r"\becc:([a-z][a-z0-9-]*)",
                                                                                     text(p)) if n not in known})
    assert not unknown, unknown


def test_every_kick_skill_or_agent_named_exists():
    known = SKILL_NAMES | {p.stem for p in AGENTS}
    unknown = sorted({f"{rel(p)}: kick:{n}" for p in PLUGIN_TEXT for n in re.findall(r"\bkick:([a-z][a-z-]*)",
                                                                                      text(p)) if n not in known})
    assert not unknown, unknown


@pytest.mark.parametrize("path", SKILLS, ids=lambda p: p.parent.name)
def test_references_named_by_a_skill_exist(path):
    missing = []
    for shared, name in re.findall(r"(\.\./using-kick/)?references/([a-z-]+\.md)", text(path)):
        base = ROOT / "skills" / "using-kick" if shared else path.parent
        if not (base / "references" / name).is_file():
            missing.append(name)
    assert not missing, f"{rel(path)} names missing references {missing}"


# ---------------------------------------------------------------- hooks
@pytest.mark.parametrize(("event", "action"), [("SessionStart", "session-start"), ("PostToolUse", "post-write")])
def test_hooks_call_the_cli_only_when_it_is_installed(event, action):
    data = json.loads(text(ROOT / "hooks" / "hooks.json"))
    commands = [h["command"] for group in data["hooks"][event] for h in group["hooks"]]
    assert any(f"kick hook {action}" in c and "command -v kick" in c for c in commands)


def test_no_blocking_hook():
    data = json.loads(text(ROOT / "hooks" / "hooks.json"))
    assert set(data["hooks"]) == {"SessionStart", "PostToolUse"}
