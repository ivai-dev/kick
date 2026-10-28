"""kick status and kick check: what is going on, in words, and what is wrong or worth a second look."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .errors import KickError
from .estimate import days, kick_items, kick_total, linked_kick, product_total, roadmap_items
from .files import RESERVED, SLUG, kick_dir, project_dir
from .kickfile import RESULT, Kick, kick_folders, load_kick
from .projectfile import Project, languages_line, load_project
from .tables import read_endpoints
from .unclear import find_unclear

NEXT = {
    "understand": "understand: ask one question at a time, write the brief, then agree it",
    "shape": "shape: options for the solution, the architecture and the look, then agree how to build it",
    "plan": "plan: tasks with ranges, then agree them",
    "build:product": "build: the real UI on mock data, then people try it",
    "build:feature": "build: hand the tasks to ECC one by one",
    "finish": "finish: write the changes back to docs/kick/project/, then kick done",
    "done": "done",
}


def next_words(kick: Kick) -> str:
    step = kick.step
    return NEXT[f"build:{kick.kind}" if step == "build" else step]


def rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


# ---------------------------------------------------------------- status
def kick_line(kick: Kick) -> str:
    items, _ = kick_items(kick)
    done = sum(i.status == "done" for i in items)
    left = kick_total(kick, remaining=True)
    estimate = days(left.low, left.likely, left.high) + " left" if items else "no tasks yet"
    unclear = len(find_unclear(kick.path))
    return (f"  {kick.slug}  {kick.kind}  {kick.step}  tasks {done}/{len(items)}  {estimate}"
            + (f"  unclear {unclear}" if unclear else ""))


def status_lines(root: Path, project: Project) -> list[str]:
    out = [languages_line(project)]
    kicks, broken = [], []
    for folder in kick_folders(root):
        try:
            kicks.append(load_kick(folder))
        except KickError as exc:
            broken.append(f"  {folder.name}: cannot be read ({exc}); run kick check")
    if kicks or broken:
        out.append("Kicks:")
        out += [kick_line(k) for k in kicks] + broken
    else:
        out.append("No kick in progress: start one with the kick:start skill.")
    roadmap, _ = roadmap_items(root)
    if roadmap:
        states = {"done": 0, "in progress": 0, "not started": 0}
        for item in roadmap:
            try:
                kick = linked_kick(root, item.kick) if item.kick else None
            except KickError:
                kick = None
            states["not started" if kick is None else "done" if kick.status == "done" else "in progress"] += 1
        left = product_total(root, remaining=True)
        out.append(f"Roadmap: {len(roadmap)} features: {states['done']} done, {states['in progress']} in progress, "
                   f"{states['not started']} not started; {days(left.low, left.likely, left.high)} left")
    api = project_dir(root) / "api.md"
    if api.is_file():
        endpoints, _ = read_endpoints(api)
        if endpoints:
            mock = sum(e.status == "mock" for e in endpoints)
            costly = sum(bool(e.cost.strip()) for e in endpoints)
            out.append(f"API: {len(endpoints)} endpoints: {mock} mock, {len(endpoints) - mock} real"
                       + (f"; {costly} marked costly" if costly else ""))
    done = kick_folders(root, done=True)
    if done:
        out.append(f"Finished kicks: {len(done)}")
    project_unclear = find_unclear(project_dir(root))
    if project_unclear:
        out.append(f"Unclear in docs/kick/project/: {len(project_unclear)}")
    if kicks:
        out.append("Next:")
        out += [f"  {k.slug}: {next_words(k)}" for k in kicks]
    return out


def kick_status_lines(root: Path, kick: Kick) -> list[str]:
    out = [f"{kick.title} ({kick.slug}, {kick.kind} kick, started {kick.started.isoformat()}, {kick.status})"]
    labels = {"understand": "understood", "shape": "shape", "plan": "plan", "result": RESULT[kick.kind]}
    for key, label in labels.items():
        when = kick.agreed.get(key)
        out.append(f"  {'agreed' if when else 'not agreed'}: {label}" + (f" ({when.isoformat()})" if when else ""))
    items, _ = kick_items(kick)
    if items:
        done = sum(i.status == "done" for i in items)
        doing = [i.key for i in items if i.status == "doing"]
        left = kick_total(kick, remaining=True)
        out.append(f"  tasks: {done}/{len(items)} done" + (f"; doing {', '.join(doing)}" if doing else "")
                   + f"; {days(left.low, left.likely, left.high)} left")
    unclear = find_unclear(kick.path)
    if unclear:
        out.append(f"  unclear ({len(unclear)}):")
        out += [f"    {rel(root, u.path)}:{u.line}: {u.text}" for u in unclear]
    out.append(f"Next: {next_words(kick)}")
    return out


# ---------------------------------------------------------------- check
@dataclass
class Findings:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def check_kick(root: Path, folder: Path, roadmap_keys: set[str] | None, found: Findings) -> None:
    name = rel(root, folder)
    try:
        kick = load_kick(folder)
    except KickError as exc:
        found.errors.append(str(exc))
        return
    items, errors = kick_items(kick)
    found.errors += [f"{name}/{e}" for e in errors]
    found.warnings += kick.agreement_warnings()
    started = [i.key for i in items if i.status in ("doing", "done") and not i.probe]
    if started and "plan" not in kick.agreed and kick.status != "done":
        found.warnings.append(f"{kick.slug}: work started ({', '.join(started[:3])}) before the plan was agreed")
    unclear = find_unclear(folder)
    if unclear and "plan" in kick.agreed and kick.status != "done":
        found.warnings.append(f"{kick.slug}: {len(unclear)} unclear point(s) remain although the plan is agreed")
    if kick.roadmap and roadmap_keys is not None and kick.roadmap not in roadmap_keys:
        found.warnings.append(f"{kick.slug}: roadmap key {kick.roadmap} is not in docs/kick/project/roadmap.md")


def check_root(root: Path, slug: str | None = None) -> Findings:
    found = Findings()
    try:
        load_project(root)
    except KickError as exc:
        found.errors.append(str(exc))
        return found
    roadmap_keys = None
    if (project_dir(root) / "roadmap.md").is_file():
        items, errors = roadmap_items(root)
        found.errors += [f"project/{e}" for e in errors]
        roadmap_keys = {i.key for i in items}
        for item in items:
            if not item.kick:
                continue
            where = f"project/roadmap.md:{item.line}: {item.key}"
            if not SLUG.fullmatch(item.kick) or item.kick in RESERVED:
                found.errors.append(f"{where}: {item.kick!r} in the Kick column is not a kick name")
                continue
            try:
                if linked_kick(root, item.kick) is None:
                    found.errors.append(f"{where} names the kick {item.kick}, which does not exist")
            except KickError:
                pass  # the broken kick.yaml is reported with its kick below
    if (project_dir(root) / "api.md").is_file():
        _, errors = read_endpoints(project_dir(root) / "api.md")
        found.errors += [f"project/{e}" for e in errors]
    folders = kick_folders(root) + kick_folders(root, done=True)
    if slug:
        folders = [f for f in folders if f.name == slug]
        if not folders:
            raise KickError(f"no kick named {slug} in {kick_dir(root)}")
    for folder in folders:
        check_kick(root, folder, roadmap_keys, found)
    return found
