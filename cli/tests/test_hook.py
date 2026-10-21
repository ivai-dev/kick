import copy
import io
import json
import sys
from datetime import date

import pytest
from helpers import STATE, pkg, plan_dict, write_kickoff

from kickoff.cli import main
from kickoff.hook import post_write, pre_write, session_start


@pytest.fixture(autouse=True)
def no_ecc(tmp_path, monkeypatch):
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(tmp_path / "claude"))  # ECC "not installed": hooks must not care
    monkeypatch.delenv("KICKOFF_ECC_ROOT", raising=False)


def edit(root, rel):
    return {"cwd": str(root), "tool_name": "Edit", "tool_input": {"file_path": str(root / rel)}}


def signed_off():
    gate = {"approved_by": "Customer", "date": date(2026, 10, 1), "evidence": "docs/signoff.md"}
    state = copy.deepcopy(STATE)
    state["phases"] = {"init": "done", "discovery": "done", "feature-map": "done", "ux-design": "done",
                       "prototype": "done", "signoff": "done"}
    state["gates"] = {"C3": gate, "C4": dict(gate, approved_by="Project lead")}
    return state


@pytest.mark.parametrize(("rel", "reason"), [
    (".kickoff/state.yaml", "state.yaml is written by the kickoff CLI only"),
    (".kickoff/tickets.yaml", "tickets.yaml is written by kickoff tickets only"),
    ("docs/04-architecture/system-architecture.md", "architecture documents wait for C3 and C4: phase signoff"),
    ("docs/05-design/prototype/js/ui.js", "the kit core is replaced by kickoff proto update"),
    ("docs/05-design/prototype/narrow.html", "the kit core"),
    ("docs/05-design/prototype/test/logic.test.js", "the kit core"),
])
def test_pre_write_blocks(tmp_path, rel, reason):
    code, message = pre_write(edit(write_kickoff(tmp_path), rel))
    assert code == 2 and reason in message


@pytest.mark.parametrize("rel", [
    "docs/04-architecture/adr/0001-speech.md",
    "docs/05-design/prototype/js/common.js",
    "docs/05-design/prototype/js/ui/extra.js",
    ".kickoff/features.yaml",
    "README.md",
])
def test_pre_write_allows(tmp_path, rel):
    assert pre_write(edit(write_kickoff(tmp_path), rel)) == (0, "")


def test_architecture_opens_after_c3_and_c4(tmp_path):
    root = write_kickoff(tmp_path, state=signed_off())
    assert pre_write(edit(root, "docs/04-architecture/data-model.md")) == (0, "")


def test_relative_paths_resolve_against_the_hook_cwd(tmp_path):
    root = write_kickoff(tmp_path)
    payload = {"cwd": str(root / "docs"), "tool_input": {"file_path": "../.kickoff/state.yaml"}}
    assert pre_write(payload)[0] == 2


def test_outside_a_project_nothing_is_touched(tmp_path):
    assert pre_write(edit(tmp_path, ".kickoff/state.yaml")) == (0, "")
    assert post_write(edit(tmp_path, ".kickoff/plan.yaml")) == (0, "")
    assert session_start({"cwd": str(tmp_path)}) == (0, "")


def test_a_broken_project_file_does_not_block_writes(tmp_path):
    root = write_kickoff(tmp_path)
    (root / ".kickoff" / "project.yaml").write_text("name: [", encoding="utf-8")
    assert pre_write(edit(root, "docs/04-architecture/system-architecture.md")) == (0, "")


def test_post_write_reports_validate_errors(tmp_path):
    root = write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", role="ops")]))
    code, message = post_write(edit(root, ".kickoff/plan.yaml"))
    assert code == 2 and "kickoff validate after editing .kickoff/plan.yaml" in message
    assert "unknown role ops" in message
    assert post_write(edit(root, "docs/notes.md")) == (0, "")


def test_post_write_is_quiet_on_a_clean_project(tmp_path):
    root = write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1")]))
    assert post_write(edit(root, ".kickoff/plan.yaml")) == (0, "")


def test_session_start_prints_status_and_the_ecc_failure(tmp_path):
    code, text = session_start({"cwd": str(write_kickoff(tmp_path))})
    assert code == 0
    assert text.startswith("kickoff project detected: use the kickoff:using-kickoff skill.")
    assert "\nNext: " in text
    assert "ecc fail: D1 ECC is not installed" in text


def run_hook(monkeypatch, capsys, event, payload):
    data = payload if isinstance(payload, bytes) else json.dumps(payload).encode("utf-8")
    monkeypatch.setattr(sys, "stdin", io.TextIOWrapper(io.BytesIO(data), encoding="utf-8"))
    code = main(["hook", event])
    return code, capsys.readouterr()


def test_cli_blocks_with_a_json_decision_and_exit_0(tmp_path, monkeypatch, capsys):
    code, out = run_hook(monkeypatch, capsys, "pre-write", edit(write_kickoff(tmp_path), ".kickoff/state.yaml"))
    decision = json.loads(out.out)["hookSpecificOutput"]
    assert code == 0 and decision["hookEventName"] == "PreToolUse" and decision["permissionDecision"] == "deny"
    assert "state.yaml is written by the kickoff CLI only" in decision["permissionDecisionReason"]


def test_cli_post_write_feeds_errors_back_as_a_block_decision(tmp_path, monkeypatch, capsys):
    root = write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", role="ops")]))
    code, out = run_hook(monkeypatch, capsys, "post-write", edit(root, ".kickoff/plan.yaml"))
    decision = json.loads(out.out)
    assert code == 0 and decision["decision"] == "block" and "unknown role ops" in decision["reason"]


def test_cli_allowed_write_prints_nothing(tmp_path, monkeypatch, capsys):
    code, out = run_hook(monkeypatch, capsys, "pre-write", edit(write_kickoff(tmp_path), "README.md"))
    assert (code, out.out, out.err) == (0, "", "")


def test_cli_bad_json_is_a_visible_non_blocking_error(monkeypatch, capsys):
    code, out = run_hook(monkeypatch, capsys, "pre-write", b"{not json")
    assert code == 1 and "kickoff hook pre-write: JSONDecodeError" in out.err


def test_cli_session_start_prints_to_stdout(tmp_path, monkeypatch, capsys):
    code, out = run_hook(monkeypatch, capsys, "session-start", {"cwd": str(write_kickoff(tmp_path))})
    assert code == 0 and "kickoff project detected" in out.out
