from pathlib import Path

from helpers import pkg, plan_dict, write_kickoff

from kick.cli import main
from kick.docs import fill_markers, md_table, write_docs

FEATURES = {
    "schema_version": 1,
    "epics": [{"id": "E1", "name": "Core", "goal": "Everything core.", "features": [
        {"id": "F1.1", "name": "Export", "release": "MVP", "prio": "P0", "platforms": "W", "wbs": ["1.1.1"]},
        {"id": "F1.2", "name": "Old", "release": "R2", "prio": "P2", "status": "removed", "removed_by": "D2"},
    ]}],
}


def setup(tmp_path):
    plan = plan_dict([pkg("1.1.1", effort=2), pkg("1.1.2", role="qa", deps=["1.1.1"])],
                     gates=[{"id": "G1", "name": "MVP accepted", "at": "1"}],
                     risks=[{"id": "R1", "title": "Late data", "p": 2, "i": 3, "mitigation": "Ask early"}],
                     sprints=[{"name": "Sprint 1", "start": "2026-09-28", "days": 14}])
    write_kickoff(tmp_path, plan=plan, features=FEATURES)
    return tmp_path / "docs"


def test_md_table_pads_columns():
    assert md_table(["ID", "Name"], [["F1.1", "A|B"]]) == "| ID   | Name |\n| ---- | ---- |\n| F1.1 | A\\|B |"


def test_feature_map(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    fm = (docs / "02-requirements" / "feature-map.md").read_text(encoding="utf-8")
    assert "## E1 — Core" in fm
    assert "Everything core." in fm
    assert "| F1.1 | Export  | MVP     | P0   | W         | 1.1.1 |" in fm
    assert "Removed: F1.2 (see D2)." in fm


def test_wbs_and_risks(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    wbs = (docs / "06-planning" / "wbs.md").read_text(encoding="utf-8")
    assert "| G1   | MVP accepted | 30/09/2026 |" in wbs
    assert "| 1.1.2 | Package 1.1.2 | QA        | 1          | 30/09/2026 – 30/09/2026 | 1.1.1      |" in wbs
    risks = (docs / "06-planning" / "risk-register.md").read_text(encoding="utf-8")
    assert "| R1  | Late data | 2   | 3   | 6     | Ask early  | —       | open   |" in risks


def test_plan_markers_keep_prose(tmp_path):
    docs = setup(tmp_path)
    plan_md = docs / "06-planning" / "plan.md"
    plan_md.parent.mkdir(parents=True, exist_ok=True)
    plan_md.write_text("# Plan\n\nHand-written intro.\n\n<!-- kickoff:begin gates -->\nold\n<!-- kickoff:end gates -->\n",
                       encoding="utf-8")
    write_docs(tmp_path, check=False)
    out = plan_md.read_text(encoding="utf-8")
    assert "Hand-written intro." in out
    assert "old" not in out
    assert "| G1   | MVP accepted | 30/09/2026 |" in out


def test_plan_md_created_with_all_markers(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    out = (docs / "06-planning" / "plan.md").read_text(encoding="utf-8")
    for name in ("gates", "phases", "sprints"):
        assert f"<!-- kickoff:begin {name} -->" in out


def test_generated_documents_use_lf_line_endings(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    for path in (docs / "02-requirements" / "feature-map.md", docs / "06-planning" / "wbs.md",
                 docs / "06-planning" / "risk-register.md", docs / "06-planning" / "plan.md"):
        raw = path.read_bytes()
        assert b"\n" in raw and b"\r" not in raw, path.name


def test_fill_markers_ignores_unknown_blocks():
    src = "a\n<!-- kickoff:begin x -->\n1\n<!-- kickoff:end x -->\n"
    assert fill_markers(src, {"y": "2"}) == src


def test_check_mode(tmp_path, capsys):
    setup(tmp_path)
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 1
    assert main(["--root", str(tmp_path), "docs"]) == 0
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 0
    Path(tmp_path / "docs" / "06-planning" / "wbs.md").write_text("edited", encoding="utf-8")
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 1
