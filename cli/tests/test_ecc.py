import json
import subprocess

import pytest
from helpers import project_dict, write_kickoff

from kickoff import ecc
from kickoff.cli import main


def fake_ecc(path, version="2.2.3", missing=()):
    for kind, names in ecc.COMPONENTS.items():
        for name in names:
            if f"{kind} {name}" in missing:
                continue
            p = ecc.component_path(path, kind, name)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("x", encoding="utf-8")
    (path / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (path / ".claude-plugin" / "plugin.json").write_text(json.dumps({"version": version}), encoding="utf-8")
    return path


def entry(path, version="2.2.3", scope="user", project=None):
    e = {"scope": scope, "installPath": str(path), "version": version}
    if project:
        e["projectPath"] = str(project)
    return e


def register(cfg, *entries):
    p = cfg / "plugins" / "installed_plugins.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps({"version": 2, "plugins": {"ecc@ecc": list(entries)}}), encoding="utf-8")


@pytest.fixture
def cfg(tmp_path, monkeypatch):
    cfg = tmp_path / "claude"
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(cfg))
    for name in ("KICKOFF_ECC_ROOT", "ECC_DISABLED_HOOKS"):
        monkeypatch.delenv(name, raising=False)
    return cfg


@pytest.fixture
def installed(tmp_path, cfg):
    root = fake_ecc(tmp_path / "ecc-2.2.3")
    register(cfg, entry(root))
    return root


# ---------------------------------------------------------------- locating ECC
def test_env_override_wins_and_reads_the_manifest_version(tmp_path, cfg, installed, monkeypatch):
    other = fake_ecc(tmp_path / "dev-ecc", version="2.3.0")
    monkeypatch.setenv("KICKOFF_ECC_ROOT", str(other))
    assert ecc.find_install() == ecc.Install(other, "2.3.0")


def test_env_override_must_be_a_folder(tmp_path, cfg, monkeypatch):
    monkeypatch.setenv("KICKOFF_ECC_ROOT", str(tmp_path / "nope"))
    with pytest.raises(ecc.EccError, match="is not a folder"):
        ecc.find_install()


def test_project_scope_beats_a_newer_user_install(tmp_path, cfg):
    user = fake_ecc(tmp_path / "u", "2.4.0")
    local = fake_ecc(tmp_path / "p", "2.2.3")
    project = tmp_path / "proj"
    project.mkdir()
    register(cfg, entry(user, "2.4.0"), entry(local, "2.2.3", "project", project))
    assert ecc.find_install(project).root == local
    assert ecc.find_install(tmp_path).root == user  # another project gets the user install


def test_highest_user_version_wins_and_stale_paths_are_skipped(tmp_path, cfg):
    old = fake_ecc(tmp_path / "a", "2.2.3")
    new = fake_ecc(tmp_path / "b", "2.10.0")
    register(cfg, entry(old, "2.2.3"), entry(new, "2.10.0"), entry(tmp_path / "gone", "9.0.0"))
    assert ecc.find_install().version == "2.10.0"


def test_local_scope_and_a_project_path_above_the_kickoff_folder(tmp_path, cfg):
    user = fake_ecc(tmp_path / "u", "2.4.0")
    local = fake_ecc(tmp_path / "l", "2.2.3")
    repo = tmp_path / "repo"
    (repo / "product").mkdir(parents=True)
    register(cfg, entry(user, "2.4.0"), entry(local, "2.2.3", "local", repo))
    assert ecc.find_install(repo / "product").root == local
    assert ecc.find_install(tmp_path / "other").root == user


@pytest.mark.parametrize("data", [[], {"plugins": []}, {"plugins": {"ecc@ecc": {"x": 1}}},
                                  {"plugins": {"ecc@ecc": ["junk", 3]}}])
def test_malformed_install_records_mean_not_installed(cfg, data):
    p = cfg / "plugins" / "installed_plugins.json"
    p.parent.mkdir(parents=True)
    p.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(ecc.EccError, match="ECC is not installed"):
        ecc.find_install()


@pytest.mark.parametrize(("value", "key"), [("2.2.3", (2, 2, 3)), ("v2.10.1-rc.1", (2, 10, 1)), ("a1b2c3d4", None),
                                            ("unknown", None), ("", None)])
def test_version_key(value, key):
    assert ecc.version_key(value) == key


def test_doctor_warns_on_a_non_version(tmp_path, cfg, capsys):
    register(cfg, entry(fake_ecc(tmp_path / "e", "x"), "a1b2c3d4"))
    code, out = doctor_out(capsys)
    assert code == 0 and "warn: D2 ECC version 'a1b2c3d4' is not a version number" in out


def test_not_installed(cfg):
    with pytest.raises(ecc.EccError, match="ECC is not installed"):
        ecc.find_install()


def test_root_command(installed, capsys):
    assert main(["ecc", "root"]) == 0
    assert capsys.readouterr().out.strip() == str(installed)


# ---------------------------------------------------------------- doctor
def doctor_out(capsys, root=None):
    argv = ["--root", str(root)] if root else []
    code = main([*argv, "ecc", "doctor"])
    return code, capsys.readouterr().out


def test_doctor_passes_outside_a_project(installed, capsys):
    code, out = doctor_out(capsys)
    assert code == 0 and "ok: D3 19 components present" in out and out.rstrip().endswith("ecc doctor passed")
    assert "D5" not in out


def test_doctor_fails_without_ecc(cfg, capsys):
    code, out = doctor_out(capsys)
    assert code == 1 and "fail: D1 ECC is not installed" in out


def test_doctor_fails_on_a_missing_component(tmp_path, cfg, capsys):
    register(cfg, entry(fake_ecc(tmp_path / "e", missing=("skill council", "agent planner"))))
    code, out = doctor_out(capsys)
    assert code == 1 and "fail: D3 missing: skill council, agent planner" in out


@pytest.mark.parametrize(("version", "code", "line"), [
    ("2.2.2", 1, "fail: D2 ECC 2.2.2 is older than 2.2.3"),
    ("2.3.0", 0, "warn: D2 ECC 2.3.0 is newer than the tested 2.2.3"),
    ("2.2.9", 0, "ok: D2 version 2.2.9"),
])
def test_doctor_version(tmp_path, cfg, capsys, version, code, line):
    register(cfg, entry(fake_ecc(tmp_path / "e", version), version))
    got, out = doctor_out(capsys)
    assert got == code and line in out


def test_doctor_warns_about_project_setup_and_the_router(tmp_path, cfg, installed, capsys, monkeypatch):
    write_kickoff(tmp_path / "proj")
    table = cfg / ecc.ROUTER_TABLE
    table.parent.mkdir(parents=True)
    table.write_text("# Routing table\n", encoding="utf-8")
    monkeypatch.setenv("ECC_DISABLED_HOOKS", "session:start,stop:cost-tracker")
    code, out = doctor_out(capsys, tmp_path / "proj")
    assert code == 0
    assert "warn: D4" in out
    assert "warn: D5 GATEGUARD_EXEMPT_GLOBS in .claude/settings.json lacks .kickoff/**, docs/**, AGENTS.md" in out
    assert "warn: D6" in out


# ---------------------------------------------------------------- setup
def test_setup_creates_merges_and_is_idempotent(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj", project=project_dict(docs_root="documents"))
    settings = root / ".claude" / "settings.json"
    settings.parent.mkdir()
    settings.write_text(json.dumps({"permissions": {"allow": ["Bash(ls)"]},
                                    "env": {"FOO": "1", "GATEGUARD_EXEMPT_GLOBS": "vendor/**"}}), encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup"]) == 0
    data = json.loads(settings.read_text(encoding="utf-8"))
    assert data["permissions"] == {"allow": ["Bash(ls)"]} and data["env"]["FOO"] == "1"
    assert data["env"]["GATEGUARD_EXEMPT_GLOBS"] == "vendor/**,.kickoff/**,documents/**,AGENTS.md"
    capsys.readouterr()
    assert main(["--root", str(root), "ecc", "setup"]) == 0
    assert "ecc setup up to date" in capsys.readouterr().out
    assert main(["--root", str(root), "ecc", "doctor"]) == 0
    assert "ok: D5" in capsys.readouterr().out


def test_setup_dry_prints_a_diff_and_writes_nothing(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj")
    assert main(["--root", str(root), "ecc", "setup", "--dry"]) == 0
    out = capsys.readouterr().out
    assert "+  \"env\": {" in out and ".kickoff/**,docs/**,AGENTS.md" in out
    assert not (root / ".claude").exists()


def test_setup_refuses_invalid_json(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj")
    (root / ".claude").mkdir()
    (root / ".claude" / "settings.json").write_text("{oops", encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup"]) == 2
    assert "invalid JSON, nothing written" in capsys.readouterr().err
    assert (root / ".claude" / "settings.json").read_text(encoding="utf-8") == "{oops"


@pytest.mark.parametrize(("settings", "message"), [
    ({"env": None}, "\"env\" is not an object"),
    ({"env": ["x"]}, "\"env\" is not an object"),
    ({"env": {"GATEGUARD_EXEMPT_GLOBS": False}}, "is not a string"),
    ([1], "expected a JSON object"),
])
def test_setup_refuses_odd_shapes_without_writing(tmp_path, cfg, installed, capsys, settings, message):
    root = write_kickoff(tmp_path / "proj")
    path = root / ".claude" / "settings.json"
    path.parent.mkdir()
    path.write_text(json.dumps(settings), encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup"]) == 2
    assert message in capsys.readouterr().err
    assert json.loads(path.read_text(encoding="utf-8")) == settings


def test_doctor_survives_odd_settings(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj")
    (root / ".claude").mkdir()
    (root / ".claude" / "settings.json").write_text(json.dumps({"env": {"GATEGUARD_EXEMPT_GLOBS": ["x"]}}),
                                                    encoding="utf-8")
    code, out = doctor_out(capsys, root)
    assert code == 0 and "warn: D5" in out


def test_setup_updates_the_local_file_when_it_holds_the_value(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj")
    (root / ".claude").mkdir()
    local = root / ".claude" / "settings.local.json"
    local.write_text(json.dumps({"env": {"GATEGUARD_EXEMPT_GLOBS": "tmp/**"}}), encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup"]) == 0
    assert json.loads(local.read_text(encoding="utf-8"))["env"]["GATEGUARD_EXEMPT_GLOBS"] == \
        "tmp/**,.kickoff/**,docs/**,AGENTS.md"
    assert not (root / ".claude" / "settings.json").exists()
    capsys.readouterr()
    assert main(["--root", str(root), "ecc", "doctor"]) == 0
    assert "ok: D5" in capsys.readouterr().out


def test_setup_router_adds_the_block_once_under_the_planning_lane(tmp_path, cfg, installed):
    root = write_kickoff(tmp_path / "proj")
    table = cfg / ecc.ROUTER_TABLE
    table.parent.mkdir(parents=True)
    table.write_text("# Table\n\n## 3. Planning lane\n\n| Request | Primary | Support |\n|--|--|--|\n| a | b | c |\n"
                     "\n## 4. Decision lane\n", encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup", "--router"]) == 0
    assert main(["--root", str(root), "ecc", "setup", "--router"]) == 0
    text = table.read_text(encoding="utf-8")
    assert text.count(ecc.ROUTER_BEGIN) == 1
    assert text.index("## 3. Planning lane") < text.index(ecc.ROUTER_BEGIN) < text.index("| a | b | c |")
    assert "kickoff:using-kickoff" in text


def test_setup_router_refreshes_an_older_block(tmp_path, cfg, installed):
    root = write_kickoff(tmp_path / "proj")
    table = cfg / ecc.ROUTER_TABLE
    table.parent.mkdir(parents=True)
    table.write_text(f"# Table\n\n{ecc.ROUTER_BEGIN}\nold route with tickets\n{ecc.ROUTER_END}\n\n## 4. Next\n",
                     encoding="utf-8")
    assert main(["--root", str(root), "ecc", "setup", "--router"]) == 0
    text = table.read_text(encoding="utf-8")
    assert "old route" not in text and text.count(ecc.ROUTER_BEGIN) == 1 and text.endswith("\n## 4. Next\n")
    assert ecc.router_change() is None


def test_setup_router_works_outside_a_project(tmp_path, cfg, installed, capsys, monkeypatch):
    table = cfg / ecc.ROUTER_TABLE
    table.parent.mkdir(parents=True)
    table.write_text("# Table\n", encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    assert main(["ecc", "setup", "--router"]) == 0
    assert ecc.ROUTER_BEGIN in table.read_text(encoding="utf-8")
    assert not (tmp_path / ".claude").exists()
    assert main(["ecc", "setup"]) == 2  # the GateGuard exemption still needs a project


def test_setup_router_without_the_router_is_refused(tmp_path, cfg, installed, capsys):
    root = write_kickoff(tmp_path / "proj")
    assert main(["--root", str(root), "ecc", "setup", "--router"]) == 2
    assert "ecc-router is not installed" in capsys.readouterr().err


# ---------------------------------------------------------------- run (patched epic-* handoff)
def test_run_calls_node_on_the_ecc_script_in_the_current_folder(tmp_path, installed, monkeypatch):
    calls = []
    monkeypatch.setattr(ecc.shutil, "which", lambda name: "/usr/bin/node")
    monkeypatch.setattr(ecc.subprocess, "run",
                        lambda argv, cwd: calls.append((argv, cwd)) or subprocess.CompletedProcess(argv, 3))
    monkeypatch.chdir(tmp_path)
    assert main(["ecc", "run", "github-coordination", "--", "sync", "--repo", "o/r"]) == 3
    argv, cwd = calls[0]
    assert argv == ["/usr/bin/node", str(installed / "scripts" / "github-coordination.js"), "sync", "--repo", "o/r"]
    assert cwd == tmp_path


def test_run_unknown_script_and_missing_node(installed, monkeypatch, capsys):
    assert main(["ecc", "run", "install-everything"]) == 2
    assert "unknown ECC script" in capsys.readouterr().err
    monkeypatch.setattr(ecc.shutil, "which", lambda name: None)
    assert main(["ecc", "run", "github-coordination"]) == 2
    assert "node not found" in capsys.readouterr().err
