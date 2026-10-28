import pytest

from kick.cli import main


def test_version(capsys):
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    assert "kick 1.0.0" in capsys.readouterr().out


def test_no_command_prints_help(capsys):
    assert main([]) == 0
    assert "usage: kick" in capsys.readouterr().out
