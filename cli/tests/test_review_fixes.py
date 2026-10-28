"""Regression tests for the findings of the 1.0.0 code review."""

import pytest
from test_report import TASK_HEAD, roadmap, tasks

from kick.cli import main
from kick.commands.hook_cmd import _start
from kick.errors import KickError
from kick.estimate import product_total
from kick.files import check_slug, write_yaml
from kick.kickfile import finish_kick, load_kick, new_kick
from kick.projectfile import init_project, make_languages
from kick.report import check_root
from kick.tables import TASKS, parse_days, read_items


@pytest.fixture
def root(tmp_path):
    init_project(tmp_path, make_languages("vi"))
    return tmp_path


def test_root_is_accepted_after_the_command(tmp_path, capsys):
    assert main(["init", "--chat", "en", "--root", str(tmp_path)]) == 0
    assert main(["status", "--root", str(tmp_path)]) == 0
    assert main(["--root", str(tmp_path), "status"]) == 0
    assert "No kick in progress: start one with the kick:start skill." in capsys.readouterr().out


def test_remaining_is_zero_when_a_linked_kick_has_done_every_task(root):
    roadmap(root, "| a: A | | 5–8–14 | low | | first | app |\n")
    new_kick(root, "app", "App", "feature")
    tasks(root, "app", "| t: T | x | | 1–2–3 | low | | done |\n")
    left = product_total(root, remaining=True)
    assert (left.low, left.likely, left.high) == (0, 0, 0)


@pytest.mark.parametrize("text", ["inf", "nan", "1e999", "-4", "1–2–inf", "-1–0–1"])
def test_days_must_be_finite_and_not_negative(text):
    with pytest.raises(ValueError):
        parse_days(text)


def test_an_impossible_date_is_a_clean_error(root, capsys):
    new_kick(root, "app", "App", "feature")
    path = root / "docs/kick/app/kick.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace("started: ", "started: 2026-02-30 #"),
                    encoding="utf-8")
    assert main(["--root", str(root), "status", "app"]) == 2
    assert "invalid YAML" in capsys.readouterr().err


def test_a_name_ending_in_a_newline_is_refused():
    with pytest.raises(KickError):
        check_slug("ab\n")


def test_bom_crlf_and_line_separators_in_tables(tmp_path):
    path = tmp_path / "tasks.md"
    path.write_bytes(("﻿## Tasks\r\n\r\n" + TASK_HEAD.replace("\n", "\r\n")
                      + "| a: A   more | x | | 1–2–3 | low | | todo |\r\n| b: B | x | a | 1 | low | | todo |\r\n")
                     .encode("utf-8"))
    items, errors = read_items(path, TASKS)
    assert errors == [] and [(i.key, i.line) for i in items] == [("a", 5), ("b", 6)]


def test_a_kick_with_every_task_done_is_not_without_tasks(root, capsys):
    new_kick(root, "app", "App", "feature")
    tasks(root, "app", "| a: A | x | | 1 | low | | done |\n")
    assert main(["--root", str(root), "status"]) == 0
    assert "tasks 1/1  0–0–0 days left" in capsys.readouterr().out


def test_post_write_skips_other_files_before_any_import(tmp_path):
    assert _start("post-write", {"cwd": str(tmp_path), "tool_input": {"file_path": "src/app.py"}}) is None
    assert _start("post-write", {"cwd": str(tmp_path), "tool_input": {"file_path": "docs/kick/x/tasks.md"}}) \
        == tmp_path / "docs/kick/x"


def test_one_broken_kick_does_not_hide_the_others(root, capsys):
    new_kick(root, "good", "Good", "feature")
    new_kick(root, "bad", "Bad", "feature")
    (root / "docs/kick/bad/kick.yaml").write_text("title: [unclosed\n", encoding="utf-8")
    roadmap(root, "| a: A | | 1 | low | | | bad |\n")
    assert main(["--root", str(root), "status"]) == 0
    out = capsys.readouterr().out
    assert "  good  feature  understand" in out and "  bad: cannot be read" in out
    found = check_root(root)
    assert any("bad" in e and "invalid YAML" in e for e in found.errors)


def test_a_failed_move_leaves_the_kick_active(root, monkeypatch):
    new_kick(root, "app", "App", "feature")

    def boom(*args):
        raise OSError("disk full")

    monkeypatch.setattr("kick.kickfile.shutil.move", boom)
    with pytest.raises(OSError):
        finish_kick(root, "app")
    assert load_kick(root / "docs/kick/app").status == "active"


def test_a_kick_cell_pointing_outside_is_an_error_and_never_read(root, tmp_path):
    outside = tmp_path.parent / "outside"
    outside.mkdir(exist_ok=True)
    write_yaml(outside / "kick.yaml", {"schema_version": 1, "title": "x", "kind": "feature", "started": "2026-10-28",
                                       "status": "active"})
    roadmap(root, "| a: A | | 2 | low | | | ../../../outside |\n")
    assert any("is not a kick name" in e for e in check_root(root).errors)
    assert product_total(root).likely == 2


def test_answers_in_a_wrong_shape_are_ignored(cfg):
    from kick import companions
    path = companions.answers_file()
    path.parent.mkdir(parents=True)
    path.write_text("answers: [figma]\n", encoding="utf-8")
    assert companions.load_answers() == {}


def test_new_with_roadmap_links_the_row(root, capsys):
    roadmap(root, "| lending: lend | | 2 | low | | first | |\n")
    assert main(["--root", str(root), "new", "lending", "--title", "Lending", "--kind", "feature",
                 "--roadmap", "lending"]) == 0
    assert "linked: roadmap row lending → lending" in capsys.readouterr().out
    text = (root / "docs/kick/project/roadmap.md").read_text(encoding="utf-8")
    assert "| lending: lend |  | 2 | low |  | first | lending |" in text
    assert check_root(root).errors == []
    assert main(["--root", str(root), "new", "other", "--title", "O", "--kind", "feature", "--roadmap", "nope"]) == 0
    assert "warn: the roadmap has no row nope" in capsys.readouterr().out


def test_estimate_warns_about_an_unreadable_table(root, capsys):
    new_kick(root, "app", "App", "feature")
    (root / "docs/kick/app/tasks.md").write_text("# renamed heading\n", encoding="utf-8")
    assert main(["--root", str(root), "estimate", "app"]) == 0
    assert "warn: app: tasks.md: no '## Tasks' table (its rows are not counted; run kick check)" in \
        capsys.readouterr().out
