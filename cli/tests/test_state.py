from datetime import date

import pytest

from kick.cli import main
from kick.errors import KickError
from kick.model import find_root, load_state, read_yaml
from kick.state import approve, blockers, migrate, next_step, reopen, set_phase, status_lines


def fresh():
    return {"schema_version": 1, "phases": {}, "gates": {}, "stale": []}


def test_solution_blocked_until_signoff_gates():
    s = fresh()
    assert blockers(s, "solution") == ["phase signoff is not done", "gate C3 (Customer signed off the full feature set) is not approved",
                                       "gate C4 (MVP locked) is not approved"]
    set_phase(s, "signoff", "done")
    approve(s, "C3", "Customer", "docs/01-discovery/signoff-2026-10-01.md", date(2026, 10, 1))
    approve(s, "C4", "Customer and project lead", "docs/01-discovery/signoff-2026-10-01.md", date(2026, 10, 1))
    assert blockers(s, "solution") == []


def test_plan_draft_vs_baseline():
    s = fresh()
    set_phase(s, "feature-map", "done")
    approve(s, "C2", "Project lead", "commit abc123", date(2026, 9, 26))
    assert blockers(s, "plan") == []
    assert "gate C5 (Solution approved) is not approved" in blockers(s, "plan", baseline=True)


def test_approve_needs_phase_and_evidence():
    s = fresh()
    with pytest.raises(KickError, match="phase discovery is not done"):
        approve(s, "C1", "Project lead", "link", date(2026, 9, 25))
    set_phase(s, "discovery", "done")
    with pytest.raises(KickError, match="--by"):
        approve(s, "C1", " ", "link", date(2026, 9, 25))
    set_phase(s, "signoff", "done")
    with pytest.raises(KickError, match="evidence"):  # a customer gate; the lead's own gates need none (0.9)
        approve(s, "C3", "Customer", " ", date(2026, 9, 25))


def test_reopen_c3_marks_later_phases_stale():
    s = fresh()
    for p in ("signoff", "solution", "plan"):
        set_phase(s, p, "done")
    approve(s, "C3", "Customer", "x", date(2026, 10, 1))
    approve(s, "C4", "Customer", "x", date(2026, 10, 1))
    assert reopen(s, "C3", "FB session 2026-10-08") == ["solution", "plan"]
    assert "C3" not in s["gates"] and "C4" not in s["gates"]
    assert s["phases"]["signoff"] == "in_progress"
    assert next_step(s) == "continue kickoff:signoff; then re-run stale: solution, plan"
    assert blockers(s, "solution") == ["phase signoff is not done",
                                       "gate C3 (Customer signed off the full feature set) is not approved",
                                       "gate C4 (MVP locked) is not approved"]
    set_phase(s, "signoff", "done")
    approve(s, "C3", "Customer", "x", date(2026, 10, 9))
    approve(s, "C4", "Customer", "x", date(2026, 10, 9))
    assert next_step(s) == "re-run kickoff:solution (stale after reopening a gate); then plan"
    set_phase(s, "solution", "done")
    assert s["stale"] == ["plan"]


def test_the_phase_being_re_run_is_not_listed_as_a_later_stale_one():
    s = fresh()
    for p in ("discovery", "research", "feature-map", "plan"):
        set_phase(s, p, "done")
    reopen(s, "C1", "new scope")
    set_phase(s, "discovery", "done")
    set_phase(s, "research", "in_progress")  # started again while still stale
    assert s["stale"] == ["research", "feature-map", "plan"]
    assert next_step(s) == "continue kickoff:research; then re-run stale: feature-map, plan"


def test_the_design_concept_comes_before_ux_design():
    s = fresh()
    for p in ("init", "discovery", "research", "feature-map"):
        set_phase(s, p, "done")
    for g in ("C1", "C2"):
        approve(s, g, "Project lead", "x", date(2026, 10, 1))
    assert next_step(s) == "run kickoff:design-concept"
    assert blockers(s, "ux-design") == ["phase design-concept is not done",
                                        "gate CD (Customer chose the design concept) is not approved"]
    set_phase(s, "design-concept", "done")
    assert next_step(s).startswith("approve gate CD (Customer chose the design concept)")
    approve(s, "CD", "Customer", "docs/05-design/codesign-2026-10-27.md", date(2026, 10, 27))
    assert blockers(s, "ux-design") == [] and next_step(s) == "run kickoff:ux-design"
    assert reopen(s, "CD", "customer wants another structure") == []
    assert s["phases"]["design-concept"] == "in_progress"


def test_a_prototype_needs_ux_design_and_nothing_else():
    s = fresh()
    for p in ("init", "discovery", "research", "feature-map", "design-concept", "ux-design"):
        set_phase(s, p, "done")
    for g in ("C1", "C2", "CD"):
        approve(s, g, "Project lead", "x", date(2026, 10, 1))
    assert blockers(s, "prototype") == [] and next_step(s) == "run kickoff:prototype"
    assert blockers(fresh(), "prototype") == ["phase ux-design is not done"]


def test_a_prototype_started_before_0_7_does_not_need_the_design_concept():
    s = fresh()
    for p in ("init", "discovery", "research", "feature-map", "ux-design"):
        set_phase(s, p, "done")
    for g in ("C1", "C2"):
        approve(s, g, "Project lead", "x", date(2026, 10, 1))
    set_phase(s, "prototype", "in_progress")  # a 0.6 project in the middle of its prototype
    assert blockers(s, "prototype") == [] and blockers(s, "signoff") == ["phase prototype is not done"]
    lines = "\n".join(status_lines(s))
    assert "skipped (prototype started before 0.7.0)" in lines
    assert "not needed (prototype started before 0.7.0)" in lines
    assert next_step(s) == "continue kickoff:prototype"


def raw_state(phases, gates=(), stale=()):
    ok = {"approved_by": "Lead", "date": date(2026, 10, 1), "evidence": "x"}
    return {"schema_version": 1, "phases": dict(phases), "gates": {g: ok for g in gates}, "stale": list(stale)}


def test_a_0_7_state_moves_to_the_design_concept():
    done = {p: "done" for p in ("init", "discovery", "research", "feature-map", "ux-design", "fe-foundation")}
    s = migrate(raw_state({**done, "design-direction": "in_progress"}, ("C1", "C2", "CF"), ["fe-foundation"]))
    assert s["phases"].get("design-concept") == "in_progress"
    assert "design-direction" not in s["phases"] and "fe-foundation" not in s["phases"]
    assert set(s["gates"]) == {"C1", "C2"} and s["stale"] == []
    assert migrate(s) == s  # applying it again changes nothing


def test_ux_design_finished_before_the_concept_is_run_again_after_it():
    done = {p: "done" for p in ("init", "discovery", "research", "feature-map", "ux-design")}
    s = migrate(raw_state({**done, "fe-foundation": "in_progress"}, ("C1", "C2")))
    assert s["stale"] == ["ux-design"]
    assert next_step(s) == "run kickoff:design-concept"
    set_phase(s, "design-concept", "done")
    approve(s, "CD", "Customer", "x", date(2026, 10, 27))
    assert next_step(s) == "re-run kickoff:ux-design (stale after reopening a gate)"


def test_a_part_done_ux_design_starts_again_after_the_concept():
    s = migrate(raw_state({"init": "done", "discovery": "done", "research": "done", "feature-map": "done",
                           "ux-design": "in_progress"}, ("C1", "C2")))
    assert "ux-design" not in s["phases"] and any("ux-design reset" in h for h in s["history"])
    assert next_step(s) == "run kickoff:design-concept"


def test_a_project_past_the_concept_is_not_migrated_back():
    done = {p: "done" for p in ("init", "discovery", "research", "feature-map", "ux-design", "prototype")}
    s = migrate(raw_state(done, ("C1", "C2")))
    assert s["stale"] == [] and "design-concept" not in s["phases"]


def test_phase_start_refuses_a_blocked_phase(tmp_path, capsys):
    root = tmp_path
    assert main(["--root", str(root), "init", "--name", "Library Loans"]) == 0
    state = load_state(root)
    state["phases"] = {p: "done" for p in ("init", "discovery", "feature-map")}
    state["gates"] = {g: {"approved_by": "Lead", "date": date(2026, 10, 1), "evidence": "x"} for g in ("C1", "C2")}
    from kick.model import write_yaml
    write_yaml(root / ".kickoff" / "state.yaml", state)
    assert main(["--root", str(root), "phase", "start", "ux-design"]) == 2
    assert "cannot start ux-design: phase design-concept is not done" in capsys.readouterr().err
    assert "ux-design" not in load_state(root)["phases"]  # no pass through a skipped gate
    assert main(["--root", str(root), "phase", "done", "ux-design"]) == 2
    assert "cannot finish ux-design: phase design-concept is not done" in capsys.readouterr().err
    assert "ux-design" not in load_state(root)["phases"]
    assert main(["--root", str(root), "phase", "start", "design-concept"]) == 0


def test_stale_prerequisite_blocks_the_next_phase():
    s = fresh()
    for p in ("init", "discovery", "feature-map", "plan"):
        set_phase(s, p, "done")
    approve(s, "C1", "Project lead", "x", date(2026, 9, 25))
    approve(s, "C2", "Project lead", "x", date(2026, 9, 26))
    s["stale"] = ["feature-map", "plan"]
    assert blockers(s, "design-concept") == ["phase feature-map is stale: re-run it first"]
    assert blockers(s, "feature-map") == []  # the stale phase itself may be re-run


def test_the_last_step_hands_the_wbs_over():
    s = fresh()
    for p in ("init", "discovery", "research", "feature-map", "design-concept", "ux-design",
              "prototype", "signoff", "solution", "plan"):
        set_phase(s, p, "done")
    for g in ("C1", "C2", "CD", "C3", "C4", "C5", "C6"):
        approve(s, g, "Project lead", "x", date(2026, 10, 1))
    assert next_step(s).startswith("done: plan baselined;") and "kickoff export" in next_step(s)
    s["phases"]["tickets"] = "done"  # a state.yaml from before 0.6 keeps loading and is ignored
    assert "tickets" not in "\n".join(status_lines(s))


def test_c6_needs_c5():
    s = fresh()
    set_phase(s, "plan", "done")
    with pytest.raises(KickError, match="gate C5 is not approved"):
        approve(s, "C6", "Project lead", "x", date(2026, 10, 1))
    assert "approve gate C6" not in next_step(s)


def test_rerunning_a_stale_phase_reopens_its_gate():
    s = fresh()
    for p in ("signoff", "solution"):
        set_phase(s, p, "done")
    for g in ("C3", "C4", "C5"):
        approve(s, g, "Lead", "x", date(2026, 10, 1))
    reopen(s, "C3", "FB")
    set_phase(s, "signoff", "done")
    approve(s, "C3", "Customer", "x", date(2026, 10, 9))
    approve(s, "C4", "Customer", "x", date(2026, 10, 9))
    assert "C5" in s["gates"]
    set_phase(s, "solution", "done")
    assert "C5" not in s["gates"] and s["stale"] == []


def test_next_step_walks_the_flow():
    s = fresh()
    assert next_step(s) == "run kickoff:init"
    set_phase(s, "init", "done")
    assert next_step(s) == "run kickoff:discovery"
    set_phase(s, "discovery", "done")
    assert next_step(s) == "approve gate C1 (Vision approved): kickoff gate approve C1 --by <who> [--evidence <link>]"


@pytest.mark.parametrize("name", ["2026", "yes", "A: B", "Library Loans"])
def test_init_keeps_awkward_names(tmp_path, name):
    assert main(["--root", str(tmp_path), "init", "--name", name]) == 0
    assert read_yaml(tmp_path / ".kickoff" / "project.yaml")["name"] == name


def test_cli_init_and_status(tmp_path, capsys):
    assert main(["--root", str(tmp_path), "init", "--name", "Library Loans"]) == 0
    assert (tmp_path / ".kickoff" / "project.yaml").exists()
    assert read_yaml(tmp_path / ".kickoff" / "project.yaml")["name"] == "Library Loans"
    assert (tmp_path / "docs" / "04-architecture" / "adr").is_dir()
    assert load_state(tmp_path)["phases"] == {"init": "in_progress"}
    assert main(["--root", str(tmp_path), "init", "--name", "Again"]) == 2
    capsys.readouterr()
    assert main(["--root", str(tmp_path), "status"]) == 0
    assert "init             in_progress" in capsys.readouterr().out
    assert main(["--root", str(tmp_path), "can", "solution"]) == 1
    assert main(["--root", str(tmp_path), "phase", "done", "init"]) == 0
    assert main(["--root", str(tmp_path), "validate"]) == 0


def test_init_inside_another_project_needs_nested(tmp_path, capsys):
    assert main(["--root", str(tmp_path), "init", "--name", "Platform"]) == 0
    child = tmp_path / "apps" / "minute"
    child.mkdir(parents=True)
    assert main(["--root", str(child), "init", "--name", "Minute"]) == 2
    assert "--nested" in capsys.readouterr().err
    assert not (child / ".kickoff").exists()
    assert main(["--root", str(child), "init", "--name", "Minute", "--nested"]) == 0
    assert read_yaml(child / ".kickoff" / "project.yaml")["name"] == "Minute"
    assert read_yaml(tmp_path / ".kickoff" / "project.yaml")["name"] == "Platform"
    assert find_root(child) == child.resolve()
    assert find_root(tmp_path / "apps") == tmp_path.resolve()
