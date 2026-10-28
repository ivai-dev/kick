import csv
import json

from helpers import FEATURES, PLAN, pkg, plan_dict, project_dict, write_kickoff

from kick.cli import main


def plan_with_items():
    return plan_dict(
        [pkg("1.1.1", effort=2, item={"title": "Lend a book", "type": "story", "epic": "E1", "areas": ["area:desk"],
                                       "desc": "The librarian lends a book.", "ac": ["A loan is saved", "Due in 14 days"]}),
         pkg("1.1.2", role="qa", effort=0.5, deps=["1.1.1"], release="R2")],
        phases=[{"code": "1", "name": "Build", "i18n": {"vi": {"name": "Xây dựng"}}}],
        groups=[{"code": "1.1", "name": "Core"}])


def features():
    return dict(FEATURES, epics=[{"id": "E1", "name": "Loans", "features": [
        {"id": "F1.1", "name": "Lend", "release": "MVP", "prio": "P0", "wbs": ["1.1.1"]},
        {"id": "F1.2", "name": "Gone", "release": "MVP", "prio": "P1", "wbs": ["1.1"], "status": "removed",
         "removed_by": "D3"}]}])


def test_export_writes_three_files_in_the_docs_folder(tmp_path, capsys):
    root = write_kickoff(tmp_path, plan=plan_with_items(), features=features())
    assert main(["--root", str(root), "export"]) == 0
    out = root / "docs" / "06-planning" / "export"
    assert sorted(p.name for p in out.iterdir()) == ["wbs-items.md", "wbs.csv", "wbs.json"]
    assert "2 packages exported" in capsys.readouterr().out

    rows = list(csv.DictReader((out / "wbs.csv").read_text(encoding="utf-8-sig").splitlines()))
    assert rows[0]["code"] == "1.1.1" and rows[0]["title"] == "Lend a book" and rows[0]["features"] == "F1.1"
    assert rows[0]["ac"] == "A loan is saved; Due in 14 days" and rows[0]["phase"] == "Build"
    assert rows[1]["deps"] == "1.1.1" and rows[1]["release"] == "R2" and rows[1]["title"] == "Package 1.1.2"
    assert rows[1]["features"] == ""  # a removed feature does not count

    doc = json.loads((out / "wbs.json").read_text(encoding="utf-8"))
    assert doc["total_effort"] == 2.5 and doc["items"][0]["effort"] == 2 and doc["items"][1]["effort"] == 0.5
    assert doc["items"][0]["start"] == "2026-09-28" and doc["items"][1]["start"] > doc["items"][0]["end"]

    md = (out / "wbs-items.md").read_text(encoding="utf-8")
    assert "## 1.1.1 Lend a book" in md and "- [ ] Due in 14 days" in md and "| Depends on | 1.1.1 |" in md


def test_export_formats_folder_and_language(tmp_path, capsys):
    root = write_kickoff(tmp_path, project=project_dict(), plan=plan_with_items(), features=features())
    assert main(["--root", str(root), "export", "--format", "json", "--out", str(tmp_path / "x"),
                 "--lang", "vi"]) == 0
    doc = json.loads((tmp_path / "x" / "wbs.json").read_text(encoding="utf-8"))
    assert doc["language"] == "vi" and doc["items"][0]["phase"] == "Xây dựng"
    assert sorted(p.name for p in (tmp_path / "x").iterdir()) == ["wbs.json"]
    assert main(["--root", str(root), "export", "--format", "xlsx"]) == 2
    assert "unknown format xlsx" in capsys.readouterr().err


def test_export_of_an_empty_plan(tmp_path):
    root = write_kickoff(tmp_path, plan=dict(PLAN))
    assert main(["--root", str(root), "export", "--format", "csv"]) == 0
    text = (root / "docs" / "06-planning" / "export" / "wbs.csv").read_text(encoding="utf-8-sig")
    assert text.splitlines() == ["code,name,phase,group,role,effort,deps,release,prio,features,start,end,type,title,"
                                 "epic,areas,desc,ac,sprint,effort_min,effort_max,confidence"]
