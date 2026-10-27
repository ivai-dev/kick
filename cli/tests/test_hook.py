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
    ("docs/04-architecture/system-architecture.md", "architecture documents wait for C3 and C4: phase signoff"),
])
def test_pre_write_blocks(tmp_path, rel, reason):
    code, message = pre_write(edit(write_kickoff(tmp_path), rel))
    assert code == 2 and reason in message


def test_the_state_guard_names_the_prototype_command(tmp_path):
    assert "kickoff prototype record" in pre_write(edit(write_kickoff(tmp_path), ".kickoff/state.yaml"))[1]


@pytest.mark.skipif(sys.platform != "win32", reason="case-insensitive file system only")
def test_case_variants_meet_the_same_guard_on_windows(tmp_path):
    root = write_kickoff(tmp_path)
    assert pre_write(edit(root, ".kickoff/State.yaml"))[0] == 2
    assert pre_write(edit(root, "Docs/04-Architecture/Data-Model.md"))[0] == 2


def test_the_fast_path_ignores_files_outside_a_project(tmp_path, monkeypatch, capsys):
    import kickoff.hook  # noqa: F401  (only proves the fast path returns before the handlers run)

    code, out = run_hook(monkeypatch, capsys, "pre-write", edit(tmp_path, ".kickoff/state.yaml"))
    assert (code, out.out, out.err) == (0, "", "")


def test_a_non_object_payload_is_a_visible_non_blocking_error(monkeypatch, capsys):
    code, out = run_hook(monkeypatch, capsys, "pre-write", b"[1, 2]")
    assert code == 1 and "not a JSON object" in out.err


@pytest.mark.parametrize("rel", [
    "docs/04-architecture/adr/0001-speech.md",
    "apps/web/src/screens/sc-01.tsx",
    "packages/ui/src/components/button.tsx",
    "packages/kit/src/router.tsx",  # kickoff no longer owns or guards any code folder
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
    assert "ecc warn: D5" in text and "Never turn GateGuard off" in text


def test_session_start_drops_the_gateguard_hint_once_the_project_is_set_up(tmp_path):
    root = write_kickoff(tmp_path)
    (root / ".claude").mkdir()
    (root / ".claude" / "settings.json").write_text(
        json.dumps({"env": {"GATEGUARD_EXEMPT_GLOBS": ".kickoff/**,docs/**,AGENTS.md"}}), encoding="utf-8")
    _, text = session_start({"cwd": str(root)})
    assert "D5" not in text and "GateGuard" not in text


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
