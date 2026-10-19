"""Paths and executables that come from project.yaml are untrusted: a cloned repo must not make kickoff write
outside its folder or run an arbitrary binary."""

import shutil
from pathlib import Path

import pytest
from helpers import pkg, plan_dict, project_dict, write_kickoff

from kickoff.cli import main
from kickoff.docs import write_docs
from kickoff.model import ModelError, inside_root, load_project
from kickoff.proto import ProtoError, bundle, find_browser, new_prototype
from kickoff.schemas import schema_errors

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"
BAD = ["../escaped", "docs/../../escaped", "/abs/docs", "\\abs\\docs", "C:\\abs\\docs", "C:/abs/docs", ".."]


def make_root(tmp_path, **project):
    root = tmp_path / "proj"
    root.mkdir()
    write_kickoff(root, project=project_dict(**project), plan=plan_dict([pkg("1.1.1")]))
    return root


# ---------------------------------------------------------------- the shared helper
def test_inside_root_accepts_a_relative_path_inside_the_project(tmp_path):
    assert inside_root(tmp_path, "docs/05-design", "docs_root") == (tmp_path / "docs" / "05-design").resolve()
    assert inside_root(tmp_path, "docs/a..b", "docs_root") == (tmp_path / "docs" / "a..b").resolve()


@pytest.mark.parametrize("value", BAD)
def test_inside_root_rejects_escapes_and_absolute_paths(tmp_path, value):
    with pytest.raises(ModelError, match="docs_root"):
        inside_root(tmp_path, value, "docs_root")


# ---------------------------------------------------------------- the schema says so too
@pytest.mark.parametrize("value", BAD)
def test_schema_rejects_unsafe_paths(value):
    for key, data in (("docs_root", {"docs_root": value}), ("proto.dir", {"proto": {"dir": value}}),
                      ("proto.ux_spec", {"proto": {"ux_spec": value}})):
        errors = schema_errors("project", project_dict(**data))
        assert errors and key.split(".")[-1] in errors[0], (key, value)


def test_schema_accepts_ordinary_relative_paths():
    data = project_dict(docs_root="docs/sub", proto={"dir": "docs/05-design/prototype", "ux_spec": "a..b/ux.md"})
    assert schema_errors("project", data) == []


# ---------------------------------------------------------------- every consumer is guarded
@pytest.mark.parametrize("value", BAD)
def test_docs_refuse_to_write_outside_the_project(tmp_path, value):
    root = make_root(tmp_path, docs_root=value)
    with pytest.raises(ModelError, match="docs_root"):
        write_docs(root, check=False)
    assert sorted(p.name for p in tmp_path.iterdir()) == ["proj"]


def test_docs_command_refuses_too(tmp_path, capsys):
    root = make_root(tmp_path, docs_root="../escaped")
    assert main(["--root", str(root), "docs"]) == 2
    assert "docs_root" in capsys.readouterr().err
    assert not (tmp_path / "escaped").exists()


def test_workbook_refuses_to_write_outside_the_project(tmp_path, capsys):
    root = make_root(tmp_path, docs_root="../escaped")
    assert main(["--root", str(root), "workbook"]) == 2
    assert not (tmp_path / "escaped").exists()
    assert "docs_root" in capsys.readouterr().err


def test_workbook_checks_the_resolved_default_path(tmp_path):
    root = make_root(tmp_path)
    assert main(["--root", str(root), "workbook"]) == 0
    assert (root / "docs" / "06-planning" / "demo-estimate.xlsx").exists()


def copy_mini(tmp_path, **proto):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs" / "05-design", root / "docs" / "05-design", ignore=shutil.ignore_patterns("prototype"))
    if proto:
        from kickoff.model import read_yaml, write_yaml

        path = root / ".kickoff" / "project.yaml"
        data = read_yaml(path)
        data["proto"] = {**data.get("proto", {}), **proto}
        write_yaml(path, data)
    return root


def test_proto_new_refuses_a_directory_outside_the_project(tmp_path):
    root = copy_mini(tmp_path)
    project = load_project(root)
    project.proto["dir"] = "../escaped"  # what a hostile project.yaml would say (the schema also rejects it)
    with pytest.raises(ModelError, match="proto.dir"):
        new_prototype(root, project)
    assert not (tmp_path / "escaped").exists()


def test_proto_bundle_refuses_a_directory_outside_the_project(tmp_path):
    root = copy_mini(tmp_path)
    project = load_project(root)
    project.proto["dir"] = str(tmp_path)
    with pytest.raises(ModelError, match="proto.dir"):
        bundle(root, project)


def test_ux_spec_outside_the_project_is_refused(tmp_path):
    root = copy_mini(tmp_path)
    project = load_project(root)
    project.proto["ux_spec"] = "../ux-spec.md"
    with pytest.raises(ModelError, match="proto.ux_spec"):
        new_prototype(root, project)


def test_proto_command_with_a_bad_dir_in_yaml_exits_2(tmp_path, capsys):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    path = root / ".kickoff" / "project.yaml"
    raw = path.read_text(encoding="utf-8")
    assert "  dir: docs/05-design/prototype" in raw
    path.write_text(raw.replace("  dir: docs/05-design/prototype", "  dir: ../escaped"), encoding="utf-8")
    assert main(["--root", str(root), "proto", "bundle"]) == 2
    assert not (tmp_path / "escaped").exists()


# ---------------------------------------------------------------- proto.browser
def project_with_browser(value):
    from kickoff.model import Project

    return Project.from_dict(project_dict(proto={"browser": value}))


@pytest.mark.parametrize("value", ["msedge", "chrome.exe", "Google-Chrome", "chromium-browser", "Microsoft Edge",
                                   "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
                                   "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"])
def test_known_browsers_are_accepted_from_project_yaml(monkeypatch, value):
    monkeypatch.delenv("KICKOFF_BROWSER", raising=False)
    assert find_browser(project_with_browser(value)) == value


@pytest.mark.parametrize("value", ["calc.exe", "/bin/sh", "powershell", "C:\\Windows\\System32\\cmd.exe",
                                   "./msedge", "tools\\chrome.exe", "chrome-evil", "msedge.bat"])
def test_other_executables_from_project_yaml_are_refused(monkeypatch, value):
    monkeypatch.delenv("KICKOFF_BROWSER", raising=False)
    with pytest.raises(ProtoError, match="proto.browser"):
        find_browser(project_with_browser(value))


def test_kickoff_browser_env_is_not_restricted(monkeypatch):
    monkeypatch.setenv("KICKOFF_BROWSER", "/opt/my-own/headless-shell")
    assert find_browser(project_with_browser("calc.exe")) == "/opt/my-own/headless-shell"


# ---------------------------------------------------------------- bundle script handling
def proto_with_index(tmp_path, scripts, js=None):
    root = copy_mini(tmp_path)
    base = root / "docs" / "05-design" / "prototype"
    (base / "js").mkdir(parents=True)
    for name, body in (js or {}).items():
        (base / "js" / name).write_text(body, encoding="utf-8")
    (base / "index.html").write_text(f"<html><body>{scripts}</body></html>", encoding="utf-8")
    return root


def test_bundle_escapes_script_end_tags_case_insensitively(tmp_path):
    root = proto_with_index(tmp_path, '<script src="js/a.js"></script>',
                            {"a.js": 'x = "</script><b>"; y = "</SCRIPT >"; z = "</ScRiPt>";'})
    html = bundle(root, load_project(root), tmp_path / "out.html").read_text(encoding="utf-8")
    body = html.split("<script charset=\"utf-8\">", 1)[1]
    assert body.lower().count("</script") == 1  # only the closing tag of the inlined script itself
    assert "<\\/script>" in html and "<\\/SCRIPT >" in html and "<\\/ScRiPt>" in html


@pytest.mark.parametrize("src", ["js/../../outside.js", "js/../index.html", "js//etc/passwd", "js/C:/x.js",
                                 "js/..\\..\\outside.js", "js/\\\\host\\share\\x.js"])
def test_bundle_rejects_script_paths_that_leave_js(tmp_path, src):
    root = proto_with_index(tmp_path, f'<script src="{src}"></script>')
    (tmp_path / "outside.js").write_text("secret()", encoding="utf-8")
    with pytest.raises(ProtoError, match="script"):
        bundle(root, load_project(root), tmp_path / "out.html")
    assert not (tmp_path / "out.html").exists()


def test_bundle_still_inlines_nested_script_paths(tmp_path):
    root = proto_with_index(tmp_path, '<script src="js/sub/a.js"></script>')
    sub = root / "docs" / "05-design" / "prototype" / "js" / "sub"
    sub.mkdir()
    (sub / "a.js").write_text("ok()", encoding="utf-8")
    assert "ok()" in bundle(root, load_project(root), tmp_path / "out.html").read_text(encoding="utf-8")
