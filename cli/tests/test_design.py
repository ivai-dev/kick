import json
import os

import pytest
from helpers import project_dict, write_kickoff

from kickoff import design
from kickoff.cli import main


@pytest.fixture
def cfg(tmp_path, monkeypatch):
    cfg = tmp_path / "claude"
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(cfg))
    for name in ("KICKOFF_IMPECCABLE", *design.TELEMETRY_ENV):
        monkeypatch.delenv(name, raising=False)
    return cfg


def plugin(tmp_path, cfg, key, skill, version="1.0.0", front="---\nname: x\n---\n"):
    root = tmp_path / "cache" / key.replace("@", "_") / version
    (root / "skills" / skill).mkdir(parents=True)
    (root / "skills" / skill / "SKILL.md").write_text(front, encoding="utf-8")
    path = cfg / "plugins" / "installed_plugins.json"
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"version": 2, "plugins": {}}
    data["plugins"][key] = [{"scope": "user", "installPath": str(root), "version": version}]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")
    return root / "skills" / skill


@pytest.fixture
def installed(tmp_path, cfg):
    plugin(tmp_path, cfg, "frontend-design@claude-code-plugins", "frontend-design")
    skill = plugin(tmp_path, cfg, "impeccable@impeccable", "impeccable", "4.7.0",
                   "---\nname: impeccable\nversion: 4.7.0\n---\n")
    (skill / "scripts").mkdir()
    (skill / "scripts" / ("impeccable.cmd" if os.name == "nt" else "impeccable")).write_text("x", encoding="utf-8")
    return skill


def test_doctor_fails_without_the_required_skills(cfg, tmp_path, capsys, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert main(["design", "doctor"]) == 1
    out = capsys.readouterr().out
    assert "fail: G1 frontend-design is not installed: Anthropic frontend-design" in out
    assert "fail: G2 impeccable is not installed: impeccable: /plugin marketplace add pbakaus/impeccable" in out
    assert "G3" not in out  # outside a project
    assert out.rstrip().endswith("design doctor failed")


def test_doctor_passes_with_plugins_and_warns_about_telemetry(installed, tmp_path, capsys):
    root = write_kickoff(tmp_path / "p", project_dict())
    assert main(["--root", str(root), "design", "doctor"]) == 0
    out = capsys.readouterr().out
    assert "ok: G1 frontend-design at" in out and "ok: G2 impeccable 4.7.0 at" in out
    assert "warn: G3 impeccable telemetry is on for this project: run kickoff design setup" in out
    assert "ok: G4 optional emil-design-eng: not installed" in out
    assert "ok: G4 optional ui-ux-pro-max: not installed" in out


def test_a_skill_folder_counts_as_installed(cfg, tmp_path):
    for name in ("frontend-design", "emil-design-eng"):
        (cfg / "skills" / name).mkdir(parents=True)
        (cfg / "skills" / name / "SKILL.md").write_text("---\nname: x\n---\n", encoding="utf-8")
    project = tmp_path / "p"
    (project / ".claude" / "skills" / "impeccable").mkdir(parents=True)
    (project / ".claude" / "skills" / "impeccable" / "SKILL.md").write_text("x", encoding="utf-8")
    assert design.skill_dir("frontend-design") == cfg / "skills" / "frontend-design"
    assert design.skill_dir("impeccable", project) == project / ".claude" / "skills" / "impeccable"
    assert design.skill_dir("impeccable") is None
    checks = [str(c) for c in design.doctor(project)]
    assert all(not c.startswith("fail") for c in checks)
    assert "ok: G4 optional emil-design-eng: installed" in checks


def test_telemetry_env_counts_as_off(installed, tmp_path, monkeypatch):
    monkeypatch.setenv("DO_NOT_TRACK", "1")
    assert design.telemetry_off(tmp_path)


def test_setup_turns_telemetry_off_and_ignores_scratch_files_once(installed, tmp_path, capsys):
    root = write_kickoff(tmp_path / "p", project_dict())
    (root / ".impeccable").mkdir()
    (root / ".impeccable" / "config.json").write_text('{"buildPath": "code"}', encoding="utf-8")
    (root / ".gitignore").write_text("node_modules/\n", encoding="utf-8")
    assert main(["--root", str(root), "design", "setup"]) == 0
    assert json.loads((root / ".impeccable" / "config.json").read_text(encoding="utf-8")) == {
        "buildPath": "code", "telemetry": False}
    ignore = (root / ".gitignore").read_text(encoding="utf-8")
    assert ignore.startswith("node_modules/\n\n# impeccable-ignore-start\n")
    assert "**/.impeccable/live/sessions/" in ignore and ignore.count(design.IGNORE_BEGIN) == 1
    capsys.readouterr()
    assert main(["--root", str(root), "design", "setup"]) == 0
    assert capsys.readouterr().out == "design setup up to date\n"
    assert main(["--root", str(root), "design", "doctor"]) == 0
    assert "ok: G3 impeccable telemetry is off for this project" in capsys.readouterr().out


def test_setup_refreshes_an_older_block_and_dry_writes_nothing(installed, tmp_path, capsys):
    root = write_kickoff(tmp_path / "p", project_dict())
    (root / ".gitignore").write_text("a\n# impeccable-ignore-start\nold\n# impeccable-ignore-end\nb\n", encoding="utf-8")
    assert main(["--root", str(root), "design", "setup", "--dry"]) == 0
    out = capsys.readouterr().out
    assert "-old" in out and '+  "telemetry": false' in out
    assert not (root / ".impeccable").exists()
    assert main(["--root", str(root), "design", "setup"]) == 0
    text = (root / ".gitignore").read_text(encoding="utf-8")
    assert text.startswith("a\n# impeccable-ignore-start\n") and text.endswith("# impeccable-ignore-end\nb\n")
    assert "old" not in text


def test_setup_refuses_invalid_json(installed, tmp_path, capsys):
    root = write_kickoff(tmp_path / "p", project_dict())
    (root / ".impeccable").mkdir()
    (root / ".impeccable" / "config.json").write_text("{nope", encoding="utf-8")
    assert main(["--root", str(root), "design", "setup"]) == 2
    assert "invalid JSON, nothing written" in capsys.readouterr().err


def test_setup_keeps_crlf_line_ends_and_reads_a_bom(installed, tmp_path):
    root = write_kickoff(tmp_path / "p", project_dict())
    (root / ".gitignore").write_bytes(b"node_modules/\r\ndist/\r\n")
    (root / ".impeccable").mkdir()
    (root / ".impeccable" / "config.json").write_bytes(b'\xef\xbb\xbf{"buildPath": "code"}')
    assert main(["--root", str(root), "design", "setup"]) == 0
    raw = (root / ".gitignore").read_bytes()
    assert raw.startswith(b"node_modules/\r\ndist/\r\n\r\n# impeccable-ignore-start\r\n")
    assert b"\n" not in raw.replace(b"\r\n", b"")
    assert json.loads((root / ".impeccable" / "config.json").read_text(encoding="utf-8")) == {
        "buildPath": "code", "telemetry": False}
    assert design.telemetry_off(root)


def test_detector_command(installed, cfg, monkeypatch):
    assert design.detector() == [str(installed / "scripts" / ("impeccable.cmd" if os.name == "nt" else "impeccable"))]
    monkeypatch.setenv("KICKOFF_IMPECCABLE", "/opt/impeccable")
    assert design.detector() == ["/opt/impeccable"]


def test_no_detector_without_impeccable(cfg, monkeypatch):
    monkeypatch.setattr(design.shutil, "which", lambda name: None)
    assert design.detector() is None
