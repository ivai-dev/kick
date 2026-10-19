"""Command-line entry point: `kickoff <command>`."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .commands import docs_cmd, proto_cmd, schedule_cmd, state_cmd, tickets_cmd, validate_cmd, workbook_cmd
from .errors import KickoffError

# Command modules, each with register(subparsers) and run(args) -> int. Later tasks append here.
COMMANDS: list = [schedule_cmd, validate_cmd, docs_cmd, workbook_cmd, tickets_cmd, state_cmd, proto_cmd]


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
