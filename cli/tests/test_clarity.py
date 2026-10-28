import copy
from datetime import date

import pytest
from helpers import STATE, write_kickoff

from kick.clarity import AREAS, clarity_lines, default_clarity, load_clarity, set_area, weakest
from kick.cli import main
from kick.errors import KickError
from kick.model import ModelError, write_yaml

DAY = date(2026, 10, 28)


def test_the_default_register_has_every_area_open_and_low():
    data = default_clarity(DAY)
    assert [a["id"] for a in data["areas"]] == AREAS
    assert {(a["status"], a["confidence"]) for a in data["areas"]} == {("open", "low")}


def test_set_updates_status_confidence_note_and_refs():
    data = default_clarity(DAY)
    set_area(data, "architecture", "assumed", "medium", "sketch only", ["ADR-001", "Q3"], DAY)
    set_area(data, "architecture", None, "high", None, ["Q3", "V1"], date(2026, 10, 29))
    area = next(a for a in data["areas"] if a["id"] == "architecture")
    assert (area["status"], area["confidence"], area["note"]) == ("assumed", "high", "sketch only")
    assert area["refs"] == ["ADR-001", "Q3", "V1"] and area["updated"] == date(2026, 10, 29)


def test_set_adds_an_area_the_project_defines_itself():
    data = default_clarity(DAY)
    set_area(data, "compliance", "open", "low", None, [], DAY)
    assert data["areas"][-1]["id"] == "compliance"


def test_set_rejects_a_bad_id_or_value():
    data = default_clarity(DAY)
    with pytest.raises(KickError, match="area id"):
        set_area(data, "Bad Id", "open", "low", None, [], DAY)
    with pytest.raises(KickError, match="status"):
        set_area(data, "scope", "done", None, None, [], DAY)
    with pytest.raises(KickError, match="confidence"):
        set_area(data, "scope", None, "certain", None, [], DAY)


def test_the_weakest_area_is_the_lowest_status_then_confidence_then_order():
    data = default_clarity(DAY)
    for area, status, conf in [("problem", "decided", "high"), ("users", "decided", "medium"),
                               ("scope", "assumed", "high"), ("solution", "assumed", "low"),
                               ("design", "validated", "high"), ("estimate", "assumed", "medium")]:
        set_area(data, area, status, conf, None, [], DAY)
    assert weakest(data)["id"] == "architecture"  # still open
    set_area(data, "architecture", "assumed", "low", None, [], DAY)
    assert weakest(data)["id"] == "solution"  # first of the assumed/low pair, in pipeline order


def test_the_lines_show_every_area_the_weakest_and_the_spread():
    data = default_clarity(DAY)
    set_area(data, "scope", "decided", "high", "MVP agreed", ["D2"], DAY)
    lines = clarity_lines(data, spread="spread 60%")
    assert lines[0] == "Clarity:"
    assert any(line.startswith("  scope") and "decided" in line and "MVP agreed" in line for line in lines)
    assert any(line.startswith("  estimate") and "spread 60%" in line for line in lines)
    assert lines[-1].startswith("Weakest: problem (open, low)")


def test_load_returns_none_without_a_file_and_rejects_a_bad_one(tmp_path):
    root = write_kickoff(tmp_path)
    assert load_clarity(root) is None
    write_yaml(root / ".kickoff" / "clarity.yaml",
               {"schema_version": 1, "areas": [{"id": "scope", "status": "finished", "confidence": "low"}]})
    with pytest.raises(ModelError, match="clarity.yaml"):
        load_clarity(root)


def test_cli_init_set_and_show(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    assert main(["--root", str(root), "clarity"]) == 0
    assert "not started" in capsys.readouterr().out
    assert main(["--root", str(root), "clarity", "init"]) == 0
    assert main(["--root", str(root), "clarity", "init"]) == 2  # already there
    assert "already exists" in capsys.readouterr().err
    code = main(["--root", str(root), "clarity", "set", "scope", "--status", "decided", "--confidence", "high",
                 "--note", "MVP agreed", "--ref", "D2"])
    assert code == 0
    assert main(["--root", str(root), "clarity"]) == 0
    out = capsys.readouterr().out
    assert "scope" in out and "MVP agreed" in out and "Weakest: problem" in out


def test_cli_set_needs_the_register_and_an_area(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    assert main(["--root", str(root), "clarity", "set", "scope", "--status", "decided"]) == 2
    assert "clarity init" in capsys.readouterr().err
    main(["--root", str(root), "clarity", "init"])
    assert main(["--root", str(root), "clarity", "set"]) == 2
    assert "needs an area" in capsys.readouterr().err


def test_status_shows_the_register_when_the_file_exists(tmp_path, capsys):
    root = write_kickoff(tmp_path, state=copy.deepcopy(STATE))
    main(["--root", str(root), "status"])
    assert "Clarity:" not in capsys.readouterr().out
    main(["--root", str(root), "clarity", "init"])
    capsys.readouterr()
    main(["--root", str(root), "status"])
    assert "Clarity:" in capsys.readouterr().out


def test_session_start_and_validate_know_the_register(tmp_path, monkeypatch):
    from kick.hook import session_start
    from kick.validate import validate_root

    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(tmp_path / "claude"))
    root = write_kickoff(tmp_path)
    assert "Clarity:" not in session_start({"cwd": str(root)})[1]
    write_yaml(root / ".kickoff" / "clarity.yaml", default_clarity(DAY))
    assert "Weakest: problem" in session_start({"cwd": str(root)})[1]
    assert not [f for f in validate_root(root) if f.where == "clarity.yaml"]
    write_yaml(root / ".kickoff" / "clarity.yaml", {"schema_version": 1, "areas": [{"id": "X"}]})
    assert [f for f in validate_root(root) if f.where == "clarity.yaml" and f.level == "error"]


def test_init_writes_the_register(tmp_path):
    from kick.state import init_project

    written = init_project(tmp_path, "Demo", DAY)
    assert tmp_path / ".kickoff" / "clarity.yaml" in written
    assert load_clarity(tmp_path)["areas"][0]["id"] == "problem"
