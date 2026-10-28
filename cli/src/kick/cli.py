"""Command-line entry point: `kick <command>`."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .commands import hook_cmd
from .errors import KickError


def commands() -> list:
    """Command modules, each with register(subparsers) and run(args) -> int; imported on demand, because
    `kickoff hook` runs on every edit and must not pay for jsonschema and yaml."""
    from .commands import (
        clarity_cmd,
        docs_cmd,
        ecc_cmd,
        estimate_cmd,
        export_cmd,
        prototype_cmd,
        schedule_cmd,
        state_cmd,
        validate_cmd,
        workbook_cmd,
    )

    return [schedule_cmd, estimate_cmd, validate_cmd, docs_cmd, workbook_cmd, export_cmd, state_cmd, clarity_cmd,
            prototype_cmd, ecc_cmd, hook_cmd]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="kick", description="kick: start any piece of work with AI")
    parser.add_argument("--version", action="version", version=f"kick {__version__}")
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
    except KickError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
