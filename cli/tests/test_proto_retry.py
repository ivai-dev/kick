"""`kickoff proto check` retries failures that look transient (a slow CDN), once, with more time."""

import pytest
from helpers import project

from kickoff import proto

PAGE = 'data-ready="1" data-screens="sc-01|SC-01|reader;sc-02|SC-02|reader" data-scenarios=""'


@pytest.fixture
def fake(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    monkeypatch.setattr(proto, "find_browser", lambda p: "browser")
    monkeypatch.setattr(proto, "proto_dir", lambda root, p: tmp_path)
    monkeypatch.setattr(proto, "ux_spec_path", lambda root, p: tmp_path / "ux-spec.md")
    monkeypatch.setattr(proto, "parse_ux_spec", lambda path: [{"code": "SC-01"}, {"code": "SC-02"}])
    monkeypatch.setattr(proto._Browser, "dump", lambda self, url, budget, **kw: PAGE)
    calls = []

    def run(answers):
        def task(browser, base, spec, kind, shots, scale=1):
            calls.append((spec["id"], kind, scale))
            queue = answers.get((spec["id"], kind))
            return queue.pop(0) if queue else (None, None)

        monkeypatch.setattr(proto, "_screen_task", task)
        warnings = []
        failures = proto.check(tmp_path, project(), routes=["sc-01", "sc-02"], warnings=warnings)
        return failures, warnings

    run.calls = calls
    return run


def test_a_transient_failure_that_recovers_is_a_warning(fake):
    failures, warnings = fake({("sc-01", "narrow"): [("sc-01 narrow: narrow: prototype not ready", None)]})
    assert failures == []
    assert warnings == ["passed on a retry after a transient failure: sc-01 narrow: narrow: prototype not ready"]
    assert ("sc-01", "narrow", 2) in fake.calls


def test_a_failure_that_repeats_is_reported(fake):
    err = "sc-02 light: Uncaught TypeError: Cannot destructure property 'useState' of 'hooks' as it is undefined."
    failures, _ = fake({("sc-02", "light"): [(err, None), (err, None)]})
    assert failures == [err]


def test_a_real_defect_is_not_retried(fake):
    err = "sc-01 dark: audit A7 text below the minimum size"
    failures, _ = fake({("sc-01", "dark"): [(err, None)]})
    assert failures == [err]
    assert all(scale == 1 for *_, scale in fake.calls)
