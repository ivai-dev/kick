import json
from pathlib import Path

from kick import __version__

ROOT = Path(__file__).resolve().parents[2]


def test_manifests_agree():
    plugin = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    market = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
    assert plugin["name"] == "kick"
    assert plugin["version"] == __version__
    entry = next(p for p in market["plugins"] if p["name"] == "kick")
    assert entry["version"] == __version__
    assert entry["source"] == "./"
