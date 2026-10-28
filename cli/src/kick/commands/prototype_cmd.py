"""kickoff prototype record"""

from __future__ import annotations

from ..errors import KickError
from ..model import KICKOFF_DIR, load_state, resolve_root, write_yaml


def register(sub) -> None:
    p = sub.add_parser("prototype", help="record the prototype the customer reviews, whatever it is built with")
    actions = p.add_subparsers(dest="prototype_action", metavar="<action>", required=True)

    a = actions.add_parser("record", help="record the published prototype link or path and its version in state.yaml")
    a.add_argument("--artifact", required=True, help="the link or the path of the prototype (a file, a build, a video)")
    a.add_argument("--version", type=int, default=None, help="version number (default: the recorded version + 1)")
    a.set_defaults(func=run_record)


def run_record(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    current = (state.get("prototype") or {}).get("version")
    version = args.version if args.version is not None else (current or 0) + 1
    if version < 1:
        raise KickError(f"version {version}: versions start at 1")
    if current is not None and version < current:
        raise KickError(f"version {version} is lower than the recorded version {current}")
    state["prototype"] = {"artifact": args.artifact, "version": version}
    write_yaml(root / KICKOFF_DIR / "state.yaml", state)
    print(f"prototype v{version}: {args.artifact}")
    return 0
