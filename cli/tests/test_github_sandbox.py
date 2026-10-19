import os

import pytest
from helpers import pkg, plan_dict, project_dict, write_kickoff

from kickoff.tickets import push
from kickoff.tracker import GitHubTracker

SANDBOX = os.environ.get("KICKOFF_SANDBOX", "")
pytestmark = [pytest.mark.github, pytest.mark.skipif(not SANDBOX, reason="set KICKOFF_SANDBOX=org/repo#project")]


def test_push_twice_is_a_no_op(tmp_path):
    slug, _, number = SANDBOX.partition("#")
    org, repo = slug.split("/")
    cfg = {"kind": "github", "org": org, "repo": repo, "project": int(number or 1),
           "assignee": os.environ.get("KICKOFF_SANDBOX_ASSIGNEE", org), "milestone": "Sandbox"}
    ticket = {"title": "Sandbox task", "type": "task", "epic": "E1", "areas": ["area:sandbox"], "desc": "x"}
    features = {"schema_version": 1, "epics": [{"id": "E1", "name": "Sandbox", "features": []}]}
    packages = [pkg("1.1.1", ticket=ticket), pkg("1.1.2", deps=["1.1.1"], ticket={**ticket, "title": "Second"})]
    write_kickoff(tmp_path, project=project_dict(tracker=cfg), plan=plan_dict(packages), features=features)

    def run():
        return push(tmp_path, GitHubTracker(cfg, {}, dry=False), dry=False)

    assert run().created == ["E1", "1.1.1", "1.1.2"]
    second = run()
    assert second.created == [] and second.updated == [] and second.mutations == []
