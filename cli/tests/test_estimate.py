import json

from helpers import FEATURES, pkg, plan_dict, project_dict, write_kickoff

from kick.cli import main
from kick.estimate import estimate, estimate_md, spread_text
from kick.export import records
from kick.model import Features, load_features, load_plan, load_project
from kick.validate import check_features, check_plan, validate_root


def feature(fid, wbs=None, **kw):
    return {"id": fid, "name": f"Feature {fid}", "release": kw.pop("release", "MVP"), "prio": "P1",
            **({"wbs": wbs} if wbs else {}), **kw}


def features_dict(*features):
    return {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "features": list(features)}]}


def build(tmp_path, packages, features=None, **project):
    return write_kickoff(tmp_path, project=project_dict(**project), plan=plan_dict(packages),
                         features=features or FEATURES)


def totals(root):
    return estimate(load_project(root), load_plan(root), load_features(root))


def test_packages_and_top_down_features_make_one_range(tmp_path):
    root = build(
        tmp_path,
        [pkg("1.1.1", effort=4, min=3, max=8, confidence="low", release="MVP"),
         pkg("1.1.2", role="qa", effort=2, release="R2")],
        features_dict(
            feature("F1.1", ["1.1.1"], estimate={"likely": 99}),  # has packages: its own estimate is not counted
            feature("F1.2", estimate={"min": 6, "likely": 10, "max": 20, "confidence": "low"}),
            feature("F1.3")))
    est = totals(root)
    assert est["work"] == {"min": 11, "likely": 16, "max": 30}
    assert est["releases"]["MVP"] == {"min": 9, "likely": 14, "max": 28}
    assert est["releases"]["R2"] == {"min": 2, "likely": 2, "max": 2}
    assert est["roles"]["dev"] == {"min": 3, "likely": 4, "max": 8}
    assert est["roles"]["-"] == {"min": 6, "likely": 10, "max": 20}
    assert est["basis"] == {"packages": 2, "point_estimates": 1, "features_top_down": 1, "low_confidence": 2,
                            "unsized_features": 1}


def test_the_overhead_rate_skips_level_of_effort_packages(tmp_path):
    root = build(
        tmp_path,
        [pkg("1.1.1", effort=10),
         pkg("1.1.2", role="lead", effort=0, effort_rate=1.0, schedule={"span": ["1.1.1", "1.1.1"]})],
        estimate={"overhead": 0.1})
    est = totals(root)
    assert est["work"]["likely"] == 12  # ten working days at a rate of 1 person-day a week: 10 / 5 * 1.0 = 2
    assert est["overhead"] == {"rate": 0.1, "min": 1, "likely": 1, "max": 1}
    assert est["total"]["likely"] == 13


def test_a_package_without_a_range_is_a_point_estimate(tmp_path):
    est = totals(build(tmp_path, [pkg("1.1.1", effort=3)]))
    assert est["total"] == {"min": 3, "likely": 3, "max": 3}
    assert est["basis"]["point_estimates"] == 1


def test_an_empty_project_estimates_nothing(tmp_path):
    root = build(tmp_path, [])
    assert totals(root)["total"] == {"min": 0, "likely": 0, "max": 0}
    assert spread_text(root) is None


def test_the_spread_text(tmp_path):
    root = build(tmp_path, [pkg("1.1.1", effort=10, min=5, max=15)])
    assert spread_text(root) == "5–15 pd, spread 100%"


def test_validate_checks_the_ranges(tmp_path):
    root = build(tmp_path, [pkg("1.1.1", effort=4, min=5), pkg("1.1.2", effort=4, max=3)],
                 features_dict(feature("F1.1", estimate={"min": 2, "likely": 5, "max": 4})))
    project, plan = load_project(root), load_plan(root)
    plan_errors = [f for f in check_plan(project, plan) if f.level == "error"]
    assert {f.where for f in plan_errors} == {"1.1.1", "1.1.2"}
    feature_errors = [f for f in check_features(project, plan, load_features(root)) if f.level == "error"]
    assert [f.where for f in feature_errors] == ["F1.1"]


def test_a_feature_with_an_estimate_needs_no_package_to_pass_the_warning(tmp_path):
    root = build(tmp_path, [], features_dict(feature("F1.1", estimate={"likely": 5}), feature("F1.2")))
    warnings = [f for f in validate_root(root) if f.level == "warning"]
    assert [f.where for f in warnings] == ["F1.2"]
    assert "without a WBS package or an estimate" in warnings[0].message


def test_the_schema_rejects_an_estimate_without_likely_and_a_bad_confidence(tmp_path):
    root = build(tmp_path, [pkg("1.1.1", confidence="certain")],
                 features_dict(feature("F1.1", estimate={"min": 1})))
    errors = [f for f in validate_root(root) if f.level == "error"]
    assert {f.where for f in errors} == {"plan.yaml", "features.yaml"}


def test_cli_prints_the_tables_and_writes_json(tmp_path, capsys):
    root = build(tmp_path, [pkg("1.1.1", effort=4, min=3, max=8, release="MVP")])
    out_file = tmp_path / "estimate.json"
    assert main(["--root", str(root), "estimate", "--json", str(out_file)]) == 0
    out = capsys.readouterr().out
    assert "## By release" in out and "| MVP" in out and "**Basis:**" in out
    assert json.loads(out_file.read_text(encoding="utf-8"))["total"]["max"] == 8


def test_cli_stops_on_a_plan_error(tmp_path, capsys):
    root = build(tmp_path, [pkg("1.1.1", role="ops")])
    assert main(["--root", str(root), "estimate"]) == 1
    assert "unknown role ops" in capsys.readouterr().out


def test_docs_write_and_check_estimate_md(tmp_path, capsys):
    root = build(tmp_path, [pkg("1.1.1", effort=4, min=3, max=8, release="MVP")])
    assert main(["--root", str(root), "docs", "--check"]) == 1  # the file does not exist yet
    assert main(["--root", str(root), "docs"]) == 0
    text = (root / "docs" / "06-planning" / "estimate.md").read_text(encoding="utf-8")
    assert text == estimate_md(load_project(root), totals(root))
    assert main(["--root", str(root), "docs", "--check"]) == 0


def test_the_export_carries_the_range_and_the_confidence(tmp_path):
    root = build(tmp_path, [pkg("1.1.1", effort=4, min=3, max=8, confidence="low"), pkg("1.1.2", effort=2)])
    rows = records(load_project(root), load_plan(root), Features([]))
    assert [(r["effort_min"], r["effort"], r["effort_max"], r["confidence"]) for r in rows] == [
        (3, 4, 8, "low"), (2, 2, 2, "")]
