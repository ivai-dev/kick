import re
from pathlib import Path

import pytest

from kickoff.cli import build_parser

ROOT = Path(__file__).resolve().parents[2]
SKILLS = sorted((ROOT / "skills").glob("*/SKILL.md"))
PHASE_SKILLS = [p for p in SKILLS if p.parent.name != "using-kickoff"]
PHASE_SECTIONS = ["When to use", "Preconditions", "Inputs", "Steps", "Outputs", "Verify", "Lessons", "Handoff"]
METHODS = ["Interview", "Bounded approval", "Option decision", "Build plan", "Task run", "Verify"]
COMMAND = re.compile(r"`kickoff (?:--root \S+ )?([a-z][a-z-]*)")


def ids(paths):
    return [p.parent.name for p in paths]


def test_skills_exist():
    assert SKILLS


@pytest.mark.parametrize("path", SKILLS, ids=ids(SKILLS))
def test_skill_file_shape(path):
    text = path.read_text(encoding="utf-8")
    name = path.parent.name
    assert re.match(rf"---\nname: {re.escape(name)}\ndescription: Use when .+\n---\n", text), "frontmatter"
    assert len(text.splitlines()) < 250
    assert set(re.findall(r"`([a-z][a-z-]*):[a-z][a-z-]*`", text)) <= {"kickoff"}, "skills may only name kickoff:* skills"


@pytest.mark.parametrize("path", PHASE_SKILLS, ids=ids(PHASE_SKILLS))
def test_phase_skill_contract(path):
    headings = re.findall(r"^## (.+)$", path.read_text(encoding="utf-8"), re.M)
    assert [h for h in headings if h in PHASE_SECTIONS] == PHASE_SECTIONS


@pytest.mark.parametrize("path", PHASE_SKILLS, ids=ids(PHASE_SKILLS))
def test_every_method_a_skill_names_has_a_rule_card(path):
    text = path.read_text(encoding="utf-8")
    for method in METHODS:
        if re.search(rf"\b{method} method\b", text):
            assert re.search(rf"^> \*\*{method}:\*\*", text, re.M), f"no rule card for {method}"


def test_methods_file_has_every_method():
    text = (ROOT / "skills" / "using-kickoff" / "references" / "methods.md").read_text(encoding="utf-8")
    headings = re.findall(r"^## (.+)$", text, re.M)
    assert [h for h in headings if h in METHODS] == METHODS


def test_commands_named_in_skills_exist():
    top = set(next(a.choices for a in build_parser()._actions if isinstance(a.choices, dict)))
    files = [*SKILLS, *(ROOT / "commands").glob("*.md")]
    used = {m.group(1) for f in files for m in COMMAND.finditer(f.read_text(encoding="utf-8"))}
    assert used <= top, sorted(used - top)


def test_twelve_skills_and_two_commands():
    assert len(SKILLS) == 12
    assert sorted(p.name for p in (ROOT / "commands").glob("*.md")) == ["kickoff-sync.md", "kickoff.md"]


def test_session_start_hook_runs_kickoff_status():
    import json

    data = json.loads((ROOT / "hooks" / "hooks.json").read_text(encoding="utf-8"))
    commands = [h["command"] for group in data["hooks"]["SessionStart"] for h in group["hooks"]]
    assert any("kickoff status" in c for c in commands)
