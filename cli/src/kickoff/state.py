"""Phases, approval gates and stale markers in .kickoff/state.yaml."""

from __future__ import annotations

from datetime import date
from importlib.resources import files
from pathlib import Path

import yaml

from .errors import KickoffError
from .model import KICKOFF_DIR, write_yaml

PHASES = ["init", "discovery", "research", "feature-map", "ux-design", "fe-foundation", "design-direction",
          "prototype", "signoff", "solution", "plan"]
GATES = {"C1": "Vision approved", "C2": "Draft scope approved", "CF": "Frontend foundation approved",
         "CD": "Customer approved the design direction",
         "C3": "Customer signed off the full feature set",
         "C4": "MVP locked", "C5": "Solution approved", "C6": "Plan baselined"}
GATE_AFTER = {"C1": "discovery", "C2": "feature-map", "CF": "fe-foundation", "CD": "design-direction",
              "C3": "signoff", "C4": "signoff", "C5": "solution", "C6": "plan"}
REQUIRES: dict[str, tuple[list[str], list[str]]] = {
    "init": ([], []),
    "discovery": (["init"], []),
    "research": (["discovery"], ["C1"]),
    "feature-map": (["discovery"], ["C1"]),
    "ux-design": (["feature-map"], ["C2"]),
    "fe-foundation": (["ux-design"], ["C2"]),
    "design-direction": (["fe-foundation"], ["CF"]),
    "prototype": (["design-direction"], ["CD"]),
    "signoff": (["prototype"], []),
    "feedback": (["prototype"], []),
    "solution": (["signoff"], ["C3", "C4"]),
    "plan": (["feature-map"], ["C2"]),
    "plan-baseline": (["solution"], ["C5"]),
}
GATE_NEEDS = {"C4": ["C3"], "C6": ["C5"]}
DOC_DIRS = ["01-discovery", "02-requirements", "03-research", "04-architecture/adr", "05-design", "06-planning",
            "07-task-specs", "08-task-plans"]


# A phase added in a later release, for projects that were past it when it arrived:
# phase -> (its gate, the release, phases that show the project is past it, and whether "started" is enough)
LEGACY = {
    "fe-foundation": ("CF", "0.5.0", "prototype built", False),
    "design-direction": ("CD", "0.7.0", "prototype started", True),
}


def legacy(state: dict, phase: str) -> bool:
    """True when `phase` never ran because the project was past it before the release that added it: the phase and
    its gate count as satisfied, so the project is not sent back to them."""
    if phase not in LEGACY or phase in state["phases"]:
        return False
    started = LEGACY[phase][3]
    proto = state["phases"].get("prototype")
    return (proto is not None if started else proto == "done") or any(
        state["phases"].get(p) == "done" for p in ("signoff", "solution"))


def legacy_note(phase: str) -> str:
    _, release, what, _ = LEGACY[phase]
    return f"{what} before {release}"


def _legacy_gate(state: dict, gate: str) -> bool:
    return any(g == gate and legacy(state, p) for p, (g, *_rest) in LEGACY.items())


def _done(state: dict, phase: str) -> bool:
    return state["phases"].get(phase) == "done" or legacy(state, phase)


def _gate_ok(state: dict, gate: str) -> bool:
    return gate in state["gates"] or _legacy_gate(state, gate)


def blockers(state: dict, phase: str, baseline: bool = False) -> list[str]:
    key = "plan-baseline" if phase == "plan" and baseline else phase
    if key not in REQUIRES:
        raise KickoffError(f"unknown phase {phase}; phases: {', '.join(PHASES)}, feedback")
    phases, gates = REQUIRES[key]
    out = [f"phase {p} is not done" for p in phases if not _done(state, p)]
    out += [f"phase {p} is stale: re-run it first" for p in phases if _done(state, p) and p in state["stale"]]
    out += [f"gate {g} ({GATES[g]}) is not approved" for g in gates if not _gate_ok(state, g)]
    return out


def set_phase(state: dict, phase: str, status: str) -> None:
    if phase not in PHASES:
        raise KickoffError(f"unknown phase {phase}")
    state["phases"][phase] = status
    if status == "done" and phase in state["stale"]:
        state["stale"].remove(phase)
        for gate, after in GATE_AFTER.items():  # a re-run phase must be approved again
            if after == phase:
                state["gates"].pop(gate, None)


def approve(state: dict, gate: str, by: str, evidence: str, day: date) -> None:
    if gate not in GATES:
        raise KickoffError(f"unknown gate {gate}")
    if not _done(state, GATE_AFTER[gate]):
        raise KickoffError(f"cannot approve {gate}: phase {GATE_AFTER[gate]} is not done")
    if GATE_AFTER[gate] in state["stale"]:
        raise KickoffError(f"cannot approve {gate}: phase {GATE_AFTER[gate]} is stale, re-run it first")
    if not by.strip():
        raise KickoffError(f"cannot approve {gate} without --by (who approved it)")
    if not evidence.strip():
        raise KickoffError(f"cannot approve {gate} without evidence (a link to the record or commit)")
    missing = [g for g in GATE_NEEDS.get(gate, []) if g not in state["gates"]]
    if missing:
        raise KickoffError(f"cannot approve {gate}: gate {', '.join(missing)} is not approved")
    state["gates"][gate] = {"approved_by": by.strip(), "date": day, "evidence": evidence.strip()}
    state.setdefault("history", []).append(f"{day.isoformat()} approve {gate} by {by.strip()}: {evidence.strip()}")


def reopen(state: dict, gate: str, reason: str) -> list[str]:
    if gate not in GATES:
        raise KickoffError(f"unknown gate {gate}")
    phase = GATE_AFTER[gate]
    for g, p in GATE_AFTER.items():
        if p == phase:
            state["gates"].pop(g, None)
    state["phases"][phase] = "in_progress"
    later = PHASES[PHASES.index(phase) + 1:]
    stale = [p for p in later if state["phases"].get(p) == "done"]
    for p in stale:
        if p not in state["stale"]:
            state["stale"].append(p)
    state["stale"].sort(key=PHASES.index)
    state.setdefault("history", []).append(f"reopen {gate}: {reason}")
    return stale


def next_step(state: dict) -> str:
    stale = state["stale"]
    in_progress = [p for p in PHASES if state["phases"].get(p) == "in_progress"]
    if in_progress:
        later = [p for p in stale if p != in_progress[0]]  # the phase being continued is not "then re-run"
        tail = f"; then re-run stale: {', '.join(later)}" if later else ""
        return f"continue kickoff:{in_progress[0]}{tail}"
    for gate, phase in GATE_AFTER.items():
        ready = all(g in state["gates"] for g in GATE_NEEDS.get(gate, []))
        if _done(state, phase) and phase not in stale and not _gate_ok(state, gate) and ready:
            return (f"approve gate {gate} ({GATES[gate]}): kickoff gate approve {gate} --by <who> "
                    "--evidence <link>")
    for phase in stale:
        if not blockers(state, phase):
            rest = [p for p in stale if p != phase]
            tail = f"; then {', '.join(rest)}" if rest else ""
            return f"re-run kickoff:{phase} (stale after reopening a gate){tail}"
    for phase in PHASES:
        if not _done(state, phase) and not blockers(state, phase):
            return f"run kickoff:{phase}"
    return ("done: plan baselined; run kickoff:feedback when customer feedback arrives; "
            "kickoff export hands the WBS over")


def status_lines(state: dict) -> list[str]:
    lines = ["Phases:"]
    for p in PHASES:
        mark = state["phases"].get(p, "—")
        if legacy(state, p):
            mark = f"skipped ({legacy_note(p)})"
        stale = "  (stale)" if p in state["stale"] else ""
        lines.append(f"  {p:<16} {mark}{stale}")
    lines.append("Gates:")
    for g, desc in GATES.items():
        a = state["gates"].get(g)
        state_ = (f"approved {a['date']} by {a['approved_by']}" if a
                  else f"not needed ({legacy_note(GATE_AFTER[g])})" if _legacy_gate(state, g) else "open")
        lines.append(f"  {g}  {desc:<42} " + state_)
    lines.append(f"Next: {next_step(state)}")
    return lines


def init_project(root: Path, name: str, today: date) -> list[Path]:
    k = root / KICKOFF_DIR
    if k.exists():
        raise KickoffError(f"{k} already exists")
    written = []
    data = yaml.safe_load(files("kickoff.templates").joinpath("project.yaml").read_text(encoding="utf-8"))
    data["name"] = name
    k.mkdir(parents=True)
    write_yaml(k / "project.yaml", data)
    written.append(k / "project.yaml")
    files_ = {
        "state.yaml": {"schema_version": 1, "phases": {"init": "in_progress"}, "gates": {}, "stale": []},
        "features.yaml": {"schema_version": 1, "epics": []},
        "plan.yaml": {"schema_version": 1, "start": today, "phases": [], "groups": [], "packages": [], "gates": []},
    }
    for fname, data in files_.items():
        write_yaml(k / fname, data)
        written.append(k / fname)
    for d in DOC_DIRS:
        path = root / "docs" / d
        path.mkdir(parents=True, exist_ok=True)
        keep = path / ".gitkeep"
        keep.touch()
        written.append(keep)
    return written
