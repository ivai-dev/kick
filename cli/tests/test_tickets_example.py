import shutil
from pathlib import Path

from fake_gh import FakeGh

from kickoff.model import load_project, load_tickets
from kickoff.tickets import push
from kickoff.tracker import GitHubTracker

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "ai-minute"
PENDING = ["E14", "E15", "6.2.2", "6.4.3", "6.5.1", "6.5.2", "6.5.3", "6.5.4", "6.5.5", "6.5.6", "6.5.7"]


def test_example_dry_run_creates_only_the_pending_items(tmp_path):
    shutil.copytree(EXAMPLE / ".kickoff", tmp_path / ".kickoff")
    gh = FakeGh()
    for key, rec in load_tickets(tmp_path)["items"].items():
        gh.add(rec["issue"], f"[{key}] existing", "existing body")
    tracker = GitHubTracker(load_project(tmp_path).tracker, {}, runner=gh, dry=True)
    report = push(tmp_path, tracker, dry=True)
    assert report.created == PENDING
    assert len(report.drift) == 71  # mapped, never synced by kickoff: needs --adopt
    assert gh.mutations == []
