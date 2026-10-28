import io
import json

import pytest

from kick.commands.hook_cmd import fast_run
from kick.hook import post_write, session_start
from kick.kickfile import new_kick
from kick.projectfile import init_project, make_languages

ROW = ("| Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status |\n"
       "| --- | --- | --- | --- | --- | --- | --- |\n")


@pytest.fixture
def root(tmp_path, cfg):
    project = tmp_path / "proj"
    project.mkdir()
    init_project(project, make_languages("vi"))
    new_kick(project, "app", "App", "feature")
    return project


def run(monkeypatch, capsys, event, payload):
    monkeypatch.setattr("sys.stdin", io.TextIOWrapper(io.BytesIO(json.dumps(payload).encode("utf-8"))))
    code = fast_run(event)
    return code, capsys.readouterr()


def test_session_start_prints_languages_status_and_the_ecc_need(root):
    code, message = session_start({"cwd": str(root / "src")})
    assert code == 0
    assert message.startswith("kick project: use the kick:using-kick skill.")
    assert "Languages: chat vi · docs vi · code en · UI vi · commits en" in message
    assert "  app  feature  understand  tasks 0/0  no tasks yet" in message
    assert "kick needs ECC: D1 ECC is not installed" in message


def test_session_start_outside_a_kick_project_is_silent(tmp_path, cfg, monkeypatch, capsys):
    code, out = run(monkeypatch, capsys, "session-start", {"cwd": str(tmp_path)})
    assert (code, out.out, out.err) == (0, "", "")


def test_session_start_with_a_broken_project_file(root):
    (root / "docs/kick/project/project.yaml").write_text("schema_version: 1\n", encoding="utf-8")
    _, message = session_start({"cwd": str(root)})
    assert "kick: " in message and "languages" in message


def test_post_write_reports_check_findings_for_kick_files_only(root):
    tasks = root / "docs/kick/app/tasks.md"
    tasks.write_text(f"## Tasks\n\n{ROW}| a: A | x | b | 3–2–1 | low | | doing |\n", encoding="utf-8")
    code, message = post_write({"cwd": str(root), "tool_input": {"file_path": "docs/kick/app/tasks.md"}})
    assert code == 0 and message.startswith("kick check after editing docs/kick/app/tasks.md:")
    assert "error: docs/kick/app/tasks.md:5: days '3–2–1'" in message
    assert "warn: app: work started (a) before the plan was agreed" in message
    assert post_write({"cwd": str(root), "tool_input": {"file_path": str(root / "docs/kick/app/brief.md")}}) == (0, "")
    other = root / "src" / "tasks.md"
    other.parent.mkdir()
    other.write_text("x", encoding="utf-8")
    assert post_write({"cwd": str(root), "tool_input": {"file_path": str(other)}}) == (0, "")


def test_post_write_is_quiet_when_all_is_well(root):
    payload = {"cwd": str(root), "tool_input": {"file_path": str(root / "docs/kick/app/kick.yaml")}}
    assert post_write(payload) == (0, "")


def test_fast_run_never_blocks_and_reports_bugs_on_stderr(root, monkeypatch, capsys):
    (root / "docs/kick/app/tasks.md").write_text(f"## Tasks\n\n{ROW}| a: A | x | | 3–2–1 | low | | todo |\n",
                                                 encoding="utf-8")
    code, out = run(monkeypatch, capsys, "post-write",
                    {"cwd": str(root), "tool_input": {"file_path": str(root / "docs/kick/app/tasks.md")}})
    assert code == 0 and "error:" in out.out and "decision" not in out.out
    monkeypatch.setattr("sys.stdin", io.TextIOWrapper(io.BytesIO(b"[1, 2]")))
    assert fast_run("post-write") == 1
    assert "kick hook post-write: ValueError" in capsys.readouterr().err
    assert fast_run("pre-write") == 1
