import json

import pytest
from conftest import register

from kick import ecc
from kick.cli import main


def fake_ecc(path, version="2.2.3", missing=(), mcp=None):
    for kind, names in ecc.COMPONENTS.items():
        for name in names:
            if f"{kind} {name}" in missing:
                continue
            p = ecc.component_path(path, kind, name)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("x", encoding="utf-8")
    (path / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (path / ".claude-plugin" / "plugin.json").write_text(json.dumps({"version": version}), encoding="utf-8")
    if mcp:
        (path / ".mcp.json").write_text(json.dumps({"mcpServers": dict.fromkeys(mcp, {})}), encoding="utf-8")
    return path


def entry(path, version="2.2.3", scope="user", project=None):
    e = {"scope": scope, "installPath": str(path), "version": version}
    if project:
        e["projectPath"] = str(project)
    return e


@pytest.fixture
def installed(tmp_path, cfg):
    root = fake_ecc(tmp_path / "ecc-2.2.3")
    register(cfg, {"ecc@ecc": [entry(root)]})
    return root


def test_env_override_wins_and_reads_the_manifest_version(tmp_path, cfg, installed, monkeypatch):
    other = fake_ecc(tmp_path / "dev", version="2.3.0")
    monkeypatch.setenv("KICK_ECC_ROOT", str(other))
    assert ecc.find_install() == ecc.Install(other, "2.3.0")


def test_project_scope_beats_a_newer_user_install(tmp_path, cfg):
    old, new = fake_ecc(tmp_path / "a", "2.2.3"), fake_ecc(tmp_path / "b", "2.4.0")
    register(cfg, {"ecc@ecc": [entry(new), entry(old, scope="project", project=tmp_path / "proj")]})
    assert ecc.find_install(tmp_path / "proj").root == old
    assert ecc.find_install(tmp_path / "elsewhere").root == new


def test_not_installed(cfg):
    with pytest.raises(ecc.EccError, match="ECC is not installed"):
        ecc.find_install()


@pytest.mark.parametrize(("value", "key"), [("2.2.3", (2, 2, 3)), ("v2.10.0-rc.1", (2, 10, 0)), ("abc123", None)])
def test_version_key(value, key):
    assert ecc.version_key(value) == key


def test_doctor_passes_and_names_the_cli_version(installed, capsys):
    assert main(["doctor"]) == 0
    out = capsys.readouterr().out
    assert out.startswith("ok: kick CLI ") and "ok: D3" in out and "doctor passed" in out
    assert "companions: 0 of 10 installed; the others are offered at the step that needs them" in out


def test_doctor_fails_without_ecc_or_with_a_missing_component(tmp_path, cfg, capsys):
    assert main(["doctor"]) == 1
    assert "fail: D1 ECC is not installed" in capsys.readouterr().out
    root = fake_ecc(tmp_path / "e", missing=("agent planner",))
    register(cfg, {"ecc@ecc": [entry(root)]})
    assert main(["doctor"]) == 1
    assert "fail: D3 missing: agent planner" in capsys.readouterr().out


def test_doctor_warns_about_gateguard_in_a_kick_project(tmp_path, installed, capsys, monkeypatch):
    project = tmp_path / "proj"
    (project / "docs" / "kick").mkdir(parents=True)
    monkeypatch.setenv("ECC_DISABLED_HOOKS", "session:start")
    assert main(["--root", str(project), "doctor"]) == 0
    out = capsys.readouterr().out
    assert "warn: D4" in out
    assert "warn: D5 GATEGUARD_EXEMPT_GLOBS in .claude/settings.json lacks docs/kick/**: run kick setup" in out


def test_setup_merges_is_idempotent_and_has_a_dry_run(tmp_path, installed, capsys):
    project = tmp_path / "proj"
    (project / "docs" / "kick").mkdir(parents=True)
    settings = project / ".claude" / "settings.json"
    settings.parent.mkdir()
    settings.write_text(json.dumps({"env": {"FOO": "1", "GATEGUARD_EXEMPT_GLOBS": "vendor/**"}}), encoding="utf-8")
    assert main(["--root", str(project), "setup", "--dry"]) == 0
    assert "+    \"GATEGUARD_EXEMPT_GLOBS\": \"vendor/**,docs/kick/**\"" in capsys.readouterr().out
    assert json.loads(settings.read_text(encoding="utf-8"))["env"]["GATEGUARD_EXEMPT_GLOBS"] == "vendor/**"
    assert main(["--root", str(project), "setup"]) == 0
    data = json.loads(settings.read_text(encoding="utf-8"))
    assert data["env"] == {"FOO": "1", "GATEGUARD_EXEMPT_GLOBS": "vendor/**,docs/kick/**"}
    capsys.readouterr()
    assert main(["--root", str(project), "setup"]) == 0
    assert "setup up to date" in capsys.readouterr().out
    assert main(["--root", str(project), "doctor"]) == 0
    assert "ok: D5 GateGuard exempts kick documents" in capsys.readouterr().out


def test_setup_refuses_invalid_json(tmp_path, installed, capsys):
    settings = tmp_path / ".claude" / "settings.json"
    settings.parent.mkdir()
    settings.write_text("{nope", encoding="utf-8")
    assert main(["--root", str(tmp_path), "setup"]) == 2
    assert "invalid JSON, nothing written" in capsys.readouterr().err
