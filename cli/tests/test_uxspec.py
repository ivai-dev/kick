"""The screen inventory checks of `kickoff validate`, `design.forbidden` in `check-docs`, `kickoff prototype record`
and the state migration of 0.8."""

import shutil
from datetime import date
from pathlib import Path

import pytest
from helpers import project_dict, write_kickoff

from kickoff.cli import main
from kickoff.model import load_project, load_state
from kickoff.uxspec import parse_inventory, ux_spec_path
from kickoff.validate import check_docs, validate_root

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"


@pytest.fixture
def mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs", root / "docs")
    return root


def spec(root):
    return ux_spec_path(root, load_project(root))


def replace_in(path, old, new):
    text = path.read_text(encoding="utf-8")
    assert old in text
    path.write_text(text.replace(old, new), encoding="utf-8")


def findings(root, level=None):
    return [str(f) for f in validate_root(root) if level in (None, f.level)]


def test_the_inventory_is_the_first_table_headed_id(mini):
    rows = parse_inventory(spec(mini))
    assert [r["code"] for r in rows] == ["SC-01", "SC-02", "SC-03", "A-01"]
    assert rows[0]["roles"] == ["librarian", "admin"] and rows[3]["platform"] == "android"


def test_the_example_inventory_is_consistent(mini):
    assert findings(mini, "error") == []


def test_platform_and_roles_are_free_text(mini):
    replace_in(spec(mini), "| SC-02 | Loans          | librarian         | web      | MVP     |",
               "| SC-02 | The dungeon    | party leader      | console  | MVP     |")
    assert findings(mini, "error") == []


def test_an_unknown_release_is_an_error(mini):
    replace_in(spec(mini), "| admin             | web      | R2      |", "| admin             | web      | R9      |")
    assert any("SC-03" in f and "R9" in f for f in findings(mini, "error"))


def test_a_duplicate_id_is_an_error(mini):
    replace_in(spec(mini), "| A-01  |", "| sc-01 |")
    assert any("same ID" in f for f in findings(mini, "error"))


def test_a_feature_screen_missing_from_the_inventory_is_an_error(mini):
    replace_in(mini / ".kickoff" / "features.yaml", "screens: [SC-01, SC-02]", "screens: [SC-01, SC-99]")
    assert any("SC-99 is not in the ux-spec screen inventory" in f for f in findings(mini, "error"))


def test_a_screen_no_feature_serves_is_a_warning(mini):
    path = spec(mini)
    path.write_text(path.read_text(encoding="utf-8").rstrip() + "\n| SC-09 | Orphan | admin | web | MVP |\n",
                    encoding="utf-8")
    assert any("SC-09 is served by no active feature" in f for f in findings(mini, "warning"))
    assert findings(mini, "error") == []


def test_without_a_ux_spec_nothing_is_checked(tmp_path):
    root = write_kickoff(tmp_path)
    assert findings(root, "error") == []


def test_the_fe_block_is_read_as_design_and_validate_asks_for_the_rename(tmp_path):
    root = write_kickoff(tmp_path, project=project_dict(fe={"dir": ".", "ux_spec": "docs/05-design/ux.md",
                                                            "forbidden": ["VPN"]}))
    project = load_project(root)
    assert project.design == {"dir": ".", "ux_spec": "docs/05-design/ux.md", "forbidden": ["VPN"]}
    assert project.design_key == "fe"
    assert any("renamed `design` in kickoff 0.8" in f for f in findings(root, "warning"))


def test_check_docs_applies_design_forbidden(tmp_path):
    root = write_kickoff(tmp_path, project=project_dict(design={"forbidden": [r"\bVPN\b"]}))
    doc = root / "docs" / "ux.md"
    doc.parent.mkdir()
    doc.write_text("Sign in\nConnect to the VPN first\n", encoding="utf-8")
    out, count = check_docs(load_project(root), [doc])
    assert count == 1 and out == [f"{doc}:2: forbidden phrase /\\bVPN\\b/"]


def test_prototype_record_counts_versions(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    assert main(["--root", str(root), "prototype", "record", "--artifact", "https://example.test/a"]) == 0
    assert main(["--root", str(root), "prototype", "record", "--artifact", "https://example.test/a"]) == 0
    assert load_state(root)["prototype"] == {"artifact": "https://example.test/a", "version": 2}
    assert main(["--root", str(root), "prototype", "record", "--artifact", "x", "--version", "1"]) == 2
    assert "lower than the recorded version 2" in capsys.readouterr().err


def test_a_0_7_state_file_loads_migrated_and_still_validates(tmp_path):
    ok = {"approved_by": "Lead", "date": date(2026, 10, 1), "evidence": "x"}
    state = {"schema_version": 1, "stale": [],
             "phases": {"init": "done", "discovery": "done", "feature-map": "done", "ux-design": "done",
                        "fe-foundation": "done", "design-direction": "in_progress"},
             "gates": {"C1": ok, "C2": ok, "CF": ok}}
    root = write_kickoff(tmp_path, state=state)
    assert findings(root, "error") == []  # the schema still accepts the old names
    loaded = load_state(root)
    assert loaded["phases"]["design-concept"] == "in_progress" and "fe-foundation" not in loaded["phases"]
    assert "CF" not in loaded["gates"]
