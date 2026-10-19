from helpers import FEATURES, pkg, plan_dict, project_dict, write_kickoff

from kickoff.cli import main
from kickoff.validate import validate_root


def run(tmp_path, packages=(), features=None, project=None, **plan_kw):
    write_kickoff(tmp_path, project=project or project_dict(), plan=plan_dict(list(packages), **plan_kw),
                  features=features or FEATURES)
    return [str(f) for f in validate_root(tmp_path)]


def feats(*features):
    return {"schema_version": 1, "epics": [{"id": "E1", "name": "Core", "features": list(features)}]}


def test_clean_project(tmp_path):
    assert run(tmp_path, [pkg("1.1.1")]) == []


def test_schema_error_stops_further_checks(tmp_path):
    out = run(tmp_path, [{"code": "1.1.1", "name": "x", "role": "dev"}])
    assert len(out) == 1 and "plan.yaml" in out[0] and "'effort' is a required property" in out[0]


def test_duplicate_code_unknown_role_and_parent(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.1"), pkg("1.2.1", role="ops")])
    assert "error: 1.1.1: duplicate package code" in out
    assert "error: 1.2.1: unknown role ops" in out
    assert "error: 1.2.1: group 1.2 is not in groups" in out


def test_dependency_rules(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", deps=["9.9.9"]), pkg("1.1.2", schedule={"span": ["1.1.1", "1.1.1"]}),
                         pkg("1.1.3", deps=["1.1.2"])])
    assert "error: 1.1.1: unknown dependency 9.9.9" in out
    assert "error: 1.1.3: dependency 1.1.2 must be a seq or fixed package, not span" in out


def test_order_after_across_roles(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.2", role="qa")], order_after={"1.1.2": "1.1.1"})
    assert "error: order_after 1.1.2: 1.1.2 (qa) and 1.1.1 (dev) are in different role queues" in out


def test_order_after_itself_is_an_error_not_a_crash(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.2")], order_after={"1.1.2": "1.1.2"})
    assert "error: order_after 1.1.2: a package cannot be ordered after itself" in out


def test_order_after_a_non_seq_or_unknown_code_is_an_error(tmp_path):
    out = run(tmp_path, [pkg("1.1.1"), pkg("1.1.2", schedule={"span": ["1.1.1", "1.1.1"]})],
              order_after={"1.1.1": "1.1.2", "1.1.9": "1.1.1"})
    assert "error: order_after 1.1.1: both packages must be seq packages" in out
    assert "error: order_after 1.1.9: unknown code 1.1.9" in out


def test_role_queues_rejects_bad_order_after_without_a_value_error():
    import pytest
    from helpers import plan

    from kickoff.errors import KickoffError
    from kickoff.schedule import role_queues

    with pytest.raises(KickoffError, match="order_after"):
        role_queues(plan([pkg("1.1.1")], order_after={"1.1.1": "1.1.1"}))


def test_cycle_is_an_error(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", deps=["1.1.2"]), pkg("1.1.2", role="qa", deps=["1.1.1"])])
    assert "error: schedule: dependency cycle: 1.1.1 -> 1.1.2 -> 1.1.1" in out


def test_gate_and_hard_date(tmp_path):
    out = run(tmp_path, [pkg("1.1.1")], gates=[{"id": "G1", "name": "x", "at": "7"}],
              project=project_dict(hard_dates={"G9": "2026-12-01"}))
    assert "error: gate G1: unknown code 7" in out
    assert "error: hard_dates G9: not a gate id" in out


def test_feature_checks(tmp_path):
    features = feats(
        {"id": "F1.1", "name": "A", "release": "MVP", "prio": "P0", "wbs": ["8.8.8"]},
        {"id": "F1.2", "name": "B", "release": "R9", "prio": "P1"},
        {"id": "F1.2", "name": "C", "release": "MVP", "prio": "P1", "wbs": ["1.1.1"]},
    )
    out = run(tmp_path, [pkg("1.1.1", ref="F1.1, F7.7")], features=features, cut_order=["F4.4"])
    assert "error: F1.1: unknown WBS code 8.8.8" in out
    assert "error: F1.2: unknown release R9" in out
    assert "error: F1.2: duplicate feature id" in out
    assert "warning: F1.2: active feature without a WBS package" in out
    assert "warning: 1.1.1: ref names unknown feature F7.7" in out
    assert "error: cut_order: unknown feature F4.4" in out


def test_forbidden_phrases_warn(tmp_path):
    out = run(tmp_path, [pkg("1.1.1", desc="Drafted with Claude")],
              project=project_dict(rules={"forbidden_phrases": ["\\bclaude\\b"]}))
    assert any(line.startswith("warning: plan.yaml packages/0/desc: forbidden phrase") for line in out)


def test_ticket_epic_and_sprint_must_exist(tmp_path):
    ticket = {"title": "x", "type": "task", "epic": "E9", "sprint": "Nope"}
    out = run(tmp_path, [pkg("1.1.1", ticket=ticket)],
              sprints=[{"name": "S1", "start": "2026-09-28", "days": 10}])
    assert "error: 1.1.1: ticket epic E9 is not in features.yaml" in out
    assert "error: 1.1.1: ticket sprint 'Nope' is not in sprints" in out


def test_untranslated_plan_text_warns_when_languages_differ(tmp_path):
    project = project_dict(languages={"repo": "en", "chat": "en", "workbook": "vi", "ui": "en"})
    out = run(tmp_path, [pkg("1.1.1")], project=project)
    assert any(line.startswith("warning: plan.yaml packages: 1 of 1 items have no i18n.en.name") for line in out)
    assert run(tmp_path, [pkg("1.1.1")]) == []  # same repo and workbook language: nothing to translate


def test_schedule_refuses_an_invalid_plan(tmp_path, capsys):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", deps=["9.9.9"])]))
    assert main(["--root", str(tmp_path), "schedule"]) == 1
    assert "unknown dependency 9.9.9" in capsys.readouterr().out


def test_cli_exit_codes(tmp_path, capsys):
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1")]))
    assert main(["--root", str(tmp_path), "validate"]) == 0
    assert "0 errors, 0 warnings" in capsys.readouterr().out
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", deps=["2.2.2"])]))
    assert main(["--root", str(tmp_path), "validate"]) == 1
