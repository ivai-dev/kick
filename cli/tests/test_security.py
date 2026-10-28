"""Paths and executables that come from project.yaml are untrusted: a cloned repo must not make kickoff write
outside its folder or run an arbitrary binary."""

import shutil
from pathlib import Path

import pytest
from helpers import pkg, plan_dict, project_dict, write_kickoff

from kick.cli import main
from kick.docs import write_docs
from kick.model import ModelError, inside_root, load_project
from kick.schemas import schema_errors
from kick.uxspec import ux_spec_path

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
    for key, data in (("docs_root", {"docs_root": value}), ("fe.dir", {"fe": {"dir": value}}),
                      ("design.ux_spec", {"design": {"ux_spec": value}}),
                      ("fe.ux_spec", {"fe": {"ux_spec": value}}),
                      ("proto.ux_spec", {"proto": {"ux_spec": value}})):
        errors = schema_errors("project", project_dict(**data))
        assert errors and key.split(".")[-1] in errors[0], (key, value)


def test_schema_accepts_ordinary_relative_paths():
    data = project_dict(docs_root="docs/sub", design={"ux_spec": "a..b/ux.md"})
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


def copy_mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs" / "05-design", root / "docs" / "05-design")
    return root


def test_ux_spec_outside_the_project_is_refused(tmp_path):
    root = copy_mini(tmp_path)
    project = load_project(root)
    project.design["ux_spec"] = "../ux-spec.md"  # what a hostile project.yaml would say (the schema also rejects it)
    with pytest.raises(ModelError, match="design.ux_spec"):
        ux_spec_path(root, project)


def test_validate_with_a_bad_ux_spec_path_in_yaml_exits_1(tmp_path, capsys):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    path = root / ".kickoff" / "project.yaml"
    raw = path.read_text(encoding="utf-8")
    assert "ux_spec: docs/05-design/ux-spec.md" in raw
    path.write_text(raw.replace("ux_spec: docs/05-design/ux-spec.md", "ux_spec: ../escaped.md"), encoding="utf-8")
    assert main(["--root", str(root), "validate"]) == 1
    assert not (tmp_path / "escaped.md").exists()
