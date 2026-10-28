"""JSON Schemas for the .kickoff/*.yaml files."""

from __future__ import annotations

import json
from datetime import date
from functools import cache
from importlib.resources import files
from typing import Any

from jsonschema import Draft202012Validator

KINDS = ("project", "features", "plan", "state", "clarity")


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
    schema = json.loads(files("kick.schemas").joinpath(f"{kind}.schema.json").read_text(encoding="utf-8"))
    return Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)


def schema_errors(kind: str, data: Any) -> list[str]:
    if kind not in KINDS:
        raise ValueError(f"unknown kind {kind}")
    errors = sorted(_validator(kind).iter_errors(_jsonable(data)), key=lambda e: [str(p) for p in e.absolute_path])
    return [f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}" for e in errors]
