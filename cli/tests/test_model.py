from datetime import date

import pytest
from helpers import FEATURES, PLAN, pkg, plan_dict, write_kickoff

from kickoff.model import (
    ModelError,
    find_root,
    load_features,
    load_plan,
    load_project,
    read_yaml,
    text,
    write_yaml,
)


def test_load_minimal_project(tmp_path):
    write_kickoff(tmp_path)
    p = load_project(tmp_path)
    assert p.name == "Demo"
    assert p.weekend == (5, 6)
    assert p.roles["dev"].focus == 1.0
    assert [r.id for r in p.releases] == ["MVP", "R2"]
    assert p.date_format == "%d/%m/%Y"


def test_missing_file_is_a_model_error(tmp_path):
    (tmp_path / ".kickoff").mkdir()
    with pytest.raises(ModelError, match="missing file"):
        load_project(tmp_path)


def test_unquoted_code_fails_schema(tmp_path):
    write_kickoff(tmp_path)
    path = tmp_path / ".kickoff" / "plan.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace('code: "1.1"', "code: 1.1"), encoding="utf-8")
    with pytest.raises(ModelError, match="is not of type 'string'"):
        load_plan(tmp_path)


def test_write_yaml_quotes_numeric_looking_strings(tmp_path):
    path = tmp_path / "x.yaml"
    write_yaml(path, {"code": "1.2", "plain": "abc", "when": date(2026, 9, 28), "multi": "a\nb"})
    raw = path.read_text(encoding="utf-8")
    assert 'code: "1.2"' in raw
    assert "plain: abc" in raw
    assert "when: 2026-09-28" in raw
    assert read_yaml(path) == {"code": "1.2", "plain": "abc", "when": date(2026, 9, 28), "multi": "a\nb"}


def test_schedule_modes_parse(tmp_path):
    packages = [
        pkg("1.1.1", schedule={"fixed": ["2026-09-24", "2026-09-25"]}),
        pkg("1.1.2"),
        pkg("1.1.3", schedule={"span": ["1.1.1", "1.1.2"]}, effort_rate=0.2),
        pkg("1.1.4", schedule={"period": {"after": "1.1.2", "months": 12}}),
        pkg("1.1.5", schedule={"tail": {"of": "1.1.4", "days": 5}}),
    ]
    write_kickoff(tmp_path, plan=plan_dict(packages))
    by = load_plan(tmp_path).by_code()
    assert by["1.1.1"].schedule == ("fixed", date(2026, 9, 24), date(2026, 9, 25))
    assert by["1.1.2"].mode == "seq"
    assert by["1.1.3"].schedule == ("span", "1.1.1", "1.1.2")
    assert by["1.1.3"].effort_rate == 0.2
    assert by["1.1.4"].schedule == ("period", "1.1.2", 12)
    assert by["1.1.5"].schedule == ("tail", "1.1.4", 5)


def test_find_root_walks_up(tmp_path):
    write_kickoff(tmp_path)
    deep = tmp_path / "a" / "b"
    deep.mkdir(parents=True)
    assert find_root(deep) == tmp_path.resolve()


def test_find_root_without_kickoff(tmp_path):
    with pytest.raises(ModelError, match="kickoff:init"):
        find_root(tmp_path)


def test_features_and_text_i18n(tmp_path):
    features = {
        "schema_version": 1,
        "epics": [
            {
                "id": "E1",
                "name": "Minutes",
                "i18n": {"vi": {"name": "Biên bản"}},
                "features": [{"id": "F1.1", "name": "Draft", "release": "MVP", "prio": "P0", "wbs": ["1.1.1"]}],
            }
        ],
    }
    write_kickoff(tmp_path, features=features)
    f = load_features(tmp_path)
    assert f.by_id()["F1.1"].epic == "E1"
    assert f.epic("E1").name == "Minutes"
    assert text({"name": "Minutes", "i18n": {"vi": {"name": "Biên bản"}}}, "name", "vi") == "Biên bản"
    assert text({"name": "Minutes"}, "name", "vi") == "Minutes"


def test_item_block_and_the_removed_ticket_key(tmp_path):
    item = {"title": "Loan desk", "type": "story", "epic": "E1", "ac": ["A loan is saved"]}
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", item=item)]))
    assert load_plan(tmp_path).packages[0].item == item
    write_kickoff(tmp_path, plan=plan_dict([pkg("1.1.1", item=item), pkg("1.1.2", ticket=dict(item, title="Old"))]))
    with pytest.raises(ModelError, match="`ticket` block was renamed `item` in kickoff 0.6 and is no longer read"):
        load_plan(tmp_path)


def test_empty_plan_and_features_are_valid(tmp_path):
    write_kickoff(tmp_path, plan=PLAN, features=FEATURES)
    assert load_plan(tmp_path).packages == []
