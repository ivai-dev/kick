"""kickoff fe new | update | check | bundle | record"""

from __future__ import annotations

from pathlib import Path

from ..errors import KickoffError
from ..fe import ToolMissing, bundle, check, migration_notes, new_fe, new_roles, update_kit
from ..model import KICKOFF_DIR, load_project, load_state, resolve_root, write_yaml


def register(sub) -> None:
    p = sub.add_parser("fe", help="scaffold, check and bundle the FE v0 (the real frontend the customer reviews)")
    actions = p.add_subparsers(dest="fe_action", metavar="<action>", required=True)

    a = actions.add_parser("new", help="copy the frontend template and write one screen stub per ux-spec row")
    a.add_argument("--force", action="store_true",
                   help="add stubs and screens.ts rows for new ux-spec screens and refresh packages/kit; "
                        "keeps every project file, including config.ts and scenarios.ts")
    a.set_defaults(func=run_new)

    a = actions.add_parser("update", help="replace packages/kit with the plugin's copy; project files are kept")
    a.add_argument("--dry", action="store_true", help="list the files that would change, write nothing")
    a.set_defaults(func=run_update)

    a = actions.add_parser("check", help="typecheck, lint, test, build, the e2e sweep and ux-spec coverage "
                                         "(exit 4 without pnpm or a browser)")
    a.add_argument("--skip-e2e", action="store_true",
                   help="skip the browser sweep (quick work inside a task; never a task's verification)")
    a.add_argument("--shots", type=Path, default=None,
                   help="folder for a screenshot of every screen x role x width x theme (git-ignored; design review)")
    a.add_argument("--direction", default=None, help="run the sweep in this direction (an id in config.ts directions)")
    a.add_argument("--skip-detect", action="store_true",
                   help="skip impeccable's anti-pattern detector (CI without the plugin); reported as skipped")
    a.set_defaults(func=run_check)

    a = actions.add_parser("bundle", help="build the one-file customer build (apps/web/dist-artifact/index.html)")
    a.set_defaults(func=run_bundle)

    a = actions.add_parser("record", help="record the published FE v0 link and version in state.yaml")
    a.add_argument("--artifact", required=True, help="the Artifact link or the bundle path")
    a.add_argument("--version", type=int, default=None, help="version number (default: the recorded version + 1)")
    a.set_defaults(func=run_record)


def run_new(args) -> int:
    root = resolve_root(args.root)
    project = load_project(root)
    for path in new_fe(root, project, force=args.force):
        print("wrote", path.relative_to(root).as_posix())
    for role in new_roles(root, project):
        print(f"warn: role {role} is in the ux-spec but not in apps/web/src/kickoff/config.ts; add it there")
    print("next: pnpm install, then kickoff fe check")
    return 0


def run_update(args) -> int:
    root = resolve_root(args.root)
    changes = update_kit(root, load_project(root), dry=args.dry)
    for path, status in changes:
        print(f"{'would be ' + status if args.dry else status}: {path}")
    for note in migration_notes():
        print(f"migration: {note}")
    print("packages/kit up to date" if not changes else "next: pnpm install, then kickoff fe check")
    return 0


def run_check(args) -> int:
    root = resolve_root(args.root)
    need_lock = load_state(root)["phases"].get("design-direction") == "done"
    try:
        failures = check(root, load_project(root), skip_e2e=args.skip_e2e, shots=args.shots,
                         skip_detect=args.skip_detect, direction=args.direction, need_lock=need_lock)
    except ToolMissing as exc:
        print(f"error: {exc}")
        print("check skipped, not passed")
        return 4
    for failure in failures:
        print(failure)
    if failures:
        print(f"{len(failures)} failures")
        return 1
    skipped = [name for name, flag in (("e2e", args.skip_e2e), ("detect", args.skip_detect)) if flag]
    print("fe check passed" + (f" ({', '.join(skipped)} skipped)" if skipped else ""))
    return 0


def run_bundle(args) -> int:
    root = resolve_root(args.root)
    try:
        path = bundle(root, load_project(root))
    except ToolMissing as exc:
        print(f"error: {exc}")
        return 4
    print("wrote", path.relative_to(root).as_posix())
    return 0


def run_record(args) -> int:
    root = resolve_root(args.root)
    state = load_state(root)
    current = (state.get("prototype") or {}).get("version")
    version = args.version if args.version is not None else (current or 0) + 1
    if version < 1:
        raise KickoffError(f"version {version}: versions start at 1")
    if current is not None and version < current:
        raise KickoffError(f"version {version} is lower than the recorded version {current}")
    state["prototype"] = {"artifact": args.artifact, "version": version}
    write_yaml(root / KICKOFF_DIR / "state.yaml", state)
    print(f"FE v0 v{version}: {args.artifact}")
    return 0
