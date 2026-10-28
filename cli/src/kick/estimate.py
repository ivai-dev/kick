"""`kickoff estimate`: the effort of the project as a range, from the work packages and the feature-level estimates.

Person-days at 100% focus. `likely` is the plan's `effort`; `min` and `max` bound it, and an item without them is a
point estimate (min = likely = max). A package counts once. A feature that has packages in its `wbs` is estimated by
them; a feature without packages uses its own `estimate`, so an early estimate exists before any WBS does."""

from __future__ import annotations

from pathlib import Path

from .errors import KickError
from .model import Features, Plan, Project, load_features, load_plan, load_project
from .schedule import CycleError, build_schedule

UNASSIGNED = "-"  # releases without an id, and top-down features that have no role yet

LABELS = {
    "en": {
        "title": "Estimate", "unit": "Person-days at 100% focus. Likely is the plan's effort; min and max bound it.",
        "release": "Release", "role": "Role", "min": "Min", "likely": "Likely", "max": "Max",
        "by_release": "By release", "by_role": "By role", "total": "Total", "work": "Work",
        "overhead": "Management overhead", "all": "All", "by_feature": "by feature (no role yet)",
        "basis": "Basis", "unassigned": "no release",
        "basis_line": "{features} features estimated top-down, {packages} packages bottom-up ({points} point estimates), "
                      "{low} items with low confidence, {unsized} active features without any estimate.",
    },
    "vi": {
        "title": "Ước lượng", "unit": "Người-ngày ở 100% tập trung. Khả dĩ là công trong kế hoạch; min và max là cận.",
        "release": "Phát hành", "role": "Vai trò", "min": "Min", "likely": "Khả dĩ", "max": "Max",
        "by_release": "Theo phát hành", "by_role": "Theo vai trò", "total": "Tổng", "work": "Công việc",
        "overhead": "Chi phí quản lý", "all": "Tất cả", "by_feature": "theo tính năng (chưa gán vai trò)",
        "basis": "Cơ sở", "unassigned": "chưa có phát hành",
        "basis_line": "{features} tính năng ước lượng từ trên xuống, {packages} gói từ dưới lên ({points} ước lượng điểm), "
                      "{low} mục độ tin cậy thấp, {unsized} tính năng đang hoạt động chưa có ước lượng.",
    },
}


def _zero() -> dict:
    return {"min": 0.0, "likely": 0.0, "max": 0.0}


def _add(acc: dict, lo: float, mid: float, hi: float) -> None:
    acc["min"] += lo
    acc["likely"] += mid
    acc["max"] += hi


def _rounded(acc: dict) -> dict:
    return {k: round(v, 2) for k, v in acc.items()}


def _level_of_effort(project: Project, plan: Plan) -> dict[str, float]:
    """The effort the scheduler computes for packages that run at a rate (`effort_rate`), when it can compute it."""
    if not any(p.effort_rate is not None for p in plan.packages):
        return {}
    try:
        sched = build_schedule(project, plan, baseline=True)
    except (CycleError, KeyError):
        return {}
    return {p.code: sched.slots[p.code].effort for p in plan.packages
            if p.effort_rate is not None and p.code in sched.slots}


def estimate(project: Project, plan: Plan, features: Features) -> dict:
    computed = _level_of_effort(project, plan)
    releases: dict[str, dict] = {}
    roles: dict[str, dict] = {}
    work, loe = _zero(), _zero()  # the overhead rate does not apply to level-of-effort (management) packages
    basis = {"packages": 0, "point_estimates": 0, "features_top_down": 0, "low_confidence": 0, "unsized_features": 0}

    def put(release: str, role: str, lo: float, mid: float, hi: float) -> None:
        for acc in (releases.setdefault(release, _zero()), roles.setdefault(role, _zero()), work):
            _add(acc, lo, mid, hi)

    for p in plan.packages:
        mid = computed.get(p.code, p.effort)
        ranged = p.code not in computed
        lo = p.effort_min if ranged and p.effort_min is not None else mid
        hi = p.effort_max if ranged and p.effort_max is not None else mid
        put(p.release or UNASSIGNED, p.role, lo, mid, hi)
        if not ranged:
            _add(loe, lo, mid, hi)
        basis["packages"] += 1
        basis["point_estimates"] += ranged and p.effort_min is None and p.effort_max is None
        basis["low_confidence"] += p.confidence == "low"
    for f in features.all():
        if f.status != "active" or f.wbs:
            continue
        if not f.estimate:
            basis["unsized_features"] += 1
            continue
        e = f.estimate
        mid = float(e["likely"])
        put(f.release, UNASSIGNED, float(e.get("min", mid)), mid, float(e.get("max", mid)))
        basis["features_top_down"] += 1
        basis["point_estimates"] += "min" not in e and "max" not in e
        basis["low_confidence"] += e.get("confidence") == "low"
    rate = project.estimate_overhead
    overhead = _rounded({k: (work[k] - loe[k]) * rate for k in work})
    work = _rounded(work)
    total = {k: round(work[k] + overhead[k], 2) for k in work}  # the printed rows add up
    release_order = [r.id for r in project.releases]
    role_order = [*project.roles, UNASSIGNED]
    return {
        "unit": "person-days at 100% focus",
        "releases": {r: _rounded(releases[r]) for r in [*release_order, UNASSIGNED] if r in releases}
        | {r: _rounded(v) for r, v in releases.items() if r not in release_order and r != UNASSIGNED},
        "roles": {r: _rounded(roles[r]) for r in role_order if r in roles}
        | {r: _rounded(v) for r, v in roles.items() if r not in role_order},
        "work": work,
        "overhead": {"rate": rate, **overhead},
        "total": total,
        "basis": basis,
    }


def estimate_root(root: Path) -> dict:
    return estimate(load_project(root), load_plan(root), load_features(root))


def spread_text(root: Path) -> str | None:
    """`2–4 pd, spread 60%` for the clarity table; None when nothing is estimated or the project cannot be read."""
    try:
        total = estimate_root(root)["total"]
    except KickError:
        return None
    if not total["likely"]:
        return None
    return f"{total['min']:g}–{total['max']:g} pd, spread {round((total['max'] - total['min']) / total['likely'] * 100)}%"


def estimate_md(project: Project, est: dict) -> str:
    from .docs import GENERATED, md_table  # docs imports this module to write estimate.md

    t = LABELS[project.languages["repo"]]
    head = [t["min"], t["likely"], t["max"]]

    def row(name: str, v: dict) -> list:
        return [name, *(f"{v[k]:g}" for k in ("min", "likely", "max"))]

    release_rows = [row(t["unassigned"] if r == UNASSIGNED else r, v) for r, v in est["releases"].items()]
    role_rows = [row(t["by_feature"] if r == UNASSIGNED else project.role_title(r, project.languages["repo"])
                     if r in project.roles else r, v) for r, v in est["roles"].items()]
    rate = est["overhead"]["rate"]
    total_rows = [row(t["work"], est["work"]), row(f"{t['overhead']} ({rate:.0%})", est["overhead"]),
                  row(t["total"], est["total"])]
    b = est["basis"]
    basis = t["basis_line"].format(features=b["features_top_down"], packages=b["packages"], points=b["point_estimates"],
                                   low=b["low_confidence"], unsized=b["unsized_features"])
    out = [f"# {t['title']}", "", GENERATED, "", t["unit"], "",
           f"## {t['by_release']}", "", md_table([t["release"], *head], release_rows), "",
           f"## {t['by_role']}", "", md_table([t["role"], *head], role_rows), "",
           f"## {t['total']}", "", md_table([t["all"], *head], total_rows), "",
           f"**{t['basis']}:** {basis}"]
    return "\n".join(out) + "\n"
