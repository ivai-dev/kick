"""Command-line entry point: `kickoff <command>`."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .commands import hook_cmd
from .errors import KickoffError


def commands() -> list:
    """Command modules, each with register(subparsers) and run(args) -> int; imported on demand, because
    `kickoff hook` runs on every edit and must not pay for jsonschema, yaml and the frontend tooling."""
    from .commands import (
        docs_cmd,
        ecc_cmd,
        fe_cmd,
        schedule_cmd,
        state_cmd,
        tickets_cmd,
        validate_cmd,
        workbook_cmd,
    )

    return [schedule_cmd, validate_cmd, docs_cmd, workbook_cmd, tickets_cmd, state_cmd, fe_cmd, ecc_cmd, hook_cmd]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="kickoff", description="Project kickoff toolkit")
    parser.add_argument("--version", action="version", version=f"kickoff {__version__}")
    parser.add_argument("--root", type=Path, default=None, help="project root (default: nearest folder with .kickoff/)")
    sub = parser.add_subparsers(dest="command", metavar="<command>")
    for module in commands():
        module.register(sub)
    return parser


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args_in = sys.argv[1:] if argv is None else argv
    if len(args_in) == 2 and args_in[0] == "hook":
        return hook_cmd.fast_run(args_in[1])
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
