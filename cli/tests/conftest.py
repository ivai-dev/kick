import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))


@pytest.fixture
def cfg(tmp_path, monkeypatch):
    """An empty Claude config (CLAUDE_CONFIG_DIR), an empty home and kick home, so no test reads this machine's."""
    cfg = tmp_path / "claude"
    home = tmp_path / "home"
    home.mkdir()
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(cfg))
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.setenv("USERPROFILE", str(home))
    monkeypatch.setenv("KICK_HOME", str(tmp_path / "kickhome"))
    for name in ("KICK_ECC_ROOT", "ECC_DISABLED_HOOKS"):
        monkeypatch.delenv(name, raising=False)
    return cfg


def register(cfg: Path, plugins: dict) -> None:
    """installed_plugins.json with {key: [entries]}."""
    p = cfg / "plugins" / "installed_plugins.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps({"version": 2, "plugins": plugins}), encoding="utf-8")
