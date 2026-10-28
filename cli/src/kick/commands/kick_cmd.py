"""kick init | new | done: create the project pages, start a kick, finish one."""

from __future__ import annotations

from ..files import resolve_root
from ..kickfile import KINDS, finish_kick, new_kick
from ..projectfile import init_project, languages_line, load_project, make_languages, project_file
from ..tables import FEATURES, fill_cell


def register(sub) -> None:
    p = sub.add_parser("init", help="create docs/kick/project/ with the languages (or change them with --update)")
    p.add_argument("--chat", help="language of the conversation, e.g. vi (default: en)")
    p.add_argument("--docs", help="language of the documents (default: the chat language)")
    p.add_argument("--code", help="language of names and comments in code (default: en)")
    p.add_argument("--ui", help="language(s) of the product's own text, comma-separated (default: the chat language)")
    p.add_argument("--commits", help="language of commit messages (default: en)")
    p.add_argument("--update", action="store_true", help="change the languages of an existing project")
    p.set_defaults(func=run_init)

    p = sub.add_parser("new", help="start a kick: docs/kick/<name>/ with its pages")
    p.add_argument("slug", help="short name: lowercase letters, digits and dashes")
    p.add_argument("--title", required=True, help="the title, in the docs language")
    p.add_argument("--kind", required=True, choices=KINDS, help="product (idea to real UI) or feature")
    p.add_argument("--roadmap", help="the roadmap key this feature kick implements")
    p.set_defaults(func=run_new)

    p = sub.add_parser("done", help="mark a kick done and move it to docs/kick/done/")
    p.add_argument("slug")
    p.set_defaults(func=run_done)


def run_init(args) -> int:
    root = resolve_root(args.root)
    ui = [u.strip() for u in args.ui.split(",") if u.strip()] if args.ui else None
    base = load_project(root).languages if args.update else None
    languages = make_languages(args.chat, args.docs, args.code, ui, args.commits, base)
    written = init_project(root, languages, update=args.update)
    for path in written:
        print("wrote", path.relative_to(root).as_posix())
    print(languages_line(load_project(root)))
    return 0


def run_new(args) -> int:
    root = resolve_root(args.root)
    load_project(root)  # a kick needs the project pages: this names `kick init` when they are missing
    written = new_kick(root, args.slug, args.title, args.kind, args.roadmap)
    for path in written:
        print("wrote", path.relative_to(root).as_posix())
    if args.roadmap:
        roadmap = project_file(root).parent / "roadmap.md"
        if roadmap.is_file() and fill_cell(roadmap, FEATURES, args.roadmap, "Kick", args.slug):
            print(f"linked: roadmap row {args.roadmap} → {args.slug}")
        else:
            print(f"warn: the roadmap has no row {args.roadmap} with an empty Kick cell; add or fix the row so the "
                  "product total counts this kick")
    print(f"next: understand ({project_file(root).parent.relative_to(root).as_posix()} is read first)")
    return 0


def run_done(args) -> int:
    root = resolve_root(args.root)
    target, warnings = finish_kick(root, args.slug)
    for warning in warnings:
        print("warn:", warning)
    print("moved to", target.relative_to(root).as_posix())
    return 0
