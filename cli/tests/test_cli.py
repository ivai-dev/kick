import pytest
from helpers import pkg, plan_dict, project_dict, write_kickoff

from kickoff.cli import main
from kickoff.model import ModelError, load_project


def test_version(capsys):
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    assert "kickoff 0.3.0" in capsys.readouterr().out


def test_no_command_prints_help(capsys):
    assert main([]) == 0
    assert "usage: kickoff" in capsys.readouterr().out


def test_schedule_json_is_written_with_lf(tmp_path):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1"), pkg("1.1.2")]))
    out = tmp_path / "schedule.json"
    assert main(["--root", str(tmp_path), "schedule", "--json", str(out)]) == 0
    raw = out.read_bytes()
    assert b"\n" in raw and b"\r" not in raw


@pytest.mark.parametrize("argv", [["docs"], ["tickets", "plan"], ["tickets", "push", "--dry"], ["tickets", "pull"],
                                  ["workbook"]])
def test_commands_stop_on_plan_errors_instead_of_a_traceback(tmp_path, capsys, argv):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", role="ops")]))
    assert main(["--root", str(tmp_path), *argv]) == 1
    assert "error: 1.1.1: unknown role ops" in capsys.readouterr().out


def test_seven_day_weekend_fails_the_schema(tmp_path):
    days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    write_kickoff(tmp_path, project=project_dict(calendar={"weekend": days, "holidays": []}))
    with pytest.raises(ModelError, match=r"calendar/weekend: .* is too long"):
        load_project(tmp_path)
    write_kickoff(tmp_path, project=project_dict(calendar={"weekend": days[:6], "holidays": []}))
    assert load_project(tmp_path).weekend == (0, 1, 2, 3, 4, 5)
