import json
from datetime import date

import pytest
import yaml

from kick.cli import main
from kick.estimate import kick_total, product_total
from kick.files import write_yaml
from kick.kickfile import finish_kick, load_kick, new_kick
from kick.projectfile import init_project, make_languages
from kick.report import check_root

DAY = date(2026, 10, 28)
TASK_HEAD = ("| Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status |\n"
             "| --- | --- | --- | --- | --- | --- | --- |\n")
ROAD_HEAD = ("| Feature | After | Days (min–likely–max) | Confidence | Basis | Release | Kick |\n"
             "| --- | --- | --- | --- | --- | --- | --- |\n")
API_HEAD = "| Endpoint | Used by | Roles | Status | Cost |\n| --- | --- | --- | --- | --- |\n"


@pytest.fixture
def root(tmp_path):
    init_project(tmp_path, make_languages("vi"))
    return tmp_path


def tasks(root, slug, rows):
    (root / f"docs/kick/{slug}/tasks.md").write_text(f"# x\n\n## Tasks\n\n{TASK_HEAD}{rows}", encoding="utf-8")


def roadmap(root, rows):
    (root / "docs/kick/project/roadmap.md").write_text(f"# R\n\n## Features\n\n{ROAD_HEAD}{rows}", encoding="utf-8")


def agree(root, slug, *steps):
    path = root / f"docs/kick/{slug}/kick.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    data["agreed"] = dict.fromkeys(steps, DAY)
    write_yaml(path, data)


def project_settings(root, **values):
    path = root / "docs/kick/project/project.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    data.update(values)
    write_yaml(path, data)


# ---------------------------------------------------------------- estimate
def test_kick_total_and_remaining(root):
    new_kick(root, "app", "App", "feature")
    tasks(root, "app", "| a: A | x | | 1–2–4 | low | | done |\n| b: B | x | a | 3 | medium | | todo |\n"
                       "| c: C | x | | | | | todo |\n")
    kick = load_kick(root / "docs/kick/app")
    total = kick_total(kick)
    assert (total.low, total.likely, total.high, total.items, total.points, total.low_confidence,
            total.unestimated) == (4, 5, 7, 3, 1, 1, 1)
    left = kick_total(kick, remaining=True)
    assert (left.low, left.likely, left.high) == (3, 3, 3)


def test_product_total_uses_a_linked_kick_instead_of_its_row(root):
    roadmap(root, "| foundation: base | | 4–6–10 | medium | | first | foundation |\n"
                  "| lending: lend | foundation | 5–8–14 | low | | first | |\n"
                  "| reports: reports | lending | 2–3–5 | low | | later | |\n")
    assert (product_total(root).low, product_total(root).likely, product_total(root).high) == (11, 17, 29)
    new_kick(root, "foundation", "Foundation", "feature", roadmap="foundation")
    total = product_total(root)
    assert total.likely == 17  # the kick has no estimated task yet: the row still counts
    tasks(root, "foundation", "| s: sign-in | x | | 1–2–3 | medium | | done |\n| d: db | x | | 1–1–2 | high | | todo |\n")
    total = product_total(root)
    assert (total.low, total.likely, total.high) == (9, 14, 24)
    assert total.by_release == {"first": [7.0, 11.0, 19.0], "later": [2.0, 3.0, 5.0]}
    left = product_total(root, remaining=True)
    assert (left.low, left.likely, left.high) == (8, 12, 21)
    finish_kick(root, "foundation")
    left = product_total(root, remaining=True)
    assert (left.low, left.likely, left.high) == (7, 11, 19)


def test_estimate_command_with_overhead_budget_and_json(root, capsys):
    project_settings(root, overhead=0.1, budget_days=20)
    roadmap(root, "| a: A | | 10–15–25 | low | | first | |\n")
    assert main(["--root", str(root), "estimate"]) == 0
    out = capsys.readouterr().out
    assert "work      10–15–25 days  (1 rows; 0 point estimates; 1 low confidence)" in out
    assert "overhead  10%: 1–1.5–2.5 days" in out
    assert "total     11–16.5–27.5 days" in out
    assert "budget    20 days: the likely fits, the max does not" in out
    assert main(["--root", str(root), "estimate", "--json"]) == 0
    data = json.loads(capsys.readouterr().out)
    assert data["total"] == [11.0, 16.5, 27.5] and data["by_release"] == {"first": [10.0, 15.0, 25.0]}


def test_estimate_of_one_kick(root, capsys):
    new_kick(root, "app", "App", "feature")
    tasks(root, "app", "| a: A | x | | 1–2–4 | low | | done |\n")
    assert main(["--root", str(root), "estimate", "app", "--remaining"]) == 0
    assert "Estimate: app (feature kick), remaining\n  work      0–0–0 days  (0 rows" in capsys.readouterr().out


# ---------------------------------------------------------------- status
def test_status_lists_kicks_roadmap_api_and_next(root, capsys):
    new_kick(root, "library", "Library", "product")
    agree(root, "library", "understand", "shape", "plan")
    tasks(root, "library", "| shell: shell | x | | 1–2–3 | medium | | done |\n"
                           "| lend: lend | x | shell | 2–3–5 | low | [unclear: scanner] | doing |\n")
    roadmap(root, "| foundation: base | | 4–6–10 | medium | | first | |\n")
    (root / "docs/kick/project/api.md").write_text(
        f"# API\n\n## Endpoints\n\n{API_HEAD}| GET /a | x | y | mock | |\n| GET /b | x | y | real | costly |\n",
        encoding="utf-8")
    assert main(["--root", str(root), "status"]) == 0
    out = capsys.readouterr().out
    assert out.startswith("Languages: chat vi · docs vi · code en · UI vi · commits en\nKicks:\n")
    assert "  library  product  build  tasks 1/2  2–3–5 days left  unclear 1" in out
    assert "Roadmap: 1 features: 0 done, 0 in progress, 1 not started; 4–6–10 days left" in out
    assert "API: 2 endpoints: 1 mock, 1 real; 1 marked costly" in out
    assert "  library: build: the real UI on mock data, then people try it" in out


def test_status_of_one_kick(root, capsys):
    new_kick(root, "app", "App", "feature")
    agree(root, "app", "understand")
    (root / "docs/kick/app/brief.md").write_text("# b\n\n- who approves? [unclear: who approves refunds]\n",
                                                 encoding="utf-8")
    assert main(["--root", str(root), "status", "app"]) == 0
    out = capsys.readouterr().out
    assert "  agreed: understood (2026-10-28)" in out and "  not agreed: it works as agreed" in out
    assert "    docs/kick/app/brief.md:3: who approves refunds" in out
    assert out.rstrip().endswith("Next: shape: options for the solution, the architecture and the look, then "
                                 "agree how to build it")


def test_status_without_kicks_and_without_project(root, tmp_path_factory, capsys):
    assert main(["--root", str(root), "status"]) == 0
    assert "No kick in progress: start one (kick new)." in capsys.readouterr().out
    empty = tmp_path_factory.mktemp("empty")
    assert main(["--root", str(empty), "status"]) == 2
    assert "run kick init" in capsys.readouterr().err


def test_template_markers_in_comments_are_not_unclear(root, capsys):
    new_kick(root, "app", "App", "feature")
    assert main(["--root", str(root), "status", "app"]) == 0
    assert "unclear" not in capsys.readouterr().out


# ---------------------------------------------------------------- check
def test_check_clean_project(root, capsys):
    new_kick(root, "app", "App", "feature")
    assert main(["--root", str(root), "check"]) == 0
    assert capsys.readouterr().out.strip() == "check: 0 errors, 0 warnings"


def test_check_errors_and_advice(root, capsys):
    new_kick(root, "app", "App", "feature", roadmap="nowhere")
    tasks(root, "app", "| a: A | x | zz | 3–2–1 | low | | doing |\n| p: probe (probe) | x | | 1 | low | | done |\n")
    (root / "docs/kick/app/design.md").write_text("[unclear: storage]\n", encoding="utf-8")
    roadmap(root, "| foundation: base | | 1 | low | | | ghost |\n")
    found = check_root(root)
    assert any("docs/kick/app/tasks.md:" in e and "3–2–1" in e for e in found.errors)
    assert any("a waits for zz" in e for e in found.errors)
    assert any("names the kick ghost, which does not exist" in e for e in found.errors)
    assert "app: work started (a) before the plan was agreed" in found.warnings
    assert "app: roadmap key nowhere is not in docs/kick/project/roadmap.md" in found.warnings
    agree(root, "app", "understand", "shape", "plan")
    assert "app: 1 unclear point(s) remain although the plan is agreed" in check_root(root).warnings
    assert main(["--root", str(root), "check"]) == 1
    assert "check: 3 errors" in capsys.readouterr().out


def test_check_reports_a_broken_kick_yaml_and_a_missing_table(root):
    new_kick(root, "app", "App", "feature")
    (root / "docs/kick/app/kick.yaml").write_text("title: x\n", encoding="utf-8")
    new_kick(root, "web", "Web", "feature")
    (root / "docs/kick/web/tasks.md").write_text("# no table\n", encoding="utf-8")
    errors = check_root(root).errors
    assert any("app" in e and "kick.yaml" in e for e in errors)
    assert "docs/kick/web/tasks.md: no '## Tasks' table" in errors


def test_check_one_kick_and_an_unknown_one(root, capsys):
    new_kick(root, "app", "App", "feature")
    assert main(["--root", str(root), "check", "app"]) == 0
    assert main(["--root", str(root), "check", "nope"]) == 2
    assert "no kick named nope" in capsys.readouterr().err
