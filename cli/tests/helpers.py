"""Builders for small in-memory projects used across the test suite."""

from __future__ import annotations

import copy
from pathlib import Path

from kickoff.model import KICKOFF_DIR, Plan, Project, write_yaml

PROJECT = {
    "schema_version": 1,
    "name": "Demo",
    "languages": {"repo": "en", "chat": "en", "workbook": "en", "ui": "en"},
    "docs_root": "docs",
    "calendar": {"weekend": ["sat", "sun"], "holidays": []},
    "roles": [
        {"id": "lead", "name": "Project lead", "focus": 1.0},
        {"id": "dev", "name": "Developer", "focus": 1.0},
        {"id": "qa", "name": "QA", "focus": 1.0},
    ],
    "releases": ["MVP", "R2"],
    "tracker": {"kind": "none"},
}
PLAN = {
    "schema_version": 1,
    "start": "2026-09-28",
    "phases": [{"code": "1", "name": "Build"}],
    "groups": [{"code": "1.1", "name": "Core"}],
    "packages": [],
    "gates": [],
}
FEATURES = {"schema_version": 1, "epics": []}
STATE = {"schema_version": 1, "phases": {}, "gates": {}, "stale": []}


def pkg(code: str, role: str = "dev", effort: float = 1, **kw) -> dict:
    return {"code": code, "name": f"Package {code}", "role": role, "effort": effort, **kw}


def project_dict(**overrides) -> dict:
    d = copy.deepcopy(PROJECT)
    d.update(overrides)
    return d


def plan_dict(packages: list[dict], **overrides) -> dict:
    d = copy.deepcopy(PLAN)
    d["packages"] = packages
    d.update(overrides)
    return d


def project(**overrides) -> Project:
    return Project.from_dict(project_dict(**overrides))


def plan(packages: list[dict], **overrides) -> Plan:
    return Plan.from_dict(plan_dict(packages, **overrides))


def write_kickoff(root: Path, project=None, plan=None, features=None, state=None, tickets=None) -> Path:
    k = root / KICKOFF_DIR
    write_yaml(k / "project.yaml", project or copy.deepcopy(PROJECT))
    write_yaml(k / "plan.yaml", plan or copy.deepcopy(PLAN))
    write_yaml(k / "features.yaml", features or copy.deepcopy(FEATURES))
    write_yaml(k / "state.yaml", state or copy.deepcopy(STATE))
    if tickets is not None:
        write_yaml(k / "tickets.yaml", tickets)
    return root
