"""kickoff proto new | check | lint | bundle"""

from __future__ import annotations

from pathlib import Path

from ..model import load_project, resolve_root
from ..proto import BrowserNotFound, bundle, check, lint, new_prototype


def register(sub) -> None:
    p = sub.add_parser("proto", help="scaffold, check, lint and bundle the clickable prototype")
    actions = p.add_subparsers(dest="proto_action", metavar="<action>", required=True)

    a = actions.add_parser("new", help="copy the kit into proto.dir and write one stub per ux-spec screen")
    a.add_argument("--force", action="store_true", help="overwrite an existing prototype")
    a.set_defaults(func=run_new)

    a = actions.add_parser("check", help="open every screen in a headless browser (exit 4 without Edge or Chrome)")
    a.add_argument("routes", nargs="*", help="screen ids to check (default: all, plus the scenarios)")
    a.add_argument("--shots", type=Path, default=None, help="folder for screenshots of the light and dark dumps")
    a.add_argument("--jobs", type=int, default=4, help="parallel browser launches (default 4)")
    a.set_defaults(func=run_check)

    a = actions.add_parser("lint", help="count font sizes, weights, inline styles and raw colours; flag forbidden text")
    a.set_defaults(func=run_lint)

    a = actions.add_parser("bundle", help="write the prototype as one self-contained HTML file")
    a.add_argument("--out", type=Path, default=None, help="output file (default: <proto.dir>/dist/prototype.html)")
    a.set_defaults(func=run_bundle)


def run_new(args) -> int:
    root = resolve_root(args.root)
    for path in new_prototype(root, load_project(root), force=args.force):
        print("wrote", path.relative_to(root))
    print("next: replace the Placeholder stubs in js/screens.js, then kickoff proto check")
    return 0


def run_check(args) -> int:
    root = resolve_root(args.root)
    try:
        failures = check(root, load_project(root), routes=args.routes or None, shots=args.shots, jobs=args.jobs)
    except BrowserNotFound as exc:
        print(f"error: {exc}")
        return 4
    for failure in failures:
        print(failure)
    print(f"{len(failures)} failures" if failures else "prototype check passed")
    return 1 if failures else 0


def run_lint(args) -> int:
    root = resolve_root(args.root)
    metrics, failures = lint(root, load_project(root))
    print(
        f"font sizes {metrics['font_sizes']}, font-weight 600 {metrics['weight_600']}, "
        f"inline styles {metrics['inline_styles']}, raw hex {metrics['raw_hex']}"
    )
    for failure in failures:
        print(failure)
    return 1 if failures else 0


def run_bundle(args) -> int:
    root = resolve_root(args.root)
    print("wrote", bundle(root, load_project(root), args.out))
    return 0
