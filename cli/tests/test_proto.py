import shutil
from pathlib import Path

import pytest

import kickoff
from kickoff.model import load_project
from kickoff.proto import KIT_DIR, bundle, check, find_browser, lint, new_prototype, parse_ux_spec

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"
BROWSER = find_browser(load_project(MINI))
browser = pytest.mark.skipif(BROWSER is None, reason="no Edge or Chrome")


def test_parse_ux_spec():
    rows = parse_ux_spec(MINI / "docs" / "05-design" / "ux-spec.md")
    assert [r["code"] for r in rows] == ["SC-01", "SC-02", "SC-03", "A-01"]
    assert rows[0]["roles"] == ["librarian", "admin"]
    assert rows[3]["platform"] == "android"


def copy_mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs" / "05-design", root / "docs" / "05-design", ignore=shutil.ignore_patterns("prototype"))
    return root


def test_new_prototype_scaffolds_stubs(tmp_path):
    root = copy_mini(tmp_path)
    written = new_prototype(root, load_project(root))
    proto = root / "docs" / "05-design" / "prototype"
    assert (proto / "index.html") in written
    screens = (proto / "js" / "screens.js").read_text(encoding="utf-8")
    assert 'KIT.register("sc-01"' in screens and 'code: "SC-01"' in screens and "KIT.ui.Placeholder" in screens
    assert 'roles: ["member"]' in screens
    html = (proto / "index.html").read_text(encoding="utf-8")
    block = html.split("<!-- kickoff:modules:begin -->")[1].split("<!-- kickoff:modules:end -->")[0]
    assert block.count("<script") == 4
    with pytest.raises(Exception, match="exists"):
        new_prototype(root, load_project(root))


def test_kit_ships_inside_the_package():
    assert (KIT_DIR / "index.html").is_file()
    assert KIT_DIR.resolve().is_relative_to(Path(kickoff.__file__).resolve().parent)


def test_mini_prototype_core_matches_the_kit():
    proto = MINI / "docs" / "05-design" / "prototype"
    names = ("route", "core", "ui", "charts", "scope", "shell", "scenario", "main")
    for name in ["narrow.html", *(f"js/{n}.js" for n in names)]:
        assert (proto / name).read_bytes() == (KIT_DIR / name).read_bytes(), name


def test_bundle_inlines_project_scripts(tmp_path):
    out = bundle(MINI, load_project(MINI), tmp_path / "prototype.html")
    html = out.read_text(encoding="utf-8")
    assert 'src="js/' not in html and "https://cdn.jsdelivr.net/npm/preact@10.24.3" in html
    assert 'KIT.register("sc-01"' in html
    assert not html.lstrip().lower().startswith(("<!doctype", "<html"))


def test_bundle_and_new_write_lf_line_endings(tmp_path):
    out = bundle(MINI, load_project(MINI), tmp_path / "prototype.html")
    assert b"\r" not in out.read_bytes()
    root = copy_mini(tmp_path)
    for path in new_prototype(root, load_project(root)):
        if path.suffix in (".js", ".html"):
            assert b"\r" not in path.read_bytes(), path.name


def test_lint_mini_passes():
    metrics, failures = lint(MINI, load_project(MINI))
    assert failures == []
    assert metrics["raw_hex"] == 0


def test_lint_flags_forbidden_and_hex(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    data = root / "docs" / "05-design" / "prototype" / "js" / "data.js"
    data.write_text(data.read_text(encoding="utf-8") + '\nconst x = "Join the VPN"; const c = "#ff0000";\n', encoding="utf-8")
    _, failures = lint(root, load_project(root))
    assert any("forbidden" in f and "VPN" in f for f in failures)
    assert any("raw hex" in f for f in failures)


def test_cli_check_exits_4_without_a_browser(monkeypatch, capsys):
    from kickoff.cli import main

    monkeypatch.setattr("kickoff.proto.find_browser", lambda project: None)
    assert main(["--root", str(MINI), "proto", "check"]) == 4
    assert "no Edge or Chrome" in capsys.readouterr().out


def test_cli_lint_exit_codes(tmp_path, capsys):
    from kickoff.cli import main

    assert main(["--root", str(MINI), "proto", "lint"]) == 0
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    data = root / "docs" / "05-design" / "prototype" / "js" / "data.js"
    data.write_text(data.read_text(encoding="utf-8") + '\nconst c = "#ff0000";\n', encoding="utf-8")
    assert main(["--root", str(root), "proto", "lint"]) == 1
    assert "raw hex colour #ff0000 in js/data.js" in capsys.readouterr().out


@pytest.mark.browser
@browser
def test_check_mini_passes():
    assert check(MINI, load_project(MINI)) == []


@pytest.mark.browser
@browser
def test_check_new_stubs_pass(tmp_path):
    root = copy_mini(tmp_path)
    new_prototype(root, load_project(root))
    assert check(root, load_project(root)) == []


@pytest.mark.browser
@browser
def test_check_reports_coverage_gap(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    spec = root / "docs" / "05-design" / "ux-spec.md"
    spec.write_text(spec.read_text(encoding="utf-8") + "| SC-09 | Missing | admin | web | R2 |\n", encoding="utf-8")
    failures = check(root, load_project(root), routes=[])
    assert "coverage: SC-09 in ux-spec but not registered" in failures
