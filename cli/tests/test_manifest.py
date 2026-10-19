import json
from pathlib import Path

from kickoff import __version__

ROOT = Path(__file__).resolve().parents[2]


def test_manifests_agree():
    plugin = json.loads((ROOT / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    market = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
    assert plugin["name"] == "kickoff"
    assert plugin["version"] == __version__
    entry = next(p for p in market["plugins"] if p["name"] == "kickoff")
    assert entry["version"] == __version__
    assert entry["source"] == "./"
