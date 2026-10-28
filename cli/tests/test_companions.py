import json

import pytest
from conftest import register
from test_ecc import entry, fake_ecc

from kick import companions
from kick.cli import main
from kick.errors import KickError


def plugin_dir(tmp_path, name):
    path = tmp_path / "plugins" / name
    path.mkdir(parents=True)
    return path


def test_catalogue_entries_are_complete():
    assert len(companions.CATALOGUE) == len(companions.BY_ID) == 10
    for c in companions.CATALOGUE:
        assert c.steps and set(c.steps) <= set(companions.STEPS)
        assert c.when and c.purpose and "@" in c.plugin and "/" in c.marketplace
        assert c.plugins or c.skills or c.mcp


def test_install_commands_add_the_marketplace_only_when_unknown():
    figma = companions.BY_ID["figma"]
    assert figma.install_commands(set()) == ["claude plugin marketplace add anthropics/claude-plugins-official",
                                             "claude plugin install figma@claude-plugins-official"]
    assert figma.install_commands({"claude-plugins-official"}) == ["claude plugin install "
                                                                   "figma@claude-plugins-official"]


def test_detection_by_plugin_skill_and_mcp(tmp_path, cfg):
    register(cfg, {"figma@claude-plugins-official": [entry(plugin_dir(tmp_path, "figma"))],
                   "frontend-design@claude-code-plugins": [entry(plugin_dir(tmp_path, "fd"))],
                   "superdesign@claude-plugins-official": [entry(tmp_path / "gone")]})
    skill = cfg / "skills" / "ui-ux-pro-max" / "SKILL.md"
    skill.parent.mkdir(parents=True)
    skill.write_text("x", encoding="utf-8")
    (cfg / ".claude.json").write_text(json.dumps({"mcpServers": {"drawio": {}}}), encoding="utf-8")
    have = {s.companion.id for s in companions.states(None) if s.installed}
    assert have == {"figma", "frontend-design", "ui-ux-pro-max", "drawio"}  # a missing install path does not count


def test_project_mcp_and_ecc_bundled_browser(tmp_path, cfg):
    project = tmp_path / "proj"
    project.mkdir()
    (project / ".mcp.json").write_text(json.dumps({"mcpServers": {"context7": {}}}), encoding="utf-8")
    ecc_root = fake_ecc(tmp_path / "ecc", mcp=["chrome-devtools"])
    register(cfg, {"ecc@ecc": [entry(ecc_root)]})
    have = {s.companion.id for s in companions.states(project) if s.installed}
    assert have == {"context7", "playwright"}


def test_step_lists_what_to_offer_and_respects_never(cfg, capsys):
    assert main(["companions", "--step", "understand"]) == 0
    out = capsys.readouterr().out
    assert "superpowers: not installed (not asked); no account needed" in out
    assert "note: it also brings its own plan and build steps; kick uses only its brainstorming" in out
    assert "install: claude plugin marketplace add anthropics/claude-plugins-official && claude plugin install " \
           "superpowers@claude-plugins-official" in out
    assert main(["companions", "mark", "superpowers", "never"]) == 0
    assert main(["companions", "mark", "mattpocock-skills", "later"]) == 0
    capsys.readouterr()
    assert main(["companions", "--step", "understand", "--json"]) == 0
    rows = json.loads(capsys.readouterr().out)
    assert [(r["id"], r["answer"]) for r in rows] == [("mattpocock-skills", "later")]
    assert companions.load_answers() == {"superpowers": "never", "mattpocock-skills": "later"}
    assert (companions.kick_home() / "companions.yaml").is_file()


def test_nothing_to_offer_and_the_full_list(tmp_path, cfg, capsys):
    register(cfg, {"playwright@claude-plugins-official": [entry(plugin_dir(tmp_path, "pw"))],
                   "context7@claude-plugins-official": [entry(plugin_dir(tmp_path, "c7"))]})
    assert main(["companions", "--step", "build"]) == 1 - 1
    out = capsys.readouterr().out
    assert "playwright" not in out and "context7" not in out and "frontend-design: not installed" in out
    assert main(["companions"]) == 0
    out = capsys.readouterr().out
    assert "playwright: installed; no account needed" in out and "figma: not installed (not asked); needs an " \
                                                                 "account" in out


def test_unknown_answers_are_ignored_and_bad_marks_refused(cfg, capsys):
    path = companions.answers_file()
    path.parent.mkdir(parents=True)
    path.write_text("answers: {figma: maybe, nope: never, drawio: later}\n", encoding="utf-8")
    assert companions.load_answers() == {"drawio": "later"}
    with pytest.raises(SystemExit):
        main(["companions", "mark", "nope", "never"])
    with pytest.raises(KickError, match="unknown companion"):
        companions.mark("nope", "never")
