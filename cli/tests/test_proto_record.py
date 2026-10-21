from helpers import write_kickoff

from kickoff.cli import main
from kickoff.model import load_state


def record(root, *extra):
    return main(["--root", str(root), "proto", "record", *extra])


def test_versions_count_up_and_never_go_back(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    assert record(root, "--artifact", "https://claude.ai/artifact/abc") == 0
    assert load_state(root)["prototype"] == {"artifact": "https://claude.ai/artifact/abc", "version": 1}
    assert record(root, "--artifact", "https://claude.ai/artifact/abc") == 0
    assert record(root, "--artifact", "docs/05-design/prototype/dist/prototype.html", "--version", "5") == 0
    assert "prototype v5: docs/05-design/prototype/dist/prototype.html" in capsys.readouterr().out
    assert record(root, "--artifact", "x", "--version", "3") == 2
    assert "lower than the recorded version 5" in capsys.readouterr().err
    assert load_state(root)["prototype"]["version"] == 5


def test_record_keeps_phases_and_gates(tmp_path):
    root = write_kickoff(tmp_path)
    assert main(["--root", str(root), "phase", "start", "init"]) == 0
    assert record(root, "--artifact", "a") == 0
    assert load_state(root)["phases"] == {"init": "in_progress"}
