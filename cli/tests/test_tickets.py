from datetime import date

from fake_gh import FakeGh
from helpers import pkg, plan_dict, project_dict, write_kickoff

from kickoff.model import load_tickets
from kickoff.tickets import link, plan_issues, pull, push
from kickoff.tracker import GitHubTracker, body_hash, strip_key, with_key

GH = {"kind": "github", "org": "o", "repo": "r", "project": 1, "assignee": "lead-user", "milestone": "MVP",
      "priority": {"source": "org-field", "map": {"P0": "High", "P1": "Medium", "P2": "Low"}},
      "issue_fields": {"Priority": {"id": "IF_P", "options": {"High": "p0", "Medium": "p1", "Low": "p2"}},
                       "Start": {"id": "IF_S"}, "Target": {"id": "IF_T"}}}
FEATURES = {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "goal": "Core goal.", "features": [
    {"id": "F1.1", "name": "Export", "release": "MVP", "prio": "P0", "wbs": ["1.1.1"]}]}]}


def ticket(title):
    return {"title": title, "type": "task", "epic": "E1", "areas": ["area:web"], "desc": "Do it.", "ac": ["Done"],
            "sprint": "Sprint 1"}


def setup(tmp_path, title="Build export"):
    packages = [pkg("1.1.1", effort=2, prio="P0", release="MVP", ticket=ticket(title)),
                pkg("1.1.2", role="qa", deps=["1.1.1"], release="MVP", ticket=ticket("Test export")),
                pkg("1.1.3", role="lead")]
    write_kickoff(tmp_path, project=project_dict(tracker=GH), plan=plan_dict(packages), features=FEATURES)


def tracker(gh, tmp_path, dry=False):
    return GitHubTracker(GH, load_tickets(tmp_path).setdefault("tracker_cache", {}), runner=gh, dry=dry)


def test_key_helpers():
    b = with_key("Body", "1.1.1")
    assert b.endswith("<!-- kickoff:1.1.1 -->\n")
    assert strip_key(b) == "Body"
    assert body_hash(b) == body_hash("Body")


def test_plan_issues_shape(tmp_path):
    from kickoff.model import load_features, load_plan, load_project
    from kickoff.schedule import build_schedule

    setup(tmp_path)
    project, plan, features = load_project(tmp_path), load_plan(tmp_path), load_features(tmp_path)
    specs = plan_issues(project, plan, features, build_schedule(project, plan))
    assert [s.key for s in specs] == ["E1", "1.1.1", "1.1.2"]
    epic, first, second = specs
    assert epic.title == "[E1] Core" and epic.type == "epic" and "Core goal." in epic.body
    assert first.title == "[1.1.1] Build export"
    assert first.body.startswith("**WBS:** 1.1.1 · **Role:** Developer · **Effort:** 2 d · **Planned:** 28/09/2026 – 29/09/2026 · **Priority:** P0")
    assert "- [ ] Done" in first.body
    assert first.parent_key == "E1" and second.blocked_by == ["1.1.1"]
    assert first.fields["Start"] == "2026-09-28" and first.fields["Sprint"] == "Sprint 1"


def test_first_push_creates_and_links(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.created == ["E1", "1.1.1", "1.1.2"]
    items = load_tickets(tmp_path)["items"]
    assert items["1.1.1"]["issue"] == 2
    assert "<!-- kickoff:1.1.2 -->" in gh.issues[3]["body"]
    assert any("addSubIssue" in m for m in gh.mutations)
    assert any("addBlockedBy" in m for m in gh.mutations)
    assert any("setIssueFieldValue" in m for m in gh.mutations)
    assert {"type:epic", "type:task", "area:web"} <= gh.labels and "MVP" in gh.milestones


def test_second_push_makes_no_mutations(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    gh.mutations.clear()
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.created == [] and report.updated == []
    assert gh.mutations == []


def test_rename_updates_title_only(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    setup(tmp_path, title="Build DOCX export")
    tickets = load_tickets(tmp_path)  # keep the mapping written by the first push
    assert tickets["items"]["1.1.1"]["issue"] == 2
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.updated == ["1.1.1"]
    assert gh.issues[2]["title"] == "[1.1.1] Build DOCX export"


def test_drift_is_reported_not_overwritten(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    gh.issues[2]["body"] = "Edited on GitHub\n\n<!-- kickoff:1.1.1 -->\n"
    setup(tmp_path, title="Build DOCX export")
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.drift and report.drift[0].startswith("1.1.1 #2")
    assert gh.issues[2]["body"].startswith("Edited on GitHub")


def test_dry_run_changes_nothing(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    report = push(tmp_path, tracker(gh, tmp_path, dry=True), dry=True)
    assert report.created == ["E1", "1.1.1", "1.1.2"]
    assert gh.issues == {} and gh.mutations == []
    assert load_tickets(tmp_path)["items"] == {}


def test_existing_issue_found_by_key(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    gh.add(7, "[1.1.1] old title", "old\n\n<!-- kickoff:1.1.1 -->\n")
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert load_tickets(tmp_path)["items"]["1.1.1"]["issue"] == 7
    assert gh.issues[7]["title"] == "[1.1.1] Build export"


def test_link_then_push_reports_an_unadopted_issue(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    gh.add(9, "Hand-made issue without key", "hand-made body")
    link(tmp_path, "1.1.1", 9)
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.drift and report.drift[0].startswith("1.1.1 #9") and "--adopt" in report.drift[0]
    assert gh.issues[9]["body"] == "hand-made body" and gh.issues[9]["title"] == "Hand-made issue without key"


def test_adopt_takes_over_the_mapped_issue(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    gh.add(9, "Hand-made issue without key", "hand-made body")
    link(tmp_path, "1.1.1", 9)
    push(tmp_path, tracker(gh, tmp_path), dry=False, adopt=True)
    assert "<!-- kickoff:1.1.1 -->" in gh.issues[9]["body"]
    assert gh.issues[9]["title"] == "[1.1.1] Build export"


def test_title_edit_in_tracker_is_drift(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    gh.issues[2]["title"] = "Renamed on GitHub"
    setup(tmp_path, title="Build DOCX export")
    report = push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert report.drift and "title edited in the tracker" in report.drift[0]
    assert gh.issues[2]["title"] == "Renamed on GitHub"


def test_labels_and_milestones_are_created_once(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert any(m.startswith("label") for m in gh.mutations) and "milestone MVP" in gh.mutations
    gh.mutations.clear()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert gh.mutations == []


def test_links_removed_in_the_tracker_are_restored(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    gh.issues[3]["parent"] = None
    gh.issues[3]["blockedBy"] = {"nodes": [], "totalCount": 0}
    gh.mutations.clear()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    assert any("addSubIssue" in m for m in gh.mutations) and any("addBlockedBy" in m for m in gh.mutations)


def test_every_feature_map_epic_becomes_an_epic(tmp_path):
    from kickoff.model import load_features, load_plan, load_project
    from kickoff.schedule import build_schedule

    features = {**FEATURES, "epics": [*FEATURES["epics"], {"id": "E2", "name": "Later", "features": []}]}
    write_kickoff(tmp_path, project=project_dict(tracker=GH),
                  plan=plan_dict([pkg("1.1.1", effort=2, prio="P0", release="MVP", ticket=ticket("Build export"))]),
                  features=features)
    project, plan, feats = load_project(tmp_path), load_plan(tmp_path), load_features(tmp_path)
    keys = [s.key for s in plan_issues(project, plan, feats, build_schedule(project, plan))]
    assert keys == ["E1", "E2", "1.1.1"]


def test_pull_records_actuals_and_reports_moves(tmp_path):
    setup(tmp_path)
    gh = FakeGh()
    push(tmp_path, tracker(gh, tmp_path), dry=False)
    gh.issues[2].update(state="CLOSED", closedAt="2026-10-02T10:00:00Z", stateReason="COMPLETED")
    gh.status[3] = "In progress"
    lines = pull(tmp_path, tracker(gh, tmp_path), today=date(2026, 10, 5))
    actuals = load_tickets(tmp_path)["actuals"]
    assert actuals["1.1.1"] == {"done": date(2026, 10, 2)}
    assert actuals["1.1.2"] == {"started": date(2026, 10, 5)}
    assert any(line.startswith("1.1.1: planned end 2026-09-29 -> actual 2026-10-02") for line in lines)
