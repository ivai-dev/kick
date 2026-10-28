"""0.9.0: scheduling off, draft architecture before the sign-off, lighter gates."""

import copy
from datetime import date

import pytest
from helpers import PROJECT, STATE, pkg, plan_dict, project_dict, write_kickoff

from kickoff.cli import main
from kickoff.errors import KickoffError
from kickoff.hook import pre_write
from kickoff.model import Project, load_project
from kickoff.state import approve, init_project, next_step
from kickoff.validate import validate_root

DAY = date(2026, 10, 28)
ARCH = "docs/04-architecture/system-architecture.md"


@pytest.fixture(autouse=True)
def no_ecc(tmp_path, monkeypatch):
    monkeypatch.setenv("CLAUDE_CONFIG_DIR", str(tmp_path / "claude"))
    monkeypatch.delenv("KICKOFF_ECC_ROOT", raising=False)


def write(root, rel, content):
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def payload(root, rel, **tool_input):
    return {"cwd": str(root), "tool_input": {"file_path": str(root / rel), **tool_input}}


def project_from(extra):
    return Project.from_dict({**copy.deepcopy(PROJECT), **extra})


# ---------------------------------------------------------------- scheduling off
def test_scheduling_defaults_to_on_and_reads_a_bare_off():
    assert project_from({}).scheduling == "on"
    assert project_from({"scheduling": "off"}).scheduling == "off"
    assert project_from({"scheduling": False}).scheduling == "off"  # YAML reads a bare `off` as false
    assert project_from({"scheduling": True}).scheduling == "on"


def test_schedule_and_workbook_say_scheduling_is_off(tmp_path, capsys):
    root = write_kickoff(tmp_path, project=project_dict(scheduling="off"), plan=plan_dict([pkg("1.1.1")]))
    assert main(["--root", str(root), "schedule"]) == 0
    assert "scheduling is off" in capsys.readouterr().out
    assert main(["--root", str(root), "workbook"]) == 0
    assert "scheduling is off" in capsys.readouterr().out
    assert not list((root / "docs").rglob("*.xlsx"))


def test_scheduling_on_still_runs_the_scheduler(tmp_path, capsys):
    root = write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1")], gates=[{"id": "G1", "name": "Done", "at": "1.1.1"}]))
    assert main(["--root", str(root), "schedule"]) == 0
    assert "G1" in capsys.readouterr().out


def test_a_new_project_starts_with_scheduling_off_and_validates(tmp_path):
    init_project(tmp_path, "Demo", DAY)
    assert load_project(tmp_path).scheduling == "off"
    assert load_project(tmp_path).estimate_overhead == 0.1
    assert not [f for f in validate_root(tmp_path) if f.level == "error"]


# ---------------------------------------------------------------- draft architecture
def test_a_draft_may_be_written_before_the_sign_off(tmp_path):
    root = write_kickoff(tmp_path)
    draft = "# Architecture\n\n- **Updated:** 2026-10-28\n- **Status:** Draft (hypothesis)\n\n## Context\n"
    assert pre_write(payload(root, ARCH, content=draft)) == (0, "")
    assert pre_write(payload(root, "docs/04-architecture/data-model.md", content="Status: draft\n")) == (0, "")


def test_a_document_without_the_draft_label_is_still_refused(tmp_path):
    root = write_kickoff(tmp_path)
    code, message = pre_write(payload(root, ARCH, content="# Architecture\n\nAccepted design.\n"))
    assert code == 2 and "wait for C3 and C4" in message and "Status: Draft" in message


def test_the_label_must_be_in_the_first_lines(tmp_path):
    root = write_kickoff(tmp_path)
    late = "\n" * 25 + "- **Status:** Draft\n"
    assert pre_write(payload(root, ARCH, content=late))[0] == 2


def test_an_edit_is_judged_by_the_file_it_leaves(tmp_path):
    root = write_kickoff(tmp_path)
    write(root, ARCH, "# Architecture\n\n- **Status:** Draft (hypothesis)\n\n## Context\n\nold\n")
    keep = payload(root, ARCH, old_string="old", new_string="new")
    assert pre_write(keep) == (0, "")
    promote = payload(root, ARCH, old_string="- **Status:** Draft (hypothesis)", new_string="- **Status:** Accepted")
    assert pre_write(promote)[0] == 2


def test_a_multiedit_is_applied_in_order(tmp_path):
    root = write_kickoff(tmp_path)
    write(root, ARCH, "# A\n\nStatus: Draft\n\nbody\n")
    edits = [{"old_string": "body", "new_string": "text"}, {"old_string": "Status: Draft", "new_string": "Status: Final"}]
    assert pre_write(payload(root, ARCH, edits=edits))[0] == 2
    assert pre_write(payload(root, ARCH, edits=edits[:1])) == (0, "")


def test_an_edit_of_a_missing_file_is_refused(tmp_path):
    root = write_kickoff(tmp_path)
    assert pre_write(payload(root, ARCH, old_string="a", new_string="Status: Draft"))[0] == 2


def test_an_accepted_adr_before_c4_is_a_validate_error(tmp_path):
    root = write_kickoff(tmp_path)
    write(root, "docs/04-architecture/adr/ADR-001-store.md", "# ADR-001\n\n## Status\n\nAccepted — 2026-10-28\n")
    write(root, "docs/04-architecture/adr/ADR-002-queue.md", "# ADR-002\n\n## Status\n\nProposed — 2026-10-28\n")
    errors = [f for f in validate_root(root) if f.level == "error"]
    assert [f.where for f in errors] == ["docs/04-architecture/adr/ADR-001-store.md"]
    assert "before C3 and C4" in errors[0].message


def test_an_accepted_adr_is_fine_after_the_sign_off(tmp_path):
    gate = {"approved_by": "Customer", "date": DAY, "evidence": "docs/signoff.md"}
    state = copy.deepcopy(STATE)
    state["phases"] = {"init": "done", "discovery": "done", "feature-map": "done", "ux-design": "done",
                       "prototype": "done", "signoff": "done"}
    state["gates"] = {"C3": gate, "C4": gate}
    root = write_kickoff(tmp_path, state=state)
    write(root, "docs/04-architecture/adr/ADR-001-store.md", "# ADR-001\n\n- **Status:** Accepted\n")
    assert not [f for f in validate_root(root) if f.level == "error"]


# ---------------------------------------------------------------- lighter gates and status
def state_with(**phases):
    state = copy.deepcopy(STATE)
    state["phases"] = phases
    return state


@pytest.mark.parametrize(("gate", "done"), [("C1", "discovery"), ("C2", "feature-map"), ("C5", "solution"),
                                            ("C6", "plan")])
def test_the_leads_gates_need_no_evidence(gate, done):
    state = state_with(**{done: "done"})
    if gate == "C6":
        state["gates"]["C5"] = {"approved_by": "Project lead", "date": DAY, "evidence": "x"}
    approve(state, gate, "Project lead", "", DAY)
    assert state["gates"][gate]["evidence"] == "decision in session 2026-10-28"


@pytest.mark.parametrize(("gate", "done"), [("CD", "design-concept"), ("C3", "signoff"), ("C4", "signoff")])
def test_the_customers_gates_still_need_evidence(gate, done):
    state = state_with(**{done: "done"})
    if gate == "C4":
        state["gates"]["C3"] = {"approved_by": "Customer", "date": DAY, "evidence": "x"}
    with pytest.raises(KickoffError, match="without evidence"):
        approve(state, gate, "Customer", "  ", DAY)


def test_the_cli_approves_a_lead_gate_without_evidence(tmp_path, capsys):
    root = write_kickoff(tmp_path, state=state_with(init="done", discovery="done"))
    assert main(["--root", str(root), "gate", "approve", "C1", "--by", "Project lead"]) == 0
    assert main(["--root", str(root), "gate", "approve", "C2", "--by", "Project lead"]) == 2
    assert "phase feature-map is not done" in capsys.readouterr().err


def test_status_names_every_phase_in_progress():
    state = state_with(init="done", discovery="done", research="in_progress", **{"feature-map": "in_progress"})
    state["gates"]["C1"] = {"approved_by": "Project lead", "date": DAY, "evidence": "x"}
    assert next_step(state) == "continue kickoff:research and kickoff:feature-map"
    state["phases"]["ux-design"] = "in_progress"
    assert next_step(state) == "continue kickoff:research, kickoff:feature-map and kickoff:ux-design"


# ---------------------------------------------------------------- review fixes
def test_accepted_adrs_stay_valid_while_a_reopened_sign_off_waits(tmp_path):
    state = state_with(init="done", discovery="done", signoff="in_progress", solution="done")
    state["stale"] = ["solution"]  # C3 was reopened by a change request: its gates are gone
    root = write_kickoff(tmp_path, state=state)
    write(root, "docs/04-architecture/adr/ADR-001-store.md", "# ADR-001\n\n## Status\n\nAccepted — 2026-10-01\n")
    assert not [f for f in validate_root(root) if f.level == "error"]


def test_a_draft_label_survives_a_byte_order_mark(tmp_path):
    root = write_kickoff(tmp_path)
    assert pre_write(payload(root, ARCH, content="﻿# A\n\n- **Status:** Draft\n")) == (0, "")


def test_the_estimate_rows_add_up_after_rounding(tmp_path):
    from kickoff.estimate import estimate
    from kickoff.model import Features, Plan

    project = project_from({"estimate": {"overhead": 0.1}})
    est = estimate(project, Plan.from_dict(plan_dict([pkg("1.1.1", effort=336.75)])), Features([]))
    assert est["total"]["likely"] == round(est["work"]["likely"] + est["overhead"]["likely"], 2)


def test_status_survives_a_malformed_register(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    (root / ".kickoff" / "clarity.yaml").write_text("schema_version: 1\nareas: [{id: X}]\n", encoding="utf-8")
    assert main(["--root", str(root), "status"]) == 0
    captured = capsys.readouterr()
    assert "Phases:" in captured.out and "clarity.yaml" in captured.err


def test_a_repeated_ref_is_stored_once():
    from kickoff.clarity import default_clarity, set_area

    data = default_clarity(DAY)
    set_area(data, "scope", None, None, None, ["Q1", "Q1", "D2"], DAY)
    set_area(data, "scope", None, None, None, ["D2"], DAY)
    assert next(a for a in data["areas"] if a["id"] == "scope")["refs"] == ["Q1", "D2"]
