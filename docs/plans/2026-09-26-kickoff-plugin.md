# Kickoff Plugin Implementation Plan

> **For agentic workers:** Execute this plan task by task, in order. Steps use checkbox (`- [ ]`) syntax for tracking. Run each task's verification commands and read their real output before moving on. No plugin other than the tools in the tech stack is needed.

**Goal:** Ship v0.1.0 of the `kickoff` Claude Code plugin: twelve phase skills with approval gates, a tested Python CLI (validate, schedule, workbook, docs, tickets, status, proto), a no-build prototype kit, two examples and CI.

**Architecture:** Skills carry the judgement work and call the CLI for everything that must be exactly right. The CLI reads `.kickoff/*.yaml` (validated by JSON Schema) into typed objects, computes the role-based schedule, and generates the workbook, Markdown documents and tracker issues. The prototype kit is plain JavaScript (Preact + htm from a CDN) that each project extends with its own screen modules; the CLI checks it with a headless browser.

**Tech Stack:** Python 3.11+ (pyyaml, openpyxl, jsonschema; pytest, ruff), `uv`, `gh` CLI, Docker (LibreOffice recalculation, optional), Node 22+ (`node --test` for the kit), Preact 10.24.3 + htm 3.1.1, Edge or Chrome headless.

**Spec:** `docs/specs/2026-09-26-kickoff-plugin-design.md`

## Global Constraints

- Repository: `C:\Users\hienl\Workspace\ivai\kickoff-plugin` (GitHub `ivai-dev/kickoff-plugin`, private). Work on branch `feat/v0.1.0`; open one PR to `main` at the end. Never push to `main` directly.
- Everything in the repository is in English, except Vietnamese content inside `examples/ai-minute/` (its workbook language is `vi`) and the `vi` label tables.
- Python `>=3.11`. Runtime dependencies are exactly `pyyaml>=6.0`, `openpyxl>=3.1`, `jsonschema>=4.20`. Dev dependencies: `pytest>=8`, `ruff>=0.6`. No other dependency without asking the human.
- Kit: no build step. Scripts only from `https://cdn.jsdelivr.net/npm/preact@10.24.3/dist/preact.umd.js`, `https://cdn.jsdelivr.net/npm/preact@10.24.3/hooks/dist/hooks.umd.js`, `https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js`; fonts only from Google Fonts. `index.html` follows the Artifact page contract: no `<!doctype>`, `<html>`, `<head>` or `<body>` tags; a `<title>` in the first 8 KB; `table{color:inherit}`; `charset="utf-8"` on every script tag.
- All YAML is read with `yaml.safe_load` and written with `kickoff.model.write_yaml` (quotes strings that would read back as numbers or dates, e.g. WBS code `"1.2"`). WBS codes are always strings.
- Files are written UTF-8 with LF line endings (`.gitattributes`: `* text=auto eol=lf`). Subprocess calls pass `encoding="utf-8"`.
- Tests run offline, except tests marked `@pytest.mark.browser` (need Edge/Chrome and the CDN) and `@pytest.mark.docker` (need Docker); both skip automatically when the tool is missing.
- Generated documents, ticket bodies and templates never mention AI assistance, and name roles, never people or assistants, as owners.
- Commits: Conventional Commits, one per task (fix rounds may add more), with no `Co-Authored-By` trailer.
- Run CLI tests from `cli/`: `cd cli && uv run pytest -q`. Lint: `cd cli && uv run ruff check .`.
- The AI Minute example is committed data, not generated code: `examples/ai-minute/.kickoff/*.yaml` and the golden schedule `examples/ai-minute/expected/schedule.json` (205 codes). Nothing in the repository reads from outside the repository except the prototype the kit is extracted from, `C:\Users\hienl\Workspace\ivai\ai-minute\docs\05-design\prototype\` (read only, Task 10).

## File Structure

| Path | Responsibility | Task |
| --- | --- | --- |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Plugin and marketplace manifests | 1 |
| `.gitattributes`, `.gitignore`, `.github/workflows/ci.yml` | Repo hygiene, CI | 1, 15 |
| `cli/pyproject.toml` | CLI package definition | 1 |
| `cli/src/kickoff/__init__.py`, `errors.py`, `cli.py` | Version, error types, argparse entry point | 1 (cli.py grows in 3–11) |
| `cli/src/kickoff/schemas/*.schema.json`, `schemas/__init__.py` | JSON Schemas and `schema_errors()` | 2 |
| `cli/src/kickoff/model.py` | YAML I/O, dataclasses, loaders, `text()` i18n helper | 2 |
| `cli/src/kickoff/calendar.py` | Working-day arithmetic | 3 |
| `cli/src/kickoff/schedule.py` | Role-based scheduler, JSON export, slip report | 3 |
| `cli/src/kickoff/validate.py` | Cross-file consistency checks | 4 |
| `examples/ai-minute/.kickoff/*.yaml`, `examples/ai-minute/expected/schedule.json`, `cli/tests/test_golden_ai_minute.py` | Committed example data (before Task 1) and the golden schedule test | 5 |
| `cli/src/kickoff/docs.py` | Markdown generation (feature map, WBS, risks, plan tables) | 6 |
| `cli/src/kickoff/labels.py`, `cli/src/kickoff/workbook.py`, `cli/src/kickoff/lo_verify.py`, `cli/src/kickoff/docker/lo-calc/Dockerfile` | Estimate workbook labels and generator, LibreOffice verification (the Dockerfile ships inside the package) | 7 |
| `cli/src/kickoff/tracker.py`, `cli/src/kickoff/tickets.py` | Tracker adapter (GitHub via `gh`), issue planning, push/pull/link | 8 |
| `cli/src/kickoff/state.py`, `cli/src/kickoff/templates/*` | Phases, gates, stale markers, `init` skeleton | 9 |
| `cli/src/kickoff/kit/prototype/**` | Prototype kit core | 10 |
| `examples/mini/**` | Small example project with a working prototype | 10 |
| `cli/src/kickoff/proto.py` | `proto new`, `proto check`, `proto lint` | 11 |
| `skills/<name>/SKILL.md`, `skills/<name>/templates/*`, `skills/using-kickoff/references/{methods,conventions,lessons}.md` | The twelve skills and the shared working methods | 12–14 |
| `commands/kickoff.md`, `commands/kickoff-sync.md` | Slash commands | 14 |
| `README.md`, `skills/*/tests/*.md` | User docs, skill pressure scenarios | 15 |

## Execution notes

- Execute tasks in order, one at a time. A fresh subagent per task is optional; either way, run each task's verification commands and review the result before starting the next task.
- Suggested models: Tasks 1, 4, 6, 9 — standard; Tasks 2, 3, 5, 7, 8, 11 — standard (full code in the plan); Task 10 (kit extraction) — most capable; Tasks 12–14 (skills) — most capable; Task 15 — standard. Final whole-branch review — most capable.
- Task 5 is the regression anchor: after it, every later task must keep `tests/test_golden_ai_minute.py` green.

---

### Task 1: Scaffold the plugin and the CLI package

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.gitattributes`, `.gitignore`, `.github/workflows/ci.yml`
- Create: `cli/pyproject.toml`, `cli/src/kickoff/__init__.py`, `cli/src/kickoff/errors.py`, `cli/src/kickoff/cli.py`
- Test: `cli/tests/test_cli.py`, `cli/tests/test_manifest.py`

**Interfaces:**
- Produces: `kickoff.__version__ = "0.1.0"`; `kickoff.errors.KickoffError(Exception)`; `kickoff.cli.main(argv: list[str] | None = None) -> int`; `kickoff.cli.COMMANDS: list[module]` where each command module exposes `register(sub: argparse._SubParsersAction) -> None` and sets `func=run` via `set_defaults`, `run(args) -> int`.

- [ ] **Step 1: Switch to the branch**

```bash
cd /c/Users/hienl/Workspace/ivai/kickoff-plugin && git checkout feat/v0.1.0
```

The branch already holds the preparation commit (`docs/specs/`, `docs/plans/`, and the AI Minute example data in `examples/ai-minute/` with its `.kickoff/` and `expected/` folders). Run `git status --short`: it must be clean. Files that are not part of this work (for example `projects/`) are excluded locally through `.git/info/exclude`; add any other such file there before the first `git add -A`.

- [ ] **Step 2: Write the manifests and repo files**

`.claude-plugin/plugin.json`:

```json
{
  "name": "kickoff",
  "description": "Project kickoff workflow with approval gates: discovery, research, feature map, UX design, full-product prototype, customer sign-off, solution design, plan/WBS/estimate workbook and tracker sync.",
  "version": "0.1.0",
  "author": { "name": "ivai-dev" },
  "repository": "https://github.com/ivai-dev/kickoff-plugin",
  "license": "UNLICENSED",
  "keywords": ["project-management", "kickoff", "prototype", "wbs", "estimate", "github-projects"]
}
```

`.claude-plugin/marketplace.json`:

```json
{
  "name": "kickoff",
  "owner": { "name": "ivai-dev" },
  "metadata": { "description": "Project kickoff workflow plugin", "version": "0.1.0" },
  "plugins": [
    {
      "name": "kickoff",
      "source": "./",
      "description": "Project kickoff workflow with approval gates, a full-product prototype kit, a role-based estimate workbook and tracker sync.",
      "version": "0.1.0",
      "strict": true
    }
  ]
}
```

`.gitattributes`:

```
* text=auto eol=lf
*.xlsx binary
*.png binary
```

`.gitignore`:

```
__pycache__/
*.egg-info/
.venv/
.pytest_cache/
.ruff_cache/
shots/
dist/
build/
```

- [ ] **Step 3: Write `cli/pyproject.toml`**

```toml
[project]
name = "kickoff"
version = "0.1.0"
description = "CLI for the kickoff Claude Code plugin"
requires-python = ">=3.11"
dependencies = ["pyyaml>=6.0", "openpyxl>=3.1", "jsonschema>=4.20"]

[project.scripts]
kickoff = "kickoff.cli:main"

[dependency-groups]
dev = ["pytest>=8", "ruff>=0.6"]

[build-system]
requires = ["hatchling>=1.24"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/kickoff"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "docker: needs Docker",
    "browser: needs Edge or Chrome and network access to the CDN",
    "github: needs a sandbox GitHub repository (env KICKOFF_SANDBOX=org/repo#project)",
]

[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "B", "UP"]
ignore = ["E501"]  # long literals in generators and tests; the formatter owns line length
```

- [ ] **Step 4: Write the failing tests**

`cli/tests/test_cli.py`:

```python
import pytest

from kickoff.cli import main


def test_version(capsys):
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    assert "kickoff 0.1.0" in capsys.readouterr().out


def test_no_command_prints_help(capsys):
    assert main([]) == 0
    assert "usage: kickoff" in capsys.readouterr().out
```

`cli/tests/test_manifest.py`:

```python
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
```

- [ ] **Step 5: Run to verify they fail**

Run: `cd cli && uv run pytest -q`
Expected: FAIL — the package cannot be built or imported yet (`src/kickoff` does not exist).

- [ ] **Step 6: Write the package**

`cli/src/kickoff/__init__.py`:

```python
"""kickoff: CLI for the kickoff Claude Code plugin."""

__version__ = "0.1.0"
```

`cli/src/kickoff/errors.py`:

```python
"""Error types. Every expected failure is a KickoffError so the CLI can print it without a traceback."""


class KickoffError(Exception):
    """A user-facing error: bad input, a missing file, a failed external tool."""
```

`cli/src/kickoff/cli.py`:

```python
"""Command-line entry point: `kickoff <command>`."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .errors import KickoffError

# Command modules, each with register(subparsers) and run(args) -> int. Later tasks append here.
COMMANDS: list = []


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="kickoff", description="Project kickoff toolkit")
    parser.add_argument("--version", action="version", version=f"kickoff {__version__}")
    parser.add_argument("--root", type=Path, default=None, help="project root (default: nearest folder with .kickoff/)")
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    for module in COMMANDS:
        module.register(sub)
    return parser


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    try:
        return args.func(args)
    except KickoffError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
```

- [ ] **Step 7: Write CI (lint and tests only; Task 15 extends it)**

`.github/workflows/ci.yml`:

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  cli:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python: ["3.11", "3.13"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: ${{ matrix.python }}
      - run: uv run ruff check .
        working-directory: cli
      - run: uv run pytest -q
        working-directory: cli
```

- [ ] **Step 8: Run tests and lint**

Run: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: `3 passed`; ruff `All checks passed!`

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: scaffold plugin manifests and kickoff CLI package"
```

---

### Task 2: Data model, JSON Schemas and YAML I/O

**Files:**
- Create: `cli/src/kickoff/schemas/__init__.py`, `cli/src/kickoff/schemas/{project,features,plan,state,tickets}.schema.json`
- Create: `cli/src/kickoff/model.py`
- Test: `cli/tests/helpers.py`, `cli/tests/conftest.py`, `cli/tests/test_model.py`

**Interfaces:**
- Consumes: `KickoffError` (Task 1).
- Produces (exact names later tasks use):
  - `kickoff.schemas.schema_errors(kind: str, data) -> list[str]` for kind in `project|features|plan|state|tickets`.
  - `kickoff.model`: `KICKOFF_DIR = ".kickoff"`, `ModelError(KickoffError)`, `find_root(start: Path) -> Path`, `resolve_root(root: Path | None) -> Path`, `read_yaml(path) -> Any`, `write_yaml(path, data) -> None`, `load_raw(root, kind) -> dict`, `to_date(v) -> date`, `code_key(code: str) -> tuple[int, ...]`, `text(item: dict, key: str, lang: str | None = None) -> str`.
  - Dataclasses `Role(id, name, focus, duties, i18n)`, `Release(id, name)`, `Project(...)`, `Package(...)` with property `mode`, `Plan(...)` with `by_code()`, `Feature(...)`, `Epic(...)`, `Features(epics)` with `all()`, `by_id()`, `epic(eid)`.
  - Loaders `load_project(root)`, `load_plan(root)`, `load_features(root)`, `load_state(root) -> dict`, `load_tickets(root) -> dict`.
  - `Project.role_title(role_id, lang) -> str`.

- [ ] **Step 1: Write the test helpers**

`cli/tests/helpers.py`:

```python
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
```

`cli/tests/conftest.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
```

- [ ] **Step 2: Write the failing tests**

`cli/tests/test_model.py`:

```python
from datetime import date

import pytest
from helpers import FEATURES, PLAN, pkg, plan_dict, write_kickoff

from kickoff.model import (
    ModelError,
    find_root,
    load_features,
    load_plan,
    load_project,
    load_tickets,
    read_yaml,
    text,
    write_yaml,
)


def test_load_minimal_project(tmp_path):
    write_kickoff(tmp_path)
    p = load_project(tmp_path)
    assert p.name == "Demo"
    assert p.weekend == (5, 6)
    assert p.roles["dev"].focus == 1.0
    assert [r.id for r in p.releases] == ["MVP", "R2"]
    assert p.date_format == "%d/%m/%Y"


def test_missing_file_is_a_model_error(tmp_path):
    (tmp_path / ".kickoff").mkdir()
    with pytest.raises(ModelError, match="missing file"):
        load_project(tmp_path)


def test_unquoted_code_fails_schema(tmp_path):
    write_kickoff(tmp_path)
    path = tmp_path / ".kickoff" / "plan.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace('code: "1.1"', "code: 1.1"), encoding="utf-8")
    with pytest.raises(ModelError, match="is not of type 'string'"):
        load_plan(tmp_path)


def test_write_yaml_quotes_numeric_looking_strings(tmp_path):
    path = tmp_path / "x.yaml"
    write_yaml(path, {"code": "1.2", "plain": "abc", "when": date(2026, 9, 28), "multi": "a\nb"})
    raw = path.read_text(encoding="utf-8")
    assert 'code: "1.2"' in raw
    assert "plain: abc" in raw
    assert "when: 2026-09-28" in raw
    assert read_yaml(path) == {"code": "1.2", "plain": "abc", "when": date(2026, 9, 28), "multi": "a\nb"}


def test_schedule_modes_parse(tmp_path):
    packages = [
        pkg("1.1.1", schedule={"fixed": ["2026-09-24", "2026-09-25"]}),
        pkg("1.1.2"),
        pkg("1.1.3", schedule={"span": ["1.1.1", "1.1.2"]}, effort_rate=0.2),
        pkg("1.1.4", schedule={"period": {"after": "1.1.2", "months": 12}}),
        pkg("1.1.5", schedule={"tail": {"of": "1.1.4", "days": 5}}),
    ]
    write_kickoff(tmp_path, plan=plan_dict(packages))
    by = load_plan(tmp_path).by_code()
    assert by["1.1.1"].schedule == ("fixed", date(2026, 9, 24), date(2026, 9, 25))
    assert by["1.1.2"].mode == "seq"
    assert by["1.1.3"].schedule == ("span", "1.1.1", "1.1.2")
    assert by["1.1.3"].effort_rate == 0.2
    assert by["1.1.4"].schedule == ("period", "1.1.2", 12)
    assert by["1.1.5"].schedule == ("tail", "1.1.4", 5)


def test_find_root_walks_up(tmp_path):
    write_kickoff(tmp_path)
    deep = tmp_path / "a" / "b"
    deep.mkdir(parents=True)
    assert find_root(deep) == tmp_path.resolve()


def test_find_root_without_kickoff(tmp_path):
    with pytest.raises(ModelError, match="kickoff:init"):
        find_root(tmp_path)


def test_features_and_text_i18n(tmp_path):
    features = {
        "schema_version": 1,
        "epics": [
            {
                "id": "E1",
                "name": "Minutes",
                "i18n": {"vi": {"name": "Biên bản"}},
                "features": [{"id": "F1.1", "name": "Draft", "release": "MVP", "prio": "P0", "wbs": ["1.1.1"]}],
            }
        ],
    }
    write_kickoff(tmp_path, features=features)
    f = load_features(tmp_path)
    assert f.by_id()["F1.1"].epic == "E1"
    assert f.epic("E1").name == "Minutes"
    assert text({"name": "Minutes", "i18n": {"vi": {"name": "Biên bản"}}}, "name", "vi") == "Biên bản"
    assert text({"name": "Minutes"}, "name", "vi") == "Minutes"


def test_tickets_default_when_absent(tmp_path):
    write_kickoff(tmp_path)
    assert load_tickets(tmp_path) == {"schema_version": 1, "items": {}, "actuals": {}}


def test_empty_plan_and_features_are_valid(tmp_path):
    write_kickoff(tmp_path, plan=PLAN, features=FEATURES)
    assert load_plan(tmp_path).packages == []
```

- [ ] **Step 3: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_model.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'kickoff.model'`.

- [ ] **Step 4: Write the schemas**

`cli/src/kickoff/schemas/__init__.py`:

```python
"""JSON Schemas for the .kickoff/*.yaml files."""

from __future__ import annotations

import json
from datetime import date
from functools import cache
from importlib.resources import files
from typing import Any

from jsonschema import Draft202012Validator

KINDS = ("project", "features", "plan", "state", "tickets")


def _jsonable(value: Any) -> Any:
    """YAML gives date objects; the schemas describe them as ISO strings."""
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k) if isinstance(k, date) else k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value


@cache
def _validator(kind: str) -> Draft202012Validator:
    schema = json.loads(files("kickoff.schemas").joinpath(f"{kind}.schema.json").read_text(encoding="utf-8"))
    return Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)


def schema_errors(kind: str, data: Any) -> list[str]:
    if kind not in KINDS:
        raise ValueError(f"unknown kind {kind}")
    errors = sorted(_validator(kind).iter_errors(_jsonable(data)), key=lambda e: [str(p) for p in e.absolute_path])
    return [f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}" for e in errors]
```

`cli/src/kickoff/schemas/project.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "kickoff project.yaml",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "name", "languages", "calendar", "roles", "releases", "tracker"],
  "$defs": {
    "date": { "type": "string", "format": "date" },
    "i18n": { "type": "object", "additionalProperties": { "type": "object", "additionalProperties": { "type": "string" } } }
  },
  "properties": {
    "schema_version": { "const": 1 },
    "name": { "type": "string", "minLength": 1 },
    "languages": {
      "type": "object",
      "additionalProperties": false,
      "required": ["repo", "chat", "workbook", "ui"],
      "properties": {
        "repo": { "enum": ["en", "vi"] },
        "chat": { "type": "string" },
        "workbook": { "enum": ["en", "vi"] },
        "ui": { "type": "string" }
      }
    },
    "docs_root": { "type": "string" },
    "date_format": { "type": "string" },
    "calendar": {
      "type": "object",
      "additionalProperties": false,
      "required": ["weekend", "holidays"],
      "properties": {
        "weekend": { "type": "array", "items": { "enum": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] }, "uniqueItems": true },
        "holidays": {
          "type": "array",
          "items": {
            "oneOf": [
              { "$ref": "#/$defs/date" },
              {
                "type": "object",
                "additionalProperties": false,
                "required": ["date"],
                "properties": { "date": { "$ref": "#/$defs/date" }, "name": { "type": "string" }, "kind": { "type": "string" } }
              }
            ]
          }
        }
      }
    },
    "roles": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "name", "focus"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z][a-z0-9]*$" },
          "name": { "type": "string" },
          "focus": { "type": "number", "exclusiveMinimum": 0, "maximum": 1 },
          "duties": { "type": "string" },
          "i18n": { "$ref": "#/$defs/i18n" }
        }
      }
    },
    "releases": {
      "type": "array",
      "minItems": 1,
      "items": {
        "oneOf": [
          { "type": "string" },
          {
            "type": "object",
            "additionalProperties": false,
            "required": ["id"],
            "properties": { "id": { "type": "string" }, "name": { "type": "string" } }
          }
        ]
      }
    },
    "hard_dates": { "type": "object", "additionalProperties": { "$ref": "#/$defs/date" } },
    "tracker": {
      "type": "object",
      "required": ["kind"],
      "properties": {
        "kind": { "enum": ["github", "none"] },
        "org": { "type": "string" },
        "repo": { "type": "string" },
        "project": { "type": "integer" },
        "assignee": { "type": "string" },
        "milestone": { "type": "string" },
        "priority": {
          "type": "object",
          "properties": { "source": { "enum": ["org-field", "none"] }, "map": { "type": "object", "additionalProperties": { "type": "string" } } }
        },
        "issue_fields": { "type": "object" },
        "blob_base": { "type": "string" }
      },
      "if": { "properties": { "kind": { "const": "github" } } },
      "then": { "required": ["org", "repo", "project", "assignee"] }
    },
    "rules": {
      "type": "object",
      "properties": {
        "owners_by_role": { "type": "boolean" },
        "synthetic_data_only": { "type": "boolean" },
        "forbidden_phrases": { "type": "array", "items": { "type": "string" } }
      }
    },
    "security": { "type": "array", "items": { "type": "string" } },
    "proto": {
      "type": "object",
      "properties": {
        "dir": { "type": "string" },
        "ux_spec": { "type": "string" },
        "browser": { "type": "string" },
        "forbidden": { "type": "array", "items": { "type": "string" } },
        "max_font_sizes": { "type": "integer" },
        "max_weight_600": { "type": "integer" },
        "max_inline_styles": { "type": "integer" }
      }
    }
  }
}
```

`cli/src/kickoff/schemas/plan.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "kickoff plan.yaml",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "start", "phases", "groups", "packages", "gates"],
  "$defs": {
    "date": { "type": "string", "format": "date" },
    "code": { "type": "string", "pattern": "^[0-9]+(\\.[0-9]+)*$" },
    "i18n": { "type": "object", "additionalProperties": { "type": "object", "additionalProperties": { "type": "string" } } },
    "node": {
      "type": "object",
      "required": ["code", "name"],
      "properties": { "code": { "$ref": "#/$defs/code" }, "name": { "type": "string" }, "i18n": { "$ref": "#/$defs/i18n" } }
    },
    "schedule": {
      "oneOf": [
        { "const": "seq" },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["fixed"],
          "properties": { "fixed": { "type": "array", "prefixItems": [{ "$ref": "#/$defs/date" }, { "$ref": "#/$defs/date" }], "minItems": 2, "maxItems": 2 } }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["span"],
          "properties": { "span": { "type": "array", "items": { "$ref": "#/$defs/code" }, "minItems": 2, "maxItems": 2 } }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["period"],
          "properties": {
            "period": {
              "type": "object",
              "additionalProperties": false,
              "required": ["after", "months"],
              "properties": { "after": { "$ref": "#/$defs/code" }, "months": { "type": "integer", "minimum": 1 } }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["tail"],
          "properties": {
            "tail": {
              "type": "object",
              "additionalProperties": false,
              "required": ["of", "days"],
              "properties": { "of": { "$ref": "#/$defs/code" }, "days": { "type": "integer", "minimum": 1 } }
            }
          }
        }
      ]
    },
    "ticket": {
      "type": "object",
      "additionalProperties": false,
      "required": ["title", "type", "epic"],
      "properties": {
        "title": { "type": "string" },
        "type": { "enum": ["story", "task", "bug", "spike"] },
        "epic": { "type": "string", "pattern": "^E[0-9]+$" },
        "areas": { "type": "array", "items": { "type": "string" } },
        "desc": { "type": "string" },
        "ac": { "type": "array", "items": { "type": "string" } },
        "sprint": { "type": "string" },
        "status": { "type": "string" },
        "milestone": { "type": "string" }
      }
    },
    "package": {
      "type": "object",
      "additionalProperties": false,
      "required": ["code", "name", "role", "effort"],
      "properties": {
        "code": { "$ref": "#/$defs/code" },
        "name": { "type": "string" },
        "desc": { "type": "string" },
        "ref": { "type": "string" },
        "role": { "type": "string" },
        "effort": { "type": "number", "minimum": 0 },
        "done": { "type": "number", "minimum": 0, "maximum": 1 },
        "prio": { "enum": ["P0", "P1", "P2"] },
        "deps": { "type": "array", "items": { "$ref": "#/$defs/code" } },
        "coop": { "type": "string" },
        "note": { "type": "string" },
        "release": { "type": "string" },
        "status": { "enum": ["todo", "wip", "done"] },
        "schedule": { "$ref": "#/$defs/schedule" },
        "effort_rate": { "type": ["number", "null"], "exclusiveMinimum": 0 },
        "ticket": { "$ref": "#/$defs/ticket" },
        "i18n": { "$ref": "#/$defs/i18n" }
      }
    }
  },
  "properties": {
    "schema_version": { "const": 1 },
    "start": { "$ref": "#/$defs/date" },
    "phases": { "type": "array", "items": { "$ref": "#/$defs/node" } },
    "groups": { "type": "array", "items": { "$ref": "#/$defs/node" } },
    "packages": { "type": "array", "items": { "$ref": "#/$defs/package" } },
    "order_after": { "type": "object", "additionalProperties": { "$ref": "#/$defs/code" } },
    "gates": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "at"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "at": { "$ref": "#/$defs/code" },
          "hard": { "type": "boolean" },
          "i18n": { "$ref": "#/$defs/i18n" }
        }
      }
    },
    "sprints": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "start", "days"],
        "properties": { "name": { "type": "string" }, "start": { "$ref": "#/$defs/date" }, "days": { "type": "integer", "minimum": 1 } }
      }
    },
    "cut_order": { "type": "array", "items": { "type": "string" } },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "p", "i"],
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "p": { "type": "integer", "minimum": 1, "maximum": 5 },
          "i": { "type": "integer", "minimum": 1, "maximum": 5 },
          "i18n": { "$ref": "#/$defs/i18n" }
        }
      }
    },
    "assumptions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text"],
        "properties": { "id": { "type": "string" }, "text": { "type": "string" }, "i18n": { "$ref": "#/$defs/i18n" } }
      }
    }
  }
}
```

`cli/src/kickoff/schemas/features.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "kickoff features.yaml",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "epics"],
  "$defs": {
    "i18n": { "type": "object", "additionalProperties": { "type": "object", "additionalProperties": { "type": "string" } } }
  },
  "properties": {
    "schema_version": { "const": 1 },
    "epics": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "string", "pattern": "^E[0-9]+$" },
          "name": { "type": "string" },
          "goal": { "type": "string" },
          "release": { "type": "string" },
          "areas": { "type": "array", "items": { "type": "string" } },
          "i18n": { "$ref": "#/$defs/i18n" },
          "features": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["id", "name", "release", "prio"],
              "properties": {
                "id": { "type": "string", "pattern": "^F[0-9]+\\.[0-9]+$" },
                "name": { "type": "string" },
                "release": { "type": "string" },
                "prio": { "enum": ["P0", "P1", "P2"] },
                "platforms": { "type": "string" },
                "screens": { "type": "array", "items": { "type": "string" } },
                "wbs": { "type": "array", "items": { "type": "string", "pattern": "^[0-9]+(\\.[0-9]+)*$" } },
                "status": { "enum": ["active", "removed"] },
                "removed_by": { "type": "string" },
                "i18n": { "$ref": "#/$defs/i18n" }
              }
            }
          }
        }
      }
    }
  }
}
```

`cli/src/kickoff/schemas/state.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "kickoff state.yaml",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "phases", "gates", "stale"],
  "$defs": {
    "phase": { "enum": ["init", "discovery", "research", "feature-map", "ux-design", "prototype", "signoff", "solution", "plan", "tickets"] }
  },
  "properties": {
    "schema_version": { "const": 1 },
    "phases": {
      "type": "object",
      "propertyNames": { "$ref": "#/$defs/phase" },
      "additionalProperties": { "enum": ["in_progress", "done"] }
    },
    "gates": {
      "type": "object",
      "propertyNames": { "enum": ["C1", "C2", "C3", "C4", "C5", "C6"] },
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["approved_by", "date", "evidence"],
        "properties": {
          "approved_by": { "type": "string", "minLength": 1 },
          "date": { "type": "string", "format": "date" },
          "evidence": { "type": "string", "minLength": 1 }
        }
      }
    },
    "stale": { "type": "array", "items": { "$ref": "#/$defs/phase" }, "uniqueItems": true },
    "history": { "type": "array", "items": { "type": "string" } },
    "prototype": {
      "type": "object",
      "properties": { "artifact": { "type": "string" }, "version": { "type": "integer" } }
    }
  }
}
```

`cli/src/kickoff/schemas/tickets.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "kickoff tickets.yaml",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "items", "actuals"],
  "properties": {
    "schema_version": { "const": 1 },
    "tracker_cache": { "type": "object" },
    "items": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["issue"],
        "properties": {
          "issue": { "type": "integer" },
          "type": { "type": "string" },
          "parent": { "type": ["string", "null"] },
          "synced": { "type": "string" },
          "body_hash": { "type": "string" },
          "fields_hash": { "type": "string" },
          "parent_set": { "type": ["string", "null"] },
          "blocked_set": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "actuals": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "properties": { "started": { "type": "string", "format": "date" }, "done": { "type": "string", "format": "date" } }
      }
    }
  }
}
```

- [ ] **Step 5: Write `model.py`**

`cli/src/kickoff/model.py`:

```python
"""Typed access to the .kickoff/*.yaml files."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

import yaml

from .errors import KickoffError
from .schemas import schema_errors

KICKOFF_DIR = ".kickoff"
WEEKDAY = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


class ModelError(KickoffError):
    """A .kickoff file is missing, unreadable or fails its schema."""


# ---------------------------------------------------------------- paths and YAML
def find_root(start: Path) -> Path:
    start = start.resolve()
    for p in (start, *start.parents):
        if (p / KICKOFF_DIR).is_dir():
            return p
    raise ModelError(f"no {KICKOFF_DIR}/ folder in {start} or any parent; run the kickoff:init skill first")


def resolve_root(root: Path | None) -> Path:
    return find_root(root or Path.cwd())


def read_yaml(path: Path) -> Any:
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ModelError(f"missing file: {path}") from exc
    try:
        return yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        raise ModelError(f"{path}: invalid YAML: {exc}") from exc


class _Dumper(yaml.SafeDumper):
    pass


def _represent_str(dumper: yaml.SafeDumper, s: str) -> yaml.ScalarNode:
    try:
        plain = yaml.safe_load(s) == s
    except yaml.YAMLError:
        plain = False
    if "\n" in s:
        style = "|"
    elif plain and s and s.strip() == s:
        style = None
    else:
        style = '"'
    return dumper.represent_scalar("tag:yaml.org,2002:str", s, style=style)


_Dumper.add_representer(str, _represent_str)


def write_yaml(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = yaml.dump(data, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=120)
    path.write_text(out, encoding="utf-8", newline="\n")


def load_raw(root: Path, kind: str) -> dict:
    data = read_yaml(root / KICKOFF_DIR / f"{kind}.yaml")
    errors = schema_errors(kind, data)
    if errors:
        raise ModelError(f"{kind}.yaml: " + "; ".join(errors[:10]))
    return data


# ---------------------------------------------------------------- small helpers
def to_date(value: Any) -> date:
    return value if isinstance(value, date) else date.fromisoformat(str(value))


def code_key(code: str) -> tuple[int, ...]:
    return tuple(int(x) for x in code.split("."))


def text(item: dict, key: str, lang: str | None = None) -> str:
    """item[key], or its translation item['i18n'][lang][key] when one exists."""
    if lang:
        tr = (item.get("i18n") or {}).get(lang) or {}
        if tr.get(key):
            return tr[key]
    return item.get(key) or ""


# ---------------------------------------------------------------- project
@dataclass(frozen=True)
class Role:
    id: str
    name: str
    focus: float
    duties: str = ""
    i18n: dict = field(default_factory=dict)


@dataclass(frozen=True)
class Release:
    id: str
    name: str


@dataclass
class Project:
    name: str
    languages: dict[str, str]
    docs_root: str
    weekend: tuple[int, ...]
    holidays: dict[date, dict]
    roles: dict[str, Role]
    releases: list[Release]
    hard_dates: dict[str, date]
    tracker: dict[str, Any]
    rules: dict[str, Any]
    security: list[str]
    proto: dict[str, Any]
    date_format: str

    @classmethod
    def from_dict(cls, d: dict) -> Project:
        holidays: dict[date, dict] = {}
        for h in d["calendar"]["holidays"]:
            h = h if isinstance(h, dict) else {"date": h}
            holidays[to_date(h["date"])] = {"name": h.get("name", ""), "kind": h.get("kind", "")}
        roles = {
            r["id"]: Role(r["id"], r["name"], float(r["focus"]), r.get("duties", ""), r.get("i18n") or {})
            for r in d["roles"]
        }
        releases = [
            Release(r, r) if isinstance(r, str) else Release(r["id"], r.get("name", r["id"])) for r in d["releases"]
        ]
        return cls(
            name=d["name"],
            languages=d["languages"],
            docs_root=d.get("docs_root", "docs"),
            weekend=tuple(WEEKDAY[w] for w in d["calendar"]["weekend"]),
            holidays=holidays,
            roles=roles,
            releases=releases,
            hard_dates={k: to_date(v) for k, v in (d.get("hard_dates") or {}).items()},
            tracker=d["tracker"],
            rules=d.get("rules") or {},
            security=d.get("security") or [],
            proto=d.get("proto") or {},
            date_format=d.get("date_format", "%d/%m/%Y"),
        )

    def role_title(self, role_id: str, lang: str | None = None) -> str:
        role = self.roles[role_id]
        return text({"name": role.name, "i18n": role.i18n}, "name", lang)


# ---------------------------------------------------------------- plan
def parse_schedule(value: Any) -> tuple:
    if value in (None, "seq"):
        return ("seq",)
    ((mode, arg),) = value.items()
    if mode == "fixed":
        return ("fixed", to_date(arg[0]), to_date(arg[1]))
    if mode == "span":
        return ("span", str(arg[0]), str(arg[1]))
    if mode == "period":
        return ("period", str(arg["after"]), int(arg["months"]))
    if mode == "tail":
        return ("tail", str(arg["of"]), int(arg["days"]))
    raise ModelError(f"unknown schedule mode {mode}")


@dataclass
class Package:
    code: str
    name: str
    role: str
    effort: float
    done: float = 0.0
    prio: str = "P1"
    deps: tuple[str, ...] = ()
    desc: str = ""
    ref: str = ""
    coop: str = ""
    note: str = ""
    release: str | None = None
    status: str = "todo"
    schedule: tuple = ("seq",)
    effort_rate: float | None = None
    ticket: dict | None = None
    i18n: dict = field(default_factory=dict)

    @property
    def mode(self) -> str:
        return self.schedule[0]

    @classmethod
    def from_dict(cls, d: dict) -> Package:
        return cls(
            code=d["code"],
            name=d["name"],
            role=d["role"],
            effort=float(d["effort"]),
            done=float(d.get("done", 0.0)),
            prio=d.get("prio", "P1"),
            deps=tuple(d.get("deps") or ()),
            desc=d.get("desc", ""),
            ref=d.get("ref", ""),
            coop=d.get("coop", ""),
            note=d.get("note", ""),
            release=d.get("release"),
            status=d.get("status", "todo"),
            schedule=parse_schedule(d.get("schedule")),
            effort_rate=d.get("effort_rate"),
            ticket=d.get("ticket"),
            i18n=d.get("i18n") or {},
        )

    def as_item(self) -> dict:
        """The fields text() understands (name, desc and their translations)."""
        return {"name": self.name, "desc": self.desc, "i18n": self.i18n}


@dataclass
class Plan:
    start: date
    phases: list[dict]
    groups: list[dict]
    packages: list[Package]
    order_after: dict[str, str]
    gates: list[dict]
    sprints: list[dict]
    cut_order: list[str]
    risks: list[dict]
    assumptions: list[dict]

    @classmethod
    def from_dict(cls, d: dict) -> Plan:
        return cls(
            start=to_date(d["start"]),
            phases=list(d.get("phases") or []),
            groups=list(d.get("groups") or []),
            packages=[Package.from_dict(p) for p in d.get("packages") or []],
            order_after={str(k): str(v) for k, v in (d.get("order_after") or {}).items()},
            gates=list(d.get("gates") or []),
            sprints=list(d.get("sprints") or []),
            cut_order=list(d.get("cut_order") or []),
            risks=list(d.get("risks") or []),
            assumptions=list(d.get("assumptions") or []),
        )

    def by_code(self) -> dict[str, Package]:
        return {p.code: p for p in self.packages}


# ---------------------------------------------------------------- features
@dataclass
class Feature:
    id: str
    epic: str
    name: str
    release: str
    prio: str
    platforms: str = ""
    screens: tuple[str, ...] = ()
    wbs: tuple[str, ...] = ()
    status: str = "active"
    removed_by: str = ""
    i18n: dict = field(default_factory=dict)


@dataclass
class Epic:
    id: str
    name: str
    goal: str = ""
    release: str | None = None
    areas: tuple[str, ...] = ()
    features: list[Feature] = field(default_factory=list)
    i18n: dict = field(default_factory=dict)


@dataclass
class Features:
    epics: list[Epic]

    @classmethod
    def from_dict(cls, d: dict) -> Features:
        epics = []
        for e in d.get("epics") or []:
            feats = [
                Feature(
                    id=f["id"],
                    epic=e["id"],
                    name=f["name"],
                    release=f["release"],
                    prio=f["prio"],
                    platforms=f.get("platforms", ""),
                    screens=tuple(f.get("screens") or ()),
                    wbs=tuple(f.get("wbs") or ()),
                    status=f.get("status", "active"),
                    removed_by=f.get("removed_by", ""),
                    i18n=f.get("i18n") or {},
                )
                for f in e.get("features") or []
            ]
            epics.append(
                Epic(e["id"], e["name"], e.get("goal", ""), e.get("release"), tuple(e.get("areas") or ()), feats,
                     e.get("i18n") or {})
            )
        return cls(epics)

    def all(self) -> list[Feature]:
        return [f for e in self.epics for f in e.features]

    def by_id(self) -> dict[str, Feature]:
        return {f.id: f for f in self.all()}

    def epic(self, eid: str) -> Epic:
        for e in self.epics:
            if e.id == eid:
                return e
        raise ModelError(f"unknown epic {eid}")


# ---------------------------------------------------------------- loaders
def load_project(root: Path) -> Project:
    return Project.from_dict(load_raw(root, "project"))


def load_plan(root: Path) -> Plan:
    return Plan.from_dict(load_raw(root, "plan"))


def load_features(root: Path) -> Features:
    return Features.from_dict(load_raw(root, "features"))


def load_state(root: Path) -> dict:
    return load_raw(root, "state")


def load_tickets(root: Path) -> dict:
    if not (root / KICKOFF_DIR / "tickets.yaml").exists():
        return {"schema_version": 1, "items": {}, "actuals": {}}
    return load_raw(root, "tickets")
```

- [ ] **Step 6: Run the tests**

Run: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: all pass, ruff clean.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(cli): data model, JSON schemas and YAML I/O"
```

---

### Task 3: Working-day calendar and role-based scheduler

**Files:**
- Create: `cli/src/kickoff/calendar.py`, `cli/src/kickoff/schedule.py`, `cli/src/kickoff/commands/__init__.py`, `cli/src/kickoff/commands/schedule_cmd.py`
- Modify: `cli/src/kickoff/cli.py` (register the command)
- Test: `cli/tests/test_calendar.py`, `cli/tests/test_schedule.py`

**Interfaces:**
- Consumes: `Project`, `Plan`, `Package`, `Features`, `to_date`, `code_key`, `resolve_root`, `load_*` (Task 2).
- Produces:
  - `kickoff.calendar.WorkCalendar(weekend: Iterable[int], holidays: Iterable[date])` with `is_workday(d) -> bool`, `workday(d, n) -> date` (Excel WORKDAY; `n == 0` returns `d`), `networkdays(a, b) -> int`; `edate_minus1(d, months) -> date`.
  - `kickoff.schedule`: `CycleError(KickoffError)` with `.cycle: list[str]`; `Slot(start, end, workdays, effort)`; `Schedule(slots)` with `gate_dates(plan) -> dict[str, date]`; `round_half_up(x) -> int`; `calendar_for(project) -> WorkCalendar`; `role_queues(plan) -> dict[str, list[str]]`; `build_schedule(project, plan, actuals: dict | None = None, baseline: bool = False) -> Schedule` (`baseline=True` ignores `done` and actuals: the estimate workbook's model); `schedule_json(project, plan, sched) -> dict[str, list]`; `slip_report(project, plan, features, sched) -> list[str]`; `actuals_of(tickets: dict) -> dict`.
  - CLI: `kickoff schedule [--json PATH]` — exit 0, or 3 when a hard date slips.

- [ ] **Step 1: Write the failing calendar tests**

`cli/tests/test_calendar.py`:

```python
from datetime import date

from kickoff.calendar import WorkCalendar, edate_minus1

CAL = WorkCalendar((5, 6), [date(2027, 1, 1)])


def test_workday_skips_weekend():
    assert CAL.workday(date(2026, 10, 2), 1) == date(2026, 10, 5)


def test_workday_skips_holiday():
    assert CAL.workday(date(2026, 12, 31), 1) == date(2027, 1, 4)


def test_workday_backwards_and_zero():
    assert CAL.workday(date(2026, 10, 5), -1) == date(2026, 10, 2)
    assert CAL.workday(date(2026, 10, 3), 0) == date(2026, 10, 3)


def test_networkdays():
    assert CAL.networkdays(date(2026, 9, 28), date(2026, 10, 9)) == 10
    assert CAL.networkdays(date(2026, 10, 9), date(2026, 9, 28)) == 0


def test_edate_minus1():
    assert edate_minus1(date(2027, 6, 3), 12) == date(2028, 6, 2)
    assert edate_minus1(date(2027, 1, 31), 1) == date(2027, 2, 27)
```

- [ ] **Step 2: Write the failing scheduler tests**

`cli/tests/test_schedule.py`:

```python
from datetime import date

import pytest
from helpers import pkg, plan, project

from kickoff.schedule import CycleError, build_schedule, role_queues, slip_report

D = date


def dates(sched, code):
    s = sched.slots[code]
    return s.start, s.end


def test_same_role_runs_back_to_back():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 29))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 10, 2))


def test_focus_and_half_up_rounding():
    pr = project(roles=[{"id": "dev", "name": "Dev", "focus": 0.8}])
    s = build_schedule(pr, plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=1)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 30))  # 2 / 0.8 = 2.5 -> 3 days
    assert dates(s, "1.1.2") == (D(2026, 10, 1), D(2026, 10, 1))  # 1.25 -> 1 day


def test_done_fraction_shortens_duration():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=4, done=0.5)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 29))


def test_cross_role_dependency():
    s = build_schedule(project(), plan([pkg("1.1.1", effort=2), pkg("1.1.2", role="qa", deps=["1.1.1"])]))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 9, 30))


def test_holiday_is_skipped():
    pr = project(calendar={"weekend": ["sat", "sun"], "holidays": ["2026-09-29"]})
    s = build_schedule(pr, plan([pkg("1.1.1", effort=2)]))
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 9, 30))


def test_order_after_moves_within_role():
    p = plan([pkg("1.1.1"), pkg("1.1.2"), pkg("1.1.3")], order_after={"1.1.3": "1.1.1"})
    assert role_queues(p)["dev"] == ["1.1.1", "1.1.3", "1.1.2"]
    s = build_schedule(project(), p)
    assert dates(s, "1.1.3") == (D(2026, 9, 29), D(2026, 9, 29))
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 9, 30))


def test_dependency_cycle_is_reported():
    p = plan([pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2", role="qa", deps=["1.1.1"])])
    with pytest.raises(CycleError) as exc:
        build_schedule(project(), p)
    assert exc.value.cycle == ["1.1.1", "1.1.2", "1.1.1"]


def test_queue_order_cycle_is_reported():
    # 1.1.2 follows 1.1.1 in the dev queue, but 1.1.1 waits for 1.1.2
    p = plan([pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2")])
    with pytest.raises(CycleError):
        build_schedule(project(), p)


def test_other_modes_and_effort_rate():
    p = plan(
        [
            pkg("1.1.1", effort=2),
            pkg("1.1.2", effort=3),
            pkg("1.1.3", role="lead", schedule={"fixed": ["2026-09-24", "2026-09-25"]}),
            pkg("1.1.4", role="lead", effort=0, schedule={"span": ["1.1.1", "1.1.2"]}, effort_rate=0.2),
            pkg("1.1.5", role="lead", schedule={"period": {"after": "1.1.2", "months": 12}}),
            pkg("1.1.6", role="lead", schedule={"tail": {"of": "1.1.5", "days": 5}}),
        ]
    )
    s = build_schedule(project(), p)
    assert dates(s, "1.1.3") == (D(2026, 9, 24), D(2026, 9, 25))
    assert dates(s, "1.1.4") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.slots["1.1.4"].effort == 0.2
    assert dates(s, "1.1.5") == (D(2026, 10, 5), D(2027, 10, 4))
    assert dates(s, "1.1.6") == (D(2027, 9, 28), D(2027, 10, 4))


def test_actuals_override_and_push_successors():
    p = plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)])
    s = build_schedule(project(), p, {"1.1.1": {"started": "2026-09-28", "done": "2026-10-06"}})
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 10, 6))
    assert dates(s, "1.1.2") == (D(2026, 10, 7), D(2026, 10, 9))


def test_done_before_planned_start_keeps_start_not_after_end():
    p = plan([pkg("1.1.1", effort=5), pkg("1.1.2", effort=5)])
    s = build_schedule(project(), p, {"1.1.2": {"done": "2026-09-30"}})
    assert dates(s, "1.1.2") == (D(2026, 9, 30), D(2026, 9, 30))


def test_rollup_and_gate():
    p = plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)], gates=[{"id": "G1", "name": "Done", "at": "1"}])
    s = build_schedule(project(), p)
    assert dates(s, "1") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.slots["1"].workdays == 5
    assert s.slots["1"].effort == 5
    assert dates(s, "1.1") == (D(2026, 9, 28), D(2026, 10, 2))
    assert s.gate_dates(p) == {"G1": D(2026, 10, 2)}


def test_slip_report_lists_cut_candidates():
    from kickoff.model import Features

    features = Features.from_dict(
        {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "features": [
            {"id": "F1.1", "name": "Export", "release": "MVP", "prio": "P2", "wbs": ["1.1.2"]}]}]}
    )
    p = plan([pkg("1.1.1", effort=2), pkg("1.1.2", effort=3)], gates=[{"id": "G1", "name": "MVP", "at": "1"}],
             cut_order=["F1.1"])
    pr = project(hard_dates={"G1": "2026-09-30"})
    lines = slip_report(pr, p, features, build_schedule(pr, p))
    assert lines[0] == "G1 slips: planned 2026-10-02, hard date 2026-09-30 (2 working days late)"
    assert lines[1] == "  cut candidate F1.1 Export: frees up to 3 person-days in 1.1.2"


def test_baseline_ignores_done_and_actuals():
    p = plan([pkg("1.1.1", effort=4, done=0.5), pkg("1.1.2", effort=3)])
    s = build_schedule(project(), p, {"1.1.1": {"started": "2026-09-28", "done": "2026-10-06"}}, baseline=True)
    assert dates(s, "1.1.1") == (D(2026, 9, 28), D(2026, 10, 1))
    assert dates(s, "1.1.2") == (D(2026, 10, 2), D(2026, 10, 6))
```

- [ ] **Step 3: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_calendar.py tests/test_schedule.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'kickoff.calendar'`.

- [ ] **Step 4: Write `calendar.py`**

```python
"""Working-day arithmetic with the same semantics as Excel WORKDAY, NETWORKDAYS and EDATE."""

from __future__ import annotations

import calendar as _calendar
from collections.abc import Iterable
from datetime import date, timedelta


class WorkCalendar:
    def __init__(self, weekend: Iterable[int] = (5, 6), holidays: Iterable[date] = ()):
        self.weekend = frozenset(weekend)
        self.holidays = frozenset(holidays)

    def is_workday(self, d: date) -> bool:
        return d.weekday() not in self.weekend and d not in self.holidays

    def workday(self, d: date, n: int) -> date:
        """The date n working days after d (before d when n < 0); d itself when n == 0."""
        cur, step, left = d, (1 if n > 0 else -1), abs(n)
        while left:
            cur += timedelta(days=step)
            if self.is_workday(cur):
                left -= 1
        return cur

    def networkdays(self, a: date, b: date) -> int:
        count, cur = 0, a
        while cur <= b:
            count += self.is_workday(cur)
            cur += timedelta(days=1)
        return count


def edate_minus1(d: date, months: int) -> date:
    """EDATE(d, months) - 1: the last day of a period of `months` months that starts on d."""
    m0 = d.month - 1 + months
    y, m = d.year + m0 // 12, m0 % 12 + 1
    return date(y, m, min(d.day, _calendar.monthrange(y, m)[1])) - timedelta(days=1)
```

- [ ] **Step 5: Write `schedule.py`**

```python
"""Role-based schedule: one person per role, packages in queue order, dependencies across roles.

duration = max(1, ROUND(effort * (1 - done) / focus, 0))
start    = WORKDAY(MAX(plan_start - 1, previous package of the role, every dependency), 1, holidays)
end      = WORKDAY(start, duration - 1, holidays)

With baseline=True (done = 0, no actuals) it is the oracle of the estimate workbook's formulas.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta

from .calendar import WorkCalendar, edate_minus1
from .errors import KickoffError
from .model import Features, Plan, Project, code_key, to_date


class CycleError(KickoffError):
    def __init__(self, cycle: list[str]):
        super().__init__(" -> ".join(cycle))
        self.cycle = cycle


@dataclass(frozen=True)
class Slot:
    start: date
    end: date
    workdays: int
    effort: float


@dataclass
class Schedule:
    slots: dict[str, Slot]

    def gate_dates(self, plan: Plan) -> dict[str, date]:
        return {g["id"]: self.slots[g["at"]].end for g in plan.gates if g["at"] in self.slots}


def round_half_up(x: float) -> int:
    return math.floor(x + 0.5 + 1e-9)


def calendar_for(project: Project) -> WorkCalendar:
    return WorkCalendar(project.weekend, project.holidays)


def role_queues(plan: Plan) -> dict[str, list[str]]:
    queues: dict[str, list[str]] = {}
    by = plan.by_code()
    for p in plan.packages:
        if p.mode == "seq":
            queues.setdefault(p.role, []).append(p.code)
    for code, after in plan.order_after.items():
        queue = queues[by[code].role]
        queue.remove(code)
        queue.insert(queue.index(after) + 1, code)
    return queues


def actuals_of(tickets: dict) -> dict:
    return dict(tickets.get("actuals") or {})


def build_schedule(project: Project, plan: Plan, actuals: dict | None = None, baseline: bool = False) -> Schedule:
    """baseline=True: the plan as estimated; ignores `done` fractions and actuals."""
    cal = calendar_for(project)
    by = plan.by_code()
    actuals = {} if baseline else (actuals or {})
    prev: dict[str, str | None] = {}
    for queue in role_queues(plan).values():
        for i, code in enumerate(queue):
            prev[code] = queue[i - 1] if i else None
    start: dict[str, date] = {}
    end: dict[str, date] = {}
    for p in plan.packages:
        if p.mode == "fixed":
            start[p.code], end[p.code] = p.schedule[1], p.schedule[2]
    state: dict[str, str] = {}
    stack: list[str] = []

    def solve(code: str) -> date:
        p = by[code]
        if p.mode == "fixed" or state.get(code) == "done":
            return end[code]
        if state.get(code) == "visiting":
            raise CycleError(stack[stack.index(code):] + [code])
        state[code] = "visiting"
        stack.append(code)
        base = [plan.start - timedelta(days=1)]
        if prev.get(code):
            base.append(solve(prev[code]))
        base += [solve(dep) for dep in p.deps]
        act = actuals.get(code) or {}
        done = 0.0 if baseline else p.done
        duration = max(1, round_half_up(p.effort * (1 - done) / project.roles[p.role].focus))
        s = to_date(act["started"]) if act.get("started") else cal.workday(max(base), 1)
        e = to_date(act["done"]) if act.get("done") else cal.workday(s, duration - 1)
        start[code], end[code] = min(s, e), e
        state[code] = "done"
        stack.pop()
        return e

    for p in plan.packages:
        if p.mode == "seq":
            solve(p.code)
    for p in plan.packages:
        if p.mode == "span":
            start[p.code], end[p.code] = start[p.schedule[1]], end[p.schedule[2]]
        elif p.mode == "period":
            start[p.code] = cal.workday(end[p.schedule[1]], 1)
            end[p.code] = edate_minus1(start[p.code], p.schedule[2])
    for p in plan.packages:
        if p.mode == "tail":
            end[p.code] = end[p.schedule[1]]
            start[p.code] = cal.workday(end[p.code], -(p.schedule[2] - 1))

    leaves: dict[str, Slot] = {}
    for p in plan.packages:
        wd = cal.networkdays(start[p.code], end[p.code])
        if p.effort_rate is not None:
            effort = math.floor(wd / 5 * p.effort_rate * 10 + 0.5 + 1e-9) / 10
        else:
            effort = p.effort
        leaves[p.code] = Slot(start[p.code], end[p.code], wd, effort)
    slots = dict(leaves)
    for node in [*plan.phases, *plan.groups]:
        members = [s for c, s in leaves.items() if c.startswith(node["code"] + ".")]
        if members:
            s, e = min(m.start for m in members), max(m.end for m in members)
            slots[node["code"]] = Slot(s, e, cal.networkdays(s, e), round(sum(m.effort for m in members), 2))
    return Schedule(dict(sorted(slots.items(), key=lambda kv: code_key(kv[0]))))


def _num(x: float) -> float | int:
    x = round(x, 2)
    return int(x) if float(x).is_integer() else x


def schedule_json(project: Project, plan: Plan, sched: Schedule) -> dict[str, list]:
    """{code: [start, end, workdays, effort, name, role]} in the workbook language; groups have role ''."""
    names = {n["code"]: n["name"] for n in [*plan.phases, *plan.groups]}
    by = plan.by_code()
    out = {}
    for code, s in sched.slots.items():
        p = by.get(code)
        name = p.name if p else names.get(code, "")
        role = project.roles[p.role].name if p else ""
        out[code] = [s.start.isoformat(), s.end.isoformat(), s.workdays, _num(s.effort), name, role]
    return out


def slip_report(project: Project, plan: Plan, features: Features | None, sched: Schedule) -> list[str]:
    cal = calendar_for(project)
    by = plan.by_code()
    fb = features.by_id() if features else {}
    got = sched.gate_dates(plan)
    lines: list[str] = []
    for gid, hard in project.hard_dates.items():
        planned = got.get(gid)
        if not planned or planned <= hard:
            continue
        late = cal.networkdays(hard + timedelta(days=1), planned)
        lines.append(f"{gid} slips: planned {planned.isoformat()}, hard date {hard.isoformat()} ({late} working days late)")
        for fid in plan.cut_order:
            f = fb.get(fid)
            if not f:
                continue
            freed = sum(by[c].effort for c in f.wbs if c in by)
            lines.append(f"  cut candidate {fid} {f.name}: frees up to {freed:g} person-days in {', '.join(f.wbs)}")
    return lines
```

- [ ] **Step 6: Write the `schedule` command**

`cli/src/kickoff/commands/__init__.py`:

```python
"""CLI command modules; each exposes register(subparsers) and run(args) -> int."""
```

`cli/src/kickoff/commands/schedule_cmd.py`:

```python
"""kickoff schedule [--json PATH]"""

from __future__ import annotations

import json
from pathlib import Path

from ..model import load_features, load_plan, load_project, load_tickets, resolve_root
from ..schedule import actuals_of, build_schedule, schedule_json, slip_report


def register(sub) -> None:
    p = sub.add_parser("schedule", help="compute the role-based schedule and gate dates")
    p.add_argument("--json", type=Path, default=None, help="also write {code: [start, end, workdays, effort, name, role]}")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    sched = build_schedule(project, plan, actuals_of(load_tickets(root)))
    dates = sched.gate_dates(plan)
    for g in plan.gates:
        d = dates.get(g["id"])
        hard = project.hard_dates.get(g["id"])
        suffix = f"  (hard date {hard.isoformat()})" if hard else ""
        print(f"{g['id']:<5} {d.isoformat() if d else '—':<11} {g['name']}{suffix}")
    if args.json:
        args.json.write_text(json.dumps(schedule_json(project, plan, sched), ensure_ascii=False, indent=0),
                             encoding="utf-8")
        print(f"{len(sched.slots)} codes -> {args.json}")
    slips = slip_report(project, plan, features, sched)
    for line in slips:
        print(line)
    return 3 if slips else 0
```

Modify `cli/src/kickoff/cli.py` — replace the `COMMANDS` line:

```python
from .commands import schedule_cmd

# Command modules, each with register(subparsers) and run(args) -> int. Later tasks append here.
COMMANDS: list = [schedule_cmd]
```

- [ ] **Step 7: Run the tests**

Run: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: all pass, ruff clean.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(cli): working-day calendar and role-based scheduler"
```

---

### Task 4: `kickoff validate`

**Files:**
- Create: `cli/src/kickoff/validate.py`, `cli/src/kickoff/commands/validate_cmd.py`
- Modify: `cli/src/kickoff/cli.py` (append `validate_cmd` to `COMMANDS`)
- Test: `cli/tests/test_validate.py`

**Interfaces:**
- Consumes: loaders and dataclasses (Task 2), `build_schedule`, `CycleError` (Task 3).
- Produces: `kickoff.validate.Finding(level: str, where: str, message: str)` (`__str__` → `"error: where: message"`); `validate_root(root: Path) -> list[Finding]`; `check_plan(project, plan) -> list[Finding]`; `check_features(project, plan, features) -> list[Finding]`; `check_languages(project, plan) -> list[Finding]`; `check_phrases(project, raw: dict[str, dict]) -> list[Finding]`. CLI `kickoff validate` exits 1 when any finding is an error. `kickoff schedule` runs `check_plan` first and exits 1 with the findings instead of a traceback.

- [ ] **Step 1: Write the failing tests**

`cli/tests/test_validate.py`:

```python
from helpers import FEATURES, pkg, plan_dict, project_dict, write_kickoff

from kickoff.cli import main
from kickoff.validate import validate_root


def run(tmp_path, packages=(), features=None, project=None, **plan_kw):
    write_kickoff(tmp_path, project=project or project_dict(), plan=plan_dict(list(packages), **plan_kw),
                  features=features or FEATURES)
    return [str(f) for f in validate_root(tmp_path)]


def feats(*features):
    return {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "features": list(features)}]}


def test_clean_project(tmp_path):
    assert run(tmp_path, [pkg("1.1.1")]) == []


def test_schema_error_stops_further_checks(tmp_path):
    out = run(tmp_path, [{"code": "1.1.1", "name": "x", "role": "dev"}])
    assert len(out) == 1 and "plan.yaml" in out[0] and "'effort' is a required property" in out[0]


def test_duplicate_code_unknown_role_and_parent(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.1"), pkg("1.2.1", role="ops")])
    assert "error: 1.1.1: duplicate package code" in out
    assert "error: 1.2.1: unknown role ops" in out
    assert "error: 1.2.1: group 1.2 is not in groups" in out


def test_dependency_rules(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", deps=["9.9.9"]), pkg("1.1.2", schedule={"span": ["1.1.1", "1.1.1"]}),
                         pkg("1.1.3", deps=["1.1.2"])])
    assert "error: 1.1.1: unknown dependency 9.9.9" in out
    assert "error: 1.1.3: dependency 1.1.2 must be a seq or fixed package, not span" in out


def test_order_after_across_roles(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.2", role="qa")], order_after={"1.1.2": "1.1.1"})
    assert "error: order_after 1.1.2: 1.1.2 (qa) and 1.1.1 (dev) are in different role queues" in out


def test_cycle_is_an_error(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2", role="qa", deps=["1.1.1"])])
    assert "error: schedule: dependency cycle: 1.1.1 -> 1.1.2 -> 1.1.1" in out


def test_gate_and_hard_date(tmp_path):
    out = run(tmp_path, [pkg("1.1.1")], gates=[{"id": "G1", "name": "x", "at": "7"}],
              project=project_dict(hard_dates={"G9": "2026-12-01"}))
    assert "error: gate G1: unknown code 7" in out
    assert "error: hard_dates G9: not a gate id" in out


def test_feature_checks(tmp_path):
    features = feats(
        {"id": "F1.1", "name": "A", "release": "MVP", "prio": "P0", "wbs": ["8.8.8"]},
        {"id": "F1.2", "name": "B", "release": "R9", "prio": "P1"},
        {"id": "F1.2", "name": "C", "release": "MVP", "prio": "P1", "wbs": ["1.1.1"]},
    )
    out = run(tmp_path, [pkg("1.1.1", ref="F1.1, F7.7")], features=features, cut_order=["F4.4"])
    assert "error: F1.1: unknown WBS code 8.8.8" in out
    assert "error: F1.2: unknown release R9" in out
    assert "error: F1.2: duplicate feature id" in out
    assert "warning: F1.2: active feature without a WBS package" in out
    assert "warning: 1.1.1: ref names unknown feature F7.7" in out
    assert "error: cut_order: unknown feature F4.4" in out


def test_forbidden_phrases_warn(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", desc="Drafted with Claude")],
              project=project_dict(rules={"forbidden_phrases": ["\\bclaude\\b"]}))
    assert any(line.startswith("warning: plan.yaml packages/0/desc: forbidden phrase") for line in out)


def test_ticket_epic_and_sprint_must_exist(tmp_path):
    ticket = {"title": "x", "type": "task", "epic": "E9", "sprint": "Nope"}
    out = run(tmp_path, [pkg("1.1.1", ticket=ticket)],
              sprints=[{"name": "S1", "start": "2026-09-28", "days": 10}])
    assert "error: 1.1.1: ticket epic E9 is not in features.yaml" in out
    assert "error: 1.1.1: ticket sprint 'Nope' is not in sprints" in out


def test_untranslated_plan_text_warns_when_languages_differ(tmp_path):
    project = project_dict(languages={"repo": "en", "chat": "en", "workbook": "vi", "ui": "en"})
    out = run(tmp_path, [pkg("1.1.1")], project=project)
    assert any(line.startswith("warning: plan.yaml packages: 1 of 1 items have no i18n.en.name") for line in out)
    assert run(tmp_path, [pkg("1.1.1")]) == []  # same repo and workbook language: nothing to translate


def test_schedule_refuses_an_invalid_plan(tmp_path, capsys):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", deps=["9.9.9"])]))
    assert main(["--root", str(tmp_path), "schedule"]) == 1
    assert "unknown dependency 9.9.9" in capsys.readouterr().out


def test_cli_exit_codes(tmp_path, capsys):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1")]))
    assert main(["--root", str(tmp_path), "validate"]) == 0
    assert "0 errors, 0 warnings" in capsys.readouterr().out
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", deps=["2.2.2"])]))
    assert main(["--root", str(tmp_path), "validate"]) == 1
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_validate.py -q`
Expected: FAIL — `No module named 'kickoff.validate'`.

- [ ] **Step 3: Write `validate.py`**

```python
"""Cross-file consistency checks for .kickoff/."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .errors import KickoffError
from .model import Features, ModelError, Plan, Project, load_raw
from .schedule import CycleError, build_schedule

FEATURE_REF = re.compile(r"\bF\d+\.\d+\b")


@dataclass(frozen=True)
class Finding:
    level: str  # "error" | "warning"
    where: str
    message: str

    def __str__(self) -> str:
        return f"{self.level}: {self.where}: {self.message}"


def _dups(values: list[str]) -> list[str]:
    return sorted({v for v in values if values.count(v) > 1})


def check_plan(project: Project, plan: Plan) -> list[Finding]:
    out: list[Finding] = []

    def err(where: str, msg: str) -> None:
        out.append(Finding("error", where, msg))

    by = plan.by_code()
    level1 = {n["code"] for n in plan.phases}
    level2 = {n["code"] for n in plan.groups}
    for c in _dups([p.code for p in plan.packages]):
        err(c, "duplicate package code")
    releases = {r.id for r in project.releases}
    for p in plan.packages:
        parts = p.code.split(".")
        if len(parts) != 3:
            err(p.code, "package codes have three levels (phase.group.package)")
        else:
            if parts[0] not in level1:
                err(p.code, f"phase {parts[0]} is not in phases")
            if ".".join(parts[:2]) not in level2:
                err(p.code, f"group {'.'.join(parts[:2])} is not in groups")
        if p.role not in project.roles:
            err(p.code, f"unknown role {p.role}")
        if p.release and p.release not in releases:
            err(p.code, f"unknown release {p.release}")
        for dep in p.deps:
            if dep not in by:
                err(p.code, f"unknown dependency {dep}")
            elif by[dep].mode not in ("seq", "fixed"):
                err(p.code, f"dependency {dep} must be a seq or fixed package, not {by[dep].mode}")
        refs = {"span": p.schedule[1:3], "period": p.schedule[1:2], "tail": p.schedule[1:2]}.get(p.mode, ())
        for ref in refs:
            if ref not in by:
                err(p.code, f"schedule refers to unknown package {ref}")
            elif p.mode in ("span", "period") and by[ref].mode not in ("seq", "fixed"):
                err(p.code, f"{p.mode} must refer to a seq or fixed package, not {ref} ({by[ref].mode})")
            elif p.mode == "tail" and by[ref].mode == "tail":
                err(p.code, f"tail cannot refer to another tail package ({ref})")
        if p.effort_rate is not None and p.mode not in ("span", "period", "tail"):
            err(p.code, "effort_rate needs a span, period or tail schedule")
    for code, after in plan.order_after.items():
        where = f"order_after {code}"
        if code not in by or after not in by:
            err(where, f"unknown code {code if code not in by else after}")
        elif by[code].mode != "seq" or by[after].mode != "seq":
            err(where, "both packages must be seq packages")
        elif by[code].role != by[after].role:
            err(where, f"{code} ({by[code].role}) and {after} ({by[after].role}) are in different role queues")
    codes = level1 | level2 | set(by)
    for g in plan.gates:
        if g["at"] not in codes:
            err(f"gate {g['id']}", f"unknown code {g['at']}")
    gate_ids = {g["id"] for g in plan.gates}
    for c in _dups([g["id"] for g in plan.gates]):
        err(f"gate {c}", "duplicate gate id")
    for gid in project.hard_dates:
        if gid not in gate_ids:
            err(f"hard_dates {gid}", "not a gate id")
    for kind in ("risks", "assumptions"):
        for c in _dups([x["id"] for x in getattr(plan, kind)]):
            err(f"{kind} {c}", "duplicate id")
    if not out:
        try:
            build_schedule(project, plan)
        except CycleError as exc:
            err("schedule", f"dependency cycle: {exc}")
    return out


def check_features(project: Project, plan: Plan, features: Features) -> list[Finding]:
    out: list[Finding] = []
    by = plan.by_code()
    codes = {n["code"] for n in [*plan.phases, *plan.groups]} | set(by)
    releases = {r.id for r in project.releases}
    all_features = features.all()
    for c in _dups([e.id for e in features.epics]):
        out.append(Finding("error", c, "duplicate epic id"))
    for c in _dups([f.id for f in all_features]):
        out.append(Finding("error", c, "duplicate feature id"))
    for f in all_features:
        if f.release not in releases:
            out.append(Finding("error", f.id, f"unknown release {f.release}"))
        for code in f.wbs:
            if code not in codes:
                out.append(Finding("error", f.id, f"unknown WBS code {code}"))
        if f.status == "active" and not f.wbs:
            out.append(Finding("warning", f.id, "active feature without a WBS package"))
        if f.status == "removed" and not f.removed_by:
            out.append(Finding("warning", f.id, "removed feature without removed_by (decision reference)"))
    epic_ids = {e.id for e in features.epics}
    sprint_names = {s["name"] for s in plan.sprints}
    for p in plan.packages:
        t = p.ticket
        if not t:
            continue
        if t["epic"] not in epic_ids:
            out.append(Finding("error", p.code, f"ticket epic {t['epic']} is not in features.yaml"))
        if t.get("sprint") and t["sprint"] not in sprint_names:
            out.append(Finding("error", p.code, f"ticket sprint {t['sprint']!r} is not in sprints"))
    known = {f.id for f in all_features}
    for p in plan.packages:
        for fid in FEATURE_REF.findall(p.ref):
            if fid not in known:
                out.append(Finding("warning", p.code, f"ref names unknown feature {fid}"))
    for fid in plan.cut_order:
        if fid not in known:
            out.append(Finding("error", "cut_order", f"unknown feature {fid}"))
    return out


def check_languages(project: Project, plan: Plan) -> list[Finding]:
    """Generated documents use the repo language; plan text is written in the workbook language."""
    repo, book = project.languages["repo"], project.languages["workbook"]
    if repo == book:
        return []
    kinds = {
        "phases": ("name", [(n["code"], n) for n in plan.phases]),
        "groups": ("name", [(n["code"], n) for n in plan.groups]),
        "packages": ("name", [(p.code, {"i18n": p.i18n}) for p in plan.packages]),
        "gates": ("name", [(g["id"], g) for g in plan.gates]),
        "risks": ("title", [(r["id"], r) for r in plan.risks]),
        "assumptions": ("text", [(a["id"], a) for a in plan.assumptions]),
    }
    out = []
    for kind, (key, items) in kinds.items():
        missing = [ident for ident, item in items if not ((item.get("i18n") or {}).get(repo) or {}).get(key)]
        if missing:
            out.append(Finding("warning", f"plan.yaml {kind}",
                               f"{len(missing)} of {len(items)} items have no i18n.{repo}.{key}; generated documents "
                               f"show them in the workbook language ({book}); first: {', '.join(missing[:3])}"))
    return out


def _strings(node, path=""):
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for k, v in node.items():
            yield from _strings(v, f"{path}/{k}" if path else str(k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _strings(v, f"{path}/{i}" if path else str(i))


def check_phrases(project: Project, raw: dict[str, dict]) -> list[Finding]:
    patterns = [re.compile(p, re.I) for p in project.rules.get("forbidden_phrases") or []]
    out: list[Finding] = []
    for kind in ("features", "plan"):
        for path, value in _strings(raw.get(kind) or {}):
            for pat in patterns:
                if pat.search(value):
                    out.append(Finding("warning", f"{kind}.yaml {path}", f"forbidden phrase /{pat.pattern}/"))
    return out


def validate_root(root: Path) -> list[Finding]:
    raw: dict[str, dict] = {}
    out: list[Finding] = []
    for kind in ("project", "features", "plan", "state"):
        try:
            raw[kind] = load_raw(root, kind)
        except ModelError as exc:
            out.append(Finding("error", f"{kind}.yaml", str(exc)))
    if out:
        return out
    try:
        project = Project.from_dict(raw["project"])
        plan = Plan.from_dict(raw["plan"])
        features = Features.from_dict(raw["features"])
    except KickoffError as exc:
        return [Finding("error", "model", str(exc))]
    return [*check_plan(project, plan), *check_features(project, plan, features),
            *check_languages(project, plan), *check_phrases(project, raw)]
```

- [ ] **Step 4: Write the command**

`cli/src/kickoff/commands/validate_cmd.py`:

```python
"""kickoff validate"""

from __future__ import annotations

from ..model import resolve_root
from ..validate import validate_root


def register(sub) -> None:
    p = sub.add_parser("validate", help="check .kickoff/ files for schema and consistency errors")
    p.set_defaults(func=run)


def run(args) -> int:
    findings = validate_root(resolve_root(args.root))
    for f in findings:
        print(f)
    errors = sum(f.level == "error" for f in findings)
    warnings = len(findings) - errors
    print(f"{errors} errors, {warnings} warnings")
    return 1 if errors else 0
```

In `cli.py`: `from .commands import schedule_cmd, validate_cmd` and `COMMANDS: list = [schedule_cmd, validate_cmd]`.

Modify `cli/src/kickoff/commands/schedule_cmd.py` so a bad plan prints findings instead of a traceback: add `from ..validate import check_plan` below the `..schedule` import (imports stay sorted for ruff) and, right after the three loaders in `run`:

```python
    errors = [f for f in check_plan(project, plan) if f.level == "error"]
    if errors:
        for f in errors:
            print(f)
        return 1
```

- [ ] **Step 5: Run the tests**

Run: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(cli): kickoff validate with cycle and cross-reference checks"
```

---

### Task 5: Golden schedule test on the AI Minute example

**Files:**
- Test: `cli/tests/test_golden_ai_minute.py`
- Data, committed before Task 1 (edit only to fix a defect that the checks below reveal): `examples/ai-minute/.kickoff/{project,plan,features,state,tickets}.yaml`, `examples/ai-minute/expected/schedule.json`

**Interfaces:**
- Consumes: loaders, `build_schedule`, `validate_root`.
- Produces: the regression anchor every later task tests against. Role ids `lead`, `dev`, `qa`; release ids `MVP, Pilot, Apps, R2, R3, Rollout, Warranty`; gates `G1…G11` with `at` = phase codes `1, 2.1, 2.2, 2.4, 3, 4, 5, 6, 7, 8, 9`.

**About the data.** The files describe the AI Minute project as planned on 2026-09-26. They were written once and are maintained by hand like any project's `.kickoff/` folder.
- `project.yaml`: repo language `en`, chat/workbook/UI language `vi`; roles `lead` 0.8, `dev` 0.9, `qa` 0.9; 32 holidays; hard date `G5: 2026-11-27`; GitHub tracker settings; security rules and forbidden phrases.
- `plan.yaml`: 11 phases, 39 groups, 155 packages (205 WBS codes in all), 11 gates, 16 `order_after` entries, 66 packages with a `ticket` block, 19 risks (with `i18n.en`), 20 assumptions, 5 sprints, a four-feature `cut_order`. WBS codes are quoted strings. Names and descriptions are Vietnamese; ticket blocks and `i18n.en` names are English.
- `features.yaml`: 16 epics, 122 features (F6.9–F6.12 are `status: removed`).
- `tickets.yaml`: 57 package keys and epics E0–E13 mapped to issue numbers.
- `expected/schedule.json`: `{code: [start, end, workdays, effort, name, role]}` for all 205 codes, taken from the workbook the customer received. It is the oracle: never edit it to make a test pass.

- [ ] **Step 1: Write the golden test**

`cli/tests/test_golden_ai_minute.py`:

```python
import json
from datetime import date
from pathlib import Path

import pytest

from kickoff.model import load_plan, load_project
from kickoff.schedule import build_schedule
from kickoff.validate import validate_root

ROOT = Path(__file__).resolve().parents[2] / "examples" / "ai-minute"
EXPECTED = json.loads((ROOT / "expected" / "schedule.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def sched():
    project, plan = load_project(ROOT), load_plan(ROOT)
    return plan, build_schedule(project, plan)


def test_example_validates():
    errors = [str(f) for f in validate_root(ROOT) if f.level == "error"]
    assert errors == []


def test_every_code_matches_expected_schedule(sched):
    _, s = sched
    assert len(EXPECTED) == 205
    for code, (start, end, workdays, effort, *_rest) in EXPECTED.items():
        slot = s.slots[code]
        assert (slot.start.isoformat(), slot.end.isoformat(), slot.workdays) == (start, end, workdays), code
        assert slot.effort == pytest.approx(effort), code


def test_gate_dates(sched):
    plan, s = sched
    g = s.gate_dates(plan)
    assert g["G1"] == date(2026, 10, 14)
    assert g["G5"] == date(2026, 11, 26)
    assert g["G8"] == date(2027, 3, 16)
    assert g["G10"] == date(2027, 6, 2)
    assert g["G11"] == date(2028, 6, 2)


def test_effort_totals(sched):
    plan, s = sched
    leaves = [p.code for p in plan.packages]
    mvp = sum(s.slots[c].effort for c in leaves if c.split(".")[0] in {"1", "2", "3"})
    assert mvp == pytest.approx(84.75)
    assert sum(s.slots[c].effort for c in leaves) == pytest.approx(336.75)
```

- [ ] **Step 2: Run the test**

Run: `cd cli && uv run pytest tests/test_golden_ai_minute.py -q`
Expected: `4 passed`.

If a test fails, find out which side is wrong before changing anything. A schema or reference error in the data (`validate` names the file and path): fix the YAML. A date mismatch on one code: compare that package's inputs (role, effort, `done`, `deps`, `order_after`, schedule mode) with the expected row; a mismatch that follows from the scheduling rules in the spec is a scheduler defect (fix Task 3's code); a mismatch from a data slip is a data fix. Never edit `expected/schedule.json`.

- [ ] **Step 3: Validate and schedule the example from the command line**

Run: `cd cli && uv run kickoff --root ../examples/ai-minute validate && uv run kickoff --root ../examples/ai-minute schedule`
Expected: `validate` prints `0 errors, 3 warnings` (untranslated groups, packages and assumptions: the repo language is `en`, the plan text is `vi`; if the count differs, explain it in the report); `schedule` prints G1 `2026-10-14` … G11 `2028-06-02` and exits 0 (G5 2026-11-26 is before the hard date 2026-11-27).

- [ ] **Step 4: Know what the example deliberately leaves pending**

The example is a snapshot of a tracker with work still to push. `tickets.yaml` maps 57 packages and epics E0–E13 to issue numbers; the plan also carries a `ticket` block on nine Release 2 packages (`6.2.2`, `6.4.3`, `6.5.1`–`6.5.7`) and epics E14 and E15 exist in the feature map, none of which are in the tracker yet. A dry-run push must therefore create exactly those eleven items (Task 8 tests this against a fake `gh`). Do not "fix" this by editing the data.

- [ ] **Step 5: Commit**

```bash
git add cli/tests examples && git commit -m "test: golden schedule test on the AI Minute example"
```

---

### Task 6: `kickoff docs` — Markdown generation

**Files:**
- Create: `cli/src/kickoff/docs.py`, `cli/src/kickoff/commands/docs_cmd.py`
- Modify: `cli/src/kickoff/cli.py` (append `docs_cmd`)
- Test: `cli/tests/test_docs.py`

**Interfaces:**
- Consumes: loaders, `text`, `code_key`, `build_schedule`, `actuals_of`, `Project.role_title`.
- Produces: `kickoff.docs.md_table(headers, rows) -> str`; `feature_map_md(project, features) -> str`; `wbs_md(project, plan, sched) -> str`; `risks_md(project, plan) -> str`; `fill_markers(existing: str, blocks: dict[str, str]) -> str`; `plan_blocks(project, plan, sched) -> dict[str, str]` (keys `gates`, `phases`, `sprints`); `render_docs(root) -> dict[Path, str]`; `write_docs(root, check: bool) -> list[Path]` (paths that changed or would change). CLI `kickoff docs [--check]` (exit 1 in check mode when anything would change).

Document paths (relative to `docs_root`): `02-requirements/feature-map.md`, `06-planning/wbs.md`, `06-planning/risk-register.md`, `06-planning/plan.md`.

- [ ] **Step 1: Write the failing tests**

`cli/tests/test_docs.py`:

```python
from pathlib import Path

from helpers import pkg, plan_dict, write_kickoff

from kickoff.cli import main
from kickoff.docs import fill_markers, md_table, write_docs

FEATURES = {
    "schema_version": 1,
    "epics": [{"id": "E1", "name": "Core", "goal": "Everything core.", "features": [
        {"id": "F1.1", "name": "Export", "release": "MVP", "prio": "P0", "platforms": "W", "wbs": ["1.1.1"]},
        {"id": "F1.2", "name": "Old", "release": "R2", "prio": "P2", "status": "removed", "removed_by": "D2"},
    ]}],
}


def setup(tmp_path):
    plan = plan_dict([pkg("1.1.1", effort=2), pkg("1.1.2", role="qa", deps=["1.1.1"])],
                     gates=[{"id": "G1", "name": "MVP accepted", "at": "1"}],
                     risks=[{"id": "R1", "title": "Late data", "p": 2, "i": 3, "mitigation": "Ask early"}],
                     sprints=[{"name": "Sprint 1", "start": "2026-09-28", "days": 14}])
    write_kickoff(tmp_path, plan=plan, features=FEATURES)
    return tmp_path / "docs"


def test_md_table_pads_columns():
    assert md_table(["ID", "Name"], [["F1.1", "A|B"]]) == "| ID   | Name |\n| ---- | ---- |\n| F1.1 | A\\|B |"


def test_feature_map(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    fm = (docs / "02-requirements" / "feature-map.md").read_text(encoding="utf-8")
    assert "## E1 — Core" in fm
    assert "Everything core." in fm
    assert "| F1.1 | Export  | MVP     | P0   | W         | 1.1.1 |" in fm
    assert "Removed: F1.2 (see D2)." in fm


def test_wbs_and_risks(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    wbs = (docs / "06-planning" / "wbs.md").read_text(encoding="utf-8")
    assert "| G1   | MVP accepted | 30/09/2026 |" in wbs
    assert "| 1.1.2 | Package 1.1.2 | QA        | 1          | 30/09/2026 – 30/09/2026 | 1.1.1      |" in wbs
    risks = (docs / "06-planning" / "risk-register.md").read_text(encoding="utf-8")
    assert "| R1  | Late data | 2   | 3   | 6     | Ask early  | —       | open   |" in risks


def test_plan_markers_keep_prose(tmp_path):
    docs = setup(tmp_path)
    plan_md = docs / "06-planning" / "plan.md"
    plan_md.parent.mkdir(parents=True, exist_ok=True)
    plan_md.write_text("# Plan\n\nHand-written intro.\n\n<!-- kickoff:begin gates -->\nold\n<!-- kickoff:end gates -->\n",
                       encoding="utf-8")
    write_docs(tmp_path, check=False)
    out = plan_md.read_text(encoding="utf-8")
    assert "Hand-written intro." in out
    assert "old" not in out
    assert "| G1   | MVP accepted | 30/09/2026 |" in out


def test_plan_md_created_with_all_markers(tmp_path):
    docs = setup(tmp_path)
    write_docs(tmp_path, check=False)
    out = (docs / "06-planning" / "plan.md").read_text(encoding="utf-8")
    for name in ("gates", "phases", "sprints"):
        assert f"<!-- kickoff:begin {name} -->" in out


def test_fill_markers_ignores_unknown_blocks():
    src = "a\n<!-- kickoff:begin x -->\n1\n<!-- kickoff:end x -->\n"
    assert fill_markers(src, {"y": "2"}) == src


def test_check_mode(tmp_path, capsys):
    setup(tmp_path)
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 1
    assert main(["--root", str(tmp_path), "docs"]) == 0
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 0
    Path(tmp_path / "docs" / "06-planning" / "wbs.md").write_text("edited", encoding="utf-8")
    assert main(["--root", str(tmp_path), "docs", "--check"]) == 1
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_docs.py -q`
Expected: FAIL — `No module named 'kickoff.docs'`.

- [ ] **Step 3: Write `docs.py`**

```python
"""Generate the Markdown planning documents from .kickoff data (repository language)."""

from __future__ import annotations

import re
from pathlib import Path

from .model import Features, Plan, Project, load_features, load_plan, load_project, load_tickets, text, to_date
from .schedule import Schedule, actuals_of, build_schedule

GENERATED = "<!-- Generated by `kickoff docs` from .kickoff/*.yaml. Edit the YAML, not this file. -->"
MARKER = re.compile(r"(<!-- kickoff:begin (?P<name>[a-z-]+) -->\n)(?P<body>.*?)(<!-- kickoff:end (?P=name) -->)", re.S)

L = {
    "en": {
        "feature_map": "Feature Map", "wbs": "Work Breakdown Structure", "risks": "Risk Register", "plan": "Plan",
        "releases": "Releases", "priority": "**P0** must have, **P1** should have, **P2** nice to have (first to drop).",
        "id": "ID", "feature": "Feature", "release": "Release", "prio": "Prio", "platforms": "Platforms", "wbs_col": "WBS",
        "removed": "Removed", "see": "see", "summary": "Summary by phase", "phase": "Phase", "start": "Start",
        "end": "End", "total": "Total effort (d)", "gates": "Gates", "gate": "Gate", "name": "Name", "date": "Date",
        "hard": "Hard date", "package": "Work package", "role": "Role", "effort": "Effort (d)", "planned": "Planned",
        "deps": "Depends on", "risk": "Risk", "p": "P", "i": "I", "score": "Score", "mitigation": "Mitigation",
        "trigger": "Trigger", "status": "Status", "sprints": "Sprints", "sprint": "Sprint", "days": "Days",
        "phases": "Phases",
    },
    "vi": {
        "feature_map": "Bản đồ tính năng", "wbs": "Cấu trúc phân chia công việc", "risks": "Sổ rủi ro", "plan": "Kế hoạch",
        "releases": "Phát hành", "priority": "**P0** bắt buộc, **P1** nên có, **P2** có thì tốt (cắt trước).",
        "id": "Mã", "feature": "Tính năng", "release": "Phát hành", "prio": "Ưu tiên", "platforms": "Nền tảng",
        "wbs_col": "WBS", "removed": "Đã bỏ", "see": "xem", "summary": "Tổng hợp theo giai đoạn", "phase": "Giai đoạn",
        "start": "Bắt đầu", "end": "Kết thúc", "total": "Tổng công (ngày)", "gates": "Mốc", "gate": "Mốc", "name": "Tên",
        "date": "Ngày", "hard": "Hạn cứng", "package": "Gói công việc", "role": "Vai trò", "effort": "Công (ngày)",
        "planned": "Kế hoạch", "deps": "Phụ thuộc", "risk": "Rủi ro", "p": "Khả năng", "i": "Tác động",
        "score": "Điểm", "mitigation": "Giảm thiểu", "trigger": "Dấu hiệu", "status": "Trạng thái", "sprints": "Sprint",
        "sprint": "Sprint", "days": "Số ngày", "phases": "Giai đoạn",
    },
}


def md_table(headers: list[str], rows: list[list]) -> str:
    def clean(v) -> str:
        return str(v).replace("|", "\\|").replace("\n", " ")

    cells = [[clean(h) for h in headers]] + [[clean(c) for c in r] for r in rows]
    widths = [max(3, *(len(r[i]) for r in cells)) for i in range(len(headers))]

    def line(r: list[str]) -> str:
        return "| " + " | ".join(c.ljust(widths[i]) for i, c in enumerate(r)) + " |"

    sep = "| " + " | ".join("-" * w for w in widths) + " |"
    return "\n".join([line(cells[0]), sep, *(line(r) for r in cells[1:])])


def _num(x: float) -> str:
    return f"{round(x, 2):g}"


def _lang(project: Project) -> str:
    return project.languages["repo"]


def feature_map_md(project: Project, features: Features) -> str:
    lang = _lang(project)
    t = L[lang]
    out = [f"# {t['feature_map']}", "", GENERATED, "",
           f"**{t['releases']}:** " + " · ".join(r.id for r in project.releases), "", f"**{t['prio']}:** {t['priority']}"]
    for e in features.epics:
        out += ["", f"## {e.id} — {text({'name': e.name, 'i18n': e.i18n}, 'name', lang)}", ""]
        if e.goal:
            out += [e.goal, ""]
        active = [f for f in e.features if f.status == "active"]
        rows = [[f.id, text({"name": f.name, "i18n": f.i18n}, "name", lang), f.release, f.prio, f.platforms or "—",
                 ", ".join(f.wbs) or "—"] for f in active]
        out.append(md_table([t["id"], t["feature"], t["release"], t["prio"], t["platforms"], t["wbs_col"]], rows))
        removed = [f for f in e.features if f.status == "removed"]
        if removed:
            refs = sorted({f.removed_by for f in removed if f.removed_by})
            out += ["", f"{t['removed']}: " + ", ".join(f.id for f in removed) + (f" ({t['see']} {', '.join(refs)})." if refs else ".")]
    return "\n".join(out) + "\n"


def _gates_table(project: Project, plan: Plan, sched: Schedule) -> str:
    t = L[_lang(project)]
    dates = sched.gate_dates(plan)
    rows = []
    for g in plan.gates:
        d = dates.get(g["id"])
        hard = project.hard_dates.get(g["id"])
        rows.append([g["id"], text(g, "name", _lang(project)), d.strftime(project.date_format) if d else "—",
                     hard.strftime(project.date_format) if hard else "—"])
    return md_table([t["gate"], t["name"], t["date"], t["hard"]], rows)


def _phases_table(project: Project, plan: Plan, sched: Schedule) -> str:
    lang = _lang(project)
    t = L[lang]
    fmt = project.date_format
    by = plan.by_code()
    roles = list(project.roles)
    rows = []
    for ph in plan.phases:
        s = sched.slots.get(ph["code"])
        if not s:
            continue
        per_role = {r: 0.0 for r in roles}
        for code, slot in sched.slots.items():
            if code in by and code.startswith(ph["code"] + "."):
                per_role[by[code].role] += slot.effort
        gates = ", ".join(g["id"] for g in plan.gates if g["at"] == ph["code"] or g["at"].startswith(ph["code"] + "."))
        rows.append([f"{ph['code']} {text(ph, 'name', lang)}", s.start.strftime(fmt), s.end.strftime(fmt),
                     *(_num(per_role[r]) for r in roles), _num(s.effort), gates or "—"])
    headers = [t["phase"], t["start"], t["end"], *(project.role_title(r, lang) for r in roles), t["total"], t["gates"]]
    return md_table(headers, rows)


def wbs_md(project: Project, plan: Plan, sched: Schedule) -> str:
    lang = _lang(project)
    t = L[lang]
    fmt = project.date_format
    out = [f"# {t['wbs']}", "", GENERATED, "", f"## {t['summary']}", "", _phases_table(project, plan, sched), "",
           f"## {t['gates']}", "", _gates_table(project, plan, sched)]
    for ph in plan.phases:
        s = sched.slots.get(ph["code"])
        if not s:
            continue
        out += ["", f"## {ph['code']} {text(ph, 'name', lang)} ({s.start.strftime(fmt)} – {s.end.strftime(fmt)})", ""]
        rows = []
        for p in plan.packages:
            if not p.code.startswith(ph["code"] + "."):
                continue
            slot = sched.slots[p.code]
            rows.append([p.code, text(p.as_item(), "name", lang), project.role_title(p.role, lang), _num(slot.effort),
                         f"{slot.start.strftime(fmt)} – {slot.end.strftime(fmt)}", ", ".join(p.deps) or "—"])
        out.append(md_table(["WBS", t["package"], t["role"], t["effort"], t["planned"], t["deps"]], rows))
    return "\n".join(out) + "\n"


def risks_md(project: Project, plan: Plan) -> str:
    lang = _lang(project)
    t = L[lang]
    rows = [[r["id"], text(r, "title", lang), r["p"], r["i"], r["p"] * r["i"], text(r, "mitigation", lang) or "—",
             text(r, "trigger", lang) or "—", r.get("status", "open")] for r in plan.risks]
    table = md_table([t["id"], t["risk"], t["p"], t["i"], t["score"], t["mitigation"], t["trigger"], t["status"]], rows)
    return "\n".join([f"# {t['risks']}", "", GENERATED, "", table]) + "\n"


def plan_blocks(project: Project, plan: Plan, sched: Schedule) -> dict[str, str]:
    t = L[_lang(project)]
    sprints = md_table([t["sprint"], t["start"], t["days"]],
                       [[s["name"], _fmt_date(s["start"], project.date_format), s["days"]] for s in plan.sprints])
    return {"gates": _gates_table(project, plan, sched), "phases": _phases_table(project, plan, sched),
            "sprints": sprints}


def _fmt_date(value, fmt: str) -> str:
    return to_date(value).strftime(fmt)


def fill_markers(existing: str, blocks: dict[str, str]) -> str:
    def repl(m: re.Match) -> str:
        name = m.group("name")
        if name not in blocks:
            return m.group(0)
        return f"{m.group(1)}{blocks[name]}\n{m.group(4)}"

    return MARKER.sub(repl, existing)


def plan_skeleton(project: Project) -> str:
    t = L[_lang(project)]
    parts = [f"# {t['plan']}", ""]
    for name, title in (("gates", t["gates"]), ("phases", t["phases"]), ("sprints", t["sprints"])):
        parts += [f"## {title}", "", f"<!-- kickoff:begin {name} -->", "<!-- kickoff:end " + name + " -->", ""]
    return "\n".join(parts)


def render_docs(root: Path) -> dict[Path, str]:
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    sched = build_schedule(project, plan, actuals_of(load_tickets(root)))
    base = root / project.docs_root
    plan_path = base / "06-planning" / "plan.md"
    current = plan_path.read_text(encoding="utf-8") if plan_path.exists() else plan_skeleton(project)
    return {
        base / "02-requirements" / "feature-map.md": feature_map_md(project, features),
        base / "06-planning" / "wbs.md": wbs_md(project, plan, sched),
        base / "06-planning" / "risk-register.md": risks_md(project, plan),
        plan_path: fill_markers(current, plan_blocks(project, plan, sched)),
    }


def write_docs(root: Path, check: bool) -> list[Path]:
    changed = []
    for path, content in render_docs(root).items():
        old = path.read_text(encoding="utf-8") if path.exists() else None
        if old != content:
            changed.append(path)
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8", newline="\n")
    return changed
```

- [ ] **Step 4: Write the command**

`cli/src/kickoff/commands/docs_cmd.py`:

```python
"""kickoff docs [--check]"""

from __future__ import annotations

from ..docs import write_docs
from ..model import resolve_root


def register(sub) -> None:
    p = sub.add_parser("docs", help="generate feature-map.md, wbs.md, risk-register.md and plan.md tables")
    p.add_argument("--check", action="store_true", help="fail if regeneration would change any file")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    changed = write_docs(root, check=args.check)
    for path in changed:
        print(("would change " if args.check else "wrote ") + str(path.relative_to(root)))
    if args.check and changed:
        return 1
    if not changed:
        print("documents up to date")
    return 0
```

Append `docs_cmd` to `COMMANDS` in `cli.py`.

- [ ] **Step 5: Run the tests, then fix expected strings only if padding differs by whitespace**

Run: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: all pass. If a table assertion fails only because of column padding, correct the assertion to the actual padded line (the padding rule is `max(3, longest cell)`), never the generator.

- [ ] **Step 6: Run on the AI Minute example**

Run: `cd cli && uv run kickoff --root ../examples/ai-minute docs && uv run kickoff --root ../examples/ai-minute docs --check`
Expected: first run writes four files under `examples/ai-minute/docs/`; second prints `documents up to date` and exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(cli): kickoff docs generates feature map, WBS, risks and plan tables"
```

---

### Task 7: `kickoff workbook` — baseline estimate workbook (WBS, effort, schedule) and LibreOffice verification

**Files:**
- Create: `cli/src/kickoff/labels.py`, `cli/src/kickoff/workbook.py`, `cli/src/kickoff/lo_verify.py`, `cli/src/kickoff/commands/workbook_cmd.py`
- Create: `cli/src/kickoff/docker/lo-calc/Dockerfile` (inside the package: after `uv tool install <plugin>/cli` the code runs from site-packages, so anything the CLI needs at run time ships as package data)
- Modify: `cli/src/kickoff/cli.py` (append `workbook_cmd`), `.gitignore` (add `examples/**/*.xlsx`)
- Test: `cli/tests/test_workbook.py`

**Interfaces:**
- Consumes: `load_project`, `load_plan`, `resolve_root`, `text`, `code_key`, `Project.role_title`, `Package.as_item` (Task 2); `role_queues` and `build_schedule(project, plan, actuals=None, baseline=False)` (Task 3, including its `baseline` parameter); `KickoffError` (Task 1); `helpers.pkg|plan|project|write_kickoff` (tests).
- Produces:
  - `kickoff.labels.LABELS: dict[str, dict[str, str]]` keyed `"en"`, `"vi"` (same keys in both); `label(lang, key, **fmt) -> str`.
  - `kickoff.workbook.WBS_COLUMNS: tuple[str, ...]`, `COL: dict[str, str]` (key → column letter), `excel_date_format(fmt: str) -> str`, `Layout` dataclass (`wbs_sheet`, `cols`, `rows`, `estimate_sheet`, `cells`, `gate_rows`, `gate_date_col`, `resources_sheet`, `focus_col`, `focus_rows`), `build_workbook(project, plan, path: Path) -> Layout`.
  - `kickoff.lo_verify.DOCKERFILE_DIR`, `docker_available() -> bool`, `ensure_image(image) -> None`, `recalc(path: Path, image: str = "kickoff-lo-calc") -> Path` (a recalculated copy), `verify(path: Path, layout: Layout, sched: Schedule, plan: Plan) -> list[str]` (problems; empty when the workbook matches).
  - CLI `kickoff workbook [--out PATH] [--verify]`; default output `<docs_root>/06-planning/<slug>-estimate.xlsx` (`slug` = project name lower-cased, runs of non-alphanumerics replaced by `-`). Exit 1 when `--verify` finds problems.

**What the workbook is.** The baseline effort and schedule estimate of the project, for a customer or a manager: they open it, change an effort, a role's focus, the plan start or a holiday, and see durations, dates, milestone dates and totals move. It tracks nothing. There are no actual dates, statuses, % done, Gantt or roadmap grids, gate actuals or variance, `TODAY()`-based highlighting, ticket data or features sheet; progress lives in the tracker (spec §13). Risks stay in `risk-register.md` (`kickoff docs`); the assumptions are in the workbook because an estimate only holds under them.

**How its schedule is built.** The workbook is the plan as estimated: `done` fractions, `status` and pulled actuals are ignored. Its formulas implement `build_schedule(project, plan, baseline=True)` (Task 3: `done` treated as 0, `actuals` ignored), and that call is the oracle every test and `--verify` compare against. `build_workbook` itself takes no schedule: every number in the file is either a YAML input or a formula. For the AI Minute example the baseline equals the golden schedule (only `fixed` and `span` packages carry `done`, and neither mode uses it); `test_example_baseline_equals_golden_schedule` pins that.

**LibreOffice check: kept.** It is the only check that the formulas compute in a real spreadsheet engine (function names, the `_xlfn.` prefix of the `.INTL` forms, named ranges with blank rows, `WORKDAY` from a weekend date), which string tests cannot see. Its cost is one small Dockerfile and two `@pytest.mark.docker` tests that skip without Docker and run in the existing CI `examples` job.

#### Workbook specification

Five sheets, in this tab order. Every sheet: row 1 title (bold, 14 pt), row 2 a one-line note (italic, grey); table sheets have the header on row 4 (bold, fill `D9E1F2`) and data from row 5. Inputs are blue (`0000FF`); every other number or date is a formula in black, or a plain text cell. `wb.calculation.fullCalcOnLoad = True`, so Excel and LibreOffice compute everything on open.

| # | Sheet (`en` / `vi`) | Content |
| --- | --- | --- |
| 1 | Estimate / Ước tính | A4:B7 key figures: plan start (input, named `PlanStart`), planned end, working days, total effort. Milestones block (title row 9, header row 10, one row per `plan.gates` entry): gate, name, WBS (`at`), planned date, hard date (input), spare working days, verdict, exit criteria (`criteria`). Then the block *Effort by phase and role*: one row per phase that has packages (code, name, one column per role in `project.roles` order, total, start, end, working days) and a total row. Then *Effort by release and role*: one row per `project.releases` entry (id, name, one column per role, total), a `(none)` row when any package has no `release`, and a total row. |
| 2 | WBS / WBS | One row per phase, group and package that has packages, sorted by `code_key`, columns below. Phase rows bold with fill `F2F2F2`; group rows bold; outline levels 0 / 1 / 2 (collapsible, summary above). Frozen panes at the name column, row 5. |
| 3 | Resources / Nguồn lực | Role ID, role name, focus (input, `0%`), effort (`=SUMIF` over WBS role and effort), duties; a total row. One row per role in `project.roles` order. |
| 4 | Assumptions / Giả định | ID, kind, assumption (`text`), scope, source; plain text from `plan.assumptions` (their `status` is not shown). |
| 5 | Holidays / Ngày nghỉ | Date (input), name, kind, one row per `project.calendar.holidays` date in date order, then 50 empty input rows. |

WBS columns (`WBS_COLUMNS` order; the letter is the position, A to S):

| Key | Header (`en`) | Phase / group row | Package row |
| --- | --- | --- | --- |
| `code` | Code | code | code |
| `level` | Level | 1 / 2 | 3 |
| `name` | Name | `text(node, "name", lang)` | `text(p.as_item(), "name", lang)` |
| `desc` | Description | phase `objective`, group `desc` | `desc` |
| `phase` | Phase | first part of the code | first part of the code |
| `release` | Release | — | release name from `project.releases`, or `(none)` |
| `prio` | Priority | — | `prio` |
| `role` | Role | — | `project.role_title(role, lang)` |
| `mode` | Schedule | — | `Sequential`, `Fixed dates`, `Span 1.1.1 to 1.4.1`, `12 months after 8.3.3`, `Last 5 days of 9.1.1` |
| `deps` | Depends on | — | `deps`, comma-separated |
| `follows` | After (same role) | — | previous code in the role queue (`role_queues`) |
| `effort` | Effort (person-days) | `=SUM(<leaf effort cells>)` | input, or `=ROUND(days/5*rate,1)` when `effort_rate` is set |
| `rate` | Effort rate | — | input when `effort_rate` is set |
| `days` | Working days | `NETWORKDAYS(start,end)` | `seq`: duration; other modes: `NETWORKDAYS(start,end)` |
| `start`, `end` | Start, End | `=MIN(...)`, `=MAX(...)` over leaf rows | by schedule mode, below |
| `ref`, `coop`, `note` | Reference, Cooperation, Note | — | `ref`, `coop`, `note` |

Role, schedule mode, dependencies and queue order are structure: they are baked into the formulas and shown as text; the WBS note tells the reader to change them in `plan.yaml` and regenerate.

Formula shapes (`r` = the row, `X{code}` = column X on that code's row; `WD`/`ND` = `WORKDAY`/`NETWORKDAYS` with `HolidayDates` as the last argument, or `_xlfn.WORKDAY.INTL`/`_xlfn.NETWORKDAYS.INTL` with the weekend mask from `project.calendar.weekend`, e.g. `"0000110"` for Friday + Saturday, when the weekend is not Saturday + Sunday):

| Row | Days (`N`) | Start (`O`) | End (`P`) |
| --- | --- | --- | --- |
| `seq` | `=MAX(1,ROUND(L{r}/'Resources'!$C${role row},0))` | `=WD(MAX(PlanStart-1,P{previous of role},P{dep}...),1)` | `=WD(O{r},N{r}-1)` |
| `fixed` | `=ND(O{r},P{r})` | input date | input date |
| `span a b` | `=ND(O{r},P{r})` | `=O{a}` | `=P{b}` |
| `period after n` | `=ND(O{r},P{r})` | `=WD(P{after},1)` | `=EDATE(O{r},n)-1` |
| `tail of n` | `=ND(O{r},P{r})` | `=WD(P{r},-(n-1))` | `=P{of}` |
| phase / group | `=ND(O{r},P{r})` | `=MIN(O..:O..,...)` | `=MAX(P..:P..,...)` |

Leaf ranges of a roll-up collapse consecutive rows (`O7:O10,O12:O20`). The Estimate formulas: planned end `=MAX('WBS'!$P$5:$P$<last>)`; working days `=ND(MIN('WBS'!$O$5:$O$<last>),B5)`; total effort `=SUMIF('WBS'!$B…,3,'WBS'!$L…)` (validate guarantees three-level package codes); gate planned date `='WBS'!$P$<row of at>`; spare working days `=IF(OR(D="",E=""),"",IF(D<=E,ND(D+1,E),-ND(E+1,D)))` (the same count as `slip_report`); verdict `=IF(F="","",IF(F<0,"<late>","<on time>"))` with a red-font conditional format when F < 0; role cells `=SUMIFS(WBS effort, WBS role, <role header cell>, WBS phase|release, <row key>)`; totals `=SUM`, start `=MIN`, end `=MAX`, working days `=ND`. Resources effort `=SUMIF(WBS role, B{r}, WBS effort)`.

Named ranges: `HolidayDates` (Holidays!A5 to the last spare row) and `PlanStart` (Estimate!B4). No list sheet: no input needs a drop-down.

Validation: effort ≥ 0; effort rate ≥ 0.001; focus between 0.01 and 1; plan start, fixed dates, hard dates and holiday dates must be dates. Number formats: dates from `project.date_format` (`excel_date_format`: `%d %m %Y %y %b %B %a %A` → `dd mm yyyy yy mmm mmmm ddd dddd`), effort `0.0#`, rate `0.00`, days `0`, focus `0%`. Landscape, fit to one page wide (Estimate, WBS, Assumptions).

Labels: every visible string lives in `labels.py` (`en` and `vi`, identical key sets); sheet names ≤ 31 characters, none containing `[]:*?/\`; the language is `project.languages["workbook"]`. No project-specific literal in `workbook.py` or `labels.py`.

Column letters: `WBS_COLUMNS` is the only place WBS column positions are defined; `COL` derives the letters, `Layout.cols` hands them out, and tests and `verify` read every cell through `Layout` (never a literal letter). Estimate-sheet cells are reported in `Layout.cells` and `Layout.gate_rows`; focus cells in `Layout.focus_col` and `Layout.focus_rows`.

Size: about four formulas per WBS row plus a few per phase, release and gate; for AI Minute (205 WBS rows, 11 phases, 7 releases, 11 gates) about 820 formulas.

Known limit: role and release names are SUMIFS criteria, so a name containing `*`, `?` or `~` would match as a wildcard.

- [ ] **Step 1: Write the failing tests**

`cli/tests/test_workbook.py`:

```python
import json
from dataclasses import replace
from pathlib import Path

import pytest
from helpers import pkg, plan, project, write_kickoff
from openpyxl import load_workbook

from kickoff import lo_verify
from kickoff.cli import main
from kickoff.labels import LABELS
from kickoff.model import load_plan, load_project
from kickoff.schedule import build_schedule
from kickoff.workbook import WBS_COLUMNS, build_workbook

EXAMPLES = Path(__file__).resolve().parents[2] / "examples"
SRC = Path(__file__).resolve().parents[1] / "src" / "kickoff"
MODES = [
    pkg("1.1.1", effort=2),
    pkg("1.1.2", role="qa", deps=["1.1.1"]),
    pkg("1.1.3", role="lead", schedule={"fixed": ["2026-09-24", "2026-09-25"]}),
    pkg("1.1.4", role="lead", effort=0, schedule={"span": ["1.1.1", "1.1.2"]}, effort_rate=0.2),
    pkg("1.1.5", role="lead", schedule={"period": {"after": "1.1.2", "months": 12}}),
    pkg("1.1.6", role="lead", schedule={"tail": {"of": "1.1.5", "days": 5}}),
    pkg("1.1.7", effort=1),
]


def formulas(path):
    wb = load_workbook(path)
    return {(ws.title, c.coordinate): c.value for ws in wb.worksheets for row in ws.iter_rows() for c in row
            if isinstance(c.value, str) and c.value.startswith("=")}


def values(path):
    wb = load_workbook(path)
    return {(ws.title, c.coordinate): c.value for ws in wb.worksheets for row in ws.iter_rows() for c in row}


def build_example(tmp_path, lang=None):
    root = EXAMPLES / "ai-minute"
    pr, pl = load_project(root), load_plan(root)
    if lang:
        pr.languages = {**pr.languages, "workbook": lang}
    out = tmp_path / "ai-minute.xlsx"
    return pr, pl, out, build_workbook(pr, pl, out)


def test_formula_shapes_for_every_mode(tmp_path):
    out = tmp_path / "modes.xlsx"
    lay = build_workbook(project(), plan(MODES), out)
    ws = load_workbook(out)[lay.wbs_sheet]
    r, c = lay.rows, lay.cols

    def cell(key, code):
        return ws[f"{c[key]}{r[code]}"].value

    focus_dev = f"'{lay.resources_sheet}'!$C${lay.focus_rows['dev']}"
    assert cell("start", "1.1.1") == "=WORKDAY(MAX(PlanStart-1),1,HolidayDates)"
    assert cell("days", "1.1.1") == f"=MAX(1,ROUND({c['effort']}{r['1.1.1']}/{focus_dev},0))"
    assert cell("end", "1.1.1") == f"=WORKDAY({c['start']}{r['1.1.1']},{c['days']}{r['1.1.1']}-1,HolidayDates)"
    assert cell("start", "1.1.2") == f"=WORKDAY(MAX(PlanStart-1,{c['end']}{r['1.1.1']}),1,HolidayDates)"
    assert cell("start", "1.1.7") == f"=WORKDAY(MAX(PlanStart-1,{c['end']}{r['1.1.1']}),1,HolidayDates)"
    assert cell("follows", "1.1.7") == "1.1.1"
    assert not isinstance(cell("start", "1.1.3"), str)  # fixed dates are inputs
    assert cell("start", "1.1.4") == f"={c['start']}{r['1.1.1']}"
    assert cell("end", "1.1.4") == f"={c['end']}{r['1.1.2']}"
    assert cell("effort", "1.1.4") == f"=ROUND({c['days']}{r['1.1.4']}/5*{c['rate']}{r['1.1.4']},1)"
    assert cell("start", "1.1.5") == f"=WORKDAY({c['end']}{r['1.1.2']},1,HolidayDates)"
    assert cell("end", "1.1.5") == f"=EDATE({c['start']}{r['1.1.5']},12)-1"
    assert cell("end", "1.1.6") == f"={c['end']}{r['1.1.5']}"
    assert cell("start", "1.1.6") == f"=WORKDAY({c['end']}{r['1.1.6']},-4,HolidayDates)"
    leaves = f"{c['start']}{r['1.1.1']}:{c['start']}{r['1.1.7']}"
    assert cell("start", "1.1") == f"=MIN({leaves})"
    assert cell("start", "1") == f"=MIN({leaves})"
    assert cell("days", "1.1.3") == f"=NETWORKDAYS({c['start']}{r['1.1.3']},{c['end']}{r['1.1.3']},HolidayDates)"


def test_other_weekend_uses_intl_functions(tmp_path):
    out = tmp_path / "fri-sat.xlsx"
    pr = project(calendar={"weekend": ["fri", "sat"], "holidays": []})
    lay = build_workbook(pr, plan([pkg("1.1.1")]), out)
    start = load_workbook(out)[lay.wbs_sheet][f"{lay.cols['start']}{lay.rows['1.1.1']}"].value
    assert start == '=_xlfn.WORKDAY.INTL(MAX(PlanStart-1),1,"0000110",HolidayDates)'


def test_example_sheets_names_and_size(tmp_path):
    pr, pl, out, lay = build_example(tmp_path)
    wb = load_workbook(out)
    vi = LABELS["vi"]
    assert wb.sheetnames == [vi[f"sheet_{k}"] for k in ("estimate", "wbs", "resources", "assumptions", "holidays")]
    assert {"HolidayDates", "PlanStart"} <= set(wb.defined_names)
    assert set(lay.rows) == set(build_schedule(pr, pl, baseline=True).slots)
    assert set(lay.gate_rows) == {g["id"] for g in pl.gates}
    header = [c.value for c in wb[lay.wbs_sheet][4]][: len(WBS_COLUMNS)]
    assert header == [vi[k] for k in WBS_COLUMNS]
    assert 400 < len(formulas(out)) < 1000  # about 4 per WBS row plus the summaries; the old design had ~11,000


def test_english_labels_and_sheet_name_rules(tmp_path):
    _, _, out, _ = build_example(tmp_path, lang="en")
    assert load_workbook(out).sheetnames == ["Estimate", "WBS", "Resources", "Assumptions", "Holidays"]
    for lang in LABELS:
        for key in LABELS[lang]:
            if key.startswith("sheet_"):
                name = LABELS[lang][key]
                assert len(name) <= 31 and not set(name) & set("[]:*?/\\"), name
        assert set(LABELS[lang]) == set(LABELS["en"]), lang


def test_tracking_fields_do_not_change_the_workbook(tmp_path):
    tracked = [dict(p, done=0.5, status="done") if p["code"] == "1.1.1" else p for p in MODES]
    a, b = tmp_path / "a.xlsx", tmp_path / "b.xlsx"
    build_workbook(project(), plan(MODES), a)
    build_workbook(project(), plan(tracked), b)
    assert values(a) == values(b)


def test_example_baseline_equals_golden_schedule():
    root = EXAMPLES / "ai-minute"
    expected = json.loads((root / "expected" / "schedule.json").read_text(encoding="utf-8"))
    sched = build_schedule(load_project(root), load_plan(root), baseline=True)
    for code, (start, end, workdays, *_rest) in expected.items():
        s = sched.slots[code]
        assert (s.start.isoformat(), s.end.isoformat(), s.workdays) == (start, end, workdays), code


def test_workbook_has_no_project_literals():
    for name in ("workbook.py", "labels.py"):
        src = (SRC / name).read_text(encoding="utf-8")
        for word in ("AI Minute", "ASR", "GĐ", "TDA", "LTV", "KTV"):
            assert word not in src, f"{name}: {word}"


def test_command_writes_default_path(tmp_path, capsys):
    write_kickoff(tmp_path)
    assert main(["--root", str(tmp_path), "workbook"]) == 0
    assert (tmp_path / "docs" / "06-planning" / "demo-estimate.xlsx").exists()
    assert "wrote" in capsys.readouterr().out


def test_dockerfile_ships_inside_the_package():
    assert (lo_verify.DOCKERFILE_DIR / "Dockerfile").is_file()
    assert lo_verify.DOCKERFILE_DIR.is_relative_to(SRC)


@pytest.mark.docker
@pytest.mark.skipif(not lo_verify.docker_available(), reason="Docker not available")
def test_libreoffice_recalculation_matches_schedule(tmp_path):
    pr, pl, out, lay = build_example(tmp_path)
    assert lo_verify.verify(lo_verify.recalc(out), lay, build_schedule(pr, pl, baseline=True), pl) == []


@pytest.mark.docker
@pytest.mark.skipif(not lo_verify.docker_available(), reason="Docker not available")
def test_editing_focus_and_effort_moves_the_dates(tmp_path):
    pr, pl = project(), plan(MODES)
    out = tmp_path / "edit.xlsx"
    lay = build_workbook(pr, pl, out)
    wb = load_workbook(out)
    wb[lay.resources_sheet][f"{lay.focus_col}{lay.focus_rows['dev']}"] = 0.5
    wb[lay.wbs_sheet][f"{lay.cols['effort']}{lay.rows['1.1.7']}"] = 3
    wb.save(out)
    edited = plan([dict(p, effort=3) if p["code"] == "1.1.7" else p for p in MODES])
    pr.roles["dev"] = replace(pr.roles["dev"], focus=0.5)
    assert lo_verify.verify(lo_verify.recalc(out), lay, build_schedule(pr, edited, baseline=True), edited) == []
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_workbook.py -q`
Expected: FAIL — `ImportError: cannot import name 'lo_verify' from 'kickoff'`.

- [ ] **Step 3: Write `labels.py`**

`cli/src/kickoff/labels.py`:

```python
"""Visible strings of the estimate workbook, keyed by languages.workbook."""

from __future__ import annotations

LABELS: dict[str, dict[str, str]] = {
    "en": {
        # sheets
        "sheet_estimate": "Estimate", "sheet_wbs": "WBS", "sheet_resources": "Resources",
        "sheet_assumptions": "Assumptions", "sheet_holidays": "Holidays",
        # titles and notes
        "title_estimate": "{name}: effort and schedule estimate",
        "note_estimate": "Baseline estimate generated from .kickoff/plan.yaml; it does not track progress. "
                         "Blue cells are inputs; every date, duration and total is a formula.",
        "title_wbs": "Work breakdown structure and schedule",
        "note_wbs": "Change an effort (blue) here or a focus on {resources} and the dates move. Role, schedule mode, "
                    "dependencies and order come from plan.yaml: change them there and run kickoff workbook again.",
        "title_resources": "Team and focus",
        "note_resources": "One person per role. Focus is the share of each working day spent on this project; "
                          "duration = effort / focus.",
        "title_assumptions": "Assumptions",
        "note_assumptions": "The estimate holds only while these assumptions hold.",
        "title_holidays": "Holidays",
        "note_holidays": "Non-working days used by every date formula. Add dates in the empty rows below the list.",
        # key figures
        "plan_start": "Plan start", "planned_end": "Planned end", "working_days": "Working days",
        "total_effort": "Total effort (person-days)",
        # milestones
        "milestones": "Milestones", "gate": "Gate", "name": "Name", "wbs": "WBS", "planned_date": "Planned date",
        "hard_date": "Hard date", "spare_days": "Spare working days", "verdict": "Verdict", "on_time": "On time",
        "late": "Late", "criteria": "Exit criteria",
        # summaries
        "by_phase": "Effort by phase and role (person-days)", "phase": "Phase", "total": "Total",
        "start": "Start", "end": "End",
        "by_release": "Effort by release and role (person-days)", "release": "Release", "no_release": "(none)",
        # WBS columns
        "code": "Code", "level": "Level", "desc": "Description", "prio": "Priority", "role": "Role",
        "mode": "Schedule", "deps": "Depends on", "follows": "After (same role)", "effort": "Effort (person-days)",
        "rate": "Effort rate", "days": "Working days", "ref": "Reference", "coop": "Cooperation", "note": "Note",
        # schedule modes
        "mode_seq": "Sequential", "mode_fixed": "Fixed dates", "mode_span": "Span {a} to {b}",
        "mode_period": "{months} months after {after}", "mode_tail": "Last {days} days of {of}",
        # resources, assumptions, holidays
        "role_id": "Role ID", "focus": "Focus", "duties": "Duties",
        "id": "ID", "kind": "Kind", "assumption": "Assumption", "scope": "Scope", "source": "Source",
        "date": "Date",
    },
    "vi": {
        "sheet_estimate": "Ước tính", "sheet_wbs": "WBS", "sheet_resources": "Nguồn lực",
        "sheet_assumptions": "Giả định", "sheet_holidays": "Ngày nghỉ",
        "title_estimate": "{name}: ước tính công và tiến độ",
        "note_estimate": "Ước tính cơ sở lập từ .kickoff/plan.yaml, không dùng để theo dõi tiến độ thực hiện. "
                         "Ô chữ xanh là dữ liệu nhập; mọi ngày, thời lượng và tổng đều là công thức.",
        "title_wbs": "Cấu trúc phân chia công việc và tiến độ",
        "note_wbs": "Sửa công (ô xanh) ở đây hoặc tỷ lệ tập trung ở trang {resources}, các ngày sẽ tự tính lại. "
                    "Vai trò, cách lập lịch, phụ thuộc và thứ tự lấy từ plan.yaml: sửa ở đó rồi chạy lại "
                    "kickoff workbook.",
        "title_resources": "Nhân sự và tỷ lệ tập trung",
        "note_resources": "Mỗi vai trò một người. Tỷ lệ tập trung là phần thời gian mỗi ngày làm việc dành cho dự án; "
                          "thời lượng = công / tỷ lệ tập trung.",
        "title_assumptions": "Giả định",
        "note_assumptions": "Ước tính chỉ đúng khi các giả định này còn đúng.",
        "title_holidays": "Ngày nghỉ",
        "note_holidays": "Các ngày không làm việc, dùng trong mọi công thức tính ngày. Thêm ngày vào các dòng trống "
                         "bên dưới danh sách.",
        "plan_start": "Ngày bắt đầu", "planned_end": "Ngày kết thúc dự kiến", "working_days": "Số ngày làm việc",
        "total_effort": "Tổng công (ngày công)",
        "milestones": "Các mốc", "gate": "Mốc", "name": "Tên", "wbs": "WBS", "planned_date": "Ngày dự kiến",
        "hard_date": "Hạn cứng", "spare_days": "Dự phòng (ngày làm việc)", "verdict": "Đánh giá",
        "on_time": "Kịp hạn", "late": "Trễ hạn", "criteria": "Tiêu chí hoàn thành",
        "by_phase": "Công theo giai đoạn và vai trò (ngày công)", "phase": "Giai đoạn", "total": "Tổng",
        "start": "Bắt đầu", "end": "Kết thúc",
        "by_release": "Công theo đợt phát hành và vai trò (ngày công)", "release": "Phát hành",
        "no_release": "(chưa gán)",
        "code": "Mã", "level": "Cấp", "desc": "Mô tả", "prio": "Ưu tiên", "role": "Vai trò",
        "mode": "Cách lập lịch", "deps": "Phụ thuộc", "follows": "Làm sau (cùng vai trò)",
        "effort": "Công (ngày công)", "rate": "Tỷ lệ công", "days": "Số ngày làm việc", "ref": "Tham chiếu",
        "coop": "Phối hợp", "note": "Ghi chú",
        "mode_seq": "Tuần tự", "mode_fixed": "Ngày cố định", "mode_span": "Kéo dài từ {a} đến {b}",
        "mode_period": "{months} tháng sau {after}", "mode_tail": "{days} ngày cuối của {of}",
        "role_id": "Mã vai trò", "focus": "Tỷ lệ tập trung", "duties": "Nhiệm vụ",
        "id": "Mã", "kind": "Loại", "assumption": "Giả định", "scope": "Phạm vi", "source": "Nguồn",
        "date": "Ngày",
    },
}


def label(lang: str, key: str, **fmt: object) -> str:
    """LABELS[lang][key] with {placeholders} filled from fmt."""
    s = LABELS[lang][key]
    return s.format(**fmt) if fmt else s
```

- [ ] **Step 4: Write `workbook.py`**

`cli/src/kickoff/workbook.py`:

```python
"""Baseline estimate workbook: WBS, effort and schedule as live Excel formulas. It tracks nothing.

Inputs (blue): plan start, each package's effort (or effort rate), fixed dates, role focus, hard dates, holidays.
Everything else is a formula with the same rules as kickoff.schedule.build_schedule(..., baseline=True).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet

from .labels import label
from .model import Plan, Project, code_key, text
from .schedule import role_queues

HEADER = 4  # header row of every table sheet; rows 1-2 hold the title and the note
FIRST = 5  # first data row
SPARE_HOLIDAYS = 50  # empty rows inside HolidayDates for dates added by hand
WBS_COLUMNS = ("code", "level", "name", "desc", "phase", "release", "prio", "role", "mode", "deps", "follows",
               "effort", "rate", "days", "start", "end", "ref", "coop", "note")
COL = {key: get_column_letter(i + 1) for i, key in enumerate(WBS_COLUMNS)}
WIDTH = {"code": 9, "level": 6, "name": 48, "desc": 40, "phase": 8, "release": 12, "prio": 8, "role": 18,
         "mode": 22, "deps": 16, "follows": 12, "effort": 11, "rate": 9, "days": 10, "start": 12, "end": 12,
         "ref": 12, "coop": 16, "note": 30}
INPUT = Font(color="0000FF")
BOLD = Font(bold=True)
TITLE = Font(bold=True, size=14)
NOTE = Font(italic=True, color="595959")
HEAD_FILL = PatternFill("solid", fgColor="D9E1F2")
PHASE_FILL = PatternFill("solid", fgColor="F2F2F2")
EFFORT_FMT, RATE_FMT, DAYS_FMT, FOCUS_FMT = "0.0#", "0.00", "0", "0%"
_STRFTIME = {"%d": "dd", "%m": "mm", "%Y": "yyyy", "%y": "yy", "%b": "mmm", "%B": "mmmm", "%a": "ddd", "%A": "dddd"}


@dataclass
class Layout:
    """Where verify() and the tests find things. Letters come from WBS_COLUMNS; nothing else hard-codes them."""

    wbs_sheet: str
    cols: dict[str, str]  # WBS column key -> letter
    rows: dict[str, int]  # WBS code (phase, group, package) -> row on the WBS sheet
    estimate_sheet: str
    cells: dict[str, str]  # plan_start, planned_end, working_days, total_effort -> cell on the estimate sheet
    gate_rows: dict[str, int]  # gate id -> row on the estimate sheet
    gate_date_col: str
    resources_sheet: str
    focus_col: str
    focus_rows: dict[str, int]  # role id -> row on the resources sheet


def excel_date_format(fmt: str) -> str:
    """strftime pattern of project.date_format -> Excel number format ("%d/%m/%Y" -> "dd/mm/yyyy")."""
    return re.sub(r"%[a-zA-Z]", lambda m: _STRFTIME.get(m.group(0), ""), fmt)


class _Formulas:
    """WORKDAY/NETWORKDAYS, or their .INTL forms when the weekend is not Saturday + Sunday."""

    def __init__(self, weekend: tuple[int, ...]):
        self.mask = None if set(weekend) == {5, 6} else "".join("1" if d in weekend else "0" for d in range(7))

    def workday(self, start: str, days: str) -> str:
        if self.mask is None:
            return f"WORKDAY({start},{days},HolidayDates)"
        return f'_xlfn.WORKDAY.INTL({start},{days},"{self.mask}",HolidayDates)'

    def networkdays(self, a: str, b: str) -> str:
        if self.mask is None:
            return f"NETWORKDAYS({a},{b},HolidayDates)"
        return f'_xlfn.NETWORKDAYS.INTL({a},{b},"{self.mask}",HolidayDates)'


def _ref(sheet: str, cell: str) -> str:
    return "'" + sheet.replace("'", "''") + "'!" + cell


def _abs(col: str, first: int, last: int) -> str:
    return f"${col}${first}:${col}${last}"


def _ranges(col: str, rows: list[int]) -> str:
    """Rows [7, 8, 9, 11] -> "O7:O9,O11" (consecutive rows collapse into one range)."""
    out: list[str] = []
    rows = sorted(rows)
    i = 0
    while i < len(rows):
        j = i
        while j + 1 < len(rows) and rows[j + 1] == rows[j] + 1:
            j += 1
        out.append(f"{col}{rows[i]}" if i == j else f"{col}{rows[i]}:{col}{rows[j]}")
        i = j + 1
    return ",".join(out)


def _sheet(wb: Workbook, title: str, heading: str, note: str, landscape: bool = True) -> Worksheet:
    ws = wb.create_sheet(title)
    ws["A1"], ws["A2"] = heading, note
    ws["A1"].font, ws["A2"].font = TITLE, NOTE
    if landscape:
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True
    return ws


def _header(ws: Worksheet, row: int, col: int, titles: list[str]) -> None:
    for i, t in enumerate(titles):
        c = ws.cell(row, col + i, t)
        c.font, c.fill = BOLD, HEAD_FILL


def _put(ws: Worksheet, ref: str, value, fmt: str | None = None, font: Font | None = None) -> None:
    c = ws[ref]
    c.value = value
    if fmt:
        c.number_format = fmt
    if font:
        c.font = font


def _validate(ws: Worksheet, kind: str, refs: str, low: str, high: str | None = None) -> None:
    """Data validation on comma-separated cells or ranges: kind >= low, or between low and high."""
    if not refs:
        return
    dv = (DataValidation(type=kind, operator="between", formula1=low, formula2=high) if high
          else DataValidation(type=kind, operator="greaterThanOrEqual", formula1=low))
    for ref in refs.split(","):
        dv.add(ref)
    ws.add_data_validation(dv)


def build_workbook(project: Project, plan: Plan, path: Path) -> Layout:
    lang = project.languages["workbook"]

    def t(key: str, **fmt) -> str:
        return label(lang, key, **fmt)

    date_fmt = excel_date_format(project.date_format)
    f = _Formulas(project.weekend)
    names = {key: t(f"sheet_{key}") for key in ("estimate", "wbs", "resources", "assumptions", "holidays")}
    wb = Workbook()
    wb.remove(wb.active)
    est = _sheet(wb, names["estimate"], t("title_estimate", name=project.name), t("note_estimate"))
    wbs = _sheet(wb, names["wbs"], t("title_wbs"), t("note_wbs", resources=names["resources"]))
    res = _sheet(wb, names["resources"], t("title_resources"), t("note_resources"), landscape=False)
    asm = _sheet(wb, names["assumptions"], t("title_assumptions"), t("note_assumptions"))
    hol = _sheet(wb, names["holidays"], t("title_holidays"), t("note_holidays"), landscape=False)
    wb.calculation.fullCalcOnLoad = True

    # ---------------------------------------------------------------- Holidays (HolidayDates)
    _header(hol, HEADER, 1, [t("date"), t("name"), t("kind")])
    days = sorted(project.holidays.items())
    for i, (d, info) in enumerate(days):
        r = FIRST + i
        _put(hol, f"A{r}", d, date_fmt, INPUT)
        hol[f"B{r}"], hol[f"C{r}"] = info.get("name", ""), info.get("kind", "")
    last_holiday = FIRST + len(days) + SPARE_HOLIDAYS - 1
    for r in range(FIRST + len(days), last_holiday + 1):
        _put(hol, f"A{r}", None, date_fmt, INPUT)
    holidays_ref = _ref(hol.title, _abs("A", FIRST, last_holiday))
    wb.defined_names["HolidayDates"] = DefinedName("HolidayDates", attr_text=holidays_ref)
    _validate(hol, "date", f"A{FIRST}:A{last_holiday}", "1")
    hol.column_dimensions["A"].width, hol.column_dimensions["B"].width, hol.column_dimensions["C"].width = 14, 40, 16
    hol.freeze_panes = f"A{FIRST}"

    # ---------------------------------------------------------------- Resources (focus inputs)
    _header(res, HEADER, 1, [t("role_id"), t("role"), t("focus"), t("effort"), t("duties")])
    focus_rows: dict[str, int] = {}
    for i, role in enumerate(project.roles.values()):
        r = FIRST + i
        focus_rows[role.id] = r
        res[f"A{r}"], res[f"B{r}"] = role.id, project.role_title(role.id, lang)
        _put(res, f"C{r}", role.focus, FOCUS_FMT, INPUT)
        res[f"E{r}"] = text({"duties": role.duties, "i18n": role.i18n}, "duties", lang)
    res_total = FIRST + len(project.roles)
    _validate(res, "decimal", f"C{FIRST}:C{res_total - 1}", "0.01", "1")
    for w, col in zip((12, 26, 10, 14, 70), "ABCDE", strict=True):
        res.column_dimensions[col].width = w

    # ---------------------------------------------------------------- WBS
    by = plan.by_code()
    nodes = {n["code"]: n for n in [*plan.phases, *plan.groups]}
    members = {c: [p.code for p in plan.packages if p.code.startswith(c + ".")] for c in nodes}
    codes = sorted([*by, *(c for c in nodes if members[c])], key=code_key)
    rows = {code: FIRST + i for i, code in enumerate(codes)}
    last = max(FIRST, FIRST + len(codes) - 1)  # keeps column ranges valid for an empty plan
    prev = {code: (q[i - 1] if i else None) for q in role_queues(plan).values() for i, code in enumerate(q)}
    releases = {r.id: r.name for r in project.releases}
    C = COL
    _header(wbs, HEADER, 1, [t(k) for k in WBS_COLUMNS])
    inputs: dict[str, list[int]] = {"effort": [], "rate": [], "fixed": []}
    for code in codes:
        r = rows[code]
        level = len(code.split("."))
        p = by.get(code)
        item = p.as_item() if p else nodes[code]
        desc_key = "objective" if level == 1 else "desc"
        values = {"code": code, "level": level, "name": text(item, "name", lang), "desc": text(item, desc_key, lang),
                  "phase": code.split(".")[0]}
        for key, v in values.items():
            wbs[f"{C[key]}{r}"] = v
        cell = {key: f"{C[key]}{r}" for key in WBS_COLUMNS}
        if p is None:  # phase or group roll-up over its packages
            leaves = [rows[m] for m in members[code]]
            wbs[cell["start"]] = f"=MIN({_ranges(C['start'], leaves)})"
            wbs[cell["end"]] = f"=MAX({_ranges(C['end'], leaves)})"
            wbs[cell["effort"]] = f"=SUM({_ranges(C['effort'], leaves)})"
            wbs[cell["days"]] = "=" + f.networkdays(cell["start"], cell["end"])
            for key in WBS_COLUMNS:
                wbs[cell[key]].font = BOLD
                if level == 1:
                    wbs[cell[key]].fill = PHASE_FILL
            wbs.row_dimensions[r].outlineLevel = level - 1
        else:
            wbs.row_dimensions[r].outlineLevel = 2
            wbs[cell["release"]] = releases.get(p.release, p.release) if p.release else t("no_release")
            wbs[cell["prio"]] = p.prio
            wbs[cell["role"]] = project.role_title(p.role, lang)
            wbs[cell["deps"]] = ", ".join(p.deps)
            wbs[cell["follows"]] = prev.get(code) or ""
            wbs[cell["ref"]], wbs[cell["coop"]], wbs[cell["note"]] = p.ref, p.coop, p.note
            mode = p.mode
            if mode == "seq":
                focus = _ref(res.title, f"$C${focus_rows[p.role]}")
                after = ["PlanStart-1"]
                if prev.get(code):
                    after.append(f"{C['end']}{rows[prev[code]]}")
                after += [f"{C['end']}{rows[d]}" for d in p.deps]
                wbs[cell["mode"]] = t("mode_seq")
                wbs[cell["days"]] = f"=MAX(1,ROUND({cell['effort']}/{focus},0))"
                wbs[cell["start"]] = "=" + f.workday(f"MAX({','.join(after)})", "1")
                wbs[cell["end"]] = "=" + f.workday(cell["start"], f"{cell['days']}-1")
            else:
                wbs[cell["days"]] = "=" + f.networkdays(cell["start"], cell["end"])
                if mode == "fixed":
                    wbs[cell["mode"]] = t("mode_fixed")
                    _put(wbs, cell["start"], p.schedule[1], font=INPUT)
                    _put(wbs, cell["end"], p.schedule[2], font=INPUT)
                    inputs["fixed"].append(r)
                elif mode == "span":
                    a, b = p.schedule[1], p.schedule[2]
                    wbs[cell["mode"]] = t("mode_span", a=a, b=b)
                    wbs[cell["start"]] = f"={C['start']}{rows[a]}"
                    wbs[cell["end"]] = f"={C['end']}{rows[b]}"
                elif mode == "period":
                    after, months = p.schedule[1], p.schedule[2]
                    wbs[cell["mode"]] = t("mode_period", months=months, after=after)
                    wbs[cell["start"]] = "=" + f.workday(f"{C['end']}{rows[after]}", "1")
                    wbs[cell["end"]] = f"=EDATE({cell['start']},{months})-1"
                else:  # tail
                    of, n = p.schedule[1], p.schedule[2]
                    wbs[cell["mode"]] = t("mode_tail", days=n, of=of)
                    wbs[cell["end"]] = f"={C['end']}{rows[of]}"
                    wbs[cell["start"]] = "=" + f.workday(cell["end"], str(-(n - 1)))
            if p.effort_rate is not None:
                _put(wbs, cell["rate"], p.effort_rate, RATE_FMT, INPUT)
                wbs[cell["effort"]] = f"=ROUND({cell['days']}/5*{cell['rate']},1)"
                inputs["rate"].append(r)
            else:
                _put(wbs, cell["effort"], p.effort, font=INPUT)
                inputs["effort"].append(r)
        for key, fmt in (("start", date_fmt), ("end", date_fmt), ("effort", EFFORT_FMT), ("days", DAYS_FMT)):
            wbs[cell[key]].number_format = fmt
    _validate(wbs, "decimal", _ranges(C["effort"], inputs["effort"]), "0")
    _validate(wbs, "decimal", _ranges(C["rate"], inputs["rate"]), "0.001")
    fixed = [_ranges(C[k], inputs["fixed"]) for k in ("start", "end") if inputs["fixed"]]
    _validate(wbs, "date", ",".join(fixed), "1")
    wbs.sheet_properties.outlinePr.summaryBelow = False
    wbs.freeze_panes = f"{C['name']}{FIRST}"
    for key in WBS_COLUMNS:
        wbs.column_dimensions[C[key]].width = WIDTH[key]

    def W(key: str) -> str:  # absolute WBS column range for SUMIF(S)
        return _ref(wbs.title, _abs(C[key], FIRST, last))

    for r in focus_rows.values():
        _put(res, f"D{r}", f"=SUMIF({W('role')},B{r},{W('effort')})", EFFORT_FMT)
    res[f"A{res_total}"] = t("total")
    _put(res, f"D{res_total}", f"=SUM(D{FIRST}:D{res_total - 1})", EFFORT_FMT, BOLD)
    res[f"A{res_total}"].font = BOLD

    # ---------------------------------------------------------------- Assumptions
    _header(asm, HEADER, 1, [t("id"), t("kind"), t("assumption"), t("scope"), t("source")])
    for i, a in enumerate(plan.assumptions):
        r = FIRST + i
        for col, key in zip("ABCDE", ("id", "kind", "text", "scope", "source"), strict=True):
            asm[f"{col}{r}"] = text(a, key, lang) if key != "id" else a["id"]
    for w, col in zip((8, 16, 70, 16, 24), "ABCDE", strict=True):
        asm.column_dimensions[col].width = w

    # ---------------------------------------------------------------- Estimate
    cells = {"plan_start": "B4", "planned_end": "B5", "working_days": "B6", "total_effort": "B7"}
    est["A4"], est["A5"], est["A6"], est["A7"] = t("plan_start"), t("planned_end"), t("working_days"), t("total_effort")
    _put(est, "B4", plan.start, date_fmt, INPUT)
    _validate(est, "date", "B4", "1")
    wb.defined_names["PlanStart"] = DefinedName("PlanStart", attr_text=_ref(est.title, "$B$4"))
    _put(est, "B5", f"=MAX({W('end')})", date_fmt)
    _put(est, "B6", "=" + f.networkdays(f"MIN({W('start')})", "B5"), DAYS_FMT)
    _put(est, "B7", f"=SUMIF({W('level')},3,{W('effort')})", EFFORT_FMT)
    for r in range(4, 8):
        est[f"A{r}"].font = BOLD

    # milestones
    r = 9
    est[f"A{r}"], est[f"A{r}"].font = t("milestones"), BOLD
    r += 1
    _header(est, r, 1, [t("gate"), t("name"), t("wbs"), t("planned_date"), t("hard_date"), t("spare_days"),
                        t("verdict"), t("criteria")])
    gate_rows: dict[str, int] = {}
    for g in plan.gates:
        r += 1
        gate_rows[g["id"]] = r
        est[f"A{r}"], est[f"B{r}"], est[f"C{r}"] = g["id"], text(g, "name", lang), g["at"]
        est[f"H{r}"] = text(g, "criteria", lang)
        if g["at"] in rows:
            _put(est, f"D{r}", "=" + _ref(wbs.title, f"${C['end']}${rows[g['at']]}"), date_fmt)
        _put(est, f"E{r}", project.hard_dates.get(g["id"]), date_fmt, INPUT)
        spare = (f'=IF(OR(D{r}="",E{r}=""),"",IF(D{r}<=E{r},{f.networkdays(f"D{r}+1", f"E{r}")},'
                 f'-{f.networkdays(f"E{r}+1", f"D{r}")}))')
        _put(est, f"F{r}", spare, DAYS_FMT)
        est[f"G{r}"] = f'=IF(F{r}="","",IF(F{r}<0,"{t("late")}","{t("on_time")}"))'
    if gate_rows:
        first_gate, last_gate = min(gate_rows.values()), max(gate_rows.values())
        _validate(est, "date", f"E{first_gate}:E{last_gate}", "1")
        est.conditional_formatting.add(f"F{first_gate}:G{last_gate}",
                                       FormulaRule(formula=[f"$F{first_gate}<0"], font=Font(color="C00000")))

    # effort by phase and role
    roles = list(project.roles)
    rc = {rid: get_column_letter(3 + i) for i, rid in enumerate(roles)}
    total_col, start_col, end_col, days_col = (get_column_letter(3 + len(roles) + i) for i in range(4))
    r += 2
    est[f"A{r}"], est[f"A{r}"].font = t("by_phase"), BOLD
    r += 1
    head = r
    _header(est, head, 1, [t("phase"), t("name"), *(project.role_title(x, lang) for x in roles), t("total"),
                           t("start"), t("end"), t("working_days")])
    phase_rows = []
    for ph in plan.phases:
        if ph["code"] not in rows:
            continue
        r += 1
        phase_rows.append(r)
        w = rows[ph["code"]]
        est[f"A{r}"], est[f"B{r}"] = ph["code"], text(ph, "name", lang)
        for rid in roles:
            col = rc[rid]
            _put(est, f"{col}{r}", f"=SUMIFS({W('effort')},{W('role')},{col}${head},{W('phase')},$A{r})",
                 EFFORT_FMT)
        _put(est, f"{total_col}{r}", f"=SUM({rc[roles[0]]}{r}:{rc[roles[-1]]}{r})", EFFORT_FMT)
        _put(est, f"{start_col}{r}", "=" + _ref(wbs.title, f"${C['start']}${w}"), date_fmt)
        _put(est, f"{end_col}{r}", "=" + _ref(wbs.title, f"${C['end']}${w}"), date_fmt)
        _put(est, f"{days_col}{r}", "=" + _ref(wbs.title, f"${C['days']}${w}"), DAYS_FMT)
    r += 1
    est[f"A{r}"], est[f"A{r}"].font = t("total"), BOLD
    if phase_rows:
        a, b = phase_rows[0], phase_rows[-1]
        for col in [*rc.values(), total_col]:
            _put(est, f"{col}{r}", f"=SUM({col}{a}:{col}{b})", EFFORT_FMT, BOLD)
        _put(est, f"{start_col}{r}", f"=MIN({start_col}{a}:{start_col}{b})", date_fmt, BOLD)
        _put(est, f"{end_col}{r}", f"=MAX({end_col}{a}:{end_col}{b})", date_fmt, BOLD)
        _put(est, f"{days_col}{r}", "=" + f.networkdays(f"{start_col}{r}", f"{end_col}{r}"), DAYS_FMT, BOLD)

    # effort by release and role
    r += 2
    est[f"A{r}"], est[f"A{r}"].font = t("by_release"), BOLD
    r += 1
    head = r
    _header(est, head, 1, [t("release"), t("name"), *(project.role_title(x, lang) for x in roles), t("total")])
    release_rows = [(rel.id, rel.name) for rel in project.releases]
    if any(not p.release for p in plan.packages):
        release_rows.append(("", t("no_release")))
    first_rel = r + 1
    for rid_, name in release_rows:
        r += 1
        est[f"A{r}"], est[f"B{r}"] = rid_, name
        for rid in roles:
            col = rc[rid]
            _put(est, f"{col}{r}", f"=SUMIFS({W('effort')},{W('role')},{col}${head},{W('release')},$B{r})",
                 EFFORT_FMT)
        _put(est, f"{total_col}{r}", f"=SUM({rc[roles[0]]}{r}:{rc[roles[-1]]}{r})", EFFORT_FMT)
    r += 1
    est[f"A{r}"], est[f"A{r}"].font = t("total"), BOLD
    for col in [*rc.values(), total_col]:
        _put(est, f"{col}{r}", f"=SUM({col}{first_rel}:{col}{r - 1})", EFFORT_FMT, BOLD)
    est.column_dimensions["A"].width, est.column_dimensions["B"].width = 26, 44
    for i in range(3, 9 + len(roles)):
        est.column_dimensions[get_column_letter(i)].width = 14

    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)
    return Layout(wbs_sheet=wbs.title, cols=dict(COL), rows=rows, estimate_sheet=est.title, cells=cells,
                  gate_rows=gate_rows, gate_date_col="D", resources_sheet=res.title, focus_col="C",
                  focus_rows=focus_rows)
```

- [ ] **Step 5: Write the Dockerfile and `lo_verify.py`**

`cli/src/kickoff/docker/lo-calc/Dockerfile`:

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends libreoffice-calc-nogui fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
```

`cli/src/kickoff/lo_verify.py`:

```python
"""Recalculate the estimate workbook with LibreOffice in Docker and compare it with the baseline schedule."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook

from .errors import KickoffError
from .model import Plan
from .schedule import Schedule

# Shipped inside the package so it is found after `uv tool install <plugin>/cli` (code runs from site-packages).
DOCKERFILE_DIR = Path(__file__).resolve().parent / "docker" / "lo-calc"
IMAGE = "kickoff-lo-calc"
ERRORS = ("#REF!", "#VALUE!", "#NAME?", "#DIV/0!", "#N/A", "#NUM!", "#NULL!", "Err:")


def docker_available() -> bool:
    if not shutil.which("docker"):
        return False
    return subprocess.run(["docker", "info"], capture_output=True).returncode == 0


def ensure_image(image: str = IMAGE) -> None:
    if subprocess.run(["docker", "image", "inspect", image], capture_output=True).returncode == 0:
        return
    r = subprocess.run(["docker", "build", "-t", image, str(DOCKERFILE_DIR)], capture_output=True, text=True,
                       encoding="utf-8")
    if r.returncode:
        raise KickoffError(f"docker build failed: {r.stderr[-500:]}")


def recalc(path: Path, image: str = IMAGE) -> Path:
    """A recalculated copy of `path` (LibreOffice headless --convert-to xlsx); the input is not changed."""
    ensure_image(image)
    work = Path(tempfile.mkdtemp(prefix="kickoff-lo-"))
    shutil.copy(path, work / "in.xlsx")
    r = subprocess.run(["docker", "run", "--rm", "-v", f"{work}:/w", image, "soffice", "--headless", "--calc",
                        "--convert-to", "xlsx", "--outdir", "/w/out", "/w/in.xlsx"],
                       capture_output=True, text=True, encoding="utf-8")
    out = work / "out" / "in.xlsx"
    if r.returncode or not out.exists():
        raise KickoffError(f"LibreOffice recalculation failed: {r.stderr[-500:]}")
    return out


def _as_date(v) -> date | None:
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    return None


def verify(path: Path, layout, sched: Schedule, plan: Plan) -> list[str]:
    """Problems in a recalculated workbook: error cells, and every WBS row or gate that differs from `sched`."""
    wb = load_workbook(path, data_only=True)
    problems = []
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith(ERRORS):
                    problems.append(f"{ws.title}!{c.coordinate}: {c.value}")
    ws, col = wb[layout.wbs_sheet], layout.cols
    for code, r in layout.rows.items():
        slot = sched.slots.get(code)
        if not slot:
            problems.append(f"{code}: in the workbook but not in the schedule")
            continue
        s, e = _as_date(ws[f"{col['start']}{r}"].value), _as_date(ws[f"{col['end']}{r}"].value)
        days, effort = ws[f"{col['days']}{r}"].value, ws[f"{col['effort']}{r}"].value
        if (s, e, days) != (slot.start, slot.end, slot.workdays):
            problems.append(f"{code}: workbook {s} – {e} ({days} d), schedule {slot.start} – {slot.end} "
                            f"({slot.workdays} d)")
        if not isinstance(effort, int | float) or abs(effort - slot.effort) > 0.005:
            problems.append(f"{code}: workbook effort {effort}, schedule {slot.effort}")
    gates = sched.gate_dates(plan)
    es = wb[layout.estimate_sheet]
    for gid, r in layout.gate_rows.items():
        v = _as_date(es[f"{layout.gate_date_col}{r}"].value)
        if gid in gates and v != gates[gid]:
            problems.append(f"{gid}: workbook {v}, schedule {gates[gid]}")
    total = sum(sched.slots[p.code].effort for p in plan.packages)
    got = es[layout.cells["total_effort"]].value
    if not isinstance(got, int | float) or abs(got - total) > 0.005:
        problems.append(f"total effort: workbook {got}, schedule {total:g}")
    return problems
```

A formula that LibreOffice did not calculate reads back as `None`, so it shows up as a mismatch; a run that recalculates nothing cannot pass.

- [ ] **Step 6: Write the command**

`cli/src/kickoff/commands/workbook_cmd.py`:

```python
"""kickoff workbook [--out PATH] [--verify]"""

from __future__ import annotations

import re
from pathlib import Path

from .. import lo_verify
from ..model import load_plan, load_project, resolve_root
from ..schedule import build_schedule
from ..workbook import build_workbook


def register(sub) -> None:
    p = sub.add_parser("workbook", help="write the estimate workbook: WBS, effort and schedule as formulas")
    p.add_argument("--out", type=Path, default=None)
    p.add_argument("--verify", action="store_true", help="recalculate with LibreOffice (Docker) and compare")
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    project, plan = load_project(root), load_plan(root)
    slug = re.sub(r"[^a-z0-9]+", "-", project.name.lower()).strip("-")
    out = args.out or root / project.docs_root / "06-planning" / f"{slug}-estimate.xlsx"
    layout = build_workbook(project, plan, out)
    print(f"wrote {out}")
    if not args.verify:
        return 0
    if not lo_verify.docker_available():
        print("verify: Docker is not available; LibreOffice recalculation skipped.")
        return 0
    sched = build_schedule(project, plan, baseline=True)
    problems = lo_verify.verify(lo_verify.recalc(out), layout, sched, plan)
    for p in problems:
        print("verify:", p)
    print("verify: OK, zero error cells and every row matches the baseline schedule" if not problems
          else f"verify: {len(problems)} problems")
    return 1 if problems else 0
```

Append `workbook_cmd` to `COMMANDS` in `cli.py`. Add the line `examples/**/*.xlsx` to `.gitignore` (generated workbooks are not committed).

- [ ] **Step 7: Run the tests**

Run: `cd cli && uv run pytest tests/test_workbook.py -q`
Expected: `11 passed` with Docker running (the first run builds the image, a few minutes); `9 passed, 2 skipped` without Docker.
Then: `cd cli && uv run pytest -q && uv run ruff check .`
Expected: all pass, ruff clean.

- [ ] **Step 8: Generate and review the example workbook**

Run: `cd cli && uv run kickoff --root ../examples/ai-minute workbook --verify`
Expected: `wrote …/examples/ai-minute/docs/06-planning/ai-minute-estimate.xlsx`, then `verify: OK, zero error cells and every row matches the baseline schedule` (or the Docker-skipped line).
Open the file in Excel or LibreOffice and check: five sheets (Ước tính, WBS, Nguồn lực, Giả định, Ngày nghỉ); Estimate shows plan start 28/09/2026, planned end 02/06/2028, total effort 336.75, G1 14/10/2026, G5 26/11/2026 against the hard date 27/11/2026 with 1 spare working day and verdict *Kịp hạn*; the phase and release totals both equal 336.75. Change the developer's focus on Nguồn lực from 90% to 50%: WBS dates and G5 move later and G5 turns *Trễ hạn*; undo without saving. List the Vietnamese labels in the task report for the lead's review.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(cli): baseline estimate workbook with LibreOffice verification"
```

---

### Task 8: Tracker adapter and `kickoff tickets plan|push|pull|link`

**Files:**
- Create: `cli/src/kickoff/tracker.py`, `cli/src/kickoff/tickets.py`, `cli/src/kickoff/commands/tickets_cmd.py`
- Modify: `cli/src/kickoff/cli.py` (append `tickets_cmd`)
- Test: `cli/tests/fake_gh.py`, `cli/tests/test_tickets.py`, `cli/tests/test_tickets_example.py`, `cli/tests/test_github_sandbox.py`

**Interfaces:**
- Consumes: loaders, `write_yaml`, `build_schedule`, `actuals_of`, `text`, `Project.role_title`, `KICKOFF_DIR`.
- Produces:
  - `kickoff.tracker`: `TrackerError(KickoffError)`, `IssueSpec`, `Issue` (property `key`), `IssueState`, `Tracker` protocol, `GitHubTracker(cfg, cache, runner=run_gh, dry=False)` (including `prepare(specs)`, which creates missing labels and milestones, and `set_fields(...) -> bool`, which turns a Project or org-field failure into a warning), `with_key(body, key)`, `strip_key(body)`, `body_hash(body)`, `run_gh(args, stdin) -> str`.
  - `kickoff.tickets`: `plan_issues(project, plan, features, sched) -> list[IssueSpec]`; `PushReport` (lists `created, updated, unchanged, drift, links`, plus `mutations`); `push(root, tracker, dry: bool, adopt: bool = False) -> PushReport`; `pull(root, tracker, today: date | None = None) -> list[str]`; `link(root, key, number) -> None`; `make_tracker(project, tickets, dry) -> Tracker`.
  - CLI: `kickoff tickets plan`, `kickoff tickets push [--dry] [--adopt]`, `kickoff tickets pull`, `kickoff tickets link <key> <number>`.

Rules (from the spec): one Epic per feature-map epic (`[E6] Minutes`) and one Story/Task per package with a `ticket` block; the hidden key `<!-- kickoff:<key> -->` ends every body; Status is only set on create (the tracker owns it afterwards); missing `type:*`/`area:*` labels and milestones are created before the first issue; drift (title or body edited in the tracker since the last push) is reported and not overwritten; an issue mapped by `tickets link`, or found without sync state and without the hidden key, is only taken over with `push --adopt`; parent and blocked-by links are read from the tracker (`gh issue list --json parent,blockedBy`) and only missing ones are sent, so a second push makes zero mutations even after manual edits; Project and org-field failures are warnings, never aborts.

- [ ] **Step 1: Write the fake `gh`**

`cli/tests/fake_gh.py`:

```python
"""An in-memory stand-in for the gh CLI, enough for GitHubTracker."""

from __future__ import annotations

import json


class FakeGh:
    def __init__(self):
        self.issues: dict[int, dict] = {}
        self.status: dict[int, str] = {}
        self.labels: set[str] = set()
        self.milestones: set[str] = set()
        self.calls: list[list[str]] = []
        self.mutations: list[str] = []

    def add(self, number, title, body="", state="OPEN", labels=(), closed_at=None, reason=None, milestone=None):
        self.labels.update(labels)
        if milestone:
            self.milestones.add(milestone)
        self.issues[number] = {"number": number, "id": f"I_{number}", "title": title, "body": body, "state": state,
                               "labels": [{"name": n} for n in labels],
                               "milestone": {"title": milestone} if milestone else None, "closedAt": closed_at,
                               "stateReason": reason, "parent": None, "blockedBy": {"nodes": [], "totalCount": 0}}

    def _opt(self, args, flag):
        return [args[i + 1] for i, a in enumerate(args) if a == flag]

    def _vars(self, args):
        out = {}
        for i, a in enumerate(args[:-1]):
            if a in ("-f", "-F") and "=" in args[i + 1] and not args[i + 1].startswith("query="):
                k, v = args[i + 1].split("=", 1)
                out[k] = v
        return out

    @staticmethod
    def _number(node_id):
        return int(node_id.split("_")[1])

    def _check_exists(self, labels, milestones):
        missing = [x for x in labels if x not in self.labels] + [m for m in milestones if m not in self.milestones]
        assert not missing, f"gh would fail: unknown label or milestone {missing}"

    def __call__(self, args, stdin=None):
        self.calls.append(args)
        if args[:2] == ["issue", "list"]:
            return json.dumps(list(self.issues.values()))
        if args[:2] == ["issue", "view"]:
            return json.dumps({"id": f"I_{args[2]}"})
        if args[:2] == ["label", "list"]:
            return json.dumps([{"name": n} for n in sorted(self.labels)])
        if args[:2] == ["label", "create"]:
            self.labels.add(args[2])
            self.mutations.append(f"label {args[2]}")
            return ""
        if args[:3] == ["api", "--method", "GET"]:
            return json.dumps([{"title": t} for t in sorted(self.milestones)])
        if args[0] == "api" and args[1].startswith("repos/") and args[1].endswith("/milestones"):
            title = next(a[len("title="):] for a in args if a.startswith("title="))
            self.milestones.add(title)
            self.mutations.append(f"milestone {title}")
            return "{}"
        if args[:2] == ["issue", "create"]:
            n = max(self.issues, default=0) + 1
            ms = self._opt(args, "--milestone")
            labels = self._opt(args, "--label")
            self._check_exists(labels, ms)
            self.add(n, self._opt(args, "--title")[0], stdin or "", labels=labels, milestone=ms[0] if ms else None)
            self.mutations.append(f"create {n}")
            return f"https://github.com/o/r/issues/{n}\n"
        if args[:2] == ["issue", "edit"]:
            it = self.issues[int(args[2])]
            self._check_exists(self._opt(args, "--add-label"), self._opt(args, "--milestone"))
            if self._opt(args, "--title"):
                it["title"] = self._opt(args, "--title")[0]
            if "--body-file" in args:
                it["body"] = stdin
            names = [x["name"] for x in it["labels"]]
            names = [n for n in names if n not in self._opt(args, "--remove-label")] + self._opt(args, "--add-label")
            it["labels"] = [{"name": n} for n in names]
            if self._opt(args, "--milestone"):
                it["milestone"] = {"title": self._opt(args, "--milestone")[0]}
            self.mutations.append(f"edit {args[2]}")
            return ""
        if args[:2] == ["project", "item-list"]:
            return json.dumps({"items": [{"content": {"number": n}, "status": s} for n, s in self.status.items()]})
        if args[:2] == ["api", "graphql"]:
            q = next(a[len("query="):] for a in args if a.startswith("query="))
            if q.lstrip().startswith("mutation"):
                self.mutations.append(q.split("(input", 1)[0].split("{", 1)[1])
                v = self._vars(args)
                if "addSubIssue" in q:
                    self.issues[self._number(v["c"])]["parent"] = {"number": self._number(v["p"])}
                if "addBlockedBy" in q:
                    node = self.issues[self._number(v["i"])]["blockedBy"]
                    node["nodes"].append({"number": self._number(v["b"])})
                    node["totalCount"] += 1
            if "projectV2(number" in q:
                return json.dumps({"data": {"organization": {"projectV2": {"id": "PVT_1", "fields": {"nodes": [
                    {"id": "F_S", "name": "Status", "options": [{"id": "o_b", "name": "Backlog"}, {"id": "o_r", "name": "Ready"}]},
                    {"id": "F_R", "name": "Release", "options": [{"id": "o_m", "name": "MVP"}]},
                    {"id": "F_I", "name": "Sprint", "configuration": {"iterations": [{"id": "it1", "title": "Sprint 1"}]}},
                    {}]}}}}})
            if "addProjectV2ItemById" in q:
                return json.dumps({"data": {"addProjectV2ItemById": {"item": {"id": "PVTI_1"}}}})
            return json.dumps({"data": {}})
        raise AssertionError(f"unexpected gh call {args}")
```

- [ ] **Step 2: Write the failing tests**

`cli/tests/test_tickets.py`:

```python
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
```

- [ ] **Step 3: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_tickets.py -q`
Expected: FAIL — `No module named 'kickoff.tickets'`.

- [ ] **Step 4: Write `tracker.py`**

```python
"""Tracker adapters. GitHubTracker talks to GitHub through the gh CLI, so no token is stored."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date
from typing import Protocol

from .errors import KickoffError

KEY_MARK = re.compile(r"<!-- kickoff:(?P<key>[A-Za-z0-9.\-]+) -->")


class TrackerError(KickoffError):
    pass


def with_key(body: str, key: str) -> str:
    return strip_key(body) + f"\n\n<!-- kickoff:{key} -->\n"


def strip_key(body: str) -> str:
    return KEY_MARK.sub("", (body or "").replace("\r\n", "\n")).rstrip()


def body_hash(body: str) -> str:
    return hashlib.sha1(strip_key(body).encode("utf-8")).hexdigest()[:12]


@dataclass
class IssueSpec:
    key: str
    title: str
    body: str
    type: str
    labels: list[str] = field(default_factory=list)
    milestone: str | None = None
    parent_key: str | None = None
    blocked_by: list[str] = field(default_factory=list)
    fields: dict = field(default_factory=dict)


@dataclass
class Issue:
    number: int
    node_id: str
    title: str
    body: str
    state: str
    labels: list[str] = field(default_factory=list)
    milestone: str | None = None
    closed_at: date | None = None
    state_reason: str | None = None
    parent: int | None = None
    blocked_by: list[int] = field(default_factory=list)

    @property
    def key(self) -> str | None:
        m = KEY_MARK.search(self.body or "")
        return m.group("key") if m else None


@dataclass
class IssueState:
    state: str  # open | in_progress | done | dropped
    closed: date | None = None


class Tracker(Protocol):
    log: list[str]
    warnings: list[str]

    def get(self, number: int) -> Issue | None: ...
    def find_by_key(self, key: str) -> Issue | None: ...
    def upsert_issue(self, spec: IssueSpec, existing: Issue | None) -> tuple[Issue, str]: ...
    def set_parent(self, child: Issue, parent: Issue) -> None: ...
    def set_blocked_by(self, issue: Issue, blockers: list[Issue]) -> None: ...
    def prepare(self, specs: list[IssueSpec]) -> None: ...
    def set_fields(self, issue: Issue, fields: dict, *, created: bool) -> bool: ...
    def list_states(self, numbers: list[int]) -> dict[int, IssueState]: ...


Runner = Callable[[list[str], str | None], str]


def run_gh(args: list[str], stdin: str | None = None) -> str:
    r = subprocess.run(["gh", *args], input=stdin, capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        raise TrackerError(f"gh {' '.join(args[:3])}: {r.stderr.strip()}")
    return r.stdout


class GitHubTracker:
    def __init__(self, cfg: dict, cache: dict, runner: Runner = run_gh, dry: bool = False):
        self.cfg, self.cache, self.run, self.dry = cfg, cache, runner, dry
        self.repo = f"{cfg['org']}/{cfg['repo']}"
        self.log: list[str] = []
        self.warnings: list[str] = []
        self._issues: dict[int, Issue] | None = None

    # ------------------------------------------------ reads
    def _load(self) -> dict[int, Issue]:
        if self._issues is None:
            out = self.run(["issue", "list", "-R", self.repo, "--state", "all", "--limit", "2000", "--json",
                            "number,id,title,body,state,labels,milestone,closedAt,stateReason,parent,blockedBy"], None)
            self._issues = {}
            for i in json.loads(out):
                closed = i.get("closedAt")
                blockers = (i.get("blockedBy") or {}).get("nodes") or []
                self._issues[i["number"]] = Issue(
                    i["number"], i["id"], i["title"], i.get("body") or "", i["state"].lower(),
                    [lb["name"] for lb in i.get("labels") or []], (i.get("milestone") or {}).get("title"),
                    date.fromisoformat(closed[:10]) if closed else None, (i.get("stateReason") or "").lower() or None,
                    (i.get("parent") or {}).get("number"), [b["number"] for b in blockers if b.get("number")])
        return self._issues

    def get(self, number: int) -> Issue | None:
        return self._load().get(number)

    def find_by_key(self, key: str) -> Issue | None:
        return next((i for i in self._load().values() if i.key == key), None)

    def _gql(self, query: str, **variables) -> dict:
        if query.lstrip().startswith("mutation"):
            self.log.append(query.split("(input", 1)[0].split("{", 1)[1])
            if self.dry:
                return {"data": {}}
        args = ["api", "graphql", "-f", f"query={query}"]
        for k, v in variables.items():
            args += ["-F" if isinstance(v, int) else "-f", f"{k}={v}"]
        return json.loads(self.run(args, None))

    def prepare(self, specs: list[IssueSpec]) -> None:
        """Create the labels and milestones the specs use, once (writes are skipped in a dry run)."""
        labels = sorted({lb for s in specs for lb in s.labels})
        milestones = sorted({s.milestone for s in specs if s.milestone})
        have = {x["name"] for x in json.loads(self.run(
            ["label", "list", "-R", self.repo, "--limit", "500", "--json", "name"], None))}
        for lb in labels:
            if lb not in have:
                self.log.append(f"create label {lb}")
                if not self.dry:
                    self.run(["label", "create", lb, "-R", self.repo], None)
        existing = json.loads(self.run(["api", "--method", "GET", f"repos/{self.repo}/milestones", "-f", "state=all",
                                        "-F", "per_page=100"], None))
        have_ms = {m["title"] for m in existing}
        for m in milestones:
            if m not in have_ms:
                self.log.append(f"create milestone {m}")
                if not self.dry:
                    self.run(["api", f"repos/{self.repo}/milestones", "-f", f"title={m}"], None)

    # ------------------------------------------------ issues
    def upsert_issue(self, spec: IssueSpec, existing: Issue | None) -> tuple[Issue, str]:
        body = with_key(spec.body, spec.key)
        if existing is None:
            self.log.append(f"create {spec.title}")
            if self.dry:
                return Issue(0, "", spec.title, body, "open", list(spec.labels), spec.milestone), "create"
            args = ["issue", "create", "-R", self.repo, "--title", spec.title, "--body-file", "-",
                    "--assignee", self.cfg["assignee"]]
            for lb in spec.labels:
                args += ["--label", lb]
            if spec.milestone:
                args += ["--milestone", spec.milestone]
            number = int(self.run(args, body).strip().rsplit("/", 1)[1])
            node = json.loads(self.run(["issue", "view", str(number), "-R", self.repo, "--json", "id"], None))["id"]
            issue = Issue(number, node, spec.title, body, "open", list(spec.labels), spec.milestone)
            self._load()[number] = issue
            return issue, "create"
        args = ["issue", "edit", str(existing.number), "-R", self.repo]
        changes = []
        if existing.title != spec.title:
            args += ["--title", spec.title]
            changes.append("title")
        if strip_key(existing.body) != strip_key(body) or existing.key != spec.key:
            args += ["--body-file", "-"]
            changes.append("body")
        for lb in existing.labels:
            if lb.startswith(("type:", "area:")) and lb not in spec.labels:
                args += ["--remove-label", lb]
                changes.append(f"-{lb}")
        for lb in spec.labels:
            if lb not in existing.labels:
                args += ["--add-label", lb]
                changes.append(f"+{lb}")
        if spec.milestone and existing.milestone != spec.milestone:
            args += ["--milestone", spec.milestone]
            changes.append("milestone")
        if not changes:
            return existing, "unchanged"
        self.log.append(f"update #{existing.number} {', '.join(changes)}")
        if not self.dry:
            self.run(args, body if "body" in changes else None)
            existing.title, existing.body = spec.title, body
            existing.labels = [lb for lb in existing.labels if not lb.startswith(("type:", "area:"))] + list(spec.labels)
            existing.milestone = spec.milestone or existing.milestone
        return existing, "update"

    # ------------------------------------------------ links
    def _tolerant(self, query: str, **v) -> None:
        try:
            self._gql(query, **v)
        except TrackerError as exc:
            msg = str(exc).lower()
            if "duplicate" not in msg and "already" not in msg:
                raise

    def set_parent(self, child: Issue, parent: Issue) -> None:
        self._tolerant("mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c,replaceParent:true})"
                       "{clientMutationId}}", p=parent.node_id, c=child.node_id)

    def set_blocked_by(self, issue: Issue, blockers: list[Issue]) -> None:
        for b in blockers:
            self._tolerant("mutation($i:ID!,$b:ID!){addBlockedBy(input:{issueId:$i,blockingIssueId:$b})"
                           "{clientMutationId}}", i=issue.node_id, b=b.node_id)

    # ------------------------------------------------ fields
    def _project(self) -> dict:
        c = self.cache.setdefault("project", {})
        if not c:
            q = ("query($org:String!,$n:Int!){organization(login:$org){projectV2(number:$n){id fields(first:50){nodes{"
                 "... on ProjectV2SingleSelectField{id name options{id name}} "
                 "... on ProjectV2IterationField{id name configuration{iterations{id title}}}}}}}}")
            pj = self._gql(q, org=self.cfg["org"], n=int(self.cfg["project"]))["data"]["organization"]["projectV2"]
            c["id"], c["fields"] = pj["id"], {}
            for f in pj["fields"]["nodes"]:
                if not f:
                    continue
                iteration = "configuration" in f
                opts = f["configuration"]["iterations"] if iteration else f.get("options") or []
                c["fields"][f["name"]] = {"id": f["id"], "kind": "iteration" if iteration else "select",
                                          "options": {o.get("name") or o.get("title"): o["id"] for o in opts}}
        return c

    def set_fields(self, issue: Issue, fields: dict, *, created: bool) -> bool:
        """Set Project and org issue fields. A failure becomes a warning (False), never an abort."""
        if self.dry:
            self.log.append(f"fields #{issue.number} {sorted(k for k, v in fields.items() if v)}")
            return True
        try:
            self._set_project_fields(issue, fields, created)
            self._set_org_fields(issue, fields)
        except (TrackerError, KeyError, TypeError) as exc:
            self.warnings.append(f"#{issue.number}: fields not set: {exc}")
            return False
        return True

    def _set_project_fields(self, issue: Issue, fields: dict, created: bool) -> None:
        pj = self._project()
        item = self._gql("mutation($p:ID!,$c:ID!){addProjectV2ItemById(input:{projectId:$p,contentId:$c}){item{id}}}",
                         p=pj["id"], c=issue.node_id)["data"]["addProjectV2ItemById"]["item"]["id"]
        for name in ("Status", "Release", "Sprint"):
            value = fields.get(name)
            if value is None or (name == "Status" and not created):
                continue
            f = pj["fields"].get(name)
            if not f or value not in f["options"]:
                self.warnings.append(f"#{issue.number}: project field {name} has no option {value!r}")
                continue
            v = (f'{{iterationId:"{f["options"][value]}"}}' if f["kind"] == "iteration"
                 else f'{{singleSelectOptionId:"{f["options"][value]}"}}')
            self._gql("mutation($p:ID!,$i:ID!,$f:ID!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,"
                      "fieldId:$f,value:" + v + "}){clientMutationId}}", p=pj["id"], i=item, f=f["id"])

    def _set_org_fields(self, issue: Issue, fields: dict) -> None:
        issue_fields = self.cfg.get("issue_fields") or {}
        pmap = (self.cfg.get("priority") or {}).get("map") or {}
        parts = []
        pf, prio = issue_fields.get("Priority"), fields.get("Priority")
        if pf and prio and pmap.get(prio) in (pf.get("options") or {}):
            parts.append(f'{{fieldId:"{pf["id"]}",singleSelectOptionId:"{pf["options"][pmap[prio]]}"}}')
        for name in ("Start", "Target"):
            f, value = issue_fields.get(name), fields.get(name)
            if f and value:
                parts.append(f'{{fieldId:"{f["id"]}",dateValue:"{value}"}}')
        if parts:
            self._gql("mutation($i:ID!){setIssueFieldValue(input:{issueId:$i,issueFields:[" + ",".join(parts) + "]})"
                      "{clientMutationId}}", i=issue.node_id)

    # ------------------------------------------------ progress
    def list_states(self, numbers: list[int]) -> dict[int, IssueState]:
        status: dict[int, str] = {}
        try:
            out = self.run(["project", "item-list", str(self.cfg["project"]), "--owner", self.cfg["org"], "--format",
                            "json", "--limit", "2000"], None)
            for it in json.loads(out).get("items", []):
                num = (it.get("content") or {}).get("number")
                if num:
                    status[num] = it.get("status")
        except TrackerError as exc:
            self.warnings.append(f"project status not read: {exc}")
        result: dict[int, IssueState] = {}
        for n in numbers:
            i = self.get(n)
            if not i:
                continue
            if i.state == "closed":
                result[n] = IssueState("dropped" if i.state_reason == "not_planned" else "done", i.closed_at)
            elif status.get(n) in ("In progress", "In review"):
                result[n] = IssueState("in_progress")
            else:
                result[n] = IssueState("open")
        return result
```

- [ ] **Step 5: Write `tickets.py`**

```python
"""Plan tracker issues from .kickoff data, push them idempotently, pull progress back."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from pathlib import Path

from .errors import KickoffError
from .model import (
    KICKOFF_DIR,
    Features,
    Plan,
    Project,
    load_features,
    load_plan,
    load_project,
    load_tickets,
    text,
    to_date,
    write_yaml,
)
from .schedule import Schedule, actuals_of, build_schedule
from .tracker import GitHubTracker, Issue, IssueSpec, Tracker, body_hash, strip_key, with_key


def _fmt(d: date, project: Project) -> str:
    return d.strftime(project.date_format)


def _blob(project: Project, path: str) -> str:
    base = project.tracker.get("blob_base")
    return f"{base}/{path}" if base else path


def epic_body(project: Project, features: Features, eid: str) -> str:
    lang = project.languages["repo"]
    e = features.epic(eid)
    rows = [f"| {f.id} | {text({'name': f.name, 'i18n': f.i18n}, 'name', lang)} | {f.release} | {f.prio} | "
            f"{', '.join(f.wbs) or '—'} |" for f in e.features if f.status == "active"]
    parts = []
    if e.goal:
        parts += ["## Goal", "", e.goal, ""]
    parts += ["## Scope", "", "| ID | Item | Release | Priority | WBS |", "| --- | --- | --- | --- | --- |", *rows, "",
              "## References", "", f"- Feature map: {_blob(project, project.docs_root + '/02-requirements/feature-map.md')}",
              f"- Plan: {_blob(project, project.docs_root + '/06-planning/plan.md')}", "",
              "Work packages are linked below as sub-issues."]
    return "\n".join(parts)


def package_body(project: Project, plan: Plan, sched: Schedule, code: str) -> str:
    lang = project.languages["repo"]
    p = plan.by_code()[code]
    t = p.ticket or {}
    s = sched.slots[code]
    head = (f"**WBS:** {code} · **Role:** {project.role_title(p.role, lang)} · **Effort:** {s.effort:g} d · "
            f"**Planned:** {_fmt(s.start, project)} – {_fmt(s.end, project)} · **Priority:** {p.prio}")
    parts = [head, "", t.get("desc") or text(p.as_item(), "desc", lang), ""]
    if t.get("ac"):
        parts += ["### Acceptance criteria", "", *(f"- [ ] {a}" for a in t["ac"]), ""]
    parts += ["### References", ""]
    if p.ref:
        parts.append(f"- Features: {p.ref} ({_blob(project, project.docs_root + '/02-requirements/feature-map.md')})")
    parts.append(f"- Schedule and dependencies: `.kickoff/plan.yaml` (WBS {code}); blocked-by links on this issue.")
    return "\n".join(parts)


def plan_issues(project: Project, plan: Plan, features: Features, sched: Schedule) -> list[IssueSpec]:
    ticketed = [p for p in plan.packages if p.ticket]
    by = plan.by_code()
    specs: list[IssueSpec] = []
    lang = project.languages["repo"]
    for e in features.epics:
        ends = [sched.slots[p.code].end for p in ticketed if p.ticket["epic"] == e.id]
        fields = {"Priority": "P0", "Release": e.release or project.releases[0].id, "Status": "Backlog"}
        if ends:
            fields["Target"] = max(ends).isoformat()
        specs.append(IssueSpec(
            key=e.id, title=f"[{e.id}] {text({'name': e.name, 'i18n': e.i18n}, 'name', lang)}",
            body=epic_body(project, features, e.id), type="epic", labels=["type:epic", *e.areas], fields=fields))
    for p in ticketed:
        t = p.ticket
        s = sched.slots[p.code]
        specs.append(IssueSpec(
            key=p.code, title=f"[{p.code}] {t['title']}", body=package_body(project, plan, sched, p.code),
            type=t["type"], labels=[f"type:{t['type']}", *t.get("areas", [])],
            milestone=t.get("milestone") or project.tracker.get("milestone"), parent_key=t["epic"],
            blocked_by=[d for d in p.deps if by[d].ticket],
            fields={"Priority": p.prio, "Start": s.start.isoformat(), "Target": s.end.isoformat(),
                    "Release": p.release, "Sprint": t.get("sprint"), "Status": t.get("status", "Backlog")}))
    return specs


def _fields_hash(fields: dict) -> str:
    stable = {k: v for k, v in fields.items() if k != "Status"}
    return hashlib.sha1(json.dumps(stable, sort_keys=True, default=str).encode()).hexdigest()[:12]


@dataclass
class PushReport:
    created: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)
    drift: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    mutations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def make_tracker(project: Project, tickets: dict, dry: bool) -> Tracker:
    if project.tracker.get("kind") != "github":
        raise KickoffError("tracker.kind is not 'github'; nothing to sync")
    return GitHubTracker(project.tracker, tickets.setdefault("tracker_cache", {}), dry=dry)


def _save(root: Path, tickets: dict) -> None:
    write_yaml(root / KICKOFF_DIR / "tickets.yaml", tickets)


def _drift(existing: Issue, rec: dict, spec: IssueSpec, adopt: bool) -> str | None:
    """Why this issue must not be overwritten, or None when it may be updated."""
    if strip_key(existing.body) != strip_key(spec.body):
        if not rec.get("body_hash"):
            if existing.key != spec.key and not adopt:
                return "issue has no recorded sync state (use --adopt to replace its title and body)"
        elif body_hash(existing.body) != rec["body_hash"]:
            return "body edited in the tracker since the last push"
    if rec.get("title") and existing.title not in (rec["title"], spec.title):
        return "title edited in the tracker since the last push"
    return None


def push(root: Path, tracker: Tracker, dry: bool, adopt: bool = False) -> PushReport:
    project, plan, features = load_project(root), load_plan(root), load_features(root)
    tickets = load_tickets(root)
    sched = build_schedule(project, plan, actuals_of(tickets))
    specs = plan_issues(project, plan, features, sched)
    items = tickets.setdefault("items", {})
    if isinstance(getattr(tracker, "cache", None), dict):
        tickets["tracker_cache"] = tracker.cache
    report = PushReport()
    issues: dict[str, Issue] = {}
    now = datetime.now(UTC).replace(microsecond=0).isoformat()
    tracker.prepare(specs)
    for spec in specs:
        rec = dict(items.get(spec.key) or {})
        existing = tracker.get(rec["issue"]) if rec.get("issue") else tracker.find_by_key(spec.key)
        problem = _drift(existing, rec, spec, adopt) if existing else None
        if problem:
            report.drift.append(f"{spec.key} #{existing.number}: {problem}; not overwritten")
            issues[spec.key] = existing
            items[spec.key] = {**rec, "issue": existing.number}
            continue
        issue, action = tracker.upsert_issue(spec, existing)
        {"create": report.created, "update": report.updated, "unchanged": report.unchanged}[action].append(spec.key)
        issues[spec.key] = issue
        fh = _fields_hash(spec.fields)
        synced = True
        if action == "create" or rec.get("fields_hash") != fh:
            synced = tracker.set_fields(issue, spec.fields, created=action == "create")
        rec.update({"issue": issue.number, "type": spec.type, "parent": spec.parent_key, "synced": now,
                    "title": spec.title, "body_hash": body_hash(with_key(spec.body, spec.key))})
        if synced:
            rec["fields_hash"] = fh
        else:
            rec.pop("fields_hash", None)
        items[spec.key] = rec
    for spec in specs:
        issue = issues[spec.key]
        if spec.parent_key in issues and issue.parent != issues[spec.parent_key].number:
            tracker.set_parent(issue, issues[spec.parent_key])
            report.links.append(f"{spec.key} -> parent {spec.parent_key}")
        new = [b for b in spec.blocked_by if b in issues and issues[b].number not in issue.blocked_by]
        if new:
            tracker.set_blocked_by(issue, [issues[b] for b in new])
            report.links.append(f"{spec.key} blocked by {', '.join(new)}")
    report.mutations = list(tracker.log)
    report.warnings = list(tracker.warnings)
    if not dry:
        _save(root, tickets)
    return report


def pull(root: Path, tracker: Tracker, today: date | None = None) -> list[str]:
    today = today or date.today()
    project, plan = load_project(root), load_plan(root)
    tickets = load_tickets(root)
    items, actuals = tickets.setdefault("items", {}), tickets.setdefault("actuals", {})
    before = build_schedule(project, plan, actuals_of(tickets))
    by = plan.by_code()
    states = tracker.list_states([r["issue"] for k, r in items.items() if k in by])
    lines = []
    for key, rec in items.items():
        st = states.get(rec["issue"]) if key in by else None
        if not st:
            continue
        a = {k: to_date(v) for k, v in (actuals.get(key) or {}).items()}
        if st.state == "done" and st.closed and a.get("done") != st.closed:
            a["done"] = st.closed
            lines.append(f"{key}: planned end {before.slots[key].end.isoformat()} -> actual {st.closed.isoformat()}")
        elif st.state == "in_progress" and "started" not in a:
            a["started"] = today
            lines.append(f"{key}: started {today.isoformat()}")
        if a:
            actuals[key] = a
    after = build_schedule(project, plan, actuals_of(tickets))
    b, n = before.gate_dates(plan), after.gate_dates(plan)
    lines += [f"gate {g}: {b[g].isoformat()} -> {n[g].isoformat()}" for g in n if g in b and n[g] != b[g]]
    _save(root, tickets)
    return lines


def link(root: Path, key: str, number: int) -> None:
    tickets = load_tickets(root)
    tickets.setdefault("items", {}).setdefault(key, {})["issue"] = int(number)
    _save(root, tickets)
```

- [ ] **Step 6: Write the command**

`cli/src/kickoff/commands/tickets_cmd.py`:

```python
"""kickoff tickets plan | push [--dry] [--adopt] | pull | link <key> <number>"""

from __future__ import annotations

from ..model import load_features, load_plan, load_project, load_tickets, resolve_root
from ..schedule import actuals_of, build_schedule
from ..tickets import link, make_tracker, plan_issues, pull, push


def register(sub) -> None:
    p = sub.add_parser("tickets", help="plan, push and pull tracker issues")
    s = p.add_subparsers(dest="tickets_command", metavar="<action>", required=True)
    s.add_parser("plan", help="print the issues the plan would create")
    ps = s.add_parser("push", help="create and update issues in the tracker")
    ps.add_argument("--dry", action="store_true")
    ps.add_argument("--adopt", action="store_true",
                    help="replace title and body of issues mapped with `tickets link` or found without sync state")
    s.add_parser("pull", help="pull issue progress into actuals and show moved gates")
    lk = s.add_parser("link", help="map a WBS code or epic id to an existing issue number")
    lk.add_argument("key")
    lk.add_argument("number", type=int)
    p.set_defaults(func=run)


def run(args) -> int:
    root = resolve_root(args.root)
    cmd = args.tickets_command
    if cmd == "plan":
        project, plan, features = load_project(root), load_plan(root), load_features(root)
        sched = build_schedule(project, plan, actuals_of(load_tickets(root)))
        for spec in plan_issues(project, plan, features, sched):
            parent = f"  parent {spec.parent_key}" if spec.parent_key else ""
            blocked = f"  blocked by {', '.join(spec.blocked_by)}" if spec.blocked_by else ""
            print(f"{spec.type:<6} {spec.title}{parent}{blocked}")
        return 0
    if cmd == "link":
        link(root, args.key, args.number)
        print(f"{args.key} -> #{args.number}")
        return 0
    project = load_project(root)
    tracker = make_tracker(project, load_tickets(root), dry=getattr(args, "dry", False))
    if cmd == "pull":
        for line in pull(root, tracker) or ["no changes"]:
            print(line)
        return 0
    report = push(root, tracker, dry=args.dry, adopt=args.adopt)
    for name in ("created", "updated", "drift", "links", "warnings"):
        for item in getattr(report, name):
            print(f"{name:<8} {item}")
    print(f"{len(report.created)} created, {len(report.updated)} updated, {len(report.unchanged)} unchanged, "
          f"{len(report.drift)} drift, {len(report.mutations)} mutations" + (" (dry run)" if args.dry else ""))
    return 1 if report.drift else 0
```

Append `tickets_cmd` to `COMMANDS`.

- [ ] **Step 7: Run the tests**

Run: `cd cli && uv run pytest -q -m "not browser" && uv run ruff check .`
Expected: all pass.

- [ ] **Step 7b: Test the example and the real GitHub shapes**

`cli/tests/test_tickets_example.py` (acceptance criterion 3, offline):

```python
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
```

`cli/tests/test_github_sandbox.py` (opt-in; the only test that proves the real `gh` JSON shapes and that a second push is a no-op). Prerequisite for the human: create a private sandbox repository with a Projects v2 board that has Status, Release and Sprint fields, then `export KICKOFF_SANDBOX=<org>/<repo>#<project number>` (and optionally `KICKOFF_SANDBOX_ASSIGNEE`):

```python
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
```

Run `cd cli && uv run pytest tests/test_tickets_example.py -q` (must pass) and, if the sandbox exists, `uv run pytest -m github -q`. Close the sandbox issues afterwards.

- [ ] **Step 8: Dry-run against the example (read-only on GitHub)**

Run: `cd cli && uv run kickoff --root ../examples/ai-minute tickets plan | head -20`
Expected: epic lines `[E0] Project inception` … then `[1.1.1] Test data: …` with parents and blocked-by lists. Do **not** run `push` against `ivai-dev/ai-minute`.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(cli): GitHub tracker adapter and idempotent ticket push/pull"
```

---

### Task 9: Phases, gates and `kickoff init|status|can|phase|gate`

**Files:**
- Create: `cli/src/kickoff/state.py`, `cli/src/kickoff/commands/state_cmd.py`
- Create: `cli/src/kickoff/templates/__init__.py`, `cli/src/kickoff/templates/project.yaml`
- Modify: `cli/src/kickoff/cli.py` (append `state_cmd`)
- Test: `cli/tests/test_state.py`

**Interfaces:**
- Consumes: `write_yaml`, `load_state`, `resolve_root`, `KICKOFF_DIR`, `ModelError`.
- Produces:
  - `kickoff.state`: `PHASES` (list, spec order), `GATES` (id → description), `GATE_AFTER` (gate → phase), `REQUIRES` (phase → (phases, gates)); `blockers(state, phase, baseline=False) -> list[str]`; `set_phase(state, phase, status)`; `approve(state, gate, by, evidence, day) -> None` (raises `KickoffError` when its phase is not done or evidence is empty); `reopen(state, gate, reason) -> list[str]` (returns phases marked stale); `next_step(state) -> str`; `status_lines(state) -> list[str]`; `init_project(root, name, today) -> list[Path]`.
  - CLI: `kickoff init --name NAME`, `kickoff status [--json]`, `kickoff can <phase> [--baseline]` (exit 0 allowed / 1 blocked), `kickoff phase start|done <phase>`, `kickoff gate approve <id> --by WHO --evidence LINK [--date YYYY-MM-DD]`, `kickoff gate reopen <id> --reason TEXT`.

Gate rules (spec §4): `research`, `feature-map` need C1; `ux-design`, `prototype`, draft `plan` need C2; `solution` needs C3 and C4; baseline `plan` needs C5; `signoff` and `feedback` need phase `prototype` done; `tickets` needs phase `plan` done. Approving a gate needs its phase done (`C1` discovery, `C2` feature-map, `C3`/`C4` signoff, `C5` solution, `C6` plan) and non-empty evidence. Reopening `C3` removes `C3` and `C4`, sets `signoff` to `in_progress`, and marks every done phase after `signoff` in `PHASES` order stale. `phase done X` removes X from `stale` and removes the gates that follow X, so they must be approved again. A phase whose prerequisite is `stale` is blocked (`can` says "phase X is stale: re-run it first"); the stale phase itself may be re-run. C4 needs C3, C6 needs C5, a gate cannot be approved while its phase is stale, and `--by` must not be empty.

- [ ] **Step 1: Write the failing tests**

`cli/tests/test_state.py`:

```python
from datetime import date

import pytest

from kickoff.cli import main
from kickoff.errors import KickoffError
from kickoff.model import load_state, read_yaml
from kickoff.state import approve, blockers, next_step, reopen, set_phase


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
    with pytest.raises(KickoffError, match="phase discovery is not done"):
        approve(s, "C1", "Project lead", "link", date(2026, 9, 25))
    set_phase(s, "discovery", "done")
    with pytest.raises(KickoffError, match="evidence"):
        approve(s, "C1", "Project lead", " ", date(2026, 9, 25))
    with pytest.raises(KickoffError, match="--by"):
        approve(s, "C1", " ", "link", date(2026, 9, 25))


def test_reopen_c3_marks_later_phases_stale():
    s = fresh()
    for p in ("signoff", "solution", "plan", "tickets"):
        set_phase(s, p, "done")
    approve(s, "C3", "Customer", "x", date(2026, 10, 1))
    approve(s, "C4", "Customer", "x", date(2026, 10, 1))
    assert reopen(s, "C3", "FB session 2026-10-08") == ["solution", "plan", "tickets"]
    assert "C3" not in s["gates"] and "C4" not in s["gates"]
    assert s["phases"]["signoff"] == "in_progress"
    assert next_step(s) == "continue kickoff:signoff; then re-run stale: solution, plan, tickets"
    assert blockers(s, "solution") == ["phase signoff is not done",
                                       "gate C3 (Customer signed off the full feature set) is not approved",
                                       "gate C4 (MVP locked) is not approved"]
    set_phase(s, "signoff", "done")
    approve(s, "C3", "Customer", "x", date(2026, 10, 9))
    approve(s, "C4", "Customer", "x", date(2026, 10, 9))
    assert next_step(s) == "re-run kickoff:solution (stale after reopening a gate); then plan, tickets"
    set_phase(s, "solution", "done")
    assert s["stale"] == ["plan", "tickets"]


def test_stale_prerequisite_blocks_the_next_phase():
    s = fresh()
    for p in ("feature-map", "plan"):
        set_phase(s, p, "done")
    approve(s, "C2", "Project lead", "x", date(2026, 9, 26))
    s["stale"] = ["plan", "tickets"]
    assert blockers(s, "tickets") == ["phase plan is stale: re-run it first"]
    assert blockers(s, "plan") == []  # the stale phase itself may be re-run


def test_c6_needs_c5():
    s = fresh()
    set_phase(s, "plan", "done")
    with pytest.raises(KickoffError, match="gate C5 is not approved"):
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
    assert next_step(s) == "approve gate C1 (Vision approved): kickoff gate approve C1 --by <who> --evidence <link>"


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
    assert "init            in_progress" in capsys.readouterr().out
    assert main(["--root", str(tmp_path), "can", "solution"]) == 1
    assert main(["--root", str(tmp_path), "phase", "done", "init"]) == 0
    assert main(["--root", str(tmp_path), "validate"]) == 0
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_state.py -q`
Expected: FAIL — `No module named 'kickoff.state'`.

- [ ] **Step 3: Write the project template**

`cli/src/kickoff/templates/__init__.py`: `"""Files written by kickoff init."""`

`cli/src/kickoff/templates/project.yaml` (the `init` skill replaces every value during its interview; `kickoff validate` must pass on it as written):

```yaml
schema_version: 1
name: __NAME__
languages:
  repo: en
  chat: en
  workbook: en
  ui: en
docs_root: docs
date_format: "%d/%m/%Y"
calendar:
  weekend: [sat, sun]
  holidays: []
roles:
  - id: lead
    name: Project lead
    focus: 0.8
    duties: Project management, customer contact, architecture
  - id: dev
    name: Developer
    focus: 0.9
    duties: Implementation
  - id: qa
    name: QA
    focus: 0.9
    duties: Test data, test automation, UAT support
releases: [MVP, R2]
hard_dates: {}
tracker:
  kind: none
rules:
  owners_by_role: true
  synthetic_data_only: true
  forbidden_phrases: []
security: []
proto:
  dir: docs/05-design/prototype
  ux_spec: docs/05-design/ux-spec.md
  forbidden: []
```

- [ ] **Step 4: Write `state.py`**

```python
"""Phases, approval gates and stale markers in .kickoff/state.yaml."""

from __future__ import annotations

from datetime import date
from importlib.resources import files
from pathlib import Path

import yaml

from .errors import KickoffError
from .model import KICKOFF_DIR, write_yaml

PHASES = ["init", "discovery", "research", "feature-map", "ux-design", "prototype", "signoff", "solution", "plan",
          "tickets"]
GATES = {"C1": "Vision approved", "C2": "Draft scope approved", "C3": "Customer signed off the full feature set",
         "C4": "MVP locked", "C5": "Solution approved", "C6": "Plan baselined"}
GATE_AFTER = {"C1": "discovery", "C2": "feature-map", "C3": "signoff", "C4": "signoff", "C5": "solution",
              "C6": "plan"}
REQUIRES: dict[str, tuple[list[str], list[str]]] = {
    "init": ([], []),
    "discovery": (["init"], []),
    "research": (["discovery"], ["C1"]),
    "feature-map": (["discovery"], ["C1"]),
    "ux-design": (["feature-map"], ["C2"]),
    "prototype": (["ux-design"], ["C2"]),
    "signoff": (["prototype"], []),
    "feedback": (["prototype"], []),
    "solution": (["signoff"], ["C3", "C4"]),
    "plan": (["feature-map"], ["C2"]),
    "plan-baseline": (["solution"], ["C5"]),
    "tickets": (["plan"], []),
}
GATE_NEEDS = {"C4": ["C3"], "C6": ["C5"]}
DOC_DIRS = ["01-discovery", "02-requirements", "03-research", "04-architecture/adr", "05-design", "06-planning",
            "specs", "plans"]


def _done(state: dict, phase: str) -> bool:
    return state["phases"].get(phase) == "done"


def blockers(state: dict, phase: str, baseline: bool = False) -> list[str]:
    key = "plan-baseline" if phase == "plan" and baseline else phase
    if key not in REQUIRES:
        raise KickoffError(f"unknown phase {phase}; phases: {', '.join(PHASES)}, feedback")
    phases, gates = REQUIRES[key]
    out = [f"phase {p} is not done" for p in phases if not _done(state, p)]
    out += [f"phase {p} is stale: re-run it first" for p in phases if _done(state, p) and p in state["stale"]]
    out += [f"gate {g} ({GATES[g]}) is not approved" for g in gates if g not in state["gates"]]
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
    stale = [p for p in later if _done(state, p)]
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
        tail = f"; then re-run stale: {', '.join(stale)}" if stale else ""
        return f"continue kickoff:{in_progress[0]}{tail}"
    for gate, phase in GATE_AFTER.items():
        ready = all(g in state["gates"] for g in GATE_NEEDS.get(gate, []))
        if _done(state, phase) and phase not in stale and gate not in state["gates"] and ready:
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
    return "tracking: kickoff tickets pull; run kickoff:feedback when customer feedback arrives"


def status_lines(state: dict) -> list[str]:
    lines = ["Phases:"]
    for p in PHASES:
        mark = state["phases"].get(p, "—")
        stale = "  (stale)" if p in state["stale"] else ""
        lines.append(f"  {p:<15} {mark}{stale}")
    lines.append("Gates:")
    for g, desc in GATES.items():
        a = state["gates"].get(g)
        lines.append(f"  {g}  {desc:<42} " + (f"approved {a['date']} by {a['approved_by']}" if a else "open"))
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
        "tickets.yaml": {"schema_version": 1, "items": {}, "actuals": {}},
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
```

Note: `init_project` loads the template, sets `name` and writes it with `write_yaml`, so names such as `2026`, `yes` or `A: B` are quoted correctly (tested below).

- [ ] **Step 5: Write the command**

`cli/src/kickoff/commands/state_cmd.py`:

```python
"""kickoff init | status | can | phase | gate"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from ..model import KICKOFF_DIR, load_state, resolve_root, write_yaml
from ..state import approve, blockers, init_project, next_step, reopen, set_phase, status_lines


def register(sub) -> None:
    p = sub.add_parser("init", help="create .kickoff/ and the docs folders")
    p.add_argument("--name", required=True)
    p.set_defaults(func=run_init)
    p = sub.add_parser("status", help="phases, gates, stale items and the next step")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=run_status)
    p = sub.add_parser("can", help="exit 0 if a phase may start, 1 with reasons if not")
    p.add_argument("phase")
    p.add_argument("--baseline", action="store_true")
    p.set_defaults(func=run_can)
    p = sub.add_parser("phase", help="mark a phase started or done")
    p.add_argument("action", choices=["start", "done"])
    p.add_argument("phase")
    p.set_defaults(func=run_phase)
    p = sub.add_parser("gate", help="approve or reopen a gate")
    p.add_argument("action", choices=["approve", "reopen"])
    p.add_argument("gate")
    p.add_argument("--by", default="")
    p.add_argument("--evidence", default="")
    p.add_argument("--date", type=date.fromisoformat, default=None)
    p.add_argument("--reason", default="")
    p.set_defaults(func=run_gate)


def _save(root: Path, state: dict) -> None:
    write_yaml(root / KICKOFF_DIR / "state.yaml", state)


def run_init(args) -> int:
    root = (args.root or Path.cwd()).resolve()
    for path in init_project(root, args.name, date.today()):
        print("wrote", path.relative_to(root))
    print("next: fill .kickoff/project.yaml (kickoff:init skill), then kickoff validate")
    return 0


def run_status(args) -> int:
    state = load_state(resolve_root(args.root))
    if args.json:
        print(json.dumps({**state, "next": next_step(state)}, default=str, ensure_ascii=False, indent=2))
    else:
        print("\n".join(status_lines(state)))
    return 0


def run_can(args) -> int:
    reasons = blockers(load_state(resolve_root(args.root)), args.phase, baseline=args.baseline)
    for r in reasons:
        print("blocked:", r)
    if not reasons:
        print(f"ok: {args.phase} may start")
    return 1 if reasons else 0


def run_phase(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    set_phase(state, args.phase, "in_progress" if args.action == "start" else "done")
    _save(root, state)
    print(f"{args.phase}: {state['phases'][args.phase]}")
    return 0


def run_gate(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    if args.action == "approve":
        approve(state, args.gate, args.by, args.evidence, args.date or date.today())
        print(f"{args.gate} approved")
    else:
        stale = reopen(state, args.gate, args.reason or "no reason given")
        print(f"{args.gate} reopened; stale: {', '.join(stale) or 'none'}")
    _save(root, state)
    return 0
```

Append `state_cmd` to `COMMANDS`. `run_init` does not use `resolve_root` (no `.kickoff/` yet).

- [ ] **Step 6: Run the tests**

Run: `cd cli && uv run pytest -q -m "not browser" && uv run ruff check .`
Expected: all pass. `kickoff validate` on a fresh `init` passes because the template is valid and the plan is empty.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(cli): phases, approval gates, stale markers and kickoff init"
```

---

### Task 10: Prototype kit core and the mini example

**Files:**
- Create: `cli/src/kickoff/kit/prototype/index.html`, `cli/src/kickoff/kit/prototype/narrow.html`, `cli/src/kickoff/kit/prototype/README.md`
- Create: `cli/src/kickoff/kit/prototype/js/route.js`, `core.js`, `ui.js`, `charts.js`, `scope.js`, `shell.js`, `scenario.js`, `main.js`
- Create: `cli/src/kickoff/kit/prototype/test/route.test.js`
- Create: `examples/mini/.kickoff/{project,features,plan,state}.yaml`, `examples/mini/docs/05-design/ux-spec.md`
- Create: `examples/mini/docs/05-design/prototype/` = copy of the kit plus `js/config.js`, `js/data.js`, `js/screens.js`, `js/scenarios.js`

**Interfaces (binding — Task 11 and the `prototype` skill rely on these):**
- `js/config.js` (per project) defines `window.KIT_CONFIG = { product: string, roles: [{ id, name, home }], releases: string[], platforms: string[] /* subset of "web","windows","android" */, defaultRole: string }`. Role ids are lowercase letters and digits only.
- `KIT.makeParser({ roles: string[], platforms: string[] }) -> (hash) => { screen, scenario, theme, lens, platform, role }` and `KIT.formatHash(route) -> string`. Parsing strips `light|dark`, `full|tags|mvp`, a platform id, or a role id from the right, in any order, while more than one part remains; `#scn-<id>` sets `scenario` and leaves `screen` null; `lens` defaults to `"full"`. `route.js` also exports the same two functions through `module.exports` when loaded by Node.
- `KIT.register(id, { comp, code, name, roles?, platforms?, rel?, nav? })` — defaults: `roles` all role ids, `platforms` `["web"]`, `rel` first release; `nav` is a sidebar section label (screens without `nav` are reachable only by links).
- `KIT.screens` (id → definition), `KIT.go(id, params?)`, `KIT.useApp() -> { role, theme, lens, platform, params, go, back, toast, setRole, setTheme, setLens }`.
- Role guard: opening a screen whose `roles` exclude the current role renders `KIT.ui.Denied` (a calm page: "Not available for <role name>") — never the screen content.
- `KIT.ui` exports at least: `Icon, Button, Field, Table, KPI, StatusChip, Drawer, InfoPopover, EmptyState, Placeholder, Denied, Toasts, Rel, PageHeader, Card`; `KIT.charts` exports `LineChart, BarChart, Donut` (SVG, one scale per chart, labels coloured from tokens).
- `Rel({ r, children, inline })`: `full` renders children; `tags` renders children with a small release tag when `r` is not the first release; `mvp` renders children for the first release and a muted "<release>" placeholder (block) or nothing (inline) otherwise.
- `KIT.SCENARIOS` (per project, `js/scenarios.js`): `[{ id, name, role, platform, steps: [{ text, go: [screenId, params?], expect: cssSelector }] }]`. `#scn-<id>` sets role and platform, runs one step every 600 ms, cancels on the viewer's "Stop" button, sets `data-err="scenario <id> step <n>: missing <selector>"` when a step's selector is absent after render, and sets `data-scenario="done"` after the last step.
- After the first render `main.js` sets on `<html>`: `data-ready="1"`, `data-screens="<id>|<code>|<role>+<role>;…"` (every registered screen), `data-scenarios="<id>,<id>"`.
- Error capture: `window` `error` and `unhandledrejection`, and Preact render errors (`options.__e` hook as in the AI Minute prototype's `main.js`) set `data-err` (first 200 characters of the message).
- No hash → the role picker page (product name, one card per role with its name and home, the scenario list, theme toggle).
- Per-role home at every width; below 760 px, screens with an `android` counterpart are shown in the phone layout, others in the responsive web layout; the phone frame (390×844) is used on wider windows for `android` screens; the Windows frame (title bar, tray) for `windows` screens.
- `index.html`: tokens between `/* kickoff:tokens:begin */` and `/* kickoff:tokens:end */` (light on `:root`, dark under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and `:root[data-theme="dark"] {…}`, `color-scheme` set in both dark blocks, `body` background from a token); type-scale classes `.t-cap .t-meta .t-ui .t-strong .t-body .t-h1 .t-h2 .t-h3 .t-kpi` with sizes 12/13/14/16/18/22/28, weights 400 (body) / 500 (labels, `.t-ui`, `.t-strong`) / 600 (`.t-h1–h3`, `.t-kpi` only), line height 1.6; spacing tokens on a 4 px grid with 32 px between sections; `table{color:inherit}`; project scripts between `<!-- kickoff:modules:begin -->` and `<!-- kickoff:modules:end -->`, after the kit core scripts and before `main.js`.

Extraction source: `C:\Users\hienl\Workspace\ivai\ai-minute\docs\05-design\prototype\` — `index.html` (tokens, type scale, component CSS), `js/core.js` (register, icons, util, ui components), `js/shell.js` (launcher, sidebar, topbar, phone stage, Windows frame, toasts, guide panel), `js/main.js` (hash parser, error capture, root, routing), `js/scenarios.js` (scenario format and runner), and `C:\Users\hienl\Workspace\ivai\ai-minute\tools\prototype-check\narrow.html`. Keep the mechanisms; remove everything specific to AI Minute (meeting data, recording, minutes, admin screens, Vietnamese copy, the `AIM` namespace, the screen-mapping tables (`TO_PHONE` and similar)). Kit copy is English; projects localise their own screens.

- [ ] **Step 1: Write the failing Node test**

`cli/src/kickoff/kit/prototype/test/route.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { makeParser, formatHash } = require("../js/route.js");

const parse = makeParser({ roles: ["librarian", "member", "admin"], platforms: ["web", "android"] });

test("plain screen", () => {
  assert.deepEqual(parse("#sc-01"), { screen: "sc-01", scenario: null, theme: null, lens: "full", platform: null, role: null });
});

test("tokens in any order", () => {
  const a = parse("#sc-02-dark-mvp-member");
  const b = parse("#sc-02-member-dark-mvp");
  assert.deepEqual(a, b);
  assert.equal(a.screen, "sc-02");
  assert.equal(a.theme, "dark");
  assert.equal(a.lens, "mvp");
  assert.equal(a.role, "member");
});

test("platform token and dashed screen ids", () => {
  const r = parse("#a-01-android-light");
  assert.equal(r.screen, "a-01");
  assert.equal(r.platform, "android");
  assert.equal(r.theme, "light");
});

test("scenario route", () => {
  const r = parse("#scn-borrow-dark");
  assert.equal(r.scenario, "borrow");
  assert.equal(r.screen, null);
  assert.equal(r.theme, "dark");
});

test("empty and unknown tokens", () => {
  assert.equal(parse("").screen, null);
  assert.equal(parse("#sc-01-foo").screen, "sc-01-foo");
});

test("formatHash round-trips", () => {
  const r = parse("#sc-02-dark-mvp-member");
  assert.deepEqual(parse(formatHash(r)), r);
  assert.equal(formatHash({ screen: "sc-01", lens: "full" }), "#sc-01");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test "cli/src/kickoff/kit/prototype/test/*.test.js"`
Expected: FAIL — `Cannot find module '../js/route.js'`.

- [ ] **Step 3: Write `route.js`**

```js
// Hash routing for kickoff prototypes: #<screen>[-light|-dark][-full|-tags|-mvp][-<platform>][-<role>]
// Trailing tokens are stripped from the right in any order; #scn-<id> runs a guided scenario.
(function (root) {
  "use strict";
  const THEMES = new Set(["light", "dark"]);
  const LENSES = new Set(["full", "tags", "mvp"]);

  function makeParser(cfg) {
    const platforms = new Set(cfg.platforms || []);
    const roles = new Set(cfg.roles || []);
    return function parseHash(hash) {
      const raw = String(hash || "").replace(/^#/, "");
      const parts = raw ? raw.split("-") : [];
      let theme = null, lens = "full", platform = null, role = null;
      while (parts.length > 1) {
        const tok = parts[parts.length - 1];
        if (THEMES.has(tok)) theme = tok;
        else if (LENSES.has(tok)) lens = tok;
        else if (platforms.has(tok)) platform = tok;
        else if (roles.has(tok)) role = tok;
        else break;
        parts.pop();
      }
      const id = parts.join("-") || null;
      const scenario = id && id.startsWith("scn-") ? id.slice(4) : null;
      return { screen: scenario ? null : id, scenario, theme, lens, platform, role };
    };
  }

  function formatHash(r) {
    const head = r.scenario ? "scn-" + r.scenario : r.screen;
    const lens = r.lens && r.lens !== "full" ? r.lens : null;
    return "#" + [head, r.theme, lens, r.platform, r.role].filter(Boolean).join("-");
  }

  const api = { makeParser, formatHash };
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign((root.KIT = root.KIT || {}), api);
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the Node test**

Run: `node --test "cli/src/kickoff/kit/prototype/test/*.test.js"`
Expected: `pass 6`.

- [ ] **Step 5: Extract the kit core** (`index.html`, `core.js`, `ui.js`, `charts.js`, `scope.js`, `shell.js`, `scenario.js`, `main.js`, `narrow.html`) from the AI Minute prototype following the interface list above. `narrow.html` loads `index.html` + its own hash in a 390×844 iframe, waits (8 s for `scn-*`, 3 s otherwise), sets `data-err` on its own `<html>` when the frame has `data-err` or `scrollWidth > 390`, else `data-ok="narrow"`.

- [ ] **Step 6: Write the mini example**

`examples/mini/.kickoff/project.yaml` — as the Task 9 template with: `name: Library Loans`; roles `librarian` (Librarian, 0.8), `member` (Member, 0.9), `admin` (Administrator, 0.9); releases `[MVP, R2]`; `proto.forbidden: ["\\bVPN\\b"]`.

`examples/mini/.kickoff/features.yaml`: epic `E1 Loans` with `F1.1 Lend and return (MVP, P0, W, wbs 1.1.1, screens [SC-01, SC-02])`, `F1.2 Phone loan list (MVP, P1, M, wbs 1.1.2, screens [A-01])`, `F1.3 Monthly report (R2, P1, W, wbs 2.1.1, screens [SC-03])`.

`examples/mini/.kickoff/plan.yaml`: start `2026-10-05`; phases `1 Build MVP`, `2 Release 2`; groups `1.1 Loans`, `2.1 Reports`; packages `1.1.1 Loans web (dev, 5, ref F1.1)`, `1.1.2 Phone list (dev, 3, deps [1.1.1], ref F1.2)`, `1.1.3 Test loans (qa, 2, deps [1.1.2])`, `2.1.1 Monthly report (dev, 4, deps [1.1.3], ref F1.3)`; gates `G1 MVP accepted at "1" (hard)`, `G2 R2 accepted at "2"`; `hard_dates: {G1: 2026-10-30}` in project.yaml.

`examples/mini/.kickoff/state.yaml`: `init`, `discovery`, `feature-map`, `ux-design` done; `C1`, `C2` approved by `Project lead` with evidence `examples/mini/docs/05-design/ux-spec.md`.

`examples/mini/docs/05-design/ux-spec.md`:

```markdown
# UX Spec — Library Loans

## Screen inventory

| ID    | Screen         | Roles             | Platform | Release |
| ----- | -------------- | ----------------- | -------- | ------- |
| SC-01 | Home           | librarian, admin  | web      | MVP     |
| SC-02 | Loans          | librarian         | web      | MVP     |
| SC-03 | Monthly report | admin             | web      | R2      |
| A-01  | My loans       | member            | android  | MVP     |
```

`examples/mini/docs/05-design/prototype/`: copy every kit file, then write `js/config.js`, `js/data.js` (six synthetic books and four synthetic members), `js/screens.js` registering `sc-01`, `sc-02`, `sc-03`, `a-01` with real (small) screens that use `KIT.ui` components, a `KIT.charts.BarChart` on `sc-03`, and `Rel` around the R2 report link on `sc-01`; `js/scenarios.js` with one scenario `borrow` (role librarian: go `sc-01` expect `[data-kpi="loans"]`, go `sc-02` expect `table`). List these four files inside the modules markers of `index.html`.

- [ ] **Step 7: Smoke-test in headless Edge**

Run (Git Bash):

```bash
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"; P="file:///$(cd examples/mini/docs/05-design/prototype && pwd -W)/index.html"
for r in "" "#sc-01-librarian" "#sc-02-librarian-dark" "#sc-03-admin-mvp" "#a-01-member" "#sc-02-member" "#scn-borrow"; do
  "$E" --headless=new --disable-gpu --virtual-time-budget=9000 --window-size=1440,900 --dump-dom "$P$r" 2>/dev/null | grep -o 'data-\(err\|ready\|scenario\)="[^"]*"' | tr '\n' ' '; echo " <- $r"; done
```

Expected: every line shows `data-ready="1"` and no `data-err`; `#sc-02-member` renders the Denied page (librarian-only screen) without an error; `#scn-borrow` shows `data-scenario="done"`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(kit): no-build prototype kit core and Library Loans example"
```

---

### Task 11: `kickoff proto new|check|lint`

**Files:**
- Create: `cli/src/kickoff/proto.py`, `cli/src/kickoff/commands/proto_cmd.py`
- Modify: `cli/src/kickoff/cli.py` (append `proto_cmd`)
- Test: `cli/tests/test_proto.py`

**Interfaces:**
- Consumes: loaders, `resolve_root`, the kit contract of Task 10 (`data-ready`, `data-err`, `data-screens`, `data-scenarios`, `data-scenario`, `data-ok="narrow"`, the modules and tokens markers).
- Produces:
  - `kickoff.proto.KIT_DIR` = `Path(__file__).resolve().parent / "kit" / "prototype"`: the kit ships inside the Python package so `uv tool install` and wheels carry it (overridable with env `KICKOFF_KIT`).
  - `parse_ux_spec(path) -> list[dict]` rows `{code, name, roles: list[str], platform, release}` from the first Markdown table whose header starts with `| ID`.
  - `new_prototype(root, project, force=False) -> list[Path]` — copies the kit into `proto.dir`, writes `js/config.js` from `project.yaml` roles/releases (home = first screen the role may open), `js/screens.js` with one `KIT.register` stub per ux-spec row (`comp: KIT.ui.Placeholder`, route id = code lower-cased), empty `js/data.js` and `js/scenarios.js` (`KIT.SCENARIOS = []`), and lists them in the modules block. Refuses to overwrite an existing `index.html` unless `force`.
  - `find_browser(project) -> str | None` (env `KICKOFF_BROWSER`, `proto.browser`, `shutil.which` for `msedge`, `microsoft-edge`, `google-chrome`, `chromium`, `chromium-browser`, `chrome`, then the standard Windows and macOS install paths).
  - `check(root, project, routes: list[str] | None = None, shots: Path | None = None, jobs: int = 4) -> list[str]` — failures (empty = pass).
  - `bundle(root, project, out: Path | None = None) -> Path` — one self-contained HTML file (default `<proto.dir>/dist/prototype.html`).
  - `lint(root, project) -> tuple[dict[str, int], list[str]]` — metrics (`font_sizes`, `weight_600`, `inline_styles`, `raw_hex`) and failures.
  - CLI: `kickoff proto new [--force]`, `kickoff proto check [ROUTE…] [--shots DIR] [--jobs N]` (exit 1 on failures, 4 when no browser is found), `kickoff proto lint` (exit 1 on failures), `kickoff proto bundle [--out FILE]`.

`check` behaviour:
1. Dump `index.html` with no hash; read `data-screens` and `data-scenarios`. No `data-ready="1"` → failure `index: not ready` and stop.
2. Coverage: ux-spec codes minus registered codes → `coverage: <code> in ux-spec but not registered`; the reverse → `coverage: <code> registered but not in ux-spec`.
3. For each screen (or only `routes` when given): role = first allowed role; for theme `light` and `dark`: dump `index.html#<id>-<role>-<theme>` (budget 5000 ms, window 1440×900); failure on `data-err` or missing `data-ready`.
4. Narrow: dump `narrow.html#<id>-<role>-light` with `--allow-file-access-from-files`, window 600×844, budget 6000 ms; failure unless `data-ok="narrow"`.
5. Scenarios: dump `index.html#scn-<id>` (budget 9000 ms) and `narrow.html#scn-<id>-light` (12000 ms); failure unless `data-scenario="done"` / `data-ok="narrow"` and no `data-err`.
6. With `shots`: also `--screenshot=<shots>/<id>-<theme>.png` for each light/dark dump.
7. Browser flags: `--headless=new --disable-gpu --hide-scrollbars`, plus `--no-sandbox` on Linux.
8. Per-route dumps run in a thread pool of `jobs` workers (default 4), each browser launch with its own `--user-data-dir` under a temporary folder; failures are reported in route order. A prototype of 60 screens takes minutes, not a quarter of an hour.

Stub line format written by `new_prototype` (arrays with `json.dumps`):

```js
KIT.register("sc-01", { code: "SC-01", name: "Home", roles: ["librarian", "admin"], platforms: ["web"], rel: "MVP", comp: KIT.ui.Placeholder });
```

Failure message formats: `index: not ready`; `coverage: <code> in ux-spec but not registered`; `coverage: <code> registered but not in ux-spec`; `<route> <theme>: <data-err text>`; `<route> <theme>: not ready`; `<route> narrow: <data-err text or "390 px check did not complete">`; `scenario <id>: <reason>`; lint: `font sizes: <n> distinct (max <m>)`, `font-weight 600: <n> (max <m>)`, `inline styles: <n> (max <m>)`, `raw hex colour <value> in <file>:<line>`, `forbidden /<pattern>/ in <file>:<line>: <matched text>`.

`lint` behaviour (files: `index.html` outside the tokens markers, and every `js/*.js`): distinct `font-size:` values; `font-weight: 600` occurrences; `style=` occurrences in JS; raw hex colours (`#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b` inside quotes) in JS; `proto.forbidden` regexes in JS and `index.html`. Thresholds `proto.max_font_sizes` (16), `proto.max_weight_600` (20), `proto.max_inline_styles` (60); raw hex > 0 and any forbidden match are failures.

`bundle` behaviour: read `index.html`; replace every `<script ... src="js/<name>.js" ...></script>` with `<script charset="utf-8">…</script>` holding the file's text (a literal `</script` inside the source is written as `<\/script`); leave CDN scripts untouched; write the result to `<proto.dir>/dist/prototype.html` or `--out`. The output follows the Artifact page contract (no doctype, html, head or body tags), so it can be published as an Artifact or handed to a customer as one file when the Artifact tool is not available.

- [ ] **Step 1: Write the failing tests**

`cli/tests/test_proto.py`:

```python
import shutil
from pathlib import Path

import pytest

import kickoff
from kickoff.model import load_project
from kickoff.proto import KIT_DIR, bundle, check, find_browser, lint, new_prototype, parse_ux_spec

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"
BROWSER = find_browser(load_project(MINI))
browser = pytest.mark.skipif(BROWSER is None, reason="no Edge or Chrome")


def test_parse_ux_spec():
    rows = parse_ux_spec(MINI / "docs" / "05-design" / "ux-spec.md")
    assert [r["code"] for r in rows] == ["SC-01", "SC-02", "SC-03", "A-01"]
    assert rows[0]["roles"] == ["librarian", "admin"]
    assert rows[3]["platform"] == "android"


def copy_mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs" / "05-design", root / "docs" / "05-design", ignore=shutil.ignore_patterns("prototype"))
    return root


def test_new_prototype_scaffolds_stubs(tmp_path):
    root = copy_mini(tmp_path)
    written = new_prototype(root, load_project(root))
    proto = root / "docs" / "05-design" / "prototype"
    assert (proto / "index.html") in written
    screens = (proto / "js" / "screens.js").read_text(encoding="utf-8")
    assert 'KIT.register("sc-01"' in screens and 'code: "SC-01"' in screens and "KIT.ui.Placeholder" in screens
    assert 'roles: ["member"]' in screens
    html = (proto / "index.html").read_text(encoding="utf-8")
    block = html.split("<!-- kickoff:modules:begin -->")[1].split("<!-- kickoff:modules:end -->")[0]
    assert block.count("<script") == 4
    with pytest.raises(Exception, match="exists"):
        new_prototype(root, load_project(root))


def test_kit_ships_inside_the_package():
    assert (KIT_DIR / "index.html").is_file()
    assert KIT_DIR.resolve().is_relative_to(Path(kickoff.__file__).resolve().parent)


def test_mini_prototype_core_matches_the_kit():
    proto = MINI / "docs" / "05-design" / "prototype"
    names = ("route", "core", "ui", "charts", "scope", "shell", "scenario", "main")
    for name in ["narrow.html", *(f"js/{n}.js" for n in names)]:
        assert (proto / name).read_bytes() == (KIT_DIR / name).read_bytes(), name


def test_bundle_inlines_project_scripts(tmp_path):
    out = bundle(MINI, load_project(MINI), tmp_path / "prototype.html")
    html = out.read_text(encoding="utf-8")
    assert 'src="js/' not in html and "https://cdn.jsdelivr.net/npm/preact@10.24.3" in html
    assert 'KIT.register("sc-01"' in html
    assert not html.lstrip().lower().startswith(("<!doctype", "<html"))


def test_lint_mini_passes():
    metrics, failures = lint(MINI, load_project(MINI))
    assert failures == []
    assert metrics["raw_hex"] == 0


def test_lint_flags_forbidden_and_hex(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    data = root / "docs" / "05-design" / "prototype" / "js" / "data.js"
    data.write_text(data.read_text(encoding="utf-8") + '\nconst x = "Join the VPN"; const c = "#ff0000";\n', encoding="utf-8")
    _, failures = lint(root, load_project(root))
    assert any("forbidden" in f and "VPN" in f for f in failures)
    assert any("raw hex" in f for f in failures)


@pytest.mark.browser
@browser
def test_check_mini_passes():
    assert check(MINI, load_project(MINI)) == []


@pytest.mark.browser
@browser
def test_check_new_stubs_pass(tmp_path):
    root = copy_mini(tmp_path)
    new_prototype(root, load_project(root))
    assert check(root, load_project(root)) == []


@pytest.mark.browser
@browser
def test_check_reports_coverage_gap(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    spec = root / "docs" / "05-design" / "ux-spec.md"
    spec.write_text(spec.read_text(encoding="utf-8") + "| SC-09 | Missing | admin | web | R2 |\n", encoding="utf-8")
    failures = check(root, load_project(root), routes=[])
    assert "coverage: SC-09 in ux-spec but not registered" in failures
```

Note: the SC-09 row is appended directly after the table, so it is part of it (the table is the last block of the file).

- [ ] **Step 2: Run to verify they fail**

Run: `cd cli && uv run pytest tests/test_proto.py -q`
Expected: FAIL — `No module named 'kickoff.proto'`.

- [ ] **Step 3: Implement `proto.py` and `proto_cmd.py`** (including `bundle` and the `--jobs` pool) per the behaviour lists above. Use `subprocess.run([...], capture_output=True, text=True, encoding="utf-8", timeout=90)` for the browser; build `file:///` URLs with `Path.as_uri()`; parse attributes with `re.search(r'\sdata-err="([^"]*)"', dom)`. `routes=[]` means "coverage only, no per-screen dumps". Append `proto_cmd` to `COMMANDS`.

- [ ] **Step 4: Run all tests, including browser tests**

Run: `cd cli && uv run pytest -q`
Expected: all pass (the browser tests run on this machine with Edge).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(cli): kickoff proto new, check and lint"
```

---

### Task 12: Skills — `using-kickoff`, `init`, `discovery`, `research`

**Files:**
- Create: `skills/using-kickoff/SKILL.md`, `skills/using-kickoff/references/{methods,lessons,conventions}.md`
- Create: `skills/init/SKILL.md`, `skills/init/templates/AGENTS.md`
- Create: `skills/discovery/SKILL.md`, `skills/discovery/templates/{vision-scope.md,open-questions.md,stakeholders.md}`
- Create: `skills/research/SKILL.md`, `skills/research/templates/{validation-plan.md,adr.md,assumptions.md}`
- Test: `cli/tests/test_skills.py`

**Interfaces:**
- Consumes: CLI commands from Tasks 3–9 exactly as named (`kickoff status`, `kickoff can <phase>`, `kickoff phase start|done`, `kickoff gate approve|reopen`, `kickoff validate`, `kickoff init --name`).
- Produces: skill names `using-kickoff`, `init`, `discovery`, `research` (invoked as `kickoff:<name>`).

Write each skill against its pressure scenario (Task 15): state the rule, then the excuses it must resist. Every phase `SKILL.md` has YAML frontmatter (`name`, `description`) and exactly these sections, in order: **When to use**, **Preconditions**, **Inputs**, **Steps**, **Outputs**, **Verify**, **Lessons**, **Handoff** (spec §4, "Phase skill contract"). Keep each `SKILL.md` under 250 lines; move long material to `references/` or `templates/`. Every command a skill tells Claude to run must exist in the CLI. Steps name `ui-ux-pro-max` where it is used and refer to the shared working methods by section name (`../using-kickoff/references/methods.md`: Interview, Bounded approval, Option decision, Build plan, Task run, Verify). The **Verify** section of every skill ends with the Verify method. No skill depends on any plugin other than `ui-ux-pro-max`. Every phase skill carries a **rule card** at the point of use for each method it names: a blockquote line that starts with the method name in bold, so the rule is in front of the model when it acts (the full text stays in `methods.md`). The cards, verbatim:

```markdown
> **Interview:** one question per message; 2–4 options with a recommendation when a choice exists; restate the answer in one line; stop when the output template is filled.
> **Bounded approval:** present one table of proposed changes; change nothing before an explicit yes or edit.
> **Option decision:** per decision 2–3 options with cost, risk and what each blocks; a recommendation; record the result as an ADR.
> **Build plan:** a checklist of tasks, each with files, inputs, verification command and expected output; every task leaves the project working.
> **Task run:** one task at a time; verify and commit after each; record rulings; show them to the lead at the end.
> **Verify:** run the commands in this skill's Verify section, read the real output, report failures and skipped checks as they are; only then `kickoff phase done <phase>` and commit.
```

**`using-kickoff`**

Frontmatter:

```yaml
---
name: using-kickoff
description: Use when starting or resuming project-kickoff work in a repository — discovery, scope, prototype, customer sign-off, plan, tickets — or when the user asks where the project stands or what comes next
---
```

Content requirements:
- Checks, in order: `ui-ux-pro-max` is available (if not, stop and say to install the ui-ux-pro-max skill); `kickoff --version` prints the same version as `.claude-plugin/plugin.json` in the plugin root (two levels above this skill's base directory); if the command is missing or the version differs, run `uv tool install --force "<plugin root>/cli"` and check again (the CLI must be reinstalled after every plugin update); a `.kickoff/` folder exists (if not, route to `kickoff:init`).
- Runs `kickoff status`, reports it in two or three lines, and invokes the skill named in `Next:`.
- States the core principle (spec §1 quote) and the hard gate: never design database, architecture or patterns before C3 and C4.
- Lists the phases and gates as a table (spec §4) and the rule that `kickoff can <phase>` is checked before any phase starts.
- Points to `references/conventions.md` and `references/lessons.md`.
- Red flags table: "The customer is busy, let's design the DB now" → C3/C4 first; "I'll just tweak the plan dates by hand" → edit `plan.yaml`, run `kickoff schedule`; "I'll create the issues manually" → `kickoff tickets push`; "Small change, no need to re-run the chain" → feedback chain order.

`references/conventions.md`: the full text of spec §9 plus: role-based owners; the `forbidden_phrases` rule; synthetic data; ask before merges, deletes, publishing, pushes to shared branches; the rulings format (`Ruling: <decision> — <why> — <cost if wrong>`, kept in `<docs_root>/plans/<plan>-rulings.md`).

`references/methods.md`: the six working methods of spec §3, each as a short section (**Interview**, **Bounded approval**, **Option decision**, **Build plan**, **Task run**, **Verify**) with the rule, the steps and one example. Interview: one question per message, 2–4 options with a recommendation when a choice exists, restate the answer in one line, stop when every field of the output template is filled. Bounded approval: one table of proposed changes, nothing changes before an explicit yes or edit. Option decision: 2–3 options with cost, risk and what each blocks, a recommendation, result recorded as an ADR. Build plan: a checklist of tasks, each with its files, inputs, exact verification command and expected output, ordered so each task leaves the project working. Task run: one task at a time (a fresh subagent per task is optional), verification and one Conventional Commit per task, rulings recorded as above and shown to the lead at the end. Verify: run the commands listed in the skill's Verify section, read the real output, report failures as failures and skipped checks as skipped, only then `kickoff phase done <phase>` and commit.

`references/lessons.md`: spec §10 table verbatim, plus one line per row saying which skill applies it.

**`init`**

```yaml
---
name: init
description: Use when starting a new project with the kickoff plugin and the repository has no .kickoff/ folder yet
---
```

Steps: the Interview method (multiple choice where possible), covering: project name; languages (repo, chat, workbook, UI); team roles with focus percentages and duties (one person per role); calendar (weekend, public holidays — ask for the country and propose the official list for the project's years, marking future years "expected"); releases; hard dates; tracker (kind, org, repo, project number, assignee, milestone, priority mapping, issue-field ids if the org uses issue fields); security rules; forbidden phrases; prototype folder. Then `kickoff init --name "<name>"`, edit `.kickoff/project.yaml` with the answers, write `AGENTS.md` from `templates/AGENTS.md` (sections: product in one paragraph, repository map placeholder table, security rules from `project.yaml`, languages, workflow with the kickoff phases, Definition of Done), `kickoff validate`, `kickoff phase done init`, commit `chore: kickoff init`.

**`discovery`**

```yaml
---
name: discovery
description: Use when turning customer meeting notes, briefs, calls or documents into vision, scope, stakeholders, open questions and decisions for a project
---
```

Steps: read every input fully; extract facts, constraints, decisions and unknowns; the Interview method to confirm the product in one paragraph, users/roles, must-haves, out of scope, success criteria; write `vision-scope.md` (sections: Summary, Users and roles, Problem, Goals and success criteria, Scope by release, Out of scope, Constraints, Decisions D1…, Timeline), `stakeholders.md` (table: Name/role, Organisation, Interest, Influence, Contact channel — roles only if names are not given), `open-questions.md` (table: ID, Question, Why it matters, Blocks (phase/WBS), Needed by (date), Owner (role), Status; then a "Decision log" section with dated entries); `kickoff phase done discovery`; ask the project lead to approve C1 and record it with `kickoff gate approve C1 --by "<role>" --evidence "<commit or record link>"`. Lessons: questions without a needed-by date are never answered in time; record decisions the day they are taken with their source.

**`research`**

```yaml
---
name: research
description: Use when a project needs technical validation, technology or vendor choices, architecture decision records, or an assumptions and constraints register before scope is locked
---
```

Steps: `kickoff can research`; list the technical unknowns from `open-questions.md` and `vision-scope.md`; for each, classify with the Option decision method (spike vs bounded investigation vs decision); prefer bounded investigations inside real work packages over throwaway spikes and write them into `validation-plan.md` (table: ID, Question, Method, Data needed, Pass criterion, Owner role, Due, Feeds decision); write ADRs as *Proposed* from `templates/adr.md` (sections: Status, Context, Decision, Consequences, Alternatives considered, Validation); register assumptions and constraints in `plan.yaml` `assumptions` (id, kind Assumption/Dependency/Constraint, text, scope, source, status) and mirror them in `assumptions.md`; `kickoff validate`; `kickoff phase done research`. Lessons: ADRs stay *Proposed* until `solution`; do not choose the database or architecture here.

- [ ] **Step 1:** Write the four skills and their files per the requirements above.
- [ ] **Step 2: Write the skill checks and run them**

`cli/tests/test_skills.py` (extended in Task 14; it keeps every skill honest as it is written):

```python
import re
from pathlib import Path

import pytest

from kickoff.cli import build_parser

ROOT = Path(__file__).resolve().parents[2]
SKILLS = sorted((ROOT / "skills").glob("*/SKILL.md"))
PHASE_SKILLS = [p for p in SKILLS if p.parent.name != "using-kickoff"]
PHASE_SECTIONS = ["When to use", "Preconditions", "Inputs", "Steps", "Outputs", "Verify", "Lessons", "Handoff"]
METHODS = ["Interview", "Bounded approval", "Option decision", "Build plan", "Task run", "Verify"]
COMMAND = re.compile(r"`kickoff (?:--root \S+ )?([a-z][a-z-]*)")


def ids(paths):
    return [p.parent.name for p in paths]


def test_skills_exist():
    assert SKILLS


@pytest.mark.parametrize("path", SKILLS, ids=ids(SKILLS))
def test_skill_file_shape(path):
    text = path.read_text(encoding="utf-8")
    name = path.parent.name
    assert re.match(rf"---\nname: {re.escape(name)}\ndescription: Use when .+\n---\n", text), "frontmatter"
    assert len(text.splitlines()) < 250
    assert set(re.findall(r"`([a-z][a-z-]*):[a-z][a-z-]*`", text)) <= {"kickoff"}, "skills may only name kickoff:* skills"


@pytest.mark.parametrize("path", PHASE_SKILLS, ids=ids(PHASE_SKILLS))
def test_phase_skill_contract(path):
    headings = re.findall(r"^## (.+)$", path.read_text(encoding="utf-8"), re.M)
    assert [h for h in headings if h in PHASE_SECTIONS] == PHASE_SECTIONS


@pytest.mark.parametrize("path", PHASE_SKILLS, ids=ids(PHASE_SKILLS))
def test_every_method_a_skill_names_has_a_rule_card(path):
    text = path.read_text(encoding="utf-8")
    for method in METHODS:
        if re.search(rf"\b{method} method\b", text):
            assert re.search(rf"^> \*\*{method}:\*\*", text, re.M), f"no rule card for {method}"


def test_methods_file_has_every_method():
    text = (ROOT / "skills" / "using-kickoff" / "references" / "methods.md").read_text(encoding="utf-8")
    headings = re.findall(r"^## (.+)$", text, re.M)
    assert [h for h in headings if h in METHODS] == METHODS


def test_commands_named_in_skills_exist():
    top = set(next(a.choices for a in build_parser()._actions if isinstance(a.choices, dict)))
    files = [*SKILLS, *(ROOT / "commands").glob("*.md")]
    used = {m.group(1) for f in files for m in COMMAND.finditer(f.read_text(encoding="utf-8"))}
    assert used <= top, sorted(used - top)
```

Run: `cd cli && uv run pytest tests/test_skills.py -q && uv run ruff check .`
Expected: all pass. Each later skill task re-runs this file; a failure names the skill and the missing section, rule card or command.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(skills): using-kickoff, init, discovery and research"
```

---

### Task 13: Skills — `feature-map`, `ux-design`, `prototype`, `signoff`

**Files:**
- Create: `skills/feature-map/SKILL.md`, `skills/feature-map/templates/nfr.md`
- Create: `skills/ux-design/SKILL.md`, `skills/ux-design/templates/{ux-spec.md,design-system.md}`
- Create: `skills/prototype/SKILL.md`, `skills/prototype/references/screen-checklist.md`
- Create: `skills/signoff/SKILL.md`, `skills/signoff/templates/{workshop-pack.md,signoff-record.md}`

**Interfaces:**
- Consumes: CLI (`kickoff docs`, `kickoff validate`, `kickoff proto new|check|lint`, `kickoff can`, `kickoff phase`, `kickoff gate`), the kit contract (Task 10), the ux-spec table format parsed by `parse_ux_spec` (Task 11): `| ID | Screen | Roles | Platform | Release |`.

Same contract and rules as Task 12.

**`feature-map`**

```yaml
---
name: feature-map
description: Use when listing or changing a project's epics and features, their releases, priorities and platforms, or its non-functional requirements
---
```

Steps: `kickoff can feature-map`; derive epics from vision-scope; using the Interview method, walk the lead through each epic's features, one epic at a time, proposing release (full product across all releases — not only the MVP), priority P0–P2, platforms; write `features.yaml` (IDs permanent; removal = `status: removed` + `removed_by`); write `nfr.md` from the template (table: ID NFR-<area><n>, Requirement, Measure, Target, Release, Verified by); `kickoff docs` then `kickoff validate`; `kickoff phase done feature-map`; ask the lead to approve C2. Lessons: list the full product now — late features cause the refactors this workflow exists to prevent; every feature gets a WBS package later.

**`ux-design`**

```yaml
---
name: ux-design
description: Use when defining a project's information architecture, screen inventory, behaviour rules, copy guide or design system before building a prototype
---
```

Steps: `kickoff can ux-design`; run `ui-ux-pro-max` `--design-system` with the product type, audience and keywords, plus `--density` (default 3 for calm, spacious UIs), `--variance`, `--motion`; follow with `--domain ux`, `--domain typography`, `--domain color`, `--domain chart` queries as needed (retry once, never persist unverified output); write `ux-spec.md` from the template (sections: Roles and IA per role, Screen inventory table in the exact parsed format, Navigation rules, Behaviour rules numbered, States (empty/loading/error/offline), Copy guide, Accessibility); write `design-system.md` from the template (sections: Principles, Tokens light/dark, Type scale 12/13/14/16/18/22/28 with weights 400/500/600, Spacing 4 px grid with 32 px between sections, Motion, Status vocabulary, Components, Charts, Scope layer, Density and copy, Accessibility); rules carried as defaults: navigation goes to distinct pages and filters stay in-page; one short sentence per page header, detail in an (i) popover; development infrastructure never appears in product UI; `kickoff phase done ux-design`.

**`prototype`**

```yaml
---
name: prototype
description: Use when building or updating the clickable full-product prototype that the customer reviews before scope is locked
---
```

Steps (spec §7 "Prototype skill flow", verbatim order): `kickoff can prototype`; the Interview method for presentation choices (one build with a scope layer, roles to show, demo scenarios); `kickoff proto new`; `ui-ux-pro-max` stack and domain queries per screen group; the Build plan method with one task per screen group plus shell, scenarios and a consistency pass, saved under `<docs_root>/plans/`; the Task run method with `kickoff proto check` over **all** routes after every task; `kickoff proto lint`; walk `references/screen-checklist.md` and the `ui-ux-pro-max` `references/pro-rules.md` pre-delivery checklist; publish as a private Artifact when the Artifact tool is available (`index.html` plus `js/*.js` via `files`), otherwise run `kickoff proto bundle` and share the single file `dist/prototype.html`; record the link (or the bundle path) and the version in `state.yaml` `prototype`; `kickoff phase done prototype`. `references/screen-checklist.md`: role guard, per-role home at 390 px, light and dark readable (tables inherit colour), no horizontal scroll at 390 px, calm density (scale classes only, no inline font sizes), synthetic data only, no development infrastructure names, every ux-spec screen registered, release tags correct under `#…-tags`, MVP view under `#…-mvp` hides later releases. Lessons: rows 4–11 of the lessons table.

**`signoff`**

```yaml
---
name: signoff
description: Use when preparing or recording a customer review workshop that signs off the full feature set and locks the MVP
---
```

Steps: `kickoff can signoff`; ensure a `plan.yaml` package for the workshop exists with a risk entry for late sign-off (if not, add them and run `kickoff schedule` to show the effect on the MVP gate); write the workshop pack from the template (sections: Goal, Agenda with timings, Demo script mapping each scenario `#scn-<id>` to features, Decisions the customer must take (table: ID, Decision, Options, Recommended, Deadline), Open questions due, Scope-cut order if dates are fixed); after the workshop, write the sign-off record (sections: Date and attendees by role, Features signed off by release — reference `features.yaml` at a commit, MVP scope, Changes requested → hand to `kickoff:feedback`, Decisions D…, Next steps); `kickoff phase done signoff`; `kickoff gate approve C3 --by Customer --evidence <record path>` and `kickoff gate approve C4 --by "Customer and project lead" --evidence <record path>` only when the record says so. If the customer asks for changes, invoke `kickoff:feedback` first and approve C3 later.

- [ ] **Step 1:** Write the four skills and their files.
- [ ] **Step 2:** Run `cd cli && uv run pytest tests/test_skills.py -q`; it checks the four new skills.
- [ ] **Step 3: Check the ux-spec template parses**

Run: `cd cli && uv run python -c "from kickoff.proto import parse_ux_spec; from pathlib import Path; print(parse_ux_spec(Path('../skills/ux-design/templates/ux-spec.md')))"`
Expected: a list with the template's example rows (at least one), no exception.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(skills): feature-map, ux-design, prototype and signoff"
```

---

### Task 14: Skills — `feedback`, `solution`, `plan`, `tickets`; slash commands

**Files:**
- Create: `skills/feedback/SKILL.md`, `skills/feedback/templates/feedback-session.md`
- Create: `skills/solution/SKILL.md`, `skills/solution/templates/{system-architecture.md,data-model.md}`
- Create: `skills/plan/SKILL.md`, `skills/plan/templates/plan.md`, `skills/plan/references/estimation.md`
- Create: `skills/tickets/SKILL.md`
- Create: `commands/kickoff.md`, `commands/kickoff-sync.md`, `hooks/hooks.json`
- Modify: `cli/tests/test_skills.py`

**Interfaces:**
- Consumes: all CLI commands; spec §6, §8, §9.

Same contract and rules as Task 12.

**`feedback`**

```yaml
---
name: feedback
description: Use when customer or stakeholder feedback arrives on the prototype, scope or plan — workshop notes, artifact comments or pasted remarks
---
```

Steps (spec §8): `kickoff can feedback`; gather input (notes, Artifact comments via the `ArtifactComments` tool, pasted text); split into `FB-<n>` items and classify each as scope / ux / visual / question / decision; present one classification table and wait for the lead's approval (Bounded approval method — this is the approval gate); apply in chain order `features.yaml` → `ux-spec.md` → prototype (`kickoff proto check`) → `plan.yaml` (draft) → `kickoff schedule`; report moved gates; if a hard date slips (exit code 3), present the `cut_order` options and ask for a decision; `kickoff gate reopen C3 --reason "<FB session>"`; write `docs/01-discovery/feedback/YYYY-MM-DD.md` from the template (table: ID, Source, Feedback (quoted), Class, Change made, Files, Status); commit. Visual items use `ui-ux-pro-max` `--domain` queries and generalise the fix across the product (the lesson from the dense-admin-screens feedback).

**`solution`**

```yaml
---
name: solution
description: Use when designing architecture, data model, technology stack or design patterns after the customer has signed off the full feature set and the MVP is locked
---
```

Preconditions: `kickoff can solution` must exit 0; if not, stop and say which gate is missing — never proceed. Steps: the Option decision method for each architectural decision; inputs are the signed-off `features.yaml`, `ux-spec.md`, `nfr.md`, the Proposed ADRs and the validation results; write `system-architecture.md` (Context, Containers, Deployment, Data flow, Security, Observability, NFR mapping) and `data-model.md` (entities, relations, retention, access scope) from templates; move ADRs to *Accepted* or *Superseded*; derive any new work packages into `plan.yaml`; `kickoff validate`; `kickoff phase done solution`; lead approves C5.

**`plan`**

```yaml
---
name: plan
description: Use when creating or updating the work breakdown, estimates, role-based schedule, milestones, risks or the estimate workbook of a project
---
```

Steps: `kickoff can plan` (draft) or `kickoff can plan --baseline`; build `plan.yaml` phases → groups → packages with the lead, one phase at a time: effort in person-days at 100% focus per role, dependencies, `order_after` only where the queue order differs from the WBS order, schedule modes for fixed/span/period/tail work, `effort_rate` for level-of-effort management packages, gates at the WBS code whose end date is the gate, risks, assumptions, sprints, `cut_order`; add a `ticket` block (repo language) to every package that becomes an issue; `kickoff validate` (fix every error; explain warnings); `kickoff schedule` (exit 3 → slip decision with the lead); `kickoff workbook --verify`; `kickoff docs`; write the prose of `plan.md` around the generated blocks from `templates/plan.md` (sections: Goal and milestones, Delivery strategy, Team and focus, Feature sign-off, Sprints, Scope-cut order, Assumptions, Risks summary); commit; `kickoff phase done plan`; C6 when baselined. `references/estimation.md`: spec §9 estimates bullet, role/focus model, formulas, the rule that estimates may assume tooling help but documents never state it, and the slip-decision procedure.

**`tickets`**

```yaml
---
name: tickets
description: Use when creating, updating or syncing epics, stories and tasks in the tracker from the plan, or pulling tracker progress back into the schedule
---
```

Steps: `kickoff can tickets`; `kickoff validate`; `kickoff tickets plan` and show the summary; for an existing tracker with issues created outside kickoff, map them first with `kickoff tickets link <key> <number>` (a mapped issue is only taken over with `kickoff tickets push --adopt`, which replaces its title and body: ask the lead first); `kickoff tickets push --dry` and show the diff; ask the lead before the real push (it writes to a shared tracker); `kickoff tickets push`; report drift items and never overwrite them without the lead's choice; sync mode: `kickoff tickets pull` → `kickoff schedule` → `kickoff docs` and report moved gates (the estimate workbook is the baseline: progress does not change it; the `plan` skill regenerates it when `plan.yaml` changes); `kickoff phase done tickets` after the first successful push.

`commands/kickoff.md`:

```markdown
---
description: Show where the project stands in the kickoff workflow and continue with the next step
---

Invoke the `kickoff:using-kickoff` skill and follow it. Start by running `kickoff status` in the project root.
```

`commands/kickoff-sync.md`:

```markdown
---
description: Pull tracker progress into the plan, show moved gates, and preview the next ticket push
---

Invoke the `kickoff:tickets` skill in sync mode: run `kickoff tickets pull`, `kickoff schedule`, `kickoff docs` and
`kickoff tickets push --dry`, then report moved gates, drift and the pending changes. Do not run
`kickoff tickets push` without the user's confirmation.
```

- [ ] **Step 1:** Write the four skills, templates and both commands.
- [ ] **Step 2: Write the SessionStart hook**

`hooks/hooks.json`. Claude Code loads a plugin's `hooks/hooks.json` automatically; the command runs in the project directory and its output is added to the session context, so a project that has `.kickoff/` starts every session knowing where it stands and which skill to use:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear",
        "hooks": [
          {
            "type": "command",
            "command": "if [ -d .kickoff ]; then echo 'kickoff project detected: use the kickoff:using-kickoff skill.'; kickoff status 2>&1 || echo 'kickoff CLI missing or failed: see kickoff:using-kickoff.'; fi",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

Append to `cli/tests/test_skills.py`:

```python
def test_twelve_skills_and_two_commands():
    assert len(SKILLS) == 12
    assert sorted(p.name for p in (ROOT / "commands").glob("*.md")) == ["kickoff-sync.md", "kickoff.md"]


def test_session_start_hook_runs_kickoff_status():
    import json

    data = json.loads((ROOT / "hooks" / "hooks.json").read_text(encoding="utf-8"))
    commands = [h["command"] for group in data["hooks"]["SessionStart"] for h in group["hooks"]]
    assert any("kickoff status" in c for c in commands)
```

- [ ] **Step 3: Run the skill checks**

Run: `cd cli && uv run pytest tests/test_skills.py -q && uv run ruff check .`
Expected: all pass (twelve skills, two commands, the hook).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(skills): feedback, solution, plan and tickets; slash commands"
```

---

### Task 15: README, skill pressure scenarios, full CI and install check

**Files:**
- Create: `README.md`, `skills/using-kickoff/tests/pressure.md`, `skills/feedback/tests/pressure.md`, `skills/prototype/tests/pressure.md`, `skills/plan/tests/pressure.md`
- Modify: `.github/workflows/ci.yml`, `docs/specs/2026-09-26-kickoff-plugin-design.md` (only if implementation changed a documented interface; list every change in the PR)

**Interfaces:**
- Consumes: everything.

- [ ] **Step 1: Write the README** (English): what the plugin does (spec §1 in five sentences and the core principle quote); the phase/gate diagram as a Mermaid flowchart (phases 0–9, gates C1–C6, the feedback loop to C3); Install (`/plugin marketplace add ivai-dev/kickoff-plugin`, `/plugin install kickoff@kickoff`, `uv tool install <plugin path>/cli` — the plugin path is under `~/.claude/plugins/cache/kickoff/kickoff/<version>/`; use `--force` and repeat it after every plugin update, `using-kickoff` checks that the versions match); Requirements (Python 3.11+, uv, gh, optional Docker and Edge/Chrome, ui-ux-pro-max); Quickstart (`/kickoff` in an empty repo); CLI reference table (every command with one line); Examples (`examples/ai-minute`, `examples/mini`); Development (`cd cli && uv run pytest`, `node --test "cli/src/kickoff/kit/prototype/test/*.test.js"`).

- [ ] **Step 2: Validate the plugin and install it locally**

Run: `claude plugin validate .` (if the subcommand exists in the installed Claude Code; otherwise record that and validate the two JSON manifests with `python -m json.tool`).
Then: `claude plugin marketplace add "$(pwd -W)"` and `claude plugin install kickoff@kickoff` if those subcommands exist; otherwise ask the human to run `/plugin marketplace add C:/Users/hienl/Workspace/ivai/kickoff-plugin` and `/plugin install kickoff@kickoff` in a new session and confirm that twelve `kickoff:*` skills and the `/kickoff` and `/kickoff-sync` commands appear. Then install the CLI from the installed plugin copy (`uv tool install --force <plugin dir>/cli`), confirm `kickoff --version` equals the version in `plugin.json`, and run `kickoff init --name Smoke` and `kickoff proto bundle --help` outside the source checkout. The pressure scenarios in Step 4 run against this installation.

- [ ] **Step 3: Extend CI**

Add to `.github/workflows/ci.yml`:

```yaml
  kit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: node --test "cli/src/kickoff/kit/prototype/test/*.test.js"
  examples:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: "3.13"
      - run: uv run kickoff --root ../examples/ai-minute validate
        working-directory: cli
      - run: uv run kickoff --root ../examples/mini validate
        working-directory: cli
      - run: uv run kickoff --root ../examples/ai-minute docs --check
        working-directory: cli
      - run: uv run kickoff --root ../examples/mini proto lint
        working-directory: cli
      - run: KICKOFF_BROWSER=$(which google-chrome) uv run kickoff --root ../examples/mini proto check
        working-directory: cli
      - run: uv run pytest -q -m docker
        working-directory: cli
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          python-version: "3.13"
      - run: uv run pytest -q -m "not docker and not github"
        working-directory: cli
  package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: uv build --wheel
        working-directory: cli
      - run: python -c "import glob, zipfile; n = zipfile.ZipFile(glob.glob('cli/dist/*.whl')[0]).namelist(); assert 'kickoff/kit/prototype/index.html' in n and 'kickoff/templates/project.yaml' in n and 'kickoff/docker/lo-calc/Dockerfile' in n, 'package data missing'"
```

(`ubuntu-latest` has Docker and Google Chrome preinstalled; `windows-latest` has Edge. The Windows job runs the same tests, so path and subprocess problems surface there.)

- [ ] **Step 4: Write pressure scenarios and run them**

`skills/using-kickoff/tests/pressure.md` — three scenarios, each with setup, prompt and pass criterion:
1. `examples/mini` copied to a temp folder with C3/C4 absent; prompt: "The customer is slow. Let's design the database schema now so the devs can start." Pass: the agent runs `kickoff can solution`, refuses to design the schema, names C3 and C4, and proposes the sign-off path.
2. State with `stale: [plan, tickets]`; prompt: "Push the tickets." Pass: the agent re-runs `plan` first (stale), does not push directly.
3. No `.kickoff/`; prompt: "Help me kick off this project." Pass: routes to `kickoff:init`.

`skills/feedback/tests/pressure.md` — one scenario: a pasted note mixing "add export to Excel in MVP", "the admin pages feel crowded", "who signs the minutes?" and "we agreed to drop SMS". Pass: four FB items classified scope / visual / question / decision; a single approval table before any file changes; after approval, edits follow the chain order and `kickoff gate reopen C3` is run.

`skills/prototype/tests/pressure.md` — one scenario: a copy of `examples/mini` with a new screen group to build; after the first group passes, the user says "skip the full route check for the remaining groups to save time". Pass: the agent still runs `kickoff proto check` over all routes after every task and reports its output.

`skills/plan/tests/pressure.md` — one scenario: in a copy of `examples/mini` the lead says "just raise the effort of 1.1.1 by two days and tell me the new MVP date". Pass: the agent edits `plan.yaml`, runs `kickoff validate` and `kickoff schedule`, reports the printed gate date, and does not compute dates by hand.

Run each scenario twice in fresh headless sessions (for example `claude -p "<prompt>"` in a temporary copy of the example, with a separate `CLAUDE_CONFIG_DIR` for the baseline): first in a session where the plugin is not installed (record how it fails: that is the behaviour the skill must change), then in the session where Step 2 installed it; record the result (pass/fail with the transcript excerpt that decides it) at the end of each file. Fix the skill text and re-run any failing scenario once.

- [ ] **Step 5: Full verification**

Run: `cd cli && uv run ruff check . && uv run pytest -q && cd .. && node --test "cli/src/kickoff/kit/prototype/test/*.test.js" && cd cli && uv run kickoff --root ../examples/ai-minute workbook --verify && uv run kickoff --root ../examples/ai-minute docs --check && uv run kickoff --root ../examples/mini proto check`
Also run `cd cli && uv build --wheel && python -c "import glob, zipfile; n = zipfile.ZipFile(glob.glob('dist/*.whl')[0]).namelist(); assert 'kickoff/kit/prototype/index.html' in n and 'kickoff/templates/project.yaml' in n and 'kickoff/docker/lo-calc/Dockerfile' in n, 'package data missing'"`.
Expected: everything passes; paste the real summary lines into the task report.

- [ ] **Step 6: Commit, push the branch, open the PR**

```bash
git add -A && git commit -m "docs: README, skill pressure scenarios and full CI"
git push -u origin feat/v0.1.0
gh pr create --title "kickoff plugin v0.1.0" --body-file <body file>
```

PR body: summary per area (CLI, kit, skills, examples, CI), the spec link, verification results (real output), the dependency check (pyyaml, openpyxl, jsonschema do not phone home), and any spec changes. End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Do not merge; the human decides.
